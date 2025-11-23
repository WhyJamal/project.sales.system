from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubscriptionPlanViewSet, OrganizationSubscriptionViewSet

router = DefaultRouter()
router.register(r"organization-subscriptions", OrganizationSubscriptionViewSet, basename="orgsubscription")
router.register(r"", SubscriptionPlanViewSet, basename="subscriptionplan")

urlpatterns = [
    path("", include(router.urls)),
]
