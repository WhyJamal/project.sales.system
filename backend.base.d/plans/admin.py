from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from .models import SubscriptionPlan, OrganizationSubscription, PlanFeature


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(TranslationAdmin):
    pass


@admin.register(PlanFeature)
class PlanFeatureAdmin(TranslationAdmin):
    pass


admin.site.register(OrganizationSubscription)
