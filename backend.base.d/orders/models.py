from django.db import models
from organizations.models import Organization
from products.models import Product

class Order(models.Model):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="orders"
    )
    product = models.ForeignKey(Product, on_delete=models.PROTECT)

    unit_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    quantity = models.PositiveIntegerField(default=1)

    total_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )

    is_free = models.BooleanField(default=False)

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("free", "Free"),
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="pending"
    )

    ordered_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.unit_price is None:
            if hasattr(self.product, 'price'):
                self.unit_price = self.product.price
            else:
                self.unit_price = 0
                self.is_free = True
                self.status = "free"

        self.total_price = self.unit_price * self.quantity

        if self.total_price == 0:
            self.is_free = True
            self.status = "free"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.organization.name} - {self.product.title} x{self.quantity}"



# class Order(models.Model):
#     organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="orders")
#     product = models.ForeignKey(Product, on_delete=models.CASCADE)
#     quantity = models.PositiveIntegerField(default=1)
#     total_price = models.DecimalField(max_digits=12, decimal_places=2)
#     ordered_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"{self.organization.name} - {self.product.name} x{self.quantity}"
