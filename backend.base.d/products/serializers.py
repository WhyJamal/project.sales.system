from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    icon = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = "__all__"

    def get_icon(self, obj):
        if obj.icon:
            return f"{settings.SITE_URL}{obj.icon.url}"
        return None