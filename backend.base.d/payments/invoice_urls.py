from django.urls import path

from . import invoice_views as views

urlpatterns = [
    path('', views.invoice_list, name='invoice-list'),
    path('create/', views.invoice_create, name='invoice-create'),
    path('<int:pk>/cancel/', views.invoice_cancel, name='invoice-cancel'),
]
