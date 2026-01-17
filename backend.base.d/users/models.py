from django.contrib.auth.models import AbstractUser
from django.db import models
#from organizations.models import Organization

class CustomUser(AbstractUser):
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="members"
    )
    
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')

    email = models.EmailField(unique=True)
    bio = models.TextField(blank=True, null=True)
    #avatar = models.ImageField(upload_to="users/avatars/", blank=True, null=True)
     
    USERNAME_FIELD = 'email'   
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.username
