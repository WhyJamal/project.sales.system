from django.db import models, transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import CustomUser
from .utils import initialize_1c_database
from datetime import datetime, timedelta
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)
class Organization(models.Model):
    name = models.CharField(max_length=255)
    inn = models.CharField(max_length=20, unique=True)
    address = models.CharField(max_length=512, blank=True, null=True)
    
    owner = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="owned_organizations"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        is_new = self.pk is None

        super().save(*args, **kwargs)

        if is_new:
            try:
                if self.owner:
                    self.owner.organization = self
                    self.owner.save(update_fields=['organization'])

            except Exception as e:
                logger.error(f"Error occurred while saving organization: {e}")
                raise

# OrganizationProduct <<Table>>
class OrganizationProduct(models.Model):
    organization = models.ForeignKey(
        'Organization',
        on_delete=models.CASCADE,
        related_name='organization_products'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE
    )

    title = models.CharField(max_length=255)
    product_url = models.URLField(blank=True, null=True)
    product_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    subscription = models.ForeignKey(
        'plans.OrganizationSubscription',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    subscription_end_date = models.DateTimeField(null=True, blank=True)

    chosen = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    archive = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']  

    def __str__(self):
        return f"{self.title} ({self.organization.name})"

    def save(self, *args, **kwargs):
        if not self.title and self.product:
            self.title = self.product.name

        if not self.product_url:
            if self.subscription:
                try:
                    self.product_url = initialize_1c_database(
                        self.organization.inn,
                        self.subscription.plan.name
                    )
                except Exception as e:
                    print(f"Error initializing 1C database: {e}")
                    self.product_url = None
                    return
            else:
                self.product_url = None

        if self.subscription and not self.subscription_end_date:
            self.subscription_end_date = self.subscription.end_date

        super().save(*args, **kwargs)
        
# old version 
# class Organization(models.Model):
#     name = models.CharField(max_length=255)
#     inn = models.CharField(max_length=20, unique=True)
#     url = models.URLField(unique=True, blank=True, null=True)
    
#     # @property
#     # def products_table(self):
#     #     return self.organization_products.all()

#     owner = models.ForeignKey(
#         CustomUser,
#         on_delete=models.SET_NULL,
#         null=True,
#         related_name="owned_organizations"
#     )
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return self.name

#     @property
#     def current_subscription(self):
#         if hasattr(self, 'subscription'):
#             return self.subscription
#         return None

#     @property
#     def tariff_plan(self):
#         if hasattr(self, 'subscription') and self.subscription:
#             return self.subscription.plan.name
#         return "basic"

#     def create_initial_subscription(self, plan_name="basic"):
#         from plans.models import SubscriptionPlan, OrganizationSubscription

#         plan = SubscriptionPlan.objects.filter(
#             name__icontains=plan_name,
#             is_active=True
#         ).first() or SubscriptionPlan.get_basic_plan()

#         if 'basic' in plan.name.lower():
#             end_date = timezone.now() + timedelta(days=365 * 100)
#         else:
#             end_date = timezone.now() + timedelta(days=plan.duration_days)

#         subscription, created = OrganizationSubscription.objects.get_or_create(
#             organization=self,
#             defaults={
#                 "plan": plan,
#                 "end_date": end_date
#             }
#         )

#         return subscription

#     def save(self, *args, **kwargs):
#         is_new = self.pk is None

#         with transaction.atomic():
#             super().save(*args, **kwargs)

#             if is_new:
#                 try:
#                     tariff_plan = getattr(self, '_tariff_plan', 'basic')

#                     # from .utils import initialize_1c_database
#                     # new_url = initialize_1c_database(self.inn, tariff_plan)

#                     self.url = new_url
#                     super().save(update_fields=['url'])

#                     # default_product = Product.objects.first()  
#                     # if default_product:
#                     #     OrganizationProduct.objects.create(
#                     #         organization=self,
#                     #         product=default_product,
#                     #         product_url=new_url,  
#                     #     )

#                     if self.owner:
#                         self.owner.organization = self
#                         self.owner.save(update_fields=['organization'])

#                     self.create_initial_subscription(tariff_plan)

#                 except Exception as e:
#                     logger.error(f"Ошибка при создании 1С или обновлении пользователя: {e}")
#                     raise

# old old version
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