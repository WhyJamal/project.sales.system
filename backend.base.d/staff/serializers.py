import re
from decimal import Decimal
from urllib.parse import urlparse

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers

from organizations.models import Organization, OrganizationProduct, Region
from plans.models import SubscriptionPlan, ALLOWED_MONTHS
from products.models import Product, SoftwareVersion

User = get_user_model()

INN_RE = re.compile(r"^\d{9,14}$")


def validate_base_url(value: str) -> str:
    """
    A base URL is later called by the server WITH the 1C service credentials
    (users list / toggle), so it may only point at our own 1C web host.
    """
    value = (value or "").strip()
    if not value:
        return value
    host_url = (settings.HOST_URL or "").rstrip("/")
    if not host_url:
        raise serializers.ValidationError("HOST_URL не настроен на сервере.")
    a, b = urlparse(value), urlparse(host_url)
    if (a.scheme, a.netloc) != (b.scheme, b.netloc):
        raise serializers.ValidationError(f"Адрес должен принадлежать вашему 1С-серверу: {host_url}")
    return value


# --------------------------------------------------------------------- auth
class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=254, trim_whitespace=True)
    password = serializers.CharField(max_length=256, trim_whitespace=False, write_only=True)
    otp = serializers.CharField(max_length=12, trim_whitespace=True)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(max_length=256, trim_whitespace=False)
    new_password = serializers.CharField(max_length=256, trim_whitespace=False)


# ------------------------------------------------------------ organizations
class OrganizationWriteSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True), allow_null=True, required=False
    )
    region = serializers.PrimaryKeyRelatedField(queryset=Region.objects.all(), allow_null=True, required=False)

    class Meta:
        model = Organization
        fields = ["name", "inn", "address", "owner", "region"]
        extra_kwargs = {"inn": {"validators": []}}  # unique check done below (nice error, self-aware)

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Название слишком короткое.")
        return value

    def validate_inn(self, value):
        value = value.strip()
        if not INN_RE.match(value):
            raise serializers.ValidationError("ИНН должен состоять из 9–14 цифр.")
        qs = Organization.objects.filter(inn=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Организация с таким ИНН уже существует.")
        return value

    def validate_address(self, value):
        return (value or "").strip() or None

    def validate_region(self, region):
        # an archived region can stay where it already is, but can't be newly assigned
        if region and not region.is_active:
            current = self.instance.region_id if self.instance is not None else None
            if region.pk != current:
                raise serializers.ValidationError("Этот регион отключён.")
        return region

    def validate_owner(self, owner):
        if owner is None:
            return owner
        current = self.instance.pk if self.instance is not None else None
        if owner.organization_id and owner.organization_id != current:
            raise serializers.ValidationError("Этот пользователь уже привязан к другой организации.")
        return owner


# -------------------------------------------------------------------- bases
class BaseCreateSerializer(serializers.Serializer):
    organization = serializers.PrimaryKeyRelatedField(queryset=Organization.objects.all())
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    plan = serializers.PrimaryKeyRelatedField(queryset=SubscriptionPlan.objects.filter(is_active=True))
    title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    user_count = serializers.IntegerField(min_value=1, max_value=10_000, default=1)

    # Term: either a number of months, or an exact end date
    months = serializers.IntegerField(required=False)
    end_date = serializers.DateTimeField(required=False)

    charge_wallet = serializers.BooleanField(default=False)
    provision = serializers.BooleanField(default=True)
    product_url = serializers.CharField(max_length=500, required=False, allow_blank=True)
    # optional: which software version the base is attached to (default: the first active one of the product)
    version = serializers.PrimaryKeyRelatedField(queryset=SoftwareVersion.objects.all(), required=False, allow_null=True)

    def validate_months(self, value):
        if value not in ALLOWED_MONTHS:
            raise serializers.ValidationError(f"Допустимые сроки (мес.): {', '.join(map(str, ALLOWED_MONTHS))}.")
        return value

    def validate_product_url(self, value):
        return validate_base_url(value)

    def validate(self, attrs):
        plan, product = attrs["plan"], attrs["product"]
        if plan.product_id and plan.product_id != product.id:
            raise serializers.ValidationError({"plan": "Этот тариф не относится к выбранному продукту."})
        version = attrs.get("version")
        if version is not None and (version.product_id != product.id or not version.is_active):
            raise serializers.ValidationError({"version": "Выберите активную версию этого продукта."})
        if "months" not in attrs and "end_date" not in attrs:
            attrs["months"] = 1
        if "months" in attrs and "end_date" in attrs:
            raise serializers.ValidationError("Укажите либо срок в месяцах, либо дату окончания.")
        if not attrs["provision"] and not attrs.get("product_url"):
            raise serializers.ValidationError({"product_url": "Если новая база не создаётся, укажите URL существующей."})
        if attrs["provision"] and attrs.get("product_url"):
            raise serializers.ValidationError({"product_url": "При создании новой базы URL не указывается."})
        return attrs


class BaseUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False)
    subscription_end_date = serializers.DateTimeField(required=False)
    plan = serializers.PrimaryKeyRelatedField(queryset=SubscriptionPlan.objects.all(), required=False)
    user_count = serializers.IntegerField(min_value=1, max_value=10_000, required=False)
    pending_user_count = serializers.IntegerField(min_value=1, max_value=10_000, required=False, allow_null=True)
    product_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0, required=False)
    archive = serializers.BooleanField(required=False)
    chosen = serializers.BooleanField(required=False)
    version = serializers.PrimaryKeyRelatedField(
        queryset=SoftwareVersion.objects.all(), required=False, allow_null=True
    )
    product_url = serializers.CharField(max_length=500, required=False, allow_blank=False)

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Название не может быть пустым.")
        return value

    def validate_product_url(self, value):
        return validate_base_url(value)

    def validate_version(self, version):
        # context carries the base being edited: the version must belong to the same product,
        # and an inactive version can only stay where it already is (not be newly attached)
        base = self.context.get("base")
        if version is not None and base is not None:
            if version.product_id != base.product_id:
                raise serializers.ValidationError("Эта версия относится к другому продукту.")
            if not version.is_active and version.pk != base.version_id:
                raise serializers.ValidationError("Эта версия отключена.")
        return version


class WalletDepositSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=Decimal("0.01"), max_value=Decimal("1000000000"))
    comment = serializers.CharField(max_length=150, required=False, allow_blank=True)


class ExtendSerializer(serializers.Serializer):
    days = serializers.IntegerField(min_value=1, max_value=3650, required=False)
    months = serializers.IntegerField(required=False)

    def validate_months(self, value):
        if value not in ALLOWED_MONTHS:
            raise serializers.ValidationError(f"Допустимые сроки (мес.): {', '.join(map(str, ALLOWED_MONTHS))}.")
        return value

    def validate(self, attrs):
        if ("days" in attrs) == ("months" in attrs):
            raise serializers.ValidationError("Укажите либо дни, либо месяцы.")
        return attrs
