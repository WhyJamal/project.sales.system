from django.db import models
from django.utils import timezone


class ClickTransaction(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    )

    click_trans_id = models.BigIntegerField(unique=True)
    service_id = models.IntegerField()
    merchant_trans_id = models.CharField(max_length=255)  
    merchant_prepare_id = models.BigIntegerField(null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error = models.IntegerField(default=0)
    error_note = models.CharField(max_length=255, blank=True)

    organization_id = models.IntegerField(null=True, blank=True)
    plan_id = models.IntegerField(null=True, blank=True)
    product_id = models.IntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Click Transaction'
        verbose_name_plural = 'Click Transactions'

    def __str__(self):
        return f"ClickTx #{self.click_trans_id} | {self.amount} UZS | {self.status}"

    
class PendingPayment(models.Model):
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE)
    plan = models.ForeignKey('plans.SubscriptionPlan', on_delete=models.CASCADE, null=True, blank=True)
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    wallet_topup = models.BooleanField(default=False)
    org_product_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment #{self.id} | {self.organization} | {self.amount}"


class InvoiceTopUp(models.Model):
    """
    Wallet top-up paid by an e-invoice (Didox). Handled by an operator by hand for now.

    The wallet is credited ONLY when an operator confirms (status `confirmed`), and only from `signed`.
    Every status change is recorded in InvoiceEvent. Nothing here touches ClickTransaction / PendingPayment.
    """

    STATUS_CREATED = 'created'      # customer asked for an invoice
    STATUS_SENT = 'sent'            # operator sent the invoice in Didox
    STATUS_SIGNED = 'signed'        # customer signed it in Didox
    STATUS_CONFIRMED = 'confirmed'  # operator saw the money on the bank account -> wallet credited
    STATUS_REJECTED = 'rejected'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = (
        (STATUS_CREATED, 'Создан'),
        (STATUS_SENT, 'Счёт-фактура отправлена'),
        (STATUS_SIGNED, 'Подписан клиентом'),
        (STATUS_CONFIRMED, 'Оплата подтверждена'),
        (STATUS_REJECTED, 'Отклонён'),
        (STATUS_CANCELLED, 'Отменён'),
    )

    organization = models.ForeignKey('organizations.Organization', on_delete=models.PROTECT, related_name='invoice_topups')
    created_by = models.ForeignKey('users.CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    amount = models.DecimalField(max_digits=14, decimal_places=2)

    # Requisites of the invoice receiver, copied as text (they must not change when the organization changes)
    inn = models.CharField(max_length=20)
    name = models.CharField(max_length=255)
    # Anything else (bank account, MFO, address, ...) - see ALLOWED_REQUISITES in payments/invoices.py
    requisites = models.JSONField(default=dict, blank=True)

    method = models.CharField(max_length=30, default='invoice')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_CREATED, db_index=True)

    sent_at = models.DateTimeField(null=True, blank=True)
    signed_at = models.DateTimeField(null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)  # rejected / cancelled

    # Set when the wallet was credited. UNIQUE: one invoice can never be credited twice.
    wallet_transaction_id = models.BigIntegerField(null=True, blank=True, unique=True)

    # Telegram messages that show this invoice: [{"chat_id": .., "message_id": ..}]
    tg_messages = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self):
        return f"Invoice #{self.pk} | {self.inn} | {self.amount} | {self.status}"


class InvoiceEvent(models.Model):
    """Audit trail: who moved an invoice to which status, from where, and when."""

    invoice = models.ForeignKey(InvoiceTopUp, on_delete=models.CASCADE, related_name='events')
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20)
    actor = models.CharField(max_length=150, blank=True)
    channel = models.CharField(max_length=20, blank=True)  # customer | panel | telegram | system
    note = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at', 'id']

    def __str__(self):
        return f"#{self.invoice_id}: {self.from_status or '-'} -> {self.to_status} ({self.actor})"

