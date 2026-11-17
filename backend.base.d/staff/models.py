import ipaddress

from django.conf import settings
from django.db import models

from . import totp


class StaffProfile(models.Model):
    """
    Admin-panel access for an existing user.

    The panel has NO self-registration: the owner creates staff accounts in advance
    (`python manage.py create_staff ...`), and each account gets its own 2FA secret.
    """

    ROLE_ADMIN = "admin"
    ROLE_MANAGER = "manager"
    ROLE_VIEWER = "viewer"
    ROLE_CHOICES = (
        (ROLE_ADMIN, "Admin"),
        (ROLE_MANAGER, "Manager"),
        (ROLE_VIEWER, "Viewer"),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="staff_profile"
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_VIEWER)
    is_active = models.BooleanField(default=True)

    # Fernet-encrypted base32 TOTP secret (never stored in plain text)
    totp_secret_enc = models.TextField(blank=True, editable=False)
    last_totp_step = models.BigIntegerField(default=0, editable=False)

    allowed_ips = models.TextField(
        blank=True,
        help_text="Har qatorda bitta IP yoki CIDR (masalan 1.2.3.4 yoki 10.0.0.0/24). Bo'sh = cheklov yo'q.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    last_login_at = models.DateTimeField(null=True, blank=True, editable=False)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True, editable=False)

    class Meta:
        verbose_name = "Staff profile"
        verbose_name_plural = "Staff profiles"

    def __str__(self):
        return f"{self.user} ({self.role})"

    @property
    def can_write(self) -> bool:
        return self.role in (self.ROLE_ADMIN, self.ROLE_MANAGER)

    @property
    def is_admin(self) -> bool:
        return self.role == self.ROLE_ADMIN

    # --- 2FA -----------------------------------------------------------
    def set_totp_secret(self, secret: str) -> None:
        self.totp_secret_enc = totp.encrypt(secret)
        self.last_totp_step = 0

    def get_totp_secret(self) -> str:
        return totp.decrypt(self.totp_secret_enc) if self.totp_secret_enc else ""

    # --- IP allow-list ---------------------------------------------------
    def ip_allowed(self, ip: str) -> bool:
        rules = [ln.strip() for ln in self.allowed_ips.splitlines() if ln.strip()]
        if not rules:
            return True
        return ip_in_rules(ip, rules)


def ip_in_rules(ip: str, rules) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    for rule in rules:
        try:
            if "/" in rule:
                if addr in ipaddress.ip_network(rule, strict=False):
                    return True
            elif addr == ipaddress.ip_address(rule):
                return True
        except ValueError:
            continue
    return False


class StaffSession(models.Model):
    """
    Server-side session. The browser only ever holds a random token (we store its
    SHA-256), so a session can be revoked at any time and a stolen DB dump is useless.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="staff_sessions"
    )
    token_hash = models.CharField(max_length=64, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} @ {self.created_at:%Y-%m-%d %H:%M}"


class StaffLoginAttempt(models.Model):
    """Used for lock-outs. Keyed by a hash of the identifier so unknown accounts are limited too."""

    identifier_hash = models.CharField(max_length=64, db_index=True)
    ip = models.GenericIPAddressField(null=True, blank=True, db_index=True)
    success = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)


class StaffAuditLog(models.Model):
    """Who changed what, when and from where. Append-only (read-only in Django admin)."""

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    actor_label = models.CharField(max_length=150, blank=True)
    action = models.CharField(max_length=60, db_index=True)
    target_type = models.CharField(max_length=40, blank=True)
    target_id = models.CharField(max_length=64, blank=True)
    summary = models.CharField(max_length=255, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.created_at:%Y-%m-%d %H:%M} {self.actor_label} {self.action}"
