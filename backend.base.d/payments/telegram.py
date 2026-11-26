"""
Telegram side of the invoice top-ups: notify the operator(s) and let them press buttons.

Settings (all optional; with no token nothing is sent and the admin panel keeps working on its own):
  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_IDS (who gets the messages), TELEGRAM_OPERATOR_IDS (who may press buttons),
  TELEGRAM_CONFIRM_MAX_AMOUNT (0 = no limit; bigger amounts can be confirmed in the admin panel only).

Network calls run in a background thread and never raise: a Telegram outage must not break an invoice.
"""
import html
import logging
import threading
import time

import requests
from django.conf import settings
from django.db import connections

from .models import InvoiceTopUp

logger = logging.getLogger(__name__)

S = InvoiceTopUp
STATUS_ICON = {
    S.STATUS_CREATED: "🆕", S.STATUS_SENT: "📤", S.STATUS_SIGNED: "✍️",
    S.STATUS_CONFIRMED: "✅", S.STATUS_REJECTED: "❌", S.STATUS_CANCELLED: "🚫",
}


def _ids(name):
    raw = getattr(settings, name, "") or ""
    return [x.strip() for x in str(raw).split(",") if x.strip()]


def _token():
    return getattr(settings, "TELEGRAM_BOT_TOKEN", "") or ""


def enabled() -> bool:
    return bool(_token() and _ids("TELEGRAM_CHAT_IDS"))


def _call(method, payload, timeout=10):
    token = _token()
    if not token:
        return None
    try:
        res = requests.post(f"https://api.telegram.org/bot{token}/{method}", json=payload, timeout=timeout)
        data = res.json()
        if not data.get("ok"):
            # "message is not modified" is normal when a refresh changes nothing
            if "not modified" not in str(data.get("description", "")):
                logger.warning("Telegram %s failed: %s", method, data.get("description"))
            return None
        return data.get("result")
    except Exception as e:  # network / JSON problems
        logger.warning("Telegram %s error: %s", method, e)
        return None


def _background(fn, *args):
    def run():
        try:
            fn(*args)
        except Exception:
            logger.exception("Telegram task failed")
        finally:
            connections.close_all()

    threading.Thread(target=run, daemon=True).start()


def _money(value) -> str:
    return f"{int(value):,}".replace(",", " ") + " сум"


def render(invoice) -> str:
    esc = html.escape
    lines = [
        f"🧾 <b>Счёт-фактура №{invoice.pk}</b>",
        f"Статус: {STATUS_ICON.get(invoice.status, '')} <b>{esc(invoice.get_status_display())}</b>",
        f"Сумма: <b>{_money(invoice.amount)}</b>",
        f"Получатель: {esc(invoice.name)}",
        f"ИНН: <code>{esc(invoice.inn)}</code>",
        f"Аккаунт: {esc(invoice.organization.name)} (ИНН {esc(invoice.organization.inn)})",
    ]
    for key, value in (invoice.requisites or {}).items():
        lines.append(f"{esc(key)}: {esc(str(value))}")
    events = list(invoice.events.all())[-3:]
    if len(events) > 1:
        lines.append("")
        for e in events[1:]:
            who = e.actor or "—"
            lines.append(f"• {esc(STATUS_ICON.get(e.to_status, ''))} {esc(dict(S.STATUS_CHOICES).get(e.to_status, e.to_status))} — {esc(who)}")
    return "\n".join(lines)


def keyboard(invoice):
    pk = invoice.pk
    reject = {"text": "❌ Отклонить", "callback_data": f"inv:{pk}:reject"}
    if invoice.status == S.STATUS_CREATED:
        rows = [[{"text": "📤 Отправил в Soliq servis", "callback_data": f"inv:{pk}:sent"}, reject]]
    elif invoice.status == S.STATUS_SENT:
        rows = [[{"text": "✍️ Клиент подписал", "callback_data": f"inv:{pk}:signed"}, reject]]
    elif invoice.status == S.STATUS_SIGNED:
        rows = [[{"text": "💰 Деньги поступили", "callback_data": f"inv:{pk}:confirm"}, reject]]
    else:
        rows = []
    return {"inline_keyboard": rows}


# ------------------------------------------------------------------ outgoing
def notify_new(invoice_id):
    if enabled():
        _background(_send_new, invoice_id)


def refresh(invoice_id):
    if _token():
        _background(_refresh, invoice_id)


def _load(invoice_id):
    return InvoiceTopUp.objects.select_related("organization").prefetch_related("events").get(pk=invoice_id)


