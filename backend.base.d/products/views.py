from django.db.models import Avg, Count
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Product, SoftwareVersion, ProductReview
from .serializers import ProductSerializer, SoftwareVersionSerializer, ProductReviewSerializer

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


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user_id == request.user.id


class ProductReviewViewSet(viewsets.ModelViewSet):
    """
    Оставление отзыва о продукте с оценкой от 1 до 5 звёзд и комментарием.
    GET `/api/products/reviews/?product=<id>` — список отзывов о продукте и средний рейтинг.
    POST `/api/products/reviews/` — добавление нового отзыва (требуется авторизация).
    Каждый пользователь может оставить только один отзыв на один продукт. При повторной отправке существующий отзыв обновляется.
    """
    serializer_class = ProductReviewSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [AllowAny()]
        return [IsAuthenticated(), IsOwnerOrReadOnly()]

    def get_queryset(self):
        queryset = ProductReview.objects.select_related("user", "product")
        product_id = self.request.query_params.get("product")
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

    def create(self, request, *args, **kwargs):
        product_id = request.data.get("product")

        existing = ProductReview.objects.filter(
            product_id=product_id, user=request.user
        ).first()

        if existing:
            serializer = self.get_serializer(existing, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=["get"], url_path="summary", permission_classes=[AllowAny])
    def summary(self, request):
        product_id = request.query_params.get("product")
        if not product_id:
            return Response({"detail": "product query param is required."}, status=400)

        agg = ProductReview.objects.filter(product_id=product_id).aggregate(
            average=Avg("rating"), count=Count("id")
        )
        return Response({
            "average": round(agg["average"], 1) if agg["average"] else 0,
            "count": agg["count"] or 0,
        })