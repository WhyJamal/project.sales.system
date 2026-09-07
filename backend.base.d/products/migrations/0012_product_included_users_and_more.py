# Generated manually — per-user pricing fields for Product

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0011_alter_productreview_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='included_users',
            field=models.PositiveIntegerField(
                default=1,
                help_text="Tarif narxiga standart kiritilgan foydalanuvchilar soni (default: 1 ta)",
            ),
        ),
        migrations.AddField(
            model_name='product',
            name='extra_user_price',
            field=models.DecimalField(
                max_digits=10, decimal_places=2, default=0,
                help_text="Limitdan (included_users) tashqari har bir qo'shimcha foydalanuvchi uchun oylik narx",
            ),
        ),
    ]
