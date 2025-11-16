from rest_framework import serializers
from .models import Organization, Company

class OrganizationSerializer(serializers.ModelSerializer):
    url = serializers.CharField(read_only=True)
    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Organization
        fields = ["id", "name", "inn", "url", "owner", "created_at"]
        read_only_fields = ["owner", "url", "created_at"]


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ("name", "logo", "url")
