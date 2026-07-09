from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by("-created_at")
    serializer_class = NotificationSerializer

    def get_permissions(self):
        if self.action == "create":
            return []          
        return [IsAuthenticated()]

    @action(detail=False, methods=["get"])
    def my_notifications(self, request):
        organization = request.user.organization
        document_type = request.query_params.get("document_type")

        queryset = Notification.objects.filter(
            contractor_inn=organization.inn,
            is_archive=False
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
                contractor_inn=organization.inn,
                is_read=False
            ).count()
        })    