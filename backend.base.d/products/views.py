from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Product, SoftwareVersion
from .serializers import ProductSerializer, SoftwareVersionSerializer

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

class SoftwareVersionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SoftwareVersionSerializer
    permission_classes = [IsAuthenticated]    

    def get_queryset(self):
        product_name = self.request.query_params.get("product")

        queryset = SoftwareVersion.objects.filter(
            is_active=True
        )

        if product_name:
            queryset = queryset.filter(
                product__name=product_name
            )

        return queryset