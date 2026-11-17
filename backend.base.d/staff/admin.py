from django.contrib import admin

from .models import StaffAuditLog, StaffLoginAttempt, StaffProfile, StaffSession


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "is_active", "has_2fa", "last_login_at", "last_login_ip")
    list_filter = ("role", "is_active")
    search_fields = ("user__username", "user__email")
    readonly_fields = ("last_login_at", "last_login_ip", "has_2fa")
    fields = ("user", "role", "is_active", "allowed_ips", "has_2fa", "last_login_at", "last_login_ip")

    @admin.display(boolean=True, description="2FA")
    def has_2fa(self, obj):
        return bool(obj.totp_secret_enc)

    def has_add_permission(self, request):
        # Accounts (and their 2FA secrets) are created with `manage.py create_staff` only
        return False


class ReadOnlyAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(StaffAuditLog)
class StaffAuditLogAdmin(ReadOnlyAdmin):
    list_display = ("created_at", "actor_label", "action", "summary", "ip")
    list_filter = ("action",)
    search_fields = ("actor_label", "summary", "target_id")


@admin.register(StaffSession)
class StaffSessionAdmin(ReadOnlyAdmin):
    list_display = ("user", "created_at", "last_seen_at", "expires_at", "ip", "revoked_at")
    actions = ["revoke"]

    def has_change_permission(self, request, obj=None):
        return False

    @admin.action(description="Tanlangan sessiyalarni tugatish")
    def revoke(self, request, queryset):
        from django.utils import timezone

        queryset.filter(revoked_at__isnull=True).update(revoked_at=timezone.now())


@admin.register(StaffLoginAttempt)
class StaffLoginAttemptAdmin(ReadOnlyAdmin):
    list_display = ("created_at", "ip", "success")
    list_filter = ("success",)
