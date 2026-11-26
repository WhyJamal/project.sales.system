from django.contrib import admin
from .models import ClickTransaction, InvoiceEvent, InvoiceTopUp, PendingPayment


@admin.register(ClickTransaction)
class ClickTransactionAdmin(admin.ModelAdmin):
    list_display = ['click_trans_id', 'amount', 'status', 'organization_id', 'plan_id', 'created_at']
    list_filter = ['status']
    search_fields = ['click_trans_id', 'merchant_trans_id']
    readonly_fields = ['click_trans_id', 'service_id', 'merchant_trans_id', 'merchant_prepare_id',
                       'amount', 'created_at', 'updated_at']
    
@admin.register(PendingPayment)
class PendingPaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "organization",
        "plan",
        "product",
        "amount",
        "created_at",
    )

    list_filter = (
        "plan",
        "product",
        "created_at",
    )

    search_fields = (
        "organization__name",
        "plan__name",
        "product__name",
    )

    readonly_fields = (
        "created_at",
    )

    ordering = ("-created_at",)


class InvoiceEventInline(admin.TabularInline):
    model = InvoiceEvent
    extra = 0
    can_delete = False
    readonly_fields = ("from_status", "to_status", "actor", "channel", "note", "created_at")

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(InvoiceTopUp)
class InvoiceTopUpAdmin(admin.ModelAdmin):
    """Read-only on purpose: statuses (and the wallet credit) change only through payments.invoices.change_status."""

    list_display = ("id", "organization", "inn", "name", "amount", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("inn", "name", "organization__name", "organization__inn")
    inlines = [InvoiceEventInline]

    def get_readonly_fields(self, request, obj=None):
        return [f.name for f in self.model._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

