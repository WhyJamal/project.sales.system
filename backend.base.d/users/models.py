from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    organization_url = models.URLField(blank=True, null=True)
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')

    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'   
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.username
