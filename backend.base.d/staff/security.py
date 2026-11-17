"""Authentication, permissions and throttling for the staff API."""
import hashlib
import hmac
import ipaddress
import logging
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework.permissions import SAFE_METHODS, BasePermission
from rest_framework.throttling import SimpleRateThrottle

from .models import StaffSession, ip_in_rules

logger = logging.getLogger("staff.security")


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def client_ip(request) -> str:
    """
    The staff API is only reachable through our Next.js proxy (see ProxyGuard), which
    forwards the visitor's address in X-Staff-Client-IP. We only trust that header after
    the proxy secret has been verified.
    """
    forwarded = request.META.get("HTTP_X_STAFF_CLIENT_IP", "").strip()
    if forwarded and proxy_secret_ok(request):
        try:
            return str(ipaddress.ip_address(forwarded))
        except ValueError:
            pass
    return request.META.get("REMOTE_ADDR", "") or ""


def proxy_secret_ok(request) -> bool:
    expected = getattr(settings, "STAFF_PROXY_SECRET", "") or ""
    given = request.META.get("HTTP_X_STAFF_PROXY_SECRET", "")
    return bool(expected) and hmac.compare_digest(expected.encode(), given.encode())


class ProxyGuard(BasePermission):
    """
    Requests must come from our own Next.js server (shared secret) — direct hits on the
    Django API from the internet are rejected before anything else happens — and from an
    allowed IP when STAFF_IP_ALLOWLIST is set.
    """

    message = "Not found."

    def has_permission(self, request, view):
        if not proxy_secret_ok(request):
            logger.warning("staff api: bad/missing proxy secret from %s", request.META.get("REMOTE_ADDR"))
            raise PermissionDenied(self.message)
        allow = getattr(settings, "STAFF_IP_ALLOWLIST", []) or []
        if allow and not ip_in_rules(client_ip(request), allow):
            logger.warning("staff api: ip %s not in global allowlist", client_ip(request))
            raise PermissionDenied(self.message)
        return True


class StaffSessionAuthentication(BaseAuthentication):
    """`Authorization: Bearer <opaque token>` — looked up by SHA-256 in StaffSession."""

    keyword = b"bearer"

    def authenticate(self, request):
        parts = get_authorization_header(request).split()
        if not parts or parts[0].lower() != self.keyword:
            return None
        if len(parts) != 2:
            raise AuthenticationFailed("Invalid token.")
        try:
            token = parts[1].decode()
        except UnicodeError:
            raise AuthenticationFailed("Invalid token.")

        session = (
            StaffSession.objects.select_related("user", "user__staff_profile")
            .filter(token_hash=hash_token(token))
            .first()
        )
        now = timezone.now()
        idle = timedelta(minutes=settings.STAFF_SESSION_IDLE_MINUTES)

        if (
            session is None
            or session.revoked_at is not None
            or session.expires_at <= now
            or session.last_seen_at + idle <= now
        ):
            raise AuthenticationFailed("Session expired.")

        user = session.user
        profile = getattr(user, "staff_profile", None)
        if not user.is_active or profile is None or not profile.is_active:
            raise AuthenticationFailed("Session expired.")
        if not profile.ip_allowed(client_ip(request)):
            logger.warning("staff api: %s blocked by per-user allowlist (%s)", user, client_ip(request))
            raise AuthenticationFailed("Session expired.")

        if (now - session.last_seen_at).total_seconds() > 60:  # sliding idle window, cheap writes
            StaffSession.objects.filter(pk=session.pk).update(last_seen_at=now)

        return (user, session)

    def authenticate_header(self, request):
        return "Bearer"


class IsStaffMember(BasePermission):
    def has_permission(self, request, view):
        return isinstance(request.auth, StaffSession) and request.user.is_authenticated


class IsStaffAdmin(BasePermission):
    """Only role == admin (every method, GET included). Answers 404-like so non-admins learn nothing."""

    message = "Not found."

    def has_permission(self, request, view):
        profile = getattr(request.user, "staff_profile", None)
        return bool(profile and profile.is_active and profile.is_admin)


class StaffRolePermission(BasePermission):
    """Safe methods: any staff role. Everything else: role == manager."""

    message = "У вас нет прав на изменение данных."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.staff_profile.can_write


class StaffRateThrottle(SimpleRateThrottle):
    """Per signed-in staff user."""

    scope = "staff"

    def get_cache_key(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return None
        return self.cache_format % {"scope": self.scope, "ident": request.user.pk}


class StaffLoginIPThrottle(SimpleRateThrottle):
    scope = "staff_login"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": client_ip(request) or "unknown"}
