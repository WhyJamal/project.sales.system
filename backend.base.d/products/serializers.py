from rest_framework import serializers

from .models import Product
from config import settings

from plans.serializers import SubscriptionPlanSerializer


class ProductSerializer(serializers.ModelSerializer):
    icon = serializers.SerializerMethodField()
    hero_section_image_url = serializers.SerializerMethodField()
    plans = SubscriptionPlanSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = "__all__"

    def get_icon(self, obj):
        if obj.icon:
            return f"{settings.SITE_URL}{obj.icon.url}"
        return None

    def get_hero_section_image_url(self, obj):
        if obj.hero_section_image:
            return f"{settings.SITE_URL}{obj.hero_section_image.url}"
        return None

    def get_plans(self, obj):
        plans = obj.plans.filter(is_active=True)
        return SubscriptionPlanSerializer(plans, many=True).data
