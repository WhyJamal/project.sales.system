from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_payment, name='create-payment'),
    path('renew/', views.renew_from_wallet, name='renew-from-wallet'),
 
    path('prepare/', views.click_prepare, name='click-prepare'),
    path('complete/', views.click_complete, name='click-complete'),
]