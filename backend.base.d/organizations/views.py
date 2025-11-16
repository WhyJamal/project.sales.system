import threading
import time
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Organization, Company
from .serializers import OrganizationSerializer, CompanySerializer
from django.http import JsonResponse
from .queue import add_to_queue
from .utils import update_1c_config

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(owner=request.user)

        instance = Organization.objects.get(pk=serializer.instance.pk)
        out_serializer = self.get_serializer(instance)

        headers = self.get_success_headers(out_serializer.data)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


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
