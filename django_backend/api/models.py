from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    # AbstractUser gives us username, email, password, etc.
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('staff', 'Staff'),
    ]
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='staff')
    
    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = 'admin'
        elif self.role not in ['admin', 'staff']:
            self.role = 'staff'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username

class AppData(models.Model):
    key = models.CharField(max_length=255, unique=True)
    value = models.TextField() # Store JSON stringified data
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.key
