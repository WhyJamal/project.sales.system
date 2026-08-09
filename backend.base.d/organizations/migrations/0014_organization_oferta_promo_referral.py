# Generated manually on 2026-08-08

import django.db.models.deletion
from django.db import migrations, models


def fill_promo_codes(apps, schema_editor):
    import random
    import string

    Organization = apps.get_model('organizations', 'Organization')
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

    existing = set(
        Organization.objects.exclude(promo_code="").values_list('promo_code', flat=True)
    )

    for org in Organization.objects.filter(promo_code=""):
        while True:
            code = "".join(random.choice(alphabet) for _ in range(8))
            if code not in existing:
                existing.add(code)
                break
        org.promo_code = code
        org.save(update_fields=['promo_code'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('organizations', '0013_organizationproduct_version'),
    ]

    operations = [
        migrations.AddField(
            model_name='organization',
            name='oferta_accepted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='organization',
            name='oferta_accepted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='organization',
            name='promo_code',
            field=models.CharField(blank=True, default='', max_length=16),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='organization',
            name='invited_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='invited_organizations',
                to='organizations.organization',
            ),
        ),
        migrations.RunPython(fill_promo_codes, noop),
        migrations.AlterField(
            model_name='organization',
            name='promo_code',
            field=models.CharField(max_length=16, unique=True),
        ),
    ]
