"""Staff API for invoice top-ups (payments.InvoiceTopUp). Statuses change only through payments.invoices.change_status."""
from django.db.models import Count, Q, Sum
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response

from payments.invoices import InvoiceError, change_status
from payments.models import InvoiceTopUp

from . import audit
from .security import IsStaffAdmin, IsStaffMember, ProxyGuard
from .views import StaffViewSet

S = InvoiceTopUp


def _invoice_dict(i: InvoiceTopUp, events: bool = False) -> dict:
    data = {
        "id": i.id,
        "organization_id": i.organization_id,
        "organization": i.organization.name,
        "organization_inn": i.organization.inn,
        "inn": i.inn,
        "name": i.name,
        "amount": str(i.amount),
        "requisites": i.requisites or {},
        "status": i.status,
        "status_label": i.get_status_display(),
        "created_at": i.created_at.isoformat(),
        "sent_at": i.sent_at.isoformat() if i.sent_at else None,
        "signed_at": i.signed_at.isoformat() if i.signed_at else None,
        "confirmed_at": i.confirmed_at.isoformat() if i.confirmed_at else None,
        "closed_at": i.closed_at.isoformat() if i.closed_at else None,
    }
    if events:
        data["events"] = [
            {"from": e.from_status, "to": e.to_status, "actor": e.actor, "channel": e.channel, "note": e.note, "created_at": e.created_at.isoformat()}
            for e in i.events.all()
        ]
    return data


class InvoiceViewSet(StaffViewSet):
    """Any staff role may look; manager/admin move invoices; only ADMIN confirms the money (like wallet deposits)."""

    def get_queryset(self):
        return InvoiceTopUp.objects.select_related("organization")

    def list(self, request):
        qs = self.get_queryset()
        status = request.query_params.get("status", "").strip()
        if status == "open":
            qs = qs.filter(status__in=(S.STATUS_CREATED, S.STATUS_SENT, S.STATUS_SIGNED))
        elif status:
            qs = qs.filter(status=status)
        q = request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(Q(inn__icontains=q) | Q(name__icontains=q) | Q(organization__name__icontains=q) | Q(organization__inn__icontains=q))
        page = self.paginate_queryset(qs)
        return self.get_paginated_response([_invoice_dict(i) for i in page])

    def retrieve(self, request, pk=None):
        try:
            invoice = self.get_queryset().prefetch_related("events").get(pk=pk)
        except (InvoiceTopUp.DoesNotExist, ValueError):
            raise NotFound()
        return Response(_invoice_dict(invoice, events=True))

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        rows = InvoiceTopUp.objects.values("status").annotate(n=Count("id"), total=Sum("amount"))
        by = {r["status"]: {"count": r["n"], "total": str(r["total"] or 0)} for r in rows}
        return Response({s: by.get(s, {"count": 0, "total": "0"}) for s, _ in S.STATUS_CHOICES})

    def _move(self, request, pk, to_status, label, note=""):
        try:
            invoice = change_status(
                int(pk), to_status,
                actor=f"panel:{request.user.username}", channel="panel", note=note,
            )
        except InvoiceTopUp.DoesNotExist:
            raise NotFound()
        except InvoiceError as e:
            raise ValidationError({"detail": str(e)})
        audit.log(
            request, f"invoice_{to_status}", "invoice", invoice.id,
            f"Счёт-фактура №{invoice.id} ({invoice.organization.name}, {invoice.amount}): {label}",
            {"status": {"old": None, "new": to_status}, **({"note": {"old": None, "new": note}} if note else {})},
        )
        invoice = self.get_queryset().prefetch_related("events").get(pk=invoice.pk)
        return Response(_invoice_dict(invoice, events=True))

    @staticmethod
    def _note(request) -> str:
        return str(request.data.get("note") or "").strip()[:500]

    @action(detail=True, methods=["post"], url_path="mark-sent")
    def mark_sent(self, request, pk=None):
        return self._move(request, pk, S.STATUS_SENT, "отправлена клиенту в Didox", self._note(request))

    @action(detail=True, methods=["post"], url_path="mark-signed")
    def mark_signed(self, request, pk=None):
        return self._move(request, pk, S.STATUS_SIGNED, "подписана клиентом", self._note(request))

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        return self._move(request, pk, S.STATUS_REJECTED, "отклонена", self._note(request))

    @action(detail=True, methods=["post"], url_path="confirm", permission_classes=[ProxyGuard, IsStaffMember, IsStaffAdmin])
    def confirm(self, request, pk=None):
        """The operator saw the money on the bank account: credits the wallet. Needs the explicit bank_checked flag."""
        if request.data.get("bank_checked") is not True:
            raise ValidationError({"detail": "Подтвердите, что деньги поступили на банковский счёт."})
        return self._move(request, pk, S.STATUS_CONFIRMED, "оплата подтверждена, кошелёк пополнен", self._note(request))
