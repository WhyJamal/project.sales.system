import os, time, threading, math

from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from datetime import timedelta

# from django.http import JsonResponse
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .serializers import (
    OrganizationSerializer, OrganizationProductSerializer, CompanySerializer,
)

from .models import Organization, OrganizationProduct, Company, REFERRAL_BONUS_PERCENT
from plans.models import SubscriptionPlan, OrganizationSubscription
from products.models import SoftwareVersion
from wallet.views import get_or_create_wallet

# from products.models import Product

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        organization = serializer.save(owner=request.user)

        out_serializer = self.get_serializer(organization)
        headers = self.get_success_headers(out_serializer.data)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class OrganizationProductViewSet(viewsets.ModelViewSet):
    #queryset = OrganizationProduct.objects.all()
    serializer_class = OrganizationProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return OrganizationProduct.objects.filter(
            organization=self.request.user.organization,
            archive=False
        )
        
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan_id = request.data.get('plan')
        if not plan_id:
            return Response({"detail": "Plan id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                plan = SubscriptionPlan.objects.get(id=plan_id)
                subscription = OrganizationSubscription.objects.create(
                    organization_id=request.data.get('organization'),
                    plan=plan,
                    end_date=timezone.now() + timedelta(days=plan.duration_days)
                )

                product = serializer.validated_data.get('product')
                latest_version = SoftwareVersion.objects.filter(
                    product=product,
                    is_active=True
                ).first()
                
                organization_product = serializer.save(
                    subscription=subscription,
                    title=request.data.get('title') or serializer.validated_data.get('title', ''),
                    version=latest_version
                )
        except ValueError as e:
            return Response(
                {
                    "error": "insufficient_balance",
                    "detail": str(e),
                    "message": "На счёте недостаточно средств. Пожалуйста, пополните баланс."
                },
                status=status.HTTP_402_PAYMENT_REQUIRED
            )
        except SubscriptionPlan.DoesNotExist:
            return Response({"detail": "Plan topilmadi."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(
            self.get_serializer(organization_product).data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        self.perform_update(serializer)

        return Response(serializer.data)

    def perform_update(self, serializer):
        serializer.save()
        
    @action(detail=False, methods=['post'], url_path='reorder')
    def reorder(self, request):
        """
        Expect body: { "items": [{"id": 5, "order": 0}, {"id": 3, "order": 1}, ...] }
        """
        items = request.data.get('items', [])
        if not isinstance(items, list):
            return Response({"detail": "Invalid items"}, status=status.HTTP_400_BAD_REQUEST)

        for it in items:
            try:
                obj_id = int(it.get('id'))
                new_order = int(it.get('order', 0))
                OrganizationProduct.objects.filter(id=obj_id).update(order=new_order)
            except Exception:
                continue

        return Response({"status": "ok"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='toggle-chosen')
    def toggle_chosen(self, request, pk=None):
        obj = self.get_object()
        obj.chosen = not obj.chosen
        obj.save()
        return Response({"id": obj.id, "chosen": obj.chosen}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='users')
    def list_users(self, request, pk=None):
        """
        1C bazasidagi joriy foydalanuvchilar ro'yxatini (jonli, HTTP orqali)
        qaytaradi + hozirgi billing holati.
        """
        from .utils import list_1c_users

        obj = self.get_object()
        users_1c = list_1c_users(obj.product_url) if obj.product_url else []

        return Response({
            "users": users_1c,
            "user_count": obj.user_count,
            "included_users": obj.product.included_users if obj.product_id else None,
            "extra_user_price": obj.product.extra_user_price if obj.product_id else None,
            "current_monthly_price": obj.calculate_monthly_price(),
        })

    @action(detail=True, methods=['post'], url_path='users/toggle')
    def toggle_1c_user(self, request, pk=None):
        """
        Body: { "id": "<1C user guid>", "status": true|false }

        1C dagi mavjud (ilgari yaratilgan) foydalanuvchining kirish
        huquqini haqiqatda yoqadi/o'chiradi (HS servisga POST). Faqat
        shu yo'l bilan real foydalanuvchini o'chirib, sonini kamaytirish
        mumkin — oddiy "-" tugmasi bilan kamaytirib bo'lmaydi.
        """
        from .utils import set_1c_user_status, list_1c_users

        obj = self.get_object()
        user_id = request.data.get('id')
        new_status = request.data.get('status')

        if not obj.product_url:
            return Response({"detail": "Bu product uchun 1C bazasi hali yaratilmagan."}, status=400)
        if not user_id or new_status is None:
            return Response({"detail": "id va status majburiy."}, status=400)

        result = set_1c_user_status(obj.product_url, user_id, bool(new_status))
        if not result.get("success"):
            return Response({"detail": "1C bilan bog'lanishda xatolik yuz berdi."}, status=502)

        return Response({
            "result": result,
            "users": list_1c_users(obj.product_url),
        })

    @action(detail=True, methods=['get'], url_path='settings-info')
    def settings_info(self, request, pk=None):
        """
        "Sozlash" oynasi uchun kerakli barcha ma'lumot: joriy tarif,
        qolgan kunlar, joriy narx va 1C foydalanuvchilar ro'yxati.
        """
        from .utils import list_1c_users

        obj = self.get_object()
        now = timezone.now()

        current_plan = obj.subscription.plan if obj.subscription_id else None
        remaining_days = 0
        if obj.subscription_end_date and obj.subscription_end_date > now:
            remaining_days = max(0, math.ceil((obj.subscription_end_date - now).total_seconds() / 86400))

        users_1c = list_1c_users(obj.product_url) if obj.product_url else []

        return Response({
            "current_plan_id": current_plan.id if current_plan else None,
            "current_plan_name": current_plan.name if current_plan else None,
            "current_plan_price": current_plan.price if current_plan else None,
            "current_plan_duration_days": current_plan.duration_days if current_plan else None,
            "subscription_end_date": obj.subscription_end_date,
            "remaining_days": remaining_days,
            "user_count": obj.user_count,
            "included_users": obj.product.included_users if obj.product_id else None,
            "extra_user_price": obj.product.extra_user_price if obj.product_id else None,
            "current_monthly_price": obj.calculate_monthly_price(),
            "users": users_1c,
        })

    @action(detail=True, methods=['post'], url_path='settings-apply')
    def settings_apply(self, request, pk=None):
        """
        Body: { "plan_id": <int, ixtiyoriy>, "user_count": <int, ixtiyoriy> }

        Muddat davomida (obuna tugash sanasi o'zgarmagan holda) tarif
        va/yoki foydalanuvchilar sonini almashtiradi:

          - Kunlik narx: (plan.price + qo'shimcha_userlar * extra_user_price) / plan.duration_days
          - Eski va yangi kunlik narx orasidagi FARQ, qolgan kunlarga
            ko'paytiriladi va shundagina hamyondan yechiladi.
          - Agar yangi holat arzonroq (yoki teng) bo'lsa — hech narsa
            yechilmaydi, faqat almashtiriladi.
          - subscription_end_date o'ZGARMAYDI (birinchi olingan tugash
            sanasi saqlanadi).
        """
        obj = self.get_object()
        now = timezone.now()

        if not obj.subscription_id or not obj.subscription_end_date or obj.subscription_end_date <= now:
            return Response({"detail": "Obuna faol emas — avval faollashtiring."}, status=400)

        old_plan = obj.subscription.plan
        old_user_count = obj.user_count
        included = obj.product.included_users if obj.product_id else 1
        extra_price = Decimal(str(obj.product.extra_user_price or 0)) if obj.product_id else Decimal('0')

        plan_id = request.data.get('plan_id')
        requested_user_count = request.data.get('user_count')

        new_plan = old_plan
        if plan_id is not None:
            try:
                new_plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
            except SubscriptionPlan.DoesNotExist:
                return Response({"detail": "Tarif topilmadi."}, status=404)

        if requested_user_count is not None:
            try:
                new_user_count = max(1, int(requested_user_count))
            except (TypeError, ValueError):
                return Response({"detail": "user_count butun son bo'lishi kerak."}, status=400)
        else:
            new_user_count = old_user_count

        remaining_days = max(0, math.ceil((obj.subscription_end_date - now).total_seconds() / 86400))

        old_daily = (Decimal(str(old_plan.price)) + extra_price * max(0, old_user_count - included)) / old_plan.duration_days
        new_daily = (Decimal(str(new_plan.price)) + extra_price * max(0, new_user_count - included)) / new_plan.duration_days

        diff_daily = new_daily - old_daily
        charge = max(Decimal('0'), diff_daily) * remaining_days

        try:
            if charge > 0:
                wallet = get_or_create_wallet(obj.organization)
                wallet.withdraw(
                    charge,
                    description=(
                        f"Tarif/user o'zgartirish: {obj.title} "
                        f"({old_plan.name} -> {new_plan.name}, {new_user_count} foydalanuvchi, "
                        f"{remaining_days} kun qoldi)"
                    ),
                )
        except ValueError as e:
            return Response({"detail": f"Balans yetarli emas: {e}"}, status=400)

        # Obuna muddati o'zgarmaydi — faqat tarif ko'chiriladi
        obj.subscription.plan = new_plan
        obj.subscription.save(update_fields=['plan'])

        obj.product_price = new_plan.price
        obj.user_count = new_user_count
        obj.pending_user_count = None
        obj.save(update_fields=['product_price', 'user_count', 'pending_user_count'])

        return Response({
            "plan_id": new_plan.id,
            "plan_name": new_plan.name,
            "user_count": obj.user_count,
            "subscription_end_date": obj.subscription_end_date,
            "remaining_days": remaining_days,
            "old_daily_price": str(old_daily),
            "new_daily_price": str(new_daily),
            "charged": str(charge),
            "current_monthly_price": obj.calculate_monthly_price(),
            "message": (
                "O'zgartirildi, qo'shimcha to'lov olinmadi."
                if charge == 0
                else f"O'zgartirildi, {charge} so'm yechildi."
            ),
        })

    

from .utils import update_1c_config, BASAR_DIR_ROOT
from urllib.parse import urlparse

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_product_version(request):
    org_product_id = request.data.get("organization_product_id")
    version_id = request.data.get("version_id")

    if not org_product_id:
        return Response({"detail": "organization_product_id required."}, status=400)
    if not version_id:
        return Response({"detail": "version_id required."}, status=400)

    try:
        org_product = OrganizationProduct.objects.get(
            id=org_product_id,
            organization=request.user.organization
        )
    except OrganizationProduct.DoesNotExist:
        return Response({"detail": "Продукт не найден."}, status=404)

    try:
        new_version = SoftwareVersion.objects.get(id=version_id, is_active=True)
    except SoftwareVersion.DoesNotExist:
        return Response({"detail": "Версия не найдена."}, status=404)

    if not org_product.product_url:
        return Response({"detail": "URL базы данных не указан."}, status=400)

    # product_url to folder_name 
    parsed = urlparse(org_product.product_url)
    folder_name = parsed.path.strip("/")
    base_path = os.path.join(BASAR_DIR_ROOT, folder_name)

    cf_file = os.path.join(new_version.install_path, "1Cv8.cf")
    if not os.path.exists(cf_file):
        return Response({"detail": f"Файл конфигурации не найден: {cf_file}"}, status=400)

    result = update_1c_config(base_path, cf_file=cf_file)

    if result["success"]:
        org_product.version = new_version
        org_product.save(update_fields=['version'])
        return Response(result, status=200)
    elif result.get("code") == "database_busy":
        return Response(result, status=423)
    else:
        return Response(result, status=500)
        
# class OrganizationViewSet(viewsets.ModelViewSet):
#     queryset = Organization.objects.all()
#     serializer_class = OrganizationSerializer
#     permission_classes = [IsAuthenticated]

#     def create(self, request, *args, **kwargs):
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         organization = serializer.save(owner=request.user)

#         # self.update_1c_config_with_tariff(organization.url, tariff_plan)
#         tariff_plan = request.data.get('tariff_plan', 'basic')
#         organization.create_initial_subscription(tariff_plan)

#         out_serializer = self.get_serializer(organization)
#         headers = self.get_success_headers(out_serializer.data)
#         return Response(out_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

#     @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
#     def add_products(self, request, pk=None):
#         org = self.get_object()

#         product_ids = request.data.get('products', [])
#         if not isinstance(product_ids, list):
#             return Response(
#                 {"detail": "products must be a list of product IDs"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         products_qs = Product.objects.filter(id__in=product_ids)
#         if not products_qs.exists():
#             return Response(
#                 {"detail": "No matching products found"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         created_orders = []

#         for product in products_qs:
#             org.products.add(product)

#             order = Order.objects.create(
#                 organization=org,
#                 product=product,
#                 quantity=1
#                 # unit_price null = 0 
#             )
#             created_orders.append(order.id)

#         return Response({
#             "detail": "Products added and orders created",
#             "orders": created_orders
#         }, status=status.HTTP_201_CREATED)


# class OrganizationProductViewSet(viewsets.ModelViewSet):
#     queryset = OrganizationProduct.objects.all()
#     serializer_class = OrganizationProductSerializer

#     def create(self, request, *args, **kwargs):
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         organization_product = serializer.save()

#         organization_product.save()

#         return Response(serializer.data, status=status.HTTP_201_CREATED)

#     def update(self, request, *args, **kwargs):
#         instance = self.get_object()
#         serializer = self.get_serializer(instance, data=request.data, partial=True)
#         serializer.is_valid(raise_exception=True)
#         updated_product = serializer.save()

#         updated_product.save()

#         return Response(serializer.data, status=status.HTTP_200_OK)


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [AllowAny]


@api_view(['GET'])
@permission_classes([AllowAny])
def invite_info(request, code):
    """
    Вызывается при открытии пригласительной (invite) ссылки.
    Возвращает только информацию о том, является ли промо-код действительным, 
    и название организации, которая пригласила пользователя — эти данные 
    отображаются пользователю на странице регистрации.
    """
    code = (code or "").strip().upper()
    organization = Organization.objects.filter(promo_code=code).first()

    if not organization:
        return Response(
            {"valid": False, "detail": "Промо-код не найден."},
            status=status.HTTP_404_NOT_FOUND
        )

    return Response({
        "valid": True,
        "promo_code": organization.promo_code,
        "organization_name": organization.name,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_invite(request):
    """
    Личный промо-код текущей организации пользователя и 
    реферальная статистика (количество приглашённых организаций).

    """
    org = request.user.organization
    if not org:
        return Response(
            {"detail": "Ваша организация не найдена."},
            status=status.HTTP_404_NOT_FOUND
        )

    invited_count = org.invited_organizations.count()

    return Response({
        "promo_code": org.promo_code,
        "invited_count": invited_count,
        "referral_bonus_percent": str(REFERRAL_BONUS_PERCENT),
    })


#from .utils import update_1c_config
#from .queue import add_to_queue

# def delayed_process(path):
#     time.sleep(1)
#     update_1c_config(path)

# new version correct
# @api_view(['POST'])
# @permission_classes([AllowAny])
# def update_1c(request):
#     base_path = request.data.get("base_path")
#     add_to_queue(base_path)

#     threading.Thread(target=delayed_process, args=(base_path,), daemon=True).start()

#     return JsonResponse({"success": True, "message": "Принято"})

# old version error
# @api_view(['POST'])
# @permission_classes([AllowAny])
# def update_1c(request):
#     base_path = request.data.get('base_path')
#     if not base_path:
#         return Response({"success": False, "message": "base_path не предоставлен"}, status=400)

#     result = update_1c_config(base_path)
#     return Response(result)