export interface Product {
    id: number;
    title: string;
    description: string;
    icon: string;
}

export const products: Product[] = [
    {
        id: 1,
        title: "Розница для Узбекистана, ред. 3.0",
        description:
            "Автоматизация розничных магазинов и сетей. Подключение оборудования и штрихкодов.",
        icon: "/images/1c.png",
    },
    {
        id: 2,
        title: "Управление компанией для Узбекистана, ред. 3.0",
        description:
            "Комплексная автоматизация компаний и ИП: продажи, услуги, CRM.",
        icon: "/images/1c.png",
    },
    {
        id: 3,
        title: "1С:Бухгалтерия для Узбекистана, ред. 3.0",
        description:
            "Бухгалтерский учет, ЭСФ, отчетность, налоги (ЕНП, НДС).",
        icon: "/images/1c.png",
    },
];