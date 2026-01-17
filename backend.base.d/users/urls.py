from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from .views import UserViewSet, RegisterUserViewSet, LoginUserView, GoogleAuthView, CurrentUserView

router = DefaultRouter()
router.register(r'auth/register', RegisterUserViewSet, basename='register')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', LoginUserView.as_view(), name='login'),
    path("auth/google/", GoogleAuthView.as_view(), name="google-auth"),
    
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]