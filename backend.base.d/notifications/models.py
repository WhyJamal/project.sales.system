from django.conf import settings
from django.db import models

class DocumentType(models.TextChoices):
    INVOICE = "invoice", "Invoice"
    ORDER = "order", "Order"
    PAYMENT = "payment", "Payment"
    RETURN = "return", "Return"
    CONTRACT = "contract", "Contract"


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    document_type = models.CharField(
        max_length=20,
        choices=DocumentType.choices
    )

    contractor_inn = models.CharField(
        max_length=14,
        db_index=True
    )

    sender_contractor_inn = models.CharField(
        max_length=14,
        db_index=True
    )

    sender_contractor_name = models.CharField(
        max_length=100
    )

    document_number = models.CharField(
        max_length=100,
        db_index=True
    )

    product_url = models.URLField()

    is_read = models.BooleanField(default=False)
    is_archive = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def str(self):
        return f"{self.document_type} - {self.document_number}"    