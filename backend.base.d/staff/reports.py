"""Report builders. Each returns {"columns": [...], "rows": [...], "summary": {...}}."""
import csv
import io
from datetime import datetime, time, timedelta
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDay, TruncMonth
from django.utils import timezone
from django.utils.dateparse import parse_date

from organizations.models import Organization, OrganizationProduct
from wallet.models import Wallet, WalletTransaction

from .services import base_status, days_left, EXPIRING_DAYS

MAX_ROWS = 5000


def _money(value) -> str:
    return str(Decimal(value or 0).quantize(Decimal("0.01")))

STATUS_LABELS = {
    "active": "Активна",
    "expiring": "Скоро истекает",
    "expired": "Истекла",
    "archived": "В архиве",
    "no_subscription": "Нет подписки",
}


class ReportError(ValueError):
    pass


def _date(value, name):
    if not value:
        return None
    d = parse_date(value)
    if d is None:
        raise ReportError(f"{name}: дата в формате ГГГГ-ММ-ДД.")
    return d


def _day_bounds(date_from, date_to):
    tz = timezone.get_current_timezone()
    start = timezone.make_aware(datetime.combine(date_from, time.min), tz) if date_from else None
    end = timezone.make_aware(datetime.combine(date_to + timedelta(days=1), time.min), tz) if date_to else None
    return start, end


def _int(value, name):
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ReportError(f"{name}: должно быть целым числом.")


# ------------------------------------------------------------------- bases
def bases_report(params):
    now = timezone.now()
    qs = OrganizationProduct.objects.select_related("organization", "product", "subscription__plan")

    status = params.get("status", "all")
    if status == "active":
        qs = qs.filter(archive=False, subscription_end_date__gt=now)
    elif status == "expiring":
        qs = qs.filter(
            archive=False,
            subscription_end_date__gt=now,
            subscription_end_date__lte=now + timedelta(days=_int(params.get("days"), "days") or EXPIRING_DAYS),
        )
    elif status == "expired":
        qs = qs.filter(archive=False, subscription_end_date__lte=now)
    elif status == "archived":
        qs = qs.filter(archive=True)
    elif status != "all":
        raise ReportError("Неверный статус.")

    if org := _int(params.get("organization"), "organization"):
        qs = qs.filter(organization_id=org)
    if product := _int(params.get("product"), "product"):
        qs = qs.filter(product_id=product)

    start, end = _day_bounds(_date(params.get("date_from"), "date_from"), _date(params.get("date_to"), "date_to"))
    if start:
        qs = qs.filter(subscription_end_date__gte=start)
    if end:
        qs = qs.filter(subscription_end_date__lt=end)

    qs = qs.order_by("subscription_end_date", "id")
    total = qs.count()
    rows, monthly_sum = [], Decimal("0")
    counts = {k: 0 for k in STATUS_LABELS}
    for b in qs[:MAX_ROWS]:
        st = base_status(b, now)
        counts[st] += 1
        monthly = b.calculate_monthly_price()
        monthly_sum += monthly
        rows.append(
            {
                "id": b.id,
                "organization": b.organization.name,
                "inn": b.organization.inn,
                "title": b.title,
                "product": b.product.title,
                "plan": b.subscription.plan.name if b.subscription_id else "",
                "end_date": b.subscription_end_date,
                "days_left": days_left(b, now),
                "status": STATUS_LABELS[st],
                "users": b.user_count,
                "monthly_price": monthly,
                "url": b.product_url or "",
            }
        )
    columns = [
        ("id", "ID"), ("organization", "Организация"), ("inn", "ИНН"), ("title", "База"), ("product", "Продукт"),
        ("plan", "Тариф"), ("end_date", "Действует до"), ("days_left", "Осталось дней"), ("status", "Статус"),
        ("users", "Пользователей"), ("monthly_price", "Цена в месяц"), ("url", "URL"),
    ]
    summary = {"total": total, "shown": len(rows), "monthly_total": _money(monthly_sum), "by_status": counts}
    return {"columns": columns, "rows": rows, "summary": summary}


# ----------------------------------------------------------- organizations
def organizations_report(params):
    now = timezone.now()
    qs = Organization.objects.select_related("owner", "wallet").annotate(
        bases_total=Count("organization_products", filter=Q(organization_products__archive=False)),
        bases_active=Count(
            "organization_products",
            filter=Q(organization_products__archive=False, organization_products__subscription_end_date__gt=now),
        ),
    )
    if search := (params.get("search") or "").strip():
        qs = qs.filter(Q(name__icontains=search) | Q(inn__icontains=search))
    qs = qs.order_by("name")
    total = qs.count()
    rows, wallet_sum = [], Decimal("0")
    for o in qs[:MAX_ROWS]:
        balance = o.wallet.balance if hasattr(o, "wallet") else Decimal("0")
        wallet_sum += balance
        rows.append(
            {
                "id": o.id, "name": o.name, "inn": o.inn, "address": o.address or "",
                "owner": o.owner.email if o.owner_id else "",
                "bases_total": o.bases_total, "bases_active": o.bases_active,
                "bases_expired": o.bases_total - o.bases_active,
                "wallet_balance": balance, "created_at": o.created_at,
            }
        )
    columns = [
        ("id", "ID"), ("name", "Организация"), ("inn", "ИНН"), ("address", "Адрес"), ("owner", "Владелец"),
        ("bases_total", "Баз"), ("bases_active", "Активных"), ("bases_expired", "Истекших"),
        ("wallet_balance", "Баланс кошелька"), ("created_at", "Создана"),
    ]
    return {"columns": columns, "rows": rows, "summary": {"total": total, "shown": len(rows), "wallet_total": _money(wallet_sum)}}


