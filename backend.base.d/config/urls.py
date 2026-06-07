from django.contrib import admin
from django.urls import path, include
# from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings              
from django.conf.urls.static import static
from django.http import JsonResponse

from utils.expiration_date.views import ExpirationDateView

def api_root(request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", api_root),

    path('api/users/', include('users.urls')),
    path('api/organizations/', include('organizations.urls')),
    path('api/plans/', include('plans.urls')),
    path('api/products/', include('products.urls')),
    path('api/contact/', include('contact.urls')),

    path('api/payments/click/', include('payments.urls')),
    path('api/wallet/', include('wallet.urls')),

    path("api/expiration-date/", ExpirationDateView.as_view(), name="expiration-date")
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)