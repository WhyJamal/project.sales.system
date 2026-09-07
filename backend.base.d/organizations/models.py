import os

from decimal import Decimal
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.utils.crypto import get_random_string
from users.models import CustomUser
from .utils import initialize_1c_database
# from datetime import datetime, timedelta
# from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

REFERRAL_BONUS_PERCENT = Decimal('10.00')  # %

PROMO_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  


def generate_promo_code():
    while True:
        code = get_random_string(8, allowed_chars=PROMO_CODE_ALPHABET)
        if not Organization.objects.filter(promo_code=code).exists():
            return code


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

    oferta_accepted = models.BooleanField(default=False)
    oferta_accepted_at = models.DateTimeField(null=True, blank=True)

    promo_code = models.CharField(max_length=16, unique=True, blank=True)
    invited_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invited_organizations'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        is_new = self.pk is None

        if not self.promo_code:
            self.promo_code = generate_promo_code()

        if self.oferta_accepted and not self.oferta_accepted_at:
            self.oferta_accepted_at = timezone.now()

        super().save(*args, **kwargs)

        if is_new:
            try:
                if self.owner:
                    self.owner.organization = self
                    self.owner.save(update_fields=['organization'])

            except Exception as e:
                logger.error(f"Error occurred while saving organization: {e}")
                raise

    def reward_referrer(self, amount, description=""):
        """
        Если организация приобретает какой-либо продукт или открывает базу данных, 
        и при этом она была приглашена по промо-коду другой организации, реферальный 
        бонус начисляется на кошелёк организации, которая её пригласила.

        """
        if not self.invited_by or not amount:
            return

        try:
            bonus = (Decimal(str(amount)) * REFERRAL_BONUS_PERCENT / Decimal('100')).quantize(Decimal('0.01'))
        except Exception:
            return

        if bonus <= 0:
            return

        try:
            from wallet.views import get_or_create_wallet
            referrer_wallet = get_or_create_wallet(self.invited_by)
            referrer_wallet.deposit(
                bonus,
                description=description or f"Реферальный бонус: {self.name} ({REFERRAL_BONUS_PERCENT}%)"
            )
        except Exception as e:
            logger.error(f"Ошибка при расчёте реферального бонуса: {e}")

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

    user_count = models.PositiveIntegerField(
        default=1,
        help_text="Ushbu productga ulangan (tarifga kiruvchi + qo'shimcha) foydalanuvchilar soni"
    )
    pending_user_count = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Joriy oy davomida so'ralgan yangi son — keyingi oy billingga qo'shiladi (bo'sh bo'lsa o'zgarish yo'q)"
    )

    version = models.ForeignKey(
            'products.SoftwareVersion',
            on_delete=models.SET_NULL,
            null=True,
            blank=True,
            related_name='organization_products'
        )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']  

    def __str__(self):
        return f"{self.title} ({self.organization.name})"

    def calculate_monthly_price(self):
        """
        Oylik to'lov summasi: baza narx (product_price) + limitdan
        (product.included_users) tashqari har bir qo'shimcha foydalanuvchi
        uchun product.extra_user_price qo'shiladi.

        Misol: product_price=100000, included_users=1, extra_user_price=50000,
        user_count=3 bo'lsa -> 100000 + (3-1)*50000 = 200000.
        """
        base_price = Decimal(str(self.product_price or 0))

        if not self.product_id:
            return base_price

        included = self.product.included_users or 1
        extra_unit_price = Decimal(str(self.product.extra_user_price or 0))
        extra_users = max(0, (self.user_count or 1) - included)

        return base_price + (extra_unit_price * extra_users)

    def request_user_count_change(self, new_count: int):
        """
        Foydalanuvchilar sonini o'zgartirish so'rovi ("+ user" modalidagi
        Apply tugmasi shu yerni chaqiradi).

        - Son kamaysa yoki o'zgarmasa — darhol qo'llaniladi (billingga
          shu bugundanoq ta'sir qiladi, chunki kirishni bloklashni
          tashkilot 1C tomonidan o'zi bajaradi).
        - Son oshsa — darhol qo'llanilmaydi, `pending_user_count` sifatida
          saqlanadi va faqat keyingi oylik faollashtirishda (billing
          kunida) `user_count` ga ko'chiriladi va shundan keyingina
          narxga qo'shiladi.
        """
        new_count = max(1, int(new_count))

        if new_count <= self.user_count:
            self.user_count = new_count
            self.pending_user_count = None
            self.save(update_fields=["user_count", "pending_user_count"])
        else:
            self.pending_user_count = new_count
            self.save(update_fields=["pending_user_count"])

        return self

    def save(self, *args, **kwargs):
        if not self.product_url and self.subscription:
            try:
                from wallet.views import get_or_create_wallet
                wallet = get_or_create_wallet(self.organization)
                cost = self.calculate_monthly_price()
                if cost and cost > 0:
                    wallet.withdraw(
                        cost,
                        description=f"Открыть базу данных: {self.title} ({self.subscription.plan.name if self.subscription.plan else ''})"
                    )
                    # Если организация была приглашена по промо-коду — реферальный 
                    # бонус начисляется на кошелёк организации, которая её пригласила.
                    self.organization.reward_referrer(cost)

                if self.version and self.version.install_path:
                    source_1cd = os.path.join(self.version.install_path, "1Cv8.1CD")
                else:
                    source_1cd = None

                self.product_url = initialize_1c_database(
                    self.organization.inn,
                    self.subscription.plan.name,
                    source_1cd=source_1cd,
                )

            except ValueError as e:
                logger.error(f"Недостаточно средств на балансе кошелька: {e}")
                raise
            except Exception as e:
                print(f"Error initializing 1C database: {e}")
                self.product_url = None
                raise  

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