def _send_new(invoice_id):
    invoice = _load(invoice_id)
    sent = []
    for chat_id in _ids("TELEGRAM_CHAT_IDS"):
        res = _call("sendMessage", {
            "chat_id": chat_id, "text": render(invoice), "parse_mode": "HTML",
            "reply_markup": keyboard(invoice), "disable_web_page_preview": True,
        })
        if res:
            sent.append({"chat_id": res["chat"]["id"], "message_id": res["message_id"]})
    if sent:
        InvoiceTopUp.objects.filter(pk=invoice_id).update(tg_messages=sent)


def _refresh(invoice_id):
    invoice = _load(invoice_id)
    for m in invoice.tg_messages or []:
        _call("editMessageText", {
            "chat_id": m["chat_id"], "message_id": m["message_id"], "text": render(invoice),
            "parse_mode": "HTML", "reply_markup": keyboard(invoice), "disable_web_page_preview": True,
        })


# ------------------------------------------------------------------ incoming (button presses)
def handle_callback(cb: dict):
    """One `callback_query` from Telegram. Never raises."""
    from .invoices import InvoiceError, change_status

    cb_id = cb.get("id")
    user = cb.get("from") or {}
    msg = cb.get("message") or {}

    def answer(text="", alert=False):
        _call("answerCallbackQuery", {"callback_query_id": cb_id, "text": text[:190], "show_alert": alert})

    if str(user.get("id")) not in _ids("TELEGRAM_OPERATOR_IDS"):
        return answer("Нет доступа", True)

    parts = str(cb.get("data") or "").split(":")
    if len(parts) != 3 or parts[0] != "inv" or not parts[1].isdigit():
        return answer()
    invoice_id, act = int(parts[1]), parts[2]
    actor = f"tg:{user.get('id')}" + (f" @{user['username']}" if user.get("username") else "")

    try:
        invoice = _load(invoice_id)
    except InvoiceTopUp.DoesNotExist:
        return answer("Не найдено", True)

    # two-step buttons for the dangerous actions
    if act in ("reject", "confirm"):
        yes = "reject_yes" if act == "reject" else "confirm_yes"
        question = "Отклонить заявку?" if act == "reject" else f"Банк: поступило {_money(invoice.amount)}? Подтвердить пополнение?"
        _call("editMessageReplyMarkup", {
            "chat_id": msg.get("chat", {}).get("id"), "message_id": msg.get("message_id"),
            "reply_markup": {"inline_keyboard": [
                [{"text": "Да, подтверждаю", "callback_data": f"inv:{invoice_id}:{yes}"},
                 {"text": "Отмена", "callback_data": f"inv:{invoice_id}:back"}],
            ]},
        })
        return answer(question, True)
    if act == "back":
        _refresh(invoice_id)
        return answer()

    target = {"sent": S.STATUS_SENT, "signed": S.STATUS_SIGNED, "confirm_yes": S.STATUS_CONFIRMED, "reject_yes": S.STATUS_REJECTED}.get(act)
    if not target:
        return answer()

    if target == S.STATUS_CONFIRMED:
        limit = int(getattr(settings, "TELEGRAM_CONFIRM_MAX_AMOUNT", 0) or 0)
        if limit and invoice.amount > limit:
            _refresh(invoice_id)
            return answer(f"Суммы больше {_money(limit)} подтверждаются только в админ-панели", True)

    try:
        change_status(invoice_id, target, actor=actor, channel="telegram")
        answer("Готово")
    except InvoiceError as e:
        _refresh(invoice_id)
        answer(str(e), True)


def handle_message(message: dict):
    """/id helps to find out the number that goes into TELEGRAM_OPERATOR_IDS / TELEGRAM_CHAT_IDS."""
    text = str(message.get("text") or "").strip().lower()
    chat_id = (message.get("chat") or {}).get("id")
    if text.startswith(("/id", "/start")) and chat_id:
        _call("sendMessage", {
            "chat_id": chat_id,
            "text": f"Ваш Telegram ID: {(message.get('from') or {}).get('id')}\nID этого чата: {chat_id}",
        })


def poll_forever():
    """Long polling: works without a public URL. Run with `python manage.py run_telegram_bot`."""
    offset = None
    logger.info("Telegram bot polling started")
    while True:
        try:
            payload = {"timeout": 50, "allowed_updates": ["callback_query", "message"]}
            if offset:
                payload["offset"] = offset
            updates = _call("getUpdates", payload, timeout=60) or []
            for u in updates:
                offset = u["update_id"] + 1
                try:
                    if u.get("callback_query"):
                        handle_callback(u["callback_query"])
                    elif u.get("message"):
                        handle_message(u["message"])
                except Exception:
                    logger.exception("Telegram update failed")
                finally:
                    connections.close_all()
            if not updates:
                time.sleep(1)
        except Exception:
            logger.exception("Telegram polling error")
            time.sleep(5)
