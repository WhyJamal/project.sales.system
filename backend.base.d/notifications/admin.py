from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "document_type",
        "contractor_inn",
        "document_number",
        "is_read",
        "is_archive",
        "created_at",
    )

    list_filter = (
        "document_type",
        "is_read",
        "created_at",
    )

    search_fields = (
        "contractor_inn",
        "document_number",
        "user__username",
    )

    ordering = ("-created_at",)