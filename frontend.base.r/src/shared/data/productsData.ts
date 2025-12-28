export interface Product {
    id: number;
    title: string;
    description: string;
    icon: string;
}

export const products: Product[] = [
    {
        id: 1,
        title: "Стандартная бухгалтерия 1С",
        description:
            "Автоматизация розничных магазинов и сетей. Подключение оборудования и штрихкодов.",
        icon: "/images/1c.png",
    },
    {
        id: 2,
        title: "Стандартная бухгалтерия 1C (МСФО)",
        description: "Комплексная автоматизация компаний и ИП: продажи, услуги, CRM.",
        icon: "/images/1c.png",
    },
    {
        id: 3,
        title: "Стабильная ERP",
        description: "Бухгалтерский учет, ЭСФ, отчетность, налоги (ЕНП, НДС).",
        icon: "/images/1c.png",
    },
];