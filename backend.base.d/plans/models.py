from django.db import models
from datetime import datetime, timedelta

class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    duration_days = models.IntegerField(default=30)
    features = models.JSONField(default=dict)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['price']

    def __str__(self):
        return f"{self.name} - {self.price}"

    @classmethod
    def get_basic_plan(cls):
        return cls.objects.filter(name__icontains='basic', is_active=True).first()

class OrganizationSubscription(models.Model):
    organization = models.OneToOneField(
        'organizations.Organization', 
        on_delete=models.CASCADE, 
        related_name='subscription'
    )
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.organization.name} - {self.plan.name}"

    def save(self, *args, **kwargs):
        if not self.end_date:
            self.end_date = datetime.now() + timedelta(days=self.plan.duration_days)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return datetime.now() > self.end_date