from django.db import models
from django.db import transaction as db_transaction
from decimal import Decimal


class Wallet(models.Model):
    organization = models.OneToOneField(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='wallet'
    )
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Wallet [{self.organization.name}] — {self.balance} UZS"

    def deposit(self, amount: Decimal):
        with db_transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(pk=self.pk)
            wallet.balance += Decimal(str(amount))
            wallet.save(update_fields=['balance', 'updated_at'])
            WalletTransaction.objects.create(
                wallet=self,
                amount=amount,
                transaction_type='deposit',
                balance_after=wallet.balance,
            )
            self.balance = wallet.balance

    def withdraw(self, amount: Decimal, description: str = ''):
        with db_transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(pk=self.pk)
            if wallet.balance < Decimal(str(amount)):
                raise ValueError(
                    f"Недостаточно средств на балансе кошелька: {wallet.balance}, нужно: {amount}"
                )
            wallet.balance -= Decimal(str(amount))
            wallet.save(update_fields=['balance', 'updated_at'])
            WalletTransaction.objects.create(
                wallet=self,
                amount=amount,
                transaction_type='withdraw',
                balance_after=wallet.balance,
                description=description,
            )
            self.balance = wallet.balance


class WalletTransaction(models.Model):
    TRANSACTION_TYPES = (
        ('deposit', 'Пополнение'),
        ('withdraw', 'Открытие базы'),
    )

    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    balance_after = models.DecimalField(max_digits=14, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_transaction_type_display()} | {self.amount} UZS | {self.created_at:%Y-%m-%d %H:%M}"
