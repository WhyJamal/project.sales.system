from rest_framework import serializers

from .models import CustomUser
from django.conf import settings

class UserSerializer(serializers.ModelSerializer):
    organization = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()  

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'phone_number', 'bio',
            'password', 'avatar', 'organization'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def get_organization(self, obj):
        org = obj.organization
        if not org:
            return None
        return {
            "id": org.id,
            "name": org.name,
            "url": org.url,
            "products": get_org_products(org),
        }

    def get_avatar(self, obj):
        if obj.avatar:  
            return f"{settings.SITE_URL}{obj.avatar.url}"
        return None  

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = self.Meta.model(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user