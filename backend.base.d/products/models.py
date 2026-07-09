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
    features_section_videoID = models.CharField(max_length=50, blank=True, null=True)
    modules_section = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    demo_url = models.URLField(unique=True, blank=True, null=True)

    def __str__(self):
        return self.title


class SoftwareVersion(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="versions"
    )
    
    name = models.CharField(
        max_length=150,
        verbose_name="Software Name"
    )

    version = models.CharField(
        max_length=50,
        verbose_name="Version"
    )

    install_path = models.CharField(
        max_length=500,
        verbose_name="Installation Path"
    )

    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Description"
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name="Is Active"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("name", "version")
        verbose_name = "Software Version"
        verbose_name_plural = "Software Versions"

    def __str__(self):
        return f"{self.name} {self.version}"        
    
class SoftwareVersionMedia(models.Model):
    IMAGE = "image"
    VIDEO = "video"
    FILE = "file"

    MEDIA_TYPES = [
        (IMAGE, "Image"),
        (VIDEO, "Video"),
        (FILE, "File"),
    ]

    update = models.ForeignKey(
        SoftwareVersion,
        on_delete=models.CASCADE,
        related_name="media"
    )

    media_type = models.CharField(
        max_length=10,
        choices=MEDIA_TYPES
    )

    media = models.FileField(upload_to="updates/")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.update.name} {self.update.version} ({self.media_type})"    