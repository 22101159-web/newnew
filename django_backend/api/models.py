from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    # AbstractUser gives us username, email, password, etc.
    role = models.CharField(max_length=50, default='user')
    
    def __str__(self):
        return self.username
