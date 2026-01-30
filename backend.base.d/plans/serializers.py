from rest_framework import serializers
from .models import SubscriptionPlan, OrganizationSubscription, PlanFeature

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = "__all__"

class PlanFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanFeature
        fields = "__all__"

class OrganizationSubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)

    class Meta:
        model = OrganizationSubscription
        fields = ['id', 'start_date', 'end_date', 'is_active', 'organization', 'plan_name']