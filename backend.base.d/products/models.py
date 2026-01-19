from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=255, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    icon = models.ImageField(upload_to='images/', blank=True, null=True)
    is_active = models.BooleanField(default=True)

    badge = models.CharField(max_length=50, blank=True, null=True)
    tags = models.JSONField(blank=True, null=True)  

    hero_section = models.JSONField(blank=True, null=True)
    hero_section_image = models.ImageField(upload_to='images/', blank=True, null=True)
    features_section = models.JSONField(blank=True, null=True)
    features_section_videoID = models.URLField(blank=True, null=True)
    modules_section = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title