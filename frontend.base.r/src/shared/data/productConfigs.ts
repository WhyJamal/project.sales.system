import { ProductConfig, ProductKey } from '@/types/product';

export const productConfigs: Record<ProductKey, ProductConfig> = {
  'standart-1c' : {
    hero: {
      title: 'Стандартная бухгалтерия 1С',
      description:
        'Автоматизация бухгалтерского и складского учета для розничных магазинов и торговых сетей. Быстрое внедрение и простота использования.',
      gradient: 'from-green-100 via-green-50 to-yellow-50',
      photo: "/images/accounting.jpg"
    },
    innovation: {
      title: 'Инновации для розничного бизнеса',
      bullets: [
        'Полный учет товаров и остатков в реальном времени',
        'Поддержка штрихкодов и торгового оборудования',
        'Автоматизация кассовых операций',
        'Контроль закупок и продаж',
        'Уменьшение потерь и ошибок учета',
      ],
      videoId: 'https://youtu.be/1',
    },
    solutions: {
      title: 'ERP-решения для бухгалтерии и торговли',
      tabs: [
        { id: 'erp', label: 'ERP-система' },
        { id: 'warehouse', label: 'Склад' },
        { id: 'reports', label: 'Отчетность' },
        { id: 'integration', label: 'Интеграции' },
      ],
    },
  },

  'standart-IFRS' : {
    hero: {
      title: '1C Бухгалтерия (МСФО)',
      description:
        'Комплексное решение для ведения бухгалтерского и финансового учета по международным стандартам (IFRS).',
      gradient: 'from-blue-100 via-blue-50 to-indigo-50',
      photo: "/images/IFRS.webp"
    },
    innovation: {
      title: 'Финансовая прозрачность и контроль',
      bullets: [
        'Поддержка отчетности по стандартам МСФО',
        'Консолидация данных из разных подразделений',
        'Финансовая аналитика и прогнозирование',
        'Сравнительный анализ показателей',
        'Соответствие требованиям международных аудиторов',
      ],
      videoId: 'https://youtu.be/1',
    },
    solutions: {
      title: 'ERP для финансов и МСФО',
      tabs: [
        { id: 'finance', label: 'Финансы' },
        { id: 'ifrs', label: 'МСФО учет' },
        { id: 'analytics', label: 'Аналитика' },
        { id: 'reporting', label: 'Отчетность' },
      ],
    },
  },

  'stable-ERP': {
    hero: {
      title: 'Стабильная ERP-платформа',
      description:
        'Надежная и масштабируемая ERP-система для среднего и крупного бизнеса. Полный контроль процессов и ресурсов.',
      gradient: 'from-purple-100 via-purple-50 to-pink-50',
      // primaryBtn: 'Начать внедрение',
      secondaryBtn: 'Скоро',
      photo: "/images/work-with-team.jpg"
    },
    innovation: {
      title: 'Рост и масштабирование бизнеса',
      bullets: [
        'Управление производственными процессами',
        'Оптимизация логистики и цепочек поставок',
        'Планирование ресурсов предприятия (MRP)',
        'Управление персоналом и KPI',
        'Интеллектуальная аналитика и BI-отчеты',
      ],
      videoId: 'https://youtu.be/1',
    },
    solutions: {
      title: 'Корпоративная ERP для бизнеса',
      tabs: [
        { id: 'core', label: 'Основные модули' },
        { id: 'production', label: 'Производство' },
        { id: 'logistics', label: 'Логистика' },
        { id: 'hr', label: 'HR' },
        { id: 'bi', label: 'BI и аналитика' },
      ],
    },
  },
};
