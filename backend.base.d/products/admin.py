from django.contrib import admin
from django.utils.html import format_html
from .models import Product, SoftwareVersion, SoftwareVersionMedia

class SoftwareVersionInline(admin.TabularInline):
    model = SoftwareVersion
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    inlines = [SoftwareVersionInline]


@admin.register(SoftwareVersion)
class SoftwareVersionAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "name",
        "version",
        "is_active",
        "created_at",
    )

@admin.register(SoftwareVersionMedia)
class SoftwareVersionMediaAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "update",
        "media_type_badge",
        "media_preview",
        "created_at",
    )

    list_filter = (
        "media_type",
        "created_at",
    )

    search_fields = (
        "update__name",
        "update__version",
    )

    readonly_fields = (
        "media_preview_large",
        "created_at",
    )

    ordering = ("-created_at",)

    fieldsets = (
        (
            "Основная информация",
            {
                "fields": (
                    "update",
                    "media_type",
                    "media",
                )
            },
        ),
        (
            "Предпросмотр",
            {
                "fields": (
                    "media_preview_large",
                    "created_at",
                )
            },
        ),
    )

    def media_type_badge(self, obj):
        colors = {
            "image": "#22c55e",
            "video": "#3b82f6",
            "file": "#6b7280",
        }

        labels = {
            "image": "🖼 Image",
            "video": "🎥 Video",
            "file": "📄 File",
        }

        return format_html(
            '<span style="background:{};color:white;padding:4px 10px;border-radius:12px;font-size:12px;">{}</span>',
            colors.get(obj.media_type, "#6b7280"),
            labels.get(obj.media_type, obj.media_type),
        )

    media_type_badge.short_description = "Тип"

    def media_preview(self, obj):
        if not obj.media:
            return "-"

        if obj.media_type == "image":
            return format_html(
                '<img src="{}" style="height:50px;border-radius:6px;" />',
                obj.media.url,
            )

        return format_html(
            '<a href="{}" target="_blank">Открыть</a>',
            obj.media.url,
        )

    media_preview.short_description = "Preview"

    def media_preview_large(self, obj):
        if not obj.pk or not obj.media:
            return "Нет файла"

        if obj.media_type == "image":
            return format_html(
                '<img src="{}" style="max-height:300px;border-radius:10px;" />',
                obj.media.url,
            )

        if obj.media_type == "video":
            return format_html(
                """
                <video width="600" controls>
                    <source src="{}">
                </video>
                """,
                obj.media.url,
            )

        return format_html(
            '<a class="button" href="{}" target="_blank">Скачать файл</a>',
            obj.media.url,
        )

    media_preview_large.short_description = "Предпросмотр"    