from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import SubscriptionPlan, OrganizationSubscription, PlanFeature
from .serializers import SubscriptionPlanSerializer, OrganizationSubscriptionSerializer, PlanFeatureSerializer

class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [AllowAny]

class PlanFeatureViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PlanFeature.objects.all()
    serializer_class = PlanFeatureSerializer
    permission_classes = [AllowAny]

class OrganizationSubscriptionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = OrganizationSubscription.objects.all()
    serializer_class = OrganizationSubscriptionSerializer
    permission_classes = [AllowAny]
