from rest_framework import viewsets
from .models import SubscriptionPlan, OrganizationSubscription
from .serializers import SubscriptionPlanSerializer, OrganizationSubscriptionSerializer

class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer

class OrganizationSubscriptionViewSet(viewsets.ModelViewSet):
    queryset = OrganizationSubscription.objects.all()
    serializer_class = OrganizationSubscriptionSerializer
