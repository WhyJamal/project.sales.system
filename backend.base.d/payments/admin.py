from django.contrib import admin
from .models import ClickTransaction, PendingPayment


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