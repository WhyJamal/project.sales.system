from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    product_url = serializers.CharField()

    class Meta:
        model = Notification
        fields = (
            "id",
            "document_type",
            "contractor_inn",
            "document_number",
            "product_url",

            "sender_contractor_name",
            "sender_contractor_inn",

            "is_read",
            "is_archive",
            "created_at"
        )
        read_only_fields = (
            "id",
            "is_read",
            "is_archive",
            "created_at",
        )