from django.db import models
from datetime import datetime, timedelta

class SubscriptionPlan(models.Model):
    PLAN_CHOICES = (
        ("starter", "Starter"),
        ("growth", "Growth"),
        ("scale", "Scale"),
    )

    code = models.CharField(
        max_length=20,
        choices=PLAN_CHOICES,
        unique=True
    )

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    period = models.DurationField(default=timedelta(days=30))
    duration_days = models.IntegerField(default=30)

    features = models.JSONField(
        default=list,
        help_text="['Feature 1', 'Feature 2']"
    )

    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    highlight = models.BooleanField(default=False) 

    class Meta:
        ordering = ["price"]

    def __str__(self):
        return self.name

class PlanFeature(models.Model):
    category = models.CharField(max_length=100, blank=True)
    name = models.CharField(max_length=150)

    starter = models.BooleanField(null=True, blank=True)
    growth = models.BooleanField(null=True, blank=True)
    scale = models.BooleanField(null=True, blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.name

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