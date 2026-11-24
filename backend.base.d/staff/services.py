"""Business logic of the admin panel (kept out of the views so it is easy to test)."""
import math
import os
from datetime import timedelta
from decimal import Decimal

import logging

from django.db import transaction
from django.utils import timezone

from organizations.models import OrganizationProduct
from organizations.utils import initialize_1c_database, set_1c_organization_info
from plans.models import OrganizationSubscription
from products.models import SoftwareVersion
from wallet.views import get_or_create_wallet

logger = logging.getLogger(__name__)

EXPIRING_DAYS = 7  # "tugayapti" = ichida shuncha kun qolgan


def base_status(obj, now=None) -> str:
    now = now or timezone.now()
    if obj.archive:
        return "archived"
    if not obj.subscription_end_date:
        return "no_subscription"
    if obj.subscription_end_date <= now:
        return "expired"
    if obj.subscription_end_date <= now + timedelta(days=EXPIRING_DAYS):
        return "expiring"
    return "active"


def days_left(obj, now=None):
    now = now or timezone.now()
    if not obj.subscription_end_date:
        return None
    seconds = (obj.subscription_end_date - now).total_seconds()
    return math.ceil(seconds / 86400) if seconds > 0 else -math.ceil(-seconds / 86400)


def serialize_base(obj, now=None) -> dict:
    now = now or timezone.now()
    plan = obj.subscription.plan if obj.subscription_id else None
    product = obj.product
    return {
        "id": obj.id,
        "title": obj.title,
        "organization": {"id": obj.organization_id, "name": obj.organization.name, "inn": obj.organization.inn},
        "product": {"id": product.id, "name": product.name, "title": product.title},
        "plan": (
            {"id": plan.id, "code": plan.code, "name": plan.name, "price": str(plan.price), "duration_days": plan.duration_days}
            if plan
            else None
        ),
        "product_url": obj.product_url,
        "product_price": str(obj.product_price),
        "monthly_price": str(obj.calculate_monthly_price()),
        "subscription_end_date": obj.subscription_end_date,
        "days_left": days_left(obj, now),
        "status": base_status(obj, now),
        "user_count": obj.user_count,
        "pending_user_count": obj.pending_user_count,
        "included_users": product.included_users,
        "extra_user_price": str(product.extra_user_price),
        "version": {"id": obj.version_id, "version": obj.version.version} if obj.version_id else None,
        "archive": obj.archive,
        "chosen": obj.chosen,
        "created_at": obj.created_at,
    }


def base_snapshot(obj) -> dict:
    """Comparable view of a base for the audit log."""
    return {
        "title": obj.title,
        "subscription_end_date": obj.subscription_end_date,
        "plan": obj.subscription.plan.name if obj.subscription_id else None,
        "user_count": obj.user_count,
        "pending_user_count": obj.pending_user_count,
        "product_price": str(obj.product_price),
        "archive": obj.archive,
        "chosen": obj.chosen,
        "version": str(obj.version) if obj.version_id else None,
        "product_url": obj.product_url,
    }


class StaffError(Exception):
    """Business-rule error → 400 with a readable message."""


@transaction.atomic
def create_base(*, data) -> OrganizationProduct:
    org, product, plan = data["organization"], data["product"], data["plan"]
    now = timezone.now()
    end_date = data.get("end_date") or now + timedelta(days=plan.duration_days * data["months"])
    months = data.get("months", 1)

    title = (data.get("title") or "").strip() or f"{org.name} - {plan.name}"
    base_inn = (data.get("inn") or "").strip() or org.inn
    probe = OrganizationProduct(
        organization=org, product=product, user_count=data["user_count"], product_price=plan.price
    )
    cost = probe.calculate_monthly_price() * months

    if data["charge_wallet"] and cost > 0:
        # Raises ValueError("Недостаточно средств ...") if the balance is too low
        try:
            get_or_create_wallet(org).withdraw(cost, description=f"Админ: открыта база — {title} ({plan.name})")
        except ValueError as e:
            raise StaffError(str(e))
        org.reward_referrer(cost)

    version = data.get("version") or SoftwareVersion.objects.filter(product=product, is_active=True).first()
    if data["provision"]:
        source = os.path.join(version.install_path, "1Cv8.1CD") if version and version.install_path else None
        try:
            product_url = initialize_1c_database(base_inn, plan.name, source_1cd=source)
        except Exception as e:  # 1C / IIS / disk problems
            raise StaffError(f"Не удалось создать базу 1С: {e}")
        try:
            base_name = org.name if base_inn == org.inn else title
            set_1c_organization_info(base_url=product_url, inn=base_inn, name=base_name)
        except Exception as e:  # the base exists; only its name/INN inside 1C was not written
            logger.warning(f"Не удалось записать ИНН/название в 1С ({product_url}): {e}")
    else:
        product_url = data["product_url"]

    subscription = OrganizationSubscription.objects.create(organization=org, plan=plan, end_date=end_date)

    # product_url is already set, so OrganizationProduct.save() will NOT charge the wallet
    # or provision a second database.
    obj = OrganizationProduct(
        organization=org,
        product=product,
        title=title,
        inn=base_inn,
        product_url=product_url,
        product_price=plan.price,
        subscription=subscription,
        subscription_end_date=end_date,
        user_count=data["user_count"],
        version=version,
        order=OrganizationProduct.objects.filter(organization=org).count(),
    )
    obj.save()
    obj._cost = cost  # for the audit trail
    return obj


