"""
Wallet top-up by e-invoice (Soliq servis) - business rules in ONE place.

Today an operator moves an invoice through the statuses by hand (admin panel or Telegram).
Later a Soliq servis integration can call `change_status()` instead of the operator; nothing else changes.

    created -> sent -> signed -> confirmed   (the wallet is credited here, and only here)
    created / sent / signed  ->  rejected or cancelled
"""
import logging
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from wallet.models import Wallet

from .models import InvoiceEvent, InvoiceTopUp

logger = logging.getLogger(__name__)

S = InvoiceTopUp

OPEN_STATUSES = (S.STATUS_CREATED, S.STATUS_SENT, S.STATUS_SIGNED)

TRANSITIONS = {
    S.STATUS_CREATED: {S.STATUS_SENT, S.STATUS_REJECTED, S.STATUS_CANCELLED},
    S.STATUS_SENT: {S.STATUS_SIGNED, S.STATUS_REJECTED, S.STATUS_CANCELLED},
    S.STATUS_SIGNED: {S.STATUS_CONFIRMED, S.STATUS_REJECTED, S.STATUS_CANCELLED},
}

# Extra requisites that may be stored in InvoiceTopUp.requisites. To start collecting a new one
# (bank account, MFO, ...) add its key here and an input on the site form; no migration is needed.
ALLOWED_REQUISITES = ("bank_account", "mfo", "bank_name", "address", "phone")

CHANNELS = ("customer", "panel", "telegram", "system")


class InvoiceError(Exception):
    """A business-rule violation; the message is safe to show to the user."""


def _setting(name, default):
    return getattr(settings, name, default)


def clean_inn(value) -> str:
    inn = str(value or "").strip()
    if not inn.isdigit() or len(inn) not in (9, 12):
        raise InvoiceError("ИНН должен состоять из 9 или 12 цифр.")
    return inn


def clean_amount(value) -> Decimal:
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise InvoiceError("Неверная сумма.")
    lo, hi = Decimal(_setting("INVOICE_MIN_AMOUNT", 1000)), Decimal(_setting("INVOICE_MAX_AMOUNT", 1_000_000_000))
    if amount != amount.quantize(Decimal("1")):
        raise InvoiceError("Сумма должна быть целым числом.")
    if amount < lo:
        raise InvoiceError(f"Минимальная сумма — {lo:,.0f} сум.".replace(",", " "))
    if amount > hi:
        raise InvoiceError(f"Максимальная сумма — {hi:,.0f} сум.".replace(",", " "))
    return amount


def clean_requisites(value) -> dict:
    out = {}
    if isinstance(value, dict):
        for key in ALLOWED_REQUISITES:
            v = value.get(key)
            if isinstance(v, (str, int)) and str(v).strip():
                out[key] = str(v).strip()[:255]
    return out


@transaction.atomic
def create_invoice(*, organization, user, amount, inn, name, requisites=None) -> InvoiceTopUp:
    name = str(name or "").strip()
    if len(name) < 2:
        raise InvoiceError("Укажите название организации.")
    name = name[:255]
    inn = clean_inn(inn)
    amount = clean_amount(amount)

    # serialise concurrent requests of one organization, so the "open invoices" limit cannot be bypassed
    from organizations.models import Organization
    Organization.objects.select_for_update().get(pk=organization.pk)
    limit = int(_setting("INVOICE_MAX_OPEN", 3))
    if InvoiceTopUp.objects.filter(organization=organization, status__in=OPEN_STATUSES).count() >= limit:
        raise InvoiceError("У вас уже есть неоплаченные заявки на счёт-фактуру. Дождитесь их обработки.")

    invoice = InvoiceTopUp.objects.create(
        organization=organization, created_by=user, amount=amount, inn=inn, name=name,
        requisites=clean_requisites(requisites),
    )
    InvoiceEvent.objects.create(
        invoice=invoice, from_status="", to_status=invoice.status,
        actor=f"user:{getattr(user, 'username', '')}"[:150], channel="customer",
    )
    transaction.on_commit(lambda: _telegram().notify_new(invoice.pk))
    return invoice


@transaction.atomic
def change_status(invoice_id, to_status, *, actor, channel, note="") -> InvoiceTopUp:
    """
    Move an invoice to `to_status`. The row is locked, so two operators (or a double click) cannot both win.
    Moving to `confirmed` credits the organization's wallet - exactly once.
    """
    invoice = InvoiceTopUp.objects.select_for_update().select_related("organization").get(pk=invoice_id)
    if invoice.status == to_status:
        raise InvoiceError("Этот статус уже установлен.")
    if to_status not in TRANSITIONS.get(invoice.status, set()):
        raise InvoiceError(f"Нельзя перейти из «{invoice.get_status_display()}» в этот статус.")

    now = timezone.now()
    previous = invoice.status
    invoice.status = to_status
    if to_status == S.STATUS_SENT:
        invoice.sent_at = now
    elif to_status == S.STATUS_SIGNED:
        invoice.signed_at = now
    elif to_status == S.STATUS_CONFIRMED:
        invoice.confirmed_at = now
        wallet, _ = Wallet.objects.get_or_create(organization=invoice.organization)
        wallet.deposit(invoice.amount, f"Пополнение по счёту-фактуре №{invoice.pk}")
        tx = wallet.transactions.filter(transaction_type="deposit").order_by("-id").first()
        invoice.wallet_transaction_id = tx.id if tx else None
    else:  # rejected / cancelled
        invoice.closed_at = now
    invoice.save()

    InvoiceEvent.objects.create(
        invoice=invoice, from_status=previous, to_status=to_status,
        actor=str(actor)[:150], channel=channel, note=str(note or "")[:500],
    )
    transaction.on_commit(lambda: _telegram().refresh(invoice.pk))
    return invoice


def expire_stale(days=None) -> int:
    """Cancel invoices nobody paid: `created` / `sent` older than `days`. `signed` ones are never touched."""
    days = int(days if days is not None else _setting("INVOICE_EXPIRE_DAYS", 7))
    cutoff = timezone.now() - timedelta(days=days)
    n = 0
    for pk in InvoiceTopUp.objects.filter(status__in=(S.STATUS_CREATED, S.STATUS_SENT), created_at__lt=cutoff).values_list("pk", flat=True):
        try:
            change_status(pk, S.STATUS_CANCELLED, actor="system", channel="system", note=f"Срок {days} дн. истёк")
            n += 1
        except InvoiceError:
            pass
    return n


def _telegram():
    from . import telegram
    return telegram
