from rest_framework import serializers
from .models import AppData
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class AppDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppData
        fields = ['key', 'value', 'updated_at']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Only allow admin and staff to log in
        if self.user.role not in ['admin', 'staff']:
            raise serializers.ValidationError({"detail": "Access denied. Unauthorized role."})

        # Add custom claims to the token response
        data['uid'] = self.user.id
        data['name'] = self.user.username
        data['role'] = self.user.role
        return data
