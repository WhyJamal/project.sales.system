import threading
import time

from django.http import JsonResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Organization, Company
from products.models import Product
from .serializers import OrganizationSerializer, CompanySerializer
from .queue import add_to_queue
from .utils import update_1c_config

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        organization = serializer.save(owner=request.user)

        # self.update_1c_config_with_tariff(organization.url, tariff_plan)
        tariff_plan = request.data.get('tariff_plan', 'basic')
        organization.create_initial_subscription(tariff_plan)

        out_serializer = self.get_serializer(organization)
        headers = self.get_success_headers(out_serializer.data)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_products(self, request, pk=None):
        org = self.get_object()

        product_ids = request.data.get('products', [])
        if not isinstance(product_ids, list):
            return Response(
                {"detail": "products must be a list of product IDs"},
                status=status.HTTP_400_BAD_REQUEST
            )

        products_qs = Product.objects.filter(id__in=product_ids)
        if not products_qs.exists():
            return Response(
                {"detail": "No matching products found"},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_orders = []

        for product in products_qs:
            org.products.add(product)

            order = Order.objects.create(
                organization=org,
                product=product,
                quantity=1
                # unit_price null = 0 
            )
            created_orders.append(order.id)

        return Response({
            "detail": "Products added and orders created",
            "orders": created_orders
        }, status=status.HTTP_201_CREATED)

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [AllowAny]


def delayed_process(path):
    time.sleep(1)
    update_1c_config(path)

@api_view(['POST'])
@permission_classes([AllowAny])
def update_1c(request):
    base_path = request.data.get("base_path")
    add_to_queue(base_path)

    threading.Thread(target=delayed_process, args=(base_path,), daemon=True).start()

    return JsonResponse({"success": True, "message": "Принято"})

# @api_view(['POST'])
# @permission_classes([AllowAny])
# def update_1c(request):
#     base_path = request.data.get('base_path')
#     if not base_path:
#         return Response({"success": False, "message": "base_path не предоставлен"}, status=400)

#     result = update_1c_config(base_path)
#     return Response(result)