def update_1c_version(obj: OrganizationProduct, version: SoftwareVersion, product_url: str | None = None) -> None:
    """
    Loads the version's configuration (1Cv8.cf) into the base's 1C database via the Designer — exactly what the
    site's "update version" does. Raises StaffError when it fails, so the caller can leave everything unchanged.
    May take minutes; call it OUTSIDE of any database transaction.
    """
    from organizations.utils import BASAR_DIR_ROOT, get_base_path_from_url, update_1c_config

    url = product_url or obj.product_url
    if not url:  # nothing to update on the server side: the link alone is stored
        return
    base_path = os.path.realpath(get_base_path_from_url(url))
    root = os.path.realpath(BASAR_DIR_ROOT)
    if os.path.commonpath([base_path, root]) != root or base_path == root:
        raise StaffError("Адрес базы указывает за пределы папки баз 1С.")
    if not os.path.isdir(base_path):
        raise StaffError(f"Папка базы не найдена на сервере: {base_path}")
    cf_file = os.path.join(version.install_path or "", "1Cv8.cf")
    if not os.path.exists(cf_file):
        raise StaffError(f"Файл конфигурации не найден: {cf_file}")
    result = update_1c_config(base_path, cf_file=cf_file)
    if not result.get("success"):
        raise StaffError(result.get("message") or "Не удалось обновить конфигурацию 1С.")


@transaction.atomic
def update_base(obj: OrganizationProduct, data: dict) -> OrganizationProduct:
    """
    Uses queryset.update() on purpose: OrganizationProduct.save() charges the wallet and
    provisions a 1C database whenever product_url is empty — an admin edit must never do that.
    """
    fields = {}
    for key in ("title", "user_count", "pending_user_count", "product_price", "archive", "chosen", "product_url"):
        if key in data:
            fields[key] = data[key]
    if "version" in data:
        fields["version"] = data["version"]

    sub = obj.subscription
    new_end = data.get("subscription_end_date")
    new_plan = data.get("plan")

    if new_plan is not None and sub is None and new_end is None:
        raise StaffError("Чтобы назначить тариф базе без подписки, укажите также дату окончания.")

    if sub is None and (new_end is not None or new_plan is not None):
        if new_plan is None:
            raise StaffError("Сначала выберите тариф.")
        sub = OrganizationSubscription.objects.create(
            organization=obj.organization, plan=new_plan, end_date=new_end or timezone.now()
        )
        fields["subscription"] = sub
    elif sub is not None:
        sub_fields = {}
        if new_plan is not None:
            sub_fields["plan"] = new_plan
        if new_end is not None:
            sub_fields["end_date"] = new_end
        if sub_fields:
            OrganizationSubscription.objects.filter(pk=sub.pk).update(**sub_fields)

    if new_end is not None:
        fields["subscription_end_date"] = new_end
    if new_plan is not None and "product_price" not in fields:
        fields["product_price"] = new_plan.price

    if fields:
        OrganizationProduct.objects.filter(pk=obj.pk).update(**fields)
    return OrganizationProduct.objects.select_related(
        "organization", "product", "subscription__plan", "version"
    ).get(pk=obj.pk)


def extend_base(obj: OrganizationProduct, *, days=None, months=None) -> OrganizationProduct:
    """Adds to the current end date; an already-expired base is extended from today."""
    now = timezone.now()
    start = obj.subscription_end_date if obj.subscription_end_date and obj.subscription_end_date > now else now
    if days is None:
        duration = obj.subscription.plan.duration_days if obj.subscription_id else 30
        days = duration * months
    return update_base(obj, {"subscription_end_date": start + timedelta(days=days)})
