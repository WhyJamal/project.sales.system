from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_payment, name='create-payment'),
    
    path('prepare/', views.click_prepare, name='click-prepare'),
    path('complete/', views.click_complete, name='click-complete'),
]