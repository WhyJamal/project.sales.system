from rest_framework import serializers
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    organization_id = serializers.IntegerField(source="organization.id", read_only=True)
    organization_name = serializers.CharField(source="organization.name", read_only=True)    
    organization_url = serializers.CharField(source="organization.url", read_only=True)    
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'phone_number',
            'organization_id', 'organization_name', 'bio',
            'organization_url', 'password'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = self.Meta.model(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user
