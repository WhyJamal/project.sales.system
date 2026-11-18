import hashlib
import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Count, Q, Sum, Value
from django.db.models.functions import Coalesce, TruncMonth
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from organizations.models import Organization, OrganizationProduct, Region
from plans.models import SubscriptionPlan
from products.models import Product, SoftwareVersion
from wallet.models import Wallet, WalletTransaction

from . import audit, reports, services, totp
from .models import StaffLoginAttempt, StaffProfile, StaffSession
from .security import (
    IsStaffMember,
    IsStaffAdmin,
    ProxyGuard,
    StaffLoginIPThrottle,
    StaffRateThrottle,
    StaffRolePermission,
    StaffSessionAuthentication,
    client_ip,
    hash_token,
)

logger = logging.getLogger("staff")
User = get_user_model()

GENERIC_LOGIN_ERROR = "Неверный логин, пароль или одноразовый код."
# Verified against when the account does not exist, so response time doesn't reveal it.
_DUMMY_HASH = make_password("dummy-password-for-timing")


class StaffPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class NoStoreMixin:
    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "no-store, private"
        response["X-Content-Type-Options"] = "nosniff"
        return response


class StaffAPIView(NoStoreMixin, APIView):
    authentication_classes = [StaffSessionAuthentication]
    permission_classes = [ProxyGuard, IsStaffMember, StaffRolePermission]
    throttle_classes = [StaffRateThrottle]


class StaffViewSet(NoStoreMixin, viewsets.GenericViewSet):
    authentication_classes = [StaffSessionAuthentication]
    permission_classes = [ProxyGuard, IsStaffMember, StaffRolePermission]
    throttle_classes = [StaffRateThrottle]
    pagination_class = StaffPagination


def _user_payload(user):
    p = user.staff_profile
    return {"id": user.id, "username": user.username, "email": user.email, "role": p.role, "can_write": p.can_write, "is_admin": p.is_admin}


def _is_admin(request) -> bool:
    p = getattr(request.user, "staff_profile", None)
    return bool(p and p.is_admin)



# ======================================================================= auth
def _ident_hash(identifier: str) -> str:
    return hashlib.sha256(identifier.strip().lower().encode()).hexdigest()


def _too_many_attempts(ident_hash: str, ip: str) -> bool:
    window = timezone.now() - timedelta(minutes=settings.STAFF_LOCK_MINUTES)
    by_ident = StaffLoginAttempt.objects.filter(identifier_hash=ident_hash, created_at__gte=window)
    last_ok = by_ident.filter(success=True).order_by("-created_at").first()
    fails = by_ident.filter(success=False)
    if last_ok:
        fails = fails.filter(created_at__gt=last_ok.created_at)
    if fails.count() >= settings.STAFF_MAX_FAILED:
        return True
    if ip and StaffLoginAttempt.objects.filter(ip=ip, success=False, created_at__gte=window).count() >= settings.STAFF_MAX_FAILED_PER_IP:
        return True
    return False


def _issue_session(request, user, profile, step, ident, ip):
    """Burns the one-time code and opens a server-side staff session. Returns a Response."""
    now = timezone.now()
    with transaction.atomic():
        # Burn the code atomically so two parallel requests can't both use it
        claimed = StaffProfile.objects.filter(pk=profile.pk, last_totp_step__lt=step).update(
            last_totp_step=step, last_login_at=now, last_login_ip=ip or None
        )
        if not claimed:
            StaffLoginAttempt.objects.create(identifier_hash=ident, ip=ip or None, success=False)
            return Response({"detail": GENERIC_LOGIN_ERROR}, status=400)

        token = secrets.token_urlsafe(48)
        expires = now + timedelta(hours=settings.STAFF_SESSION_MAX_HOURS)
        StaffSession.objects.create(
            user=user, token_hash=hash_token(token), last_seen_at=now, expires_at=expires,
            ip=ip or None, user_agent=request.META.get("HTTP_USER_AGENT", "")[:255],
        )
        # keep the 5 newest sessions per person
        old = list(StaffSession.objects.filter(user=user, revoked_at__isnull=True).order_by("-created_at").values_list("pk", flat=True)[5:])
        if old:
            StaffSession.objects.filter(pk__in=old).update(revoked_at=now)
        StaffLoginAttempt.objects.create(identifier_hash=ident, ip=ip or None, success=True)
        StaffLoginAttempt.objects.filter(created_at__lt=now - timedelta(days=7)).delete()

    audit.log(request, "login", "user", user.id, "Вошёл в систему", actor=user)
    return Response({"token": token, "expires_at": expires, "idle_minutes": settings.STAFF_SESSION_IDLE_MINUTES, "user": _user_payload(user)})


