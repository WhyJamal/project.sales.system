from django.contrib import admin
from django.utils.html import format_html

from .models import Organization, OrganizationProduct, Company
from products.models import Product 

class OrganizationProductInline(admin.TabularInline):
    model = OrganizationProduct
    extra = 1
    fields = ('title', 'product', 'product_url', 'subscription', 'created_at', 'chosen', 'order')
    readonly_fields = ('created_at',)

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'inn', 'owner', 'created_at')
    search_fields = ('name', 'inn', 'owner__username')
    inlines = [OrganizationProductInline]
    
    # def get_tariff_plan(self, obj):
    #     return obj.tariff_plan

    # get_tariff_plan.short_description = 'Тарифный план'
    # get_tariff_plan.admin_order_field = 'subscription__plan__name'

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