# ------------------------------------------------------------- transactions
def _tx_queryset(params):
    qs = WalletTransaction.objects.select_related("wallet__organization")
    kind = params.get("type", "all")
    if kind in ("deposit", "withdraw"):
        qs = qs.filter(transaction_type=kind)
    elif kind != "all":
        raise ReportError("Неверный тип.")
    if org := _int(params.get("organization"), "organization"):
        qs = qs.filter(wallet__organization_id=org)
    start, end = _day_bounds(_date(params.get("date_from"), "date_from"), _date(params.get("date_to"), "date_to"))
    if start:
        qs = qs.filter(created_at__gte=start)
    if end:
        qs = qs.filter(created_at__lt=end)
    return qs


def transactions_report(params):
    qs = _tx_queryset(params).order_by("-created_at", "-id")
    agg = qs.aggregate(
        deposits=Sum("amount", filter=Q(transaction_type="deposit")),
        withdrawals=Sum("amount", filter=Q(transaction_type="withdraw")),
        count=Count("id"),
    )
    rows = [
        {
            "id": t.id, "date": t.created_at, "organization": t.wallet.organization.name,
            "inn": t.wallet.organization.inn,
            "type": "Пополнение" if t.transaction_type == "deposit" else "Списание",
            "amount": t.amount, "balance_after": t.balance_after, "description": t.description,
        }
        for t in qs[:MAX_ROWS]
    ]
    columns = [
        ("id", "ID"), ("date", "Дата"), ("organization", "Организация"), ("inn", "ИНН"), ("type", "Тип"),
        ("amount", "Сумма"), ("balance_after", "Остаток"), ("description", "Комментарий"),
    ]
    summary = {
        "count": agg["count"], "shown": len(rows),
        "deposits": _money(agg["deposits"]), "withdrawals": _money(agg["withdrawals"]),
    }
    return {"columns": columns, "rows": rows, "summary": summary}


def finance_report(params):
    """Totals per day or month."""
    group = params.get("group", "month")
    if group not in ("day", "month"):
        raise ReportError("Группировка: day или month.")
    trunc = TruncDay if group == "day" else TruncMonth
    qs = _tx_queryset({**params, "type": "all"})
    data = (
        qs.annotate(period=trunc("created_at"))
        .values("period")
        .annotate(
            deposits=Sum("amount", filter=Q(transaction_type="deposit")),
            withdrawals=Sum("amount", filter=Q(transaction_type="withdraw")),
            count=Count("id"),
        )
        .order_by("-period")
    )
    rows, dep_total, wd_total = [], Decimal("0"), Decimal("0")
    for r in data[:MAX_ROWS]:
        dep, wd = r["deposits"] or Decimal("0"), r["withdrawals"] or Decimal("0")
        dep_total += dep
        wd_total += wd
        rows.append(
            {
                "period": r["period"].strftime("%Y-%m-%d" if group == "day" else "%Y-%m"),
                "deposits": dep, "withdrawals": wd, "net": dep - wd, "count": r["count"],
            }
        )
    columns = [
        ("period", "Период"), ("deposits", "Пополнения"), ("withdrawals", "Списания"),
        ("net", "Разница"), ("count", "Операций"),
    ]
    return {
        "columns": columns, "rows": rows,
        "summary": {"deposits": _money(dep_total), "withdrawals": _money(wd_total), "net": _money(dep_total - wd_total)},
    }


REPORTS = {
    "bases": bases_report,
    "organizations": organizations_report,
    "transactions": transactions_report,
    "finance": finance_report,
}


# --------------------------------------------------------------------- CSV
def _cell(value):
    """Plain text for CSV. Cells starting with = + - @ are neutralised (Excel formula injection)."""
    if value is None:
        return ""
    if isinstance(value, datetime):
        value = timezone.localtime(value).strftime("%Y-%m-%d %H:%M")
    text = str(value)
    if text[:1] in ("=", "+", "-", "@", "\t", "\r"):
        # leave genuine negative numbers alone
        try:
            float(text)
        except ValueError:
            return "'" + text
    return text


def to_csv(report) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf, delimiter=";")  # ';' opens correctly in Excel with uz/ru regional settings
    writer.writerow([_cell(label) for _, label in report["columns"]])
    for row in report["rows"]:
        writer.writerow([_cell(row[key]) for key, _ in report["columns"]])
    return ("\ufeff" + buf.getvalue()).encode("utf-8")