class LoginView(NoStoreMixin, APIView):
    """
    Password + one-time code, always both. Failures are indistinguishable (wrong login,
    wrong password, wrong code, not a staff member) and counted per identifier AND per IP,
    whether or not the account exists.
    """

    authentication_classes = []
    permission_classes = [ProxyGuard]
    throttle_classes = [StaffLoginIPThrottle]

    def post(self, request):
        from .serializers import LoginSerializer

        s = LoginSerializer(data=request.data)
        if not s.is_valid():
            return Response({"detail": GENERIC_LOGIN_ERROR}, status=400)
        identifier, password, otp = s.validated_data["identifier"], s.validated_data["password"], s.validated_data["otp"]

        ip = client_ip(request)
        ident = _ident_hash(identifier)

        if _too_many_attempts(ident, ip):
            audit.log(request, "login_blocked", summary=f"Слишком много попыток входа: {identifier[:60]}", actor=None)
            return Response(
                {"detail": f"Слишком много попыток. Повторите через {settings.STAFF_LOCK_MINUTES} мин."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        user = (
            User.objects.filter(Q(email__iexact=identifier) | Q(username=identifier)).select_related("staff_profile").first()
        )
        profile = getattr(user, "staff_profile", None) if user else None

        password_ok = check_password(password, user.password if user else _DUMMY_HASH) and user is not None
        eligible = bool(user and user.is_active and profile and profile.is_active and profile.ip_allowed(ip))
        step = None
        if eligible and password_ok:
            step = totp.verify(profile.get_totp_secret(), otp, profile.last_totp_step)

        if not (eligible and password_ok and step):
            StaffLoginAttempt.objects.create(identifier_hash=ident, ip=ip or None, success=False)
            audit.log(request, "login_failed", summary=f"Вход отклонён: {identifier[:60]}", actor=None)
            return Response({"detail": GENERIC_LOGIN_ERROR}, status=400)

        return _issue_session(request, user, profile, step, ident, ip)


class LoginOtpView(NoStoreMixin, APIView):
    """
    One-click variant for people already signed in on the main site: the site's access JWT
    replaces the password (it proves the password was entered), and the one-time code is still required.
    """

    authentication_classes = []
    permission_classes = [ProxyGuard]
    throttle_classes = [StaffLoginIPThrottle]

    def post(self, request):
        from rest_framework_simplejwt.authentication import JWTAuthentication
        from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

        access = request.data.get("access")
        otp = request.data.get("otp")
        if not isinstance(access, str) or not isinstance(otp, str) or not otp.strip():
            return Response({"detail": GENERIC_LOGIN_ERROR}, status=400)

        ip = client_ip(request)
        user = None
        try:
            auth = JWTAuthentication()
            user = auth.get_user(auth.get_validated_token(access))
        except (TokenError, InvalidToken, Exception):
            user = None
        ident = _ident_hash(user.email if user else "invalid-site-token")

        if _too_many_attempts(ident, ip):
            audit.log(request, "login_blocked", summary="Слишком много попыток входа (по сессии сайта)", actor=None)
            return Response(
                {"detail": f"Слишком много попыток. Повторите через {settings.STAFF_LOCK_MINUTES} мин."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        profile = getattr(user, "staff_profile", None) if user else None
        eligible = bool(user and user.is_active and profile and profile.is_active and profile.ip_allowed(ip))
        step = totp.verify(profile.get_totp_secret(), otp, profile.last_totp_step) if eligible else None

        if not (eligible and step):
            StaffLoginAttempt.objects.create(identifier_hash=ident, ip=ip or None, success=False)
            audit.log(request, "login_failed", summary="Вход по сессии сайта отклонён", actor=None)
            return Response({"detail": GENERIC_LOGIN_ERROR}, status=400)

        return _issue_session(request, user, profile, step, ident, ip)


class LogoutView(StaffAPIView):
    def post(self, request):
        StaffSession.objects.filter(pk=request.auth.pk).update(revoked_at=timezone.now())
        audit.log(request, "logout", "user", request.user.id, "Вышел из системы")
        return Response({"ok": True})


class MeView(StaffAPIView):
    def get(self, request):
        return Response({"user": _user_payload(request.user), "session_expires_at": request.auth.expires_at})


class ChangePasswordView(StaffAPIView):
    def post(self, request):
        from .serializers import ChangePasswordSerializer

        s = ChangePasswordSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(s.validated_data["current_password"]):
            raise ValidationError({"current_password": "Текущий пароль неверен."})
        try:
            validate_password(s.validated_data["new_password"], user)
        except DjangoValidationError as e:
            raise ValidationError({"new_password": list(e.messages)})
        user.set_password(s.validated_data["new_password"])
        user.save(update_fields=["password"])
        # every other session is signed out
        StaffSession.objects.filter(user=user, revoked_at__isnull=True).exclude(pk=request.auth.pk).update(
            revoked_at=timezone.now()
        )
        audit.log(request, "password_changed", "user", user.id, "Пароль изменён")
        return Response({"ok": True})


# ================================================================== dashboard
class DashboardView(StaffAPIView):
    def get(self, request):
        now = timezone.now()
        live = OrganizationProduct.objects.filter(archive=False)
        week = now + timedelta(days=services.EXPIRING_DAYS)
        month_ago = now - timedelta(days=30)
        money = WalletTransaction.objects.filter(created_at__gte=month_ago).aggregate(
            deposits=Sum("amount", filter=Q(transaction_type="deposit")),
            withdrawals=Sum("amount", filter=Q(transaction_type="withdraw")),
        )
        # Bases ending in each of the next 8 weeks (one query)
        buckets = {}
        for i in range(8):
            lo, hi = now + timedelta(days=7 * i), now + timedelta(days=7 * (i + 1))
            buckets[f"w{i}"] = Count("id", filter=Q(subscription_end_date__gt=lo, subscription_end_date__lte=hi))
        week_counts = live.aggregate(**buckets)
        expiry_weeks = [
            {"start": (now + timedelta(days=7 * i)).date().isoformat(), "count": week_counts[f"w{i}"]} for i in range(8)
        ]

        # Deposits / withdrawals for the last 6 calendar months (missing months filled with 0)
        first = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        months = []
        y, m = first.year, first.month
        for _ in range(6):
            months.append((y, m))
            m -= 1
            if m == 0:
                y, m = y - 1, 12
        months.reverse()
        since = first.replace(year=months[0][0], month=months[0][1])
        by_month = {
            (r["period"].year, r["period"].month): r
            for r in WalletTransaction.objects.filter(created_at__gte=since)
            .annotate(period=TruncMonth("created_at"))
            .values("period")
            .annotate(
                deposits=Sum("amount", filter=Q(transaction_type="deposit")),
                withdrawals=Sum("amount", filter=Q(transaction_type="withdraw")),
            )
        }
        finance_months = [
            {
                "month": f"{y}-{m:02d}",
                "deposits": reports._money((by_month.get((y, m)) or {}).get("deposits")),
                "withdrawals": reports._money((by_month.get((y, m)) or {}).get("withdrawals")),
            }
            for y, m in months
        ]

        return Response(
            {
                "expiry_weeks": expiry_weeks,
                "finance_months": finance_months,
                "organizations": Organization.objects.count(),
                "bases": {
                    "total": live.count(),
                    "active": live.filter(subscription_end_date__gt=now).count(),
                    "expiring": live.filter(subscription_end_date__gt=now, subscription_end_date__lte=week).count(),
                    "expired": live.filter(subscription_end_date__lte=now).count(),
                    "archived": OrganizationProduct.objects.filter(archive=True).count(),
                },
                "wallets_total": reports._money(Wallet.objects.aggregate(s=Sum("balance"))["s"]),
                "last_30_days": {"deposits": reports._money(money["deposits"]), "withdrawals": reports._money(money["withdrawals"])},
                "expiring_days": services.EXPIRING_DAYS,
            }
        )


class LookupsView(StaffAPIView):
    """Everything the create/edit forms need to fill their selects."""

    def get(self, request):
        return Response(
            {
                "products": list(
                    Product.objects.filter(is_active=True).values("id", "name", "title", "included_users", "extra_user_price")
                ),
                "plans": list(
                    SubscriptionPlan.objects.filter(is_active=True).values("id", "product_id", "code", "name", "price", "duration_days")
                ),
                "versions": list(
                    SoftwareVersion.objects.filter(is_active=True).values("id", "product_id", "name", "version")
                ),
                "regions": list(Region.objects.values("id", "name", "is_active")),
            }
        )


# ============================================================== organizations
def _org_dict(o):
    wallet = getattr(o, "wallet", None)
    data = {
        "id": o.id, "name": o.name, "inn": o.inn, "address": o.address,
        "owner": {"id": o.owner_id, "username": o.owner.username, "email": o.owner.email} if o.owner_id else None,
        "promo_code": o.promo_code, "created_at": o.created_at,
        "bases_total": getattr(o, "bases_total", None), "bases_active": getattr(o, "bases_active", None),
        "wallet_balance": str(wallet.balance) if wallet else "0.00",
    }
    data["region"] = {"id": o.region_id, "name": o.region.name} if o.region_id else None  # read-only for non-admins
    return data


def _org_snapshot(o):
    return {"name": o.name, "inn": o.inn, "address": o.address, "owner": o.owner.email if o.owner_id else None}


def _guard_region_input(request):
    """Every staff role can SEE the region; only admins may set or change it."""
    if "region" in request.data and not _is_admin(request):
        raise PermissionDenied("Регион может менять только администратор.")


class OrganizationViewSet(StaffViewSet):
    def get_queryset(self):
        now = timezone.now()
        qs = Organization.objects.select_related("owner", "wallet", "region").annotate(
            bases_total=Count("organization_products", filter=Q(organization_products__archive=False), distinct=True),
            bases_active=Count(
                "organization_products",
                filter=Q(organization_products__archive=False, organization_products__subscription_end_date__gt=now),
                distinct=True,
            ),
        )
        if search := (self.request.query_params.get("search") or "").strip()[:100]:
            qs = qs.filter(
                Q(name__icontains=search) | Q(inn__icontains=search) | Q(owner__email__icontains=search) | Q(region__name__icontains=search)
            )
        if region := self.request.query_params.get("region"):
            if region == "none":
                qs = qs.filter(region__isnull=True)
            else:
                try:
                    qs = qs.filter(region_id=int(region))
                except ValueError:
                    raise ValidationError({"region": "Должно быть целым числом."})
        return qs.order_by("-created_at", "-id")

    def list(self, request):
        page = self.paginate_queryset(self.get_queryset())
        return self.get_paginated_response([_org_dict(o) for o in page])

    def retrieve(self, request, pk=None):
        org = self.get_object()
        bases = OrganizationProduct.objects.filter(organization=org).select_related(
            "organization", "product", "subscription__plan", "version"
        ).order_by("archive", "subscription_end_date")
        now = timezone.now()
        members = [{"id": u.id, "username": u.username, "email": u.email, "phone_number": u.phone_number} for u in org.members.all()[:50]]
        data = _org_dict(org)
        data.update({"bases": [services.serialize_base(b, now) for b in bases], "members": members})
        return Response(data)

    @action(detail=True, methods=["get"], url_path="wallet")
    def wallet(self, request, pk=None):
        """Balance + latest wallet operations (any staff role may look)."""
        org = self.get_object()
        wallet = Wallet.objects.filter(organization=org).first()
        rows = WalletTransaction.objects.filter(wallet=wallet).order_by("-created_at", "-id")[:100] if wallet else []
        return Response({
            "balance": str(wallet.balance) if wallet else "0.00",
            "transactions": [
                {
                    "id": t.id, "type": t.transaction_type, "type_label": t.get_transaction_type_display(),
                    "amount": str(t.amount), "balance_after": str(t.balance_after),
                    "description": t.description, "created_at": t.created_at.isoformat(),
                }
                for t in rows
            ],
        })

    @action(
        detail=True, methods=["post"], url_path="wallet/deposit",
        permission_classes=[ProxyGuard, IsStaffMember, IsStaffAdmin],
    )
    def wallet_deposit(self, request, pk=None):
        """Top up an organization's wallet. Admin role only; always leaves a WalletTransaction + audit entry."""
        from .serializers import WalletDepositSerializer

        org = self.get_object()
        s = WalletDepositSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        amount, comment = s.validated_data["amount"], (s.validated_data.get("comment") or "").strip()

        wallet, _ = Wallet.objects.get_or_create(organization=org)
        # double-click / retry guard: the very same top-up within the last 10 seconds is refused
        recent = WalletTransaction.objects.filter(
            wallet=wallet, transaction_type="deposit", amount=amount, created_at__gte=timezone.now() - timedelta(seconds=10)
        ).exists()
        if recent:
            raise ValidationError({"detail": "Такое пополнение только что выполнено. Обновите страницу."})

        before = wallet.balance
        description = "Пополнение администратором" + (f": {comment}" if comment else "")
        wallet.deposit(amount, description)
        audit.log(
            request, "wallet_deposit", "organization", org.id, f"Пополнение кошелька {org.name}: +{amount}",
            {"amount": {"old": None, "new": str(amount)}, "balance": {"old": str(before), "new": str(wallet.balance)},
             **({"comment": {"old": None, "new": comment}} if comment else {})},
        )
        return Response({"balance": str(wallet.balance)}, status=201)

    def create(self, request):
        from .serializers import OrganizationWriteSerializer

        _guard_region_input(request)
        s = OrganizationWriteSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        with transaction.atomic():
            org = s.save()  # Organization.save() also links the owner
            Wallet.objects.get_or_create(organization=org)
        audit.log(request, "organization_created", "organization", org.id, f"Организация создана: {org.name}", {"inn": {"old": None, "new": org.inn}})
        if org.region_id:
            audit.log(request, "organization_region_changed", "organization", org.id, f"Регион организации {org.name}: {org.region.name}", {"region": {"old": None, "new": org.region.name}})
        return Response(_org_dict(Organization.objects.select_related("owner", "wallet", "region").get(pk=org.pk)), status=201)

    def partial_update(self, request, pk=None):
        from .serializers import OrganizationWriteSerializer

        _guard_region_input(request)
        org = self.get_object()
        before = _org_snapshot(org)
        old_region = org.region.name if org.region_id else None
        s = OrganizationWriteSerializer(org, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        with transaction.atomic():
            org = s.save()
            if org.owner_id and org.owner.organization_id != org.id:
                User.objects.filter(pk=org.owner_id).update(organization=org)
        org.refresh_from_db()
        changes = audit.diff(before, _org_snapshot(org))
        if changes:
            audit.log(request, "organization_updated", "organization", org.id, f"Организация изменена: {org.name}", changes)
        org = Organization.objects.select_related("owner", "wallet", "region").get(pk=org.pk)
        new_region = org.region.name if org.region_id else None
        if new_region != old_region:  # logged separately so that only admins can read it in the journal
            audit.log(request, "organization_region_changed", "organization", org.id, f"Регион организации {org.name}: {new_region or '—'}", {"region": {"old": old_region, "new": new_region}})
        return Response(_org_dict(org))


# ===================================================================== regions (admin only)
def _region_dict(r):
    return {"id": r.id, "name": r.name, "is_active": r.is_active, "order": r.order, "organizations_count": getattr(r, "orgs_count", None)}


class RegionViewSet(StaffViewSet):
    """Region directory. Admin role only — for every method, reads included."""

    permission_classes = [ProxyGuard, IsStaffMember, IsStaffAdmin]
    pagination_class = None

    def _validated(self, request, instance=None):
        data = {}
        if "name" in request.data or instance is None:
            name = str(request.data.get("name") or "").strip()
            if len(name) < 2 or len(name) > 120:
                raise ValidationError({"name": "От 2 до 120 символов."})
            qs = Region.objects.filter(name__iexact=name)
            if instance is not None:
                qs = qs.exclude(pk=instance.pk)
            if qs.exists():
                raise ValidationError({"name": "Такой регион уже существует."})
            data["name"] = name
        if "is_active" in request.data:
            data["is_active"] = bool(request.data.get("is_active"))
        if "order" in request.data:
            try:
                data["order"] = max(0, min(int(request.data.get("order")), 100000))
            except (TypeError, ValueError):
                raise ValidationError({"order": "Должно быть целым числом."})
        return data

    def list(self, request):
        qs = Region.objects.annotate(orgs_count=Count("organizations")).order_by("order", "name")
        return Response([_region_dict(r) for r in qs])

    def create(self, request):
        r = Region.objects.create(**self._validated(request))
        audit.log(request, "region_created", "region", r.id, f"Регион создан: {r.name}")
        return Response(_region_dict(r), status=201)

    def partial_update(self, request, pk=None):
        r = Region.objects.filter(pk=pk).first()
        if not r:
            raise NotFound()
        before = {"name": r.name, "is_active": r.is_active, "order": r.order}
        for k, val in self._validated(request, r).items():
            setattr(r, k, val)
        r.save()
        changes = audit.diff(before, {"name": r.name, "is_active": r.is_active, "order": r.order})
        if changes:
            audit.log(request, "region_updated", "region", r.id, f"Регион изменён: {r.name}", changes)
        r = Region.objects.annotate(orgs_count=Count("organizations")).get(pk=r.pk)
        return Response(_region_dict(r))

    def destroy(self, request, pk=None):
        r = Region.objects.filter(pk=pk).first()
        if not r:
            raise NotFound()
        if r.organizations.exists():
            raise ValidationError({"detail": "К региону привязаны организации. Отключите его вместо удаления."})
        name = r.name
        r.delete()
        audit.log(request, "region_deleted", "region", pk, f"Регион удалён: {name}")
        return Response(status=204)


# ===================================================================== bases
class BaseViewSet(StaffViewSet):
    ORDERING = {
        "end_date": "subscription_end_date", "-end_date": "-subscription_end_date",
        "created": "created_at", "-created": "-created_at",
        "title": "title", "-title": "-title",
    }

    def get_queryset(self):
        qs = OrganizationProduct.objects.select_related("organization", "product", "subscription__plan", "version")
        p = self.request.query_params
        now = timezone.now()
        st = p.get("status")
        if st == "active":
            qs = qs.filter(archive=False, subscription_end_date__gt=now)
        elif st == "expiring":
            qs = qs.filter(archive=False, subscription_end_date__gt=now, subscription_end_date__lte=now + timedelta(days=services.EXPIRING_DAYS))
        elif st == "expired":
            qs = qs.filter(archive=False, subscription_end_date__lte=now)
        elif st == "archived":
            qs = qs.filter(archive=True)
        elif st in (None, "", "all"):
            pass
        else:
            raise ValidationError({"status": "Недопустимое значение."})
        for param, field in (("organization", "organization_id"), ("product", "product_id")):
            if p.get(param):
                try:
                    qs = qs.filter(**{field: int(p[param])})
                except ValueError:
                    raise ValidationError({param: "Должно быть целым числом."})
        if search := (p.get("search") or "").strip()[:100]:
            qs = qs.filter(Q(title__icontains=search) | Q(organization__name__icontains=search) | Q(organization__inn__icontains=search))
        return qs.order_by(self.ORDERING.get(p.get("ordering"), "subscription_end_date"), "id")

    def list(self, request):
        page = self.paginate_queryset(self.get_queryset())
        now = timezone.now()
        return self.get_paginated_response([services.serialize_base(b, now) for b in page])

    def retrieve(self, request, pk=None):
        return Response(services.serialize_base(self.get_object()))

    def create(self, request):
        from .serializers import BaseCreateSerializer

        s = BaseCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        try:
            obj = services.create_base(data=s.validated_data)
        except services.StaffError as e:
            raise ValidationError({"detail": str(e)})
        obj = OrganizationProduct.objects.select_related("organization", "product", "subscription__plan", "version").get(pk=obj.pk)
        audit.log(
            request, "base_created", "base", obj.id, f"База создана: {obj.title} ({obj.organization.name})",
            {"end_date": {"old": None, "new": obj.subscription_end_date.isoformat()},
             "charged_wallet": {"old": None, "new": bool(s.validated_data["charge_wallet"])}},
        )
        return Response(services.serialize_base(obj), status=201)

    def partial_update(self, request, pk=None):
        from .serializers import BaseUpdateSerializer

        obj = self.get_object()
        s = BaseUpdateSerializer(data=request.data, partial=True, context={"base": obj})
        s.is_valid(raise_exception=True)
        before = services.base_snapshot(obj)
        try:
            # A different version really updates the 1C database (like on the site); if that fails nothing is saved.
            new_version = s.validated_data.get("version")
            if new_version is not None and new_version.pk != obj.version_id:
                services.update_1c_version(obj, new_version, s.validated_data.get("product_url"))
            obj = services.update_base(obj, s.validated_data)
        except services.StaffError as e:
            raise ValidationError({"detail": str(e)})
        changes = audit.diff(before, services.base_snapshot(obj))
        if changes:
            audit.log(request, "base_updated", "base", obj.id, f"База изменена: {obj.title} ({obj.organization.name})", changes)
        return Response(services.serialize_base(obj))

    @action(detail=True, methods=["post"], url_path="extend")
    def extend(self, request, pk=None):
        from .serializers import ExtendSerializer

        obj = self.get_object()
        s = ExtendSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        before = services.base_snapshot(obj)
        obj = services.extend_base(obj, **s.validated_data)
        audit.log(request, "base_extended", "base", obj.id, f"Срок продлён: {obj.title}", audit.diff(before, services.base_snapshot(obj)))
        return Response(services.serialize_base(obj))


# ================================================================== reports
class ReportView(StaffAPIView):
    def get(self, request, kind):
        builder = reports.REPORTS.get(kind)
        if builder is None:
            raise NotFound()
        params = request.query_params
        try:
            report = builder(params)
        except reports.ReportError as e:
            raise ValidationError({"detail": str(e)})

        if params.get("export") == "csv":
            audit.log(request, "report_export", "report", kind, f"CSV: {kind}", {"params": {"old": None, "new": dict(params.items())}})
            resp = HttpResponse(reports.to_csv(report), content_type="text/csv; charset=utf-8")
            resp["Content-Disposition"] = f'attachment; filename="{kind}-{timezone.localdate():%Y%m%d}.csv"'
            return resp

        return Response(
            {
                "columns": [{"key": k, "label": label} for k, label in report["columns"]],
                "rows": report["rows"],
                "summary": report["summary"],
            }
        )


class AuditLogView(StaffAPIView):
    def get(self, request):
        from .models import StaffAuditLog

        qs = StaffAuditLog.objects.all()
        if action_ := request.query_params.get("action"):
            qs = qs.filter(action=action_[:60])
        paginator = StaffPagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(
            [
                {"id": a.id, "at": a.created_at, "actor": a.actor_label, "action": a.action, "target_type": a.target_type,
                 "target_id": a.target_id, "summary": a.summary, "changes": a.changes, "ip": a.ip}
                for a in page
            ]
        )
