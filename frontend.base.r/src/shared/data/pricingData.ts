export interface Plan {
    title: string;
    description: string;
    price: string;
    highlight?: boolean;
    features: string[];
  }
  
  export interface Feature {
    category: string;
    name: string;
    starter: boolean | string;
    growth: boolean | string;
    scale: boolean | string;
  }
  
  export const plans: Plan[] = [
    {
      title: "Старт",
      description: "Базовый набор для начала работы.",
      price: "100 000 USZ",
      features: [
        "Пользовательские домены",
        "Быстрая доставка контента",
        "Базовая аналитика",
        "Онлайн-поддержка",
      ],
    },
    {
      title: "Бизнес",
      description: "Оптимальный выбор для команд.",
      price: "200 000 UZS",
      highlight: true,
      features: [
        "До 20 пользователей",
        "Расширенная аналитика",
        "Отчёты и экспорт",
        "Приоритетная поддержка",
      ],
    },
    {
      title: "Корпоративный",
      description: "Решение для масштабных задач.",
      price: "500 000 USZ",
      highlight: true,
      features: [
        "Неограниченные пользователи",
        "SSO и безопасность",
        "Индивидуальные отчёты",
        "Персональный менеджер",
      ],
    },
  ];
  
  export const features: Feature[] = [
    {
      category: "",
      name: "Доставка контента",
      starter: true,
      growth: true,
      scale: true,
    },
    {
      category: "",
      name: "Количество пользователей",
      starter: "3",
      growth: "20",
      scale: "∞",
    },
    { category: "", name: "SSO", starter: false, growth: false, scale: true },
    {
      category: "Аналитика",
      name: "Базовая аналитика",
      starter: true,
      growth: true,
      scale: true,
    },
    {
      category: "",
      name: "Расширенные отчёты",
      starter: false,
      growth: true,
      scale: true,
    },
    {
      category: "Поддержка",
      name: "Онлайн поддержка",
      starter: true,
      growth: true,
      scale: true,
    },
    {
      category: "",
      name: "Приоритетная поддержка",
      starter: false,
      growth: true,
      scale: true,
    },
  ];