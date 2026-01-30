from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet, OrganizationProductViewSet, CompanyViewSet #, update_1c  

router = DefaultRouter()
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'product/add', OrganizationProductViewSet, basename='organization_product')
router.register(r'', OrganizationViewSet, basename='organization')

urlpatterns = [
    #path('update_1c/', update_1c, name='update_1c'),
    path('', include(router.urls)),
]
