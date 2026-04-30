from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import AppData
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, AppDataSerializer
import os
from django.conf import settings
from rest_framework.parsers import MultiPartParser, FormParser

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # restrict to admins and staff, and filter only those roles
        queryset = User.objects.filter(role__in=['admin', 'staff'])
        if self.request.user.is_staff or self.request.user.role == 'admin':
            return queryset
        return queryset.filter(id=self.request.user.id)

class AppDataViewSet(viewsets.ModelViewSet):
    queryset = AppData.objects.all()
    serializer_class = AppDataSerializer
    permission_classes = [AllowAny] # Change to IsAuthenticated if needed
    lookup_field = 'key'

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = AppData.objects.get(key=kwargs['key'])
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except AppData.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    def create(self, request, *args, **kwargs):
        key = request.data.get('key')
        value = request.data.get('value')
        instance, created = AppData.objects.update_or_create(key=key, defaults={'value': value})
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class FileUploadView(APIView):
    permission_classes = [AllowAny]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file_obj = request.data.get('file')
        if not file_obj:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Simple local storage for now
        upload_path = os.path.join(settings.MEDIA_ROOT, 'uploads')
        if not os.path.exists(upload_path):
            os.makedirs(upload_path)
        
        file_path = os.path.join(upload_path, file_obj.name)
        with open(file_path, 'wb+') as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)
        
        file_url = request.build_absolute_uri(settings.MEDIA_URL + 'uploads/' + file_obj.name)
        return Response({'url': file_url}, status=status.HTTP_201_CREATED)
