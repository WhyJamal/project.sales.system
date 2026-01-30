from rest_framework import serializers

from .models import CustomUser
from django.conf import settings

from plans.serializers import OrganizationSubscriptionSerializer

def get_org_products(org):
    if not org:
        return []
    return [
        {
            "id": p.id,
            "title": p.title,
            "product_url": p.product_url,
            "product_id": p.product.id,
            "product_name": p.product.name,
            "order": p.order,
            "chosen": p.chosen,
            "subscription": OrganizationSubscriptionSerializer(p.subscription).data if p.subscription else None,
            "subscription_end_date": p.subscription_end_date
        }
        for p in org.organization_products.all()  
    ]

class UserSerializer(serializers.ModelSerializer):
    organization = serializers.SerializerMethodField()
    avatar = serializers.ImageField(write_only=True, required=False)
    avatar_url = serializers.SerializerMethodField()  

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'phone_number', 'bio',
            'password', 'avatar', 'avatar_url', 'organization'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def get_organization(self, obj):
        org = obj.organization
        if not org:
            return None
        return {
            "id": org.id,
            "name": org.name,
            "inn": org.inn,
            "address": org.address,
            "products": get_org_products(org),
        }

    def get_avatar_url(self, obj):
        if obj.avatar:  
            return f"{settings.SITE_URL}{obj.avatar.url}"
        return None  

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        avatar = validated_data.pop('avatar', None)

        user = self.Meta.model(**validated_data)
        if password:
            user.set_password(password)
        user.save()

        if avatar:
            user.avatar = avatar
            user.save()

        return user