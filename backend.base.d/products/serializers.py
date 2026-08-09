from rest_framework import serializers

from .models import Product, SoftwareVersion, SoftwareVersionMedia, ProductReview
from config import settings

from plans.serializers import SubscriptionPlanSerializer


class SoftwareVersionMediaSerializer(serializers.ModelSerializer):
    media = serializers.SerializerMethodField()

    class Meta:
        model = SoftwareVersionMedia
        fields = (
            "id",
            "media_type",
            "media",
            "created_at",
        )

    def get_media(self, obj):
        if obj.media:
            return f"{settings.SITE_URL}{obj.media.url}"
        return None

class SoftwareVersionSerializer(serializers.ModelSerializer):
    media = SoftwareVersionMediaSerializer(
        many=True,
        read_only=True
    )
    
    class Meta:
        model = SoftwareVersion
        fields = (
            "id",
            "name",
            "version",
            "description",
            "is_active",
            "created_at",
            "media",
        )

        
class ProductSerializer(serializers.ModelSerializer):
    icon = serializers.SerializerMethodField()
    hero_section_image_url = serializers.SerializerMethodField()
    plans = SubscriptionPlanSerializer(many=True, read_only=True)
    
    # versions = SoftwareVersionSerializer(
    #     many=True,
    #     read_only=True
    # )

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


class ProductReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_avatar = serializers.SerializerMethodField()

    class Meta:
        model = ProductReview
        fields = (
            "id", "product", "user", "user_name", "user_avatar",
            "rating", "comment", "created_at", "updated_at",
        )
        read_only_fields = ("user",)

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_user_avatar(self, obj):
        if obj.user.avatar:
            return f"{settings.SITE_URL}{obj.user.avatar.url}"
        return None

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

