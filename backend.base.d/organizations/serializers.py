from rest_framework import serializers
from .models import Organization, Company


class OrganizationSerializer(serializers.ModelSerializer):
    url = serializers.CharField(read_only=True)
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    tariff_plan = serializers.CharField(write_only=True, required=False, default='basic')

    class Meta:
        model = Organization
        fields = ["id", "name", "inn", "url", "owner", "created_at", "tariff_plan"]
        read_only_fields = ["owner", "url", "created_at"]

    def create(self, validated_data):
        tariff_plan = validated_data.pop('tariff_plan', 'basic')

        organization = super().create(validated_data)

        organization._tariff_plan = tariff_plan

        return organization


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ("name", "logo", "url")