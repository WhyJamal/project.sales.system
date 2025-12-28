export interface Product {
    id: number;
    name: string;
    title: string;
    description: string;
    icon: string;
}

export const products: Product[] = [
    {
        id: 1,
        name: 'standart-1c',
        title: "Стандартная бухгалтерия 1С",
        description: "Автоматизация розничных магазинов и сетей. Подключение оборудования и штрихкодов.",
        icon: "/images/1c.png",
    },
    {
        id: 2,
        name: 'standart-IFRS',
        title: "Стандартная бухгалтерия 1C (МСФО)",
        description: "Комплексная автоматизация компаний и ИП: продажи, услуги, CRM.",
        icon: "/images/1c.png",
    },
    {
        id: 3,
        name: 'stable-ERP',
        title: "Стабильная ERP",
        description: "Бухгалтерский учет, ЭСФ, отчетность, налоги (ЕНП, НДС).",
        icon: "/images/1c.png",
    },
];