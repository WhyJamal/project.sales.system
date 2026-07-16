from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer
from users.models import CustomUser
from django.conf import settings

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by("-created_at")
    serializer_class = NotificationSerializer

    def get_permissions(self):
        if self.action == "create":
            return []
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        contractor_inn = serializer.validated_data["contractor_inn"]

        try:
            user = CustomUser.objects.get(
                organization__inn=contractor_inn
            )
        except CustomUser.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Bunday INN ga ega foydalanuvchi topilmadi."
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        except CustomUser.MultipleObjectsReturned:
            return Response(
                {
                    "success": False,
                    "message": "Ushbu INN bo'yicha bir nechta foydalanuvchi topildi."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        product_url = serializer.validated_data["product_url"]

        full_product_url = (
            f"{settings.HOST_URL.rstrip('/')}/{product_url.lstrip('/')}"
        )

        notification = Notification.objects.create(
            user=user,
            document_type=serializer.validated_data["document_type"],
            contractor_inn=serializer.validated_data["contractor_inn"],
            document_number=serializer.validated_data["document_number"],
            sender_contractor_inn=serializer.validated_data["sender_contractor_inn"],
            sender_contractor_name=serializer.validated_data["sender_contractor_name"],
            product_url=full_product_url,
        )

        return Response(
            {
                "success": True,
                "id": notification.id,
                "message": "Notification yaratildi."
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"])
    def my_notifications(self, request):
        organization = request.user.organization
        document_type = request.query_params.get("document_type")

        queryset = Notification.objects.filter(
            user=request.user,
            is_archive=False,
        )

        if document_type:
            queryset = queryset.filter(document_type=document_type)

        queryset = queryset.order_by("-created_at")

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="my_notifications/archive")
    def my_notifications_archive(self, request):
        document_type = request.query_params.get("document_type")

        queryset = Notification.objects.filter(
            user=request.user,
            is_archive=True,
        )

        if document_type:
            queryset = queryset.filter(document_type=document_type)

        queryset = queryset.order_by("-created_at")

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read"])

        return Response(
            {
                "success": True,
                "message": "Notification read."
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=["patch"])
    def archive(self, request, pk=None):
        notification = self.get_object()
        notification.is_archive = True
        notification.save(update_fields=["is_archive"])

        return Response(
            {
                "success": True,
                "message": "Notification archived."
            },
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        organization = request.user.organization

        return Response({
            "count": Notification.objects.filter(
                user=request.user,
                is_read=False,
                is_archive=False,
            ).count()
        })    