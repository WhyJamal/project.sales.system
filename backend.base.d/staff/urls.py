from django.urls import path
from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("organizations", views.OrganizationViewSet, basename="staff-organizations")
router.register("bases", views.BaseViewSet, basename="staff-bases")
router.register("regions", views.RegionViewSet, basename="staff-regions")

urlpatterns = [
    path("auth/login/", views.LoginView.as_view()),
    path("auth/login-otp/", views.LoginOtpView.as_view()),
    path("auth/logout/", views.LogoutView.as_view()),
    path("auth/me/", views.MeView.as_view()),
    path("auth/change-password/", views.ChangePasswordView.as_view()),
    path("dashboard/", views.DashboardView.as_view()),
    path("lookups/", views.LookupsView.as_view()),
    path("reports/<str:kind>/", views.ReportView.as_view()),
    path("audit/", views.AuditLogView.as_view()),
] + router.urls
