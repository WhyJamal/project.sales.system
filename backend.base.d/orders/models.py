from django.db import models
from organizations.models import Organization
from products.models import Product

class Order(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="orders")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    ordered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.organization.name} - {self.product.name} x{self.quantity}"
