from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('plans', '0009_subscriptionplan_product'),
    ]

    operations = [
        migrations.AlterField(
            model_name='subscriptionplan',
            name='code',
            field=models.CharField(choices=[('starter', 'Starter'), ('growth', 'Growth'), ('scale', 'Scale')], max_length=20),
        ),
        migrations.AddConstraint(
            model_name='subscriptionplan',
            constraint=models.UniqueConstraint(fields=('product', 'code'), name='unique_plan_code_per_product'),
        ),
    ]
