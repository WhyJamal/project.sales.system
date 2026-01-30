from rest_framework import serializers
from config import settings

from .utils import initialize_1c_database

from .models import Organization, OrganizationProduct, Company
from products.models import Product
from users.models import CustomUser

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class OrganizationProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationProduct
        fields = ['id', 'organization', 'product', 'title', 
            'product_url', 'product_price', 'subscription', 
            'subscription_end_date', 'created_at', 'chosen', 'order']

    def create(self, validated_data):
        title = validated_data.get('title', None)
        if not title:
            validated_data['title'] = validated_data['product'].name if validated_data.get('product') else 'default_name'

        org = validated_data.get('organization')

        if org:
            last_order = OrganizationProduct.objects.filter(
                organization=org
            ).count()
            validated_data['order'] = last_order
        else:
            validated_data['order'] = 0  # fallback

        return super().create(validated_data)


class CompanySerializer(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()  

    class Meta:
        model = Company
        fields = ("name", "logo", "url")

    def get_logo(self, obj):
        return f"{settings.SITE_URL}{obj.logo.url}"