from django.db import models, transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import CustomUser
#from .utils import initialize_1c_database
from datetime import datetime, timedelta
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)
class Organization(models.Model):
    name = models.CharField(max_length=255)
    inn = models.CharField(max_length=20, unique=True)
    url = models.URLField(unique=True, blank=True, null=True)
    products = models.ManyToManyField(
        'products.Product',
        blank=True,
        related_name='organizations'
    )
    owner = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="owned_organizations"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    @property
    def current_subscription(self):
        if hasattr(self, 'subscription'):
            return self.subscription
        return None

    @property
    def tariff_plan(self):
        if hasattr(self, 'subscription') and self.subscription:
            return self.subscription.plan.name
        return "basic"

    def create_initial_subscription(self, plan_name="basic"):
        from plans.models import SubscriptionPlan, OrganizationSubscription

        plan = SubscriptionPlan.objects.filter(
            name__icontains=plan_name,
            is_active=True
        ).first() or SubscriptionPlan.get_basic_plan()

        if 'basic' in plan.name.lower():
            end_date = timezone.now() + timedelta(days=365 * 100)
        else:
            end_date = timezone.now() + timedelta(days=plan.duration_days)

        subscription, created = OrganizationSubscription.objects.get_or_create(
            organization=self,
            defaults={
                "plan": plan,
                "end_date": end_date
            }
        )

        return subscription

    def save(self, *args, **kwargs):
        is_new = self.pk is None

        with transaction.atomic():
            super().save(*args, **kwargs)

            if is_new:
                try:
                    tariff_plan = getattr(self, '_tariff_plan', 'basic')

                    from .utils import initialize_1c_database
                    new_url = initialize_1c_database(self.inn, tariff_plan)

                    self.url = new_url
                    super().save(update_fields=['url'])

                    if self.owner:
                        self.owner.organization = self
                        self.owner.save(update_fields=['organization'])

                    self.create_initial_subscription(tariff_plan)

                except Exception as e:
                    logger.error(f"Ошибка при создании 1С или обновлении пользователя: {e}")
                    raise


# @receiver(post_save, sender=Organization)
# def create_1c_after_org_created(sender, instance, created, **kwargs):
#     if created:
#         try:
#             tariff_plan = getattr(instance, '_tariff_plan', 'basic')

#             new_url = initialize_1c_database(instance.inn, tariff_plan)

#             instance.url = new_url
#             instance.save(update_fields=['url'])

#             if instance.owner:
#                 instance.owner.organization = instance
#                 instance.owner.save(update_fields=['organization'])

#         except Exception as e:
#             print(f"Ошибка при создании 1С или обновлении пользователя: {e}")


class Company(models.Model):
    name = models.CharField(max_length=255)
    logo = models.ImageField(upload_to="companies/")
    url = models.URLField(blank=True)

    def __str__(self):
        return self.name