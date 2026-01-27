from rest_framework import serializers
from config import settings

from .models import Organization, Company
from products.models import Product

class OrganizationSerializer(serializers.ModelSerializer):
    url = serializers.CharField(read_only=True)
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    tariff_plan = serializers.CharField(write_only=True, required=False, default='basic')
    products = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), many=True, required=False)

    class Meta:
        model = Organization
        fields = ["id", "name", "inn", "url", "owner", "created_at", "tariff_plan", "products"]
        read_only_fields = ["owner", "url", "created_at"]

    def create(self, validated_data):
        products = validated_data.pop('products', [])
        tariff_plan = validated_data.pop('tariff_plan', 'basic')

        organization = Organization(**validated_data)
        organization._tariff_plan = tariff_plan  

        request = self.context.get("request")
        if request and hasattr(request, "user"):
            organization.owner = request.user

        organization.save()

        #products
        if products:
            organization.products.set(products)

        return organization

    def update(self, instance, validated_data):
        products = validated_data.pop('products', None)
        tariff_plan = validated_data.pop('tariff_plan', None)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)

        if tariff_plan is not None:
            instance._tariff_plan = tariff_plan

        instance.save()

        if products is not None:
            instance.products.set(products)

        return instance


class CompanySerializer(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()  

    class Meta:
        model = Company
        fields = ("name", "logo", "url")

    def get_logo(self, obj):
        return f"{settings.SITE_URL}{obj.logo.url}"