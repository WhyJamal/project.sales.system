import time, threading

from django.utils import timezone
from datetime import timedelta

from django.http import JsonResponse
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .serializers import OrganizationSerializer, OrganizationProductSerializer, CompanySerializer

from .models import Organization, OrganizationProduct, Company
from plans.models import SubscriptionPlan, OrganizationSubscription
from products.models import Product

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

        organization_product = serializer.save()

        title = request.data.get('title')

        if title:
            organization_product.title = title
            organization_product.save()

        if not organization_product.subscription:
            plan_id = request.data.get('plan')  
            if not plan_id:
                return Response({"detail": "Plan id is required."}, status=status.HTTP_400_BAD_REQUEST)

            plan = SubscriptionPlan.objects.get(id=plan_id)  

            subscription = OrganizationSubscription.objects.create(
                organization=organization_product.organization,
                plan=plan,
                end_date=timezone.now() + timedelta(days=365) # 1 year default
            )
            organization_product.subscription = subscription
            organization_product.save()

        organization_product.save()  

        return Response(serializer.data, status=status.HTTP_201_CREATED)

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
