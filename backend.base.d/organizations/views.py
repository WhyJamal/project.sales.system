import os, time, threading

from django.utils import timezone
from django.db import transaction
from datetime import timedelta

# from django.http import JsonResponse
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .serializers import OrganizationSerializer, OrganizationProductSerializer, CompanySerializer

from .models import Organization, OrganizationProduct, Company
from plans.models import SubscriptionPlan, OrganizationSubscription
from products.models import SoftwareVersion

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