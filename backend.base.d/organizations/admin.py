from django.contrib import admin
from django.utils.html import format_html
from .models import Organization, Company

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'inn', 'url', 'owner', 'created_at')
    search_fields = ('name', 'inn', 'owner__username')

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