from rest_framework import serializers
from config import settings

#from .utils import initialize_1c_database

from .models import Organization, OrganizationProduct, Company
from products.models import Product
from users.models import CustomUser

class OrganizationSerializer(serializers.ModelSerializer):
    # Введённый при регистрации промо-код используется для 
    # определения поля invited_by и не является отдельным полем модели.
    invite_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Organization
        fields = '__all__'
        read_only_fields = ('promo_code', 'invited_by', 'oferta_accepted_at', 'owner')

    def validate_oferta_accepted(self, value):
        if not value:
            raise serializers.ValidationError(
                "Для продолжения необходимо принять условия публичной оферты."
            )
        return value

    def validate_invite_code(self, value):
        code = (value or "").strip().upper()
        if not code:
            return ""

        inviter = Organization.objects.filter(promo_code=code).first()
        if not inviter:
            raise serializers.ValidationError("Промо-код не найден.")

        self._inviter = inviter
        return code

    def create(self, validated_data):
        validated_data.pop('invite_code', None)
        validated_data['owner'] = self.context['request'].user

        inviter = getattr(self, '_inviter', None)
        if inviter:
            validated_data['invited_by'] = inviter

        return super().create(validated_data)


class OrganizationProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationProduct
        fields = ['id', 'organization', 'product', 'title', 
            'product_url', 'product_price', 'subscription', 
            'subscription_end_date', 'created_at', 'chosen', 
            'order', 'archive', 'version'
        ]

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