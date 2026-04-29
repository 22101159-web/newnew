import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123', role='admin')
    print("Created superuser: admin / admin123")
else:
    print("Superuser 'admin' already exists")

if not User.objects.filter(username='staff').exists():
    User.objects.create_user('staff', 'staff@example.com', 'staff123', role='staff', is_staff=True)
    print("Created staff user: staff / staff123")
else:
    print("Staff user 'staff' already exists")
