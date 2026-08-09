from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrganizationViewSet, OrganizationProductViewSet, CompanyViewSet,
    update_product_version, invite_info, my_invite,
) #, update_1c  

router = DefaultRouter()
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'product/add', OrganizationProductViewSet, basename='organization_product')
router.register(r'', OrganizationViewSet, basename='organization')

urlpatterns = [
    path('product/update-version/', update_product_version, name='update_product_version'),
    path('invite/mine/', my_invite, name='my_invite'),
    path('invite/<str:code>/', invite_info, name='invite_info'),
    path('', include(router.urls)),
]
