from django.core.management.base import BaseCommand
from products.models import Product

PRODUCTS_DATA = [
    {
        "name": "standart-1c",
        "title": "Стандартная бухгалтерия 1С",
        "description": "Автоматизация розничных магазинов и сетей. Подключение оборудования и штрихкодов.",
        "icon": "images/1c.png",  
        "badge": "New",
        "tags": ["accounting", "ERP"],
        "hero_section": {
            "title": "Стандартная бухгалтерия 1С",
            "description": "Автоматизация бухгалтерского и складского учета для розничных магазинов и торговых сетей.",
            "gradient": "from-green-100 via-green-50 to-yellow-50",
            "photo": "images/accounting.jpg"
        },
        "features_section": {
            "title": "Инновации для розничного бизнеса",
            "bullets": [
                "Полный учет товаров и остатков в реальном времени",
                "Поддержка штрихкодов и торгового оборудования",
                "Автоматизация кассовых операций",
                "Контроль закупок и продаж",
                "Уменьшение потерь и ошибок учета"
            ],
            "videoId": "https://youtu.be/1"
        },
        "modules_section": {
            "title": "ERP-решения для бухгалтерии и торговли",
            "tabs": [
                {"id": "erp", "label": "ERP-система"},
                {"id": "warehouse", "label": "Склад"},
                {"id": "reports", "label": "Отчетность"},
                {"id": "integration", "label": "Интеграции"}
            ]
        }
    },
    {
        "name": "standart-IFRS",
        "title": "Стандартная бухгалтерия 1C (МСФО)",
        "description": "Комплексная автоматизация компаний и ИП: продажи, услуги, CRM.",
        "icon": "images/1c.png",
        "badge": "Popular",
        "tags": ["finance", "IFRS"],
        "hero_section": {
            "title": "1C Бухгалтерия (МСФО)",
            "description": "Комплексное решение для ведения бухгалтерского и финансового учета по международным стандартам (IFRS).",
            "gradient": "from-blue-100 via-blue-50 to-indigo-50",
            "photo": "images/IFRS.webp"
        },
        "features_section": {
            "title": "Финансовая прозрачность и контроль",
            "bullets": [
                "Поддержка отчетности по стандартам МСФО",
                "Консолидация данных из разных подразделений",
                "Финансовая аналитика и прогнозирование",
                "Сравнительный анализ показателей",
                "Соответствие требованиям международных аудиторов"
            ],
            "videoId": "https://youtu.be/1"
        },
        "modules_section": {
            "title": "ERP для финансов и МСФО",
            "tabs": [
                {"id": "finance", "label": "Финансы"},
                {"id": "ifrs", "label": "МСФО учет"},
                {"id": "analytics", "label": "Аналитика"},
                {"id": "reporting", "label": "Отчетность"}
            ]
        }
    },
    {
        "name": "stable-ERP",
        "title": "Стабильная ERP",
        "description": "Бухгалтерский учет, ЭСФ, отчетность, налоги (ЕНП, НДС).",
        "icon": "images/1c.png",
        "badge": None,
        "tags": ["ERP", "enterprise"],
        "hero_section": {
            "title": "Стабильная ERP-платформа",
            "description": "Надежная и масштабируемая ERP-система для среднего и крупного бизнеса. Полный контроль процессов и ресурсов.",
            "gradient": "from-purple-100 via-purple-50 to-pink-50",
            "photo": "images/work-with-team.jpg"
        },
        "features_section": {
            "title": "Рост и масштабирование бизнеса",
            "bullets": [
                "Управление производственными процессами",
                "Оптимизация логистики и цепочек поставок",
                "Планирование ресурсов предприятия (MRP)",
                "Управление персоналом и KPI",
                "Интеллектуальная аналитика и BI-отчеты"
            ],
            "videoId": "https://youtu.be/1"
        },
        "modules_section": {
            "title": "Корпоративная ERP для бизнеса",
            "tabs": [
                {"id": "core", "label": "Основные модули"},
                {"id": "production", "label": "Производство"},
                {"id": "logistics", "label": "Логистика"},
                {"id": "hr", "label": "HR"},
                {"id": "bi", "label": "BI и аналитика"}
            ]
        }
    }
]

class Command(BaseCommand):
    help = 'Populate Products table with initial data'

    def handle(self, *args, **kwargs):
        for data in PRODUCTS_DATA:
            product, created = Product.objects.get_or_create(
                name=data["name"],
                defaults={
                    "title": data["title"],
                    "description": data.get("description", ""),
                    "badge": data.get("badge"),
                    "tags": data.get("tags"),
                    "hero_section": data.get("hero_section"),
                    "features_section": data.get("features_section"),
                    "modules_section": data.get("modules_section"),
                    "icon": data.get("icon")  
                }
            )
            product.save()
            self.stdout.write(self.style.SUCCESS(f'Product "{product.title}" saved.'))
