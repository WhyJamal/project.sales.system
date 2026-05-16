from django.db import migrations


def create_wallets(apps, schema_editor):
    Organization = apps.get_model('organizations', 'Organization')
    Wallet = apps.get_model('wallet', 'Wallet')
    for org in Organization.objects.all():
        Wallet.objects.get_or_create(organization=org)


class Migration(migrations.Migration):

    dependencies = [
        ('wallet', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_wallets, migrations.RunPython.noop),
    ]