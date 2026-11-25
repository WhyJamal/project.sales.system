from modeltranslation.translator import register, TranslationOptions

from .models import PlanFeature, SubscriptionPlan


# `SubscriptionPlan.name` is deliberately NOT translated: it is passed to 1C as the plan name
# (initialize_1c_database) and must not depend on the language of the current request.
@register(SubscriptionPlan)
class SubscriptionPlanTranslationOptions(TranslationOptions):
    fields = ("description", "features")


@register(PlanFeature)
class PlanFeatureTranslationOptions(TranslationOptions):
    fields = ("category", "name")
