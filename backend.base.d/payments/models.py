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
    plan = models.ForeignKey('plans.SubscriptionPlan', on_delete=models.CASCADE)
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment #{self.id} | {self.organization} | {self.amount}"    