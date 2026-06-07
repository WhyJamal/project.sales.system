from django.contrib import admin
from django.utils.html import format_html, mark_safe
from django.utils import timezone

from .models import Organization, OrganizationProduct, Company
from products.models import Product


class OrganizationProductInline(admin.TabularInline):
    model = OrganizationProduct
    extra = 1
    fields = (
        'title', 'product', 'product_url', 'subscription',
        'subscription_end_date', 'status_tag', 'chosen', 'order', 'archive', 'created_at',
    )
    readonly_fields = ('created_at', 'status_tag')

    def status_tag(self, obj):
        if not obj.subscription_end_date:
            return mark_safe('<span style="color: gray;">—</span>')
        if obj.subscription_end_date > timezone.now():
            days_left = (obj.subscription_end_date - timezone.now()).days
            return format_html(
                '<span style="color: green;">✔ Активна ({} дн.)</span>', days_left
            )
        return mark_safe('<span style="color: red;">✘ Истекла</span>')

    status_tag.short_description = 'Статус'


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'inn', 'owner', 'created_at')
    search_fields = ('name', 'inn', 'owner__username')
    inlines = [OrganizationProductInline]


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'logo_tag', 'url')
    search_fields = ('name',)
    list_filter = ()
    readonly_fields = ('logo_tag',)

    def logo_tag(self, obj):
        if obj.logo:
            return format_html('<img src="{}" style="height: 50px;"/>', obj.logo.url)
        return "-"
    logo_tag.short_description = 'Logo'