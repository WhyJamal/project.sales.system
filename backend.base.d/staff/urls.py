from django.urls import path, re_path
from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter(trailing_slash=r"/?")
router.register("organizations", views.OrganizationViewSet, basename="staff-organizations")
router.register("bases", views.BaseViewSet, basename="staff-bases")
router.register("regions", views.RegionViewSet, basename="staff-regions")

urlpatterns = [
    re_path(r"^auth/login/?$", views.LoginView.as_view()),
    re_path(r"^auth/login-otp/?$", views.LoginOtpView.as_view()),
    re_path(r"^auth/logout/?$", views.LogoutView.as_view()),
    re_path(r"^auth/me/?$", views.MeView.as_view()),
    re_path(r"^auth/change-password/?$", views.ChangePasswordView.as_view()),
    re_path(r"^dashboard/?$", views.DashboardView.as_view()),
    re_path(r"^lookups/?$", views.LookupsView.as_view()),
    re_path(r"^reports/(?P<kind>[^/]+)/?$", views.ReportView.as_view()),
    re_path(r"^audit/?$", views.AuditLogView.as_view()),
] + router.urls