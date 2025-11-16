from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import CustomUser
from .utils import initialize_1c_database 
import logging

logger = logging.getLogger(__name__)

class Organization(models.Model):
    name = models.CharField(max_length=255)
    inn = models.CharField(max_length=20, unique=True)
    url = models.URLField(unique=True, blank=True, null=True)
    owner = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, related_name="owned_organizations"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


@receiver(post_save, sender=Organization)
def create_1c_after_org_created(sender, instance, created, **kwargs):
    if created:
        try:
            new_url = initialize_1c_database(instance.inn)
            
            instance.url = new_url
            instance.save(update_fields=['url'])
            
            if instance.owner:
                instance.owner.organization_url = new_url
                instance.owner.save(update_fields=['organization_url'])
            
        except Exception as e:
            print(f"Ошибка при создании 1С или обновлении пользователя: {e}")

class Company(models.Model):
    name = models.CharField(max_length=255)
    logo = models.ImageField(upload_to="companies/")
    url = models.URLField(blank=True)

    def __str__(self):
        return self.name
