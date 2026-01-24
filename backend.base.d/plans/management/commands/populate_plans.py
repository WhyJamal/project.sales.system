from datetime import timedelta
from django.core.management.base import BaseCommand
from plans.models import SubscriptionPlan, PlanFeature

class Command(BaseCommand):
    help = "Populates the database with default subscription plans and features"

    def handle(self, *args, **options):
        # --- Define plans ---
        plans_data = [
            {
                "code": "basic",
                "name": "Basic",
                "description": "Базовый набор для начала работы.",
                "price": 100000,
                "duration_days": 30,
                "highlight": False,
                "features": [
                    "Пользовательские домены",
                    "Быстрая доставка контента",
                    "Базовая аналитика",
                    "Онлайн-поддержка",
                ],
            },
            {
                "code": "standart",
                "name": "Standart",
                "description": "Оптимальный выбор для команд.",
                "price": 200000,
                "duration_days": 30,
                "highlight": True,  # highlight для среднего плана
                "features": [
                    "До 20 пользователей",
                    "Расширенная аналитика",
                    "Отчёты и экспорт",
                    "Приоритетная поддержка",
                ],
            },
            {
                "code": "professional",
                "name": "Professional",
                "description": "Решение для масштабных задач.",
                "price": 500000,
                "duration_days": 30,
                "highlight": False,
                "features": [
                    "Неограниченные пользователи",
                    "SSO и безопасность",
                    "Индивидуальные отчёты",
                    "Персональный менеджер",
                ],
            },
        ]

        # --- Create or update SubscriptionPlan ---
        for plan_data in plans_data:
            plan, created = SubscriptionPlan.objects.update_or_create(
                code=plan_data["code"],
                defaults={
                    "name": plan_data["name"],
                    "description": plan_data["description"],
                    "price": plan_data["price"],
                    "duration_days": plan_data["duration_days"],
                    "period": timedelta(days=plan_data["duration_days"]),
                    "highlight": plan_data["highlight"],
                    "features": plan_data["features"],
                    "is_active": True,
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Plan '{plan.name}' created."))
            else:
                self.stdout.write(self.style.WARNING(f"Plan '{plan.name}' updated."))

        # --- Define features ---
        features_data = [
            {"category": "", "name": "Доставка контента", "basic": True, "standart": True, "professional": True},
            {"category": "", "name": "Количество пользователей", "basic": None, "standart": None, "professional": None},  
            {"category": "", "name": "SSO", "basic": False, "standart": False, "professional": True},
            {"category": "Аналитика", "name": "Базовая аналитика", "basic": True, "standart": True, "professional": True},
            {"category": "", "name": "Расширенные отчёты", "basic": False, "standart": True, "professional": True},
            {"category": "Поддержка", "name": "Онлайн поддержка", "basic": True, "standart": True, "professional": True},
            {"category": "", "name": "Приоритетная поддержка", "basic": False, "standart": True, "professional": True},
        ]

        # --- Create or update PlanFeature ---
        for feature_data in features_data:
            feature, created = PlanFeature.objects.update_or_create(
                name=feature_data["name"],
                defaults={
                    "category": feature_data["category"],
                    "starter": feature_data.get("basic"),      
                    "growth": feature_data.get("standart"),
                    "scale": feature_data.get("professional"),
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Feature '{feature.name}' created."))
            else:
                self.stdout.write(self.style.WARNING(f"Feature '{feature.name}' updated."))

        self.stdout.write(self.style.SUCCESS("All plans and features have been populated successfully."))
