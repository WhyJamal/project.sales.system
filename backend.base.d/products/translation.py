from modeltranslation.translator import register, TranslationOptions

from .models import Product, SoftwareVersion


@register(Product)
class ProductTranslationOptions(TranslationOptions):
    fields = (
        "title", "description", "badge", "tags",
        "hero_section", "features_section", "modules_section",
    )


@register(SoftwareVersion)
class SoftwareVersionTranslationOptions(TranslationOptions):
    fields = ("description",)