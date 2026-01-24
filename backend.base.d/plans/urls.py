from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubscriptionPlanViewSet, OrganizationSubscriptionViewSet, PlanFeatureViewSet

router = DefaultRouter()
router.register(r"organization-subscriptions", OrganizationSubscriptionViewSet, basename="orgsubscription")
router.register(r"plan-features", PlanFeatureViewSet, basename="planfeature")
router.register(r"", SubscriptionPlanViewSet, basename="subscriptionplan")

urlpatterns = [
    path("", include(router.urls)),
]
