from rest_framework import serializers
from modeltranslation.utils import get_translation_fields

from .models import SubscriptionPlan, OrganizationSubscription, PlanFeature

# Per-language columns (description_ru, description_uz, ...) stay out of the API:
# `description`, `features`, ... already return the active language.
class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        exclude = tuple(get_translation_fields("description", "features"))

class PlanFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanFeature
        exclude = tuple(get_translation_fields("category", "name"))

class OrganizationSubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)

    class Meta:
        model = OrganizationSubscription
        fields = ['id', 'start_date', 'end_date', 'is_active', 'organization', 'plan_name']