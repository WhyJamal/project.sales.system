from django.db import models
from organizations.models import Organization
from products.models import Product

class Order(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="orders")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    ordered_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):

        if not self.unit_price:
            org_product = OrganizationProduct.objects.get(
                organization=self.organization, product=self.product
            )
            self.unit_price = org_product.price
        self.total_price = (self.unit_price * self.quantity)
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
