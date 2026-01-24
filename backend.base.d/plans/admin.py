from django.contrib import admin
from .models import SubscriptionPlan, OrganizationSubscription, PlanFeature

admin.site.register(SubscriptionPlan)
admin.site.register(PlanFeature)
admin.site.register(OrganizationSubscription)
