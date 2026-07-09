from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, SoftwareVersionViewSet

router = DefaultRouter()
router.register(r'versions', SoftwareVersionViewSet, basename='software-versions')
router.register(r'', ProductViewSet, basename='products')

urlpatterns = [
    path('', include(router.urls)),
]