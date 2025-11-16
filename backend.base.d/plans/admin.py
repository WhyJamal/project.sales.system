from django.contrib import admin
from .models import SubscriptionPlan, OrganizationSubscription

admin.site.register(SubscriptionPlan)
admin.site.register(OrganizationSubscription)
