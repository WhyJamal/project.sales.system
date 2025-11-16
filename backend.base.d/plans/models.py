from django.db import models
from organizations.models import Organization

class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_months = models.IntegerField(default=1)
    features = models.JSONField(default=dict)  # {"users_limit": 10, "storage": "5GB"}

    def __str__(self):
        return self.name

class OrganizationSubscription(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.organization.name} - {self.plan.name}"
