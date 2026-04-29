from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, UserProfileView, UserViewSet, AppDataViewSet, FileUploadView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'data', AppDataViewSet, basename='appdata')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', UserProfileView.as_view(), name='user_profile'),
    path('upload/', FileUploadView.as_view(), name='file_upload'),
]
