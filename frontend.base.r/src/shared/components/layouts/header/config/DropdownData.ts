
import { DropdownKeys, DropdownItem } from "../navbar.types";

export interface DropdownSection {
    title: string;
    items: DropdownItem[];
}

const dropdownData: Record<DropdownKeys, DropdownSection[]> = {
    products: [],
    industries: [
        {
            title: "Отрасли",
            items: [
                { label: "Стандартная бухгалтерия 1С", url: "product" },
                { label: "Стандартная бухгалтерия 1C (МСФО)", url: "#" },
                { label: "Стабильная ERP", url: "#" },
            ],
            // {
            //   title: "Бизнес-приложения",
            //   items: [
            //     { label: "Управление финансами", url: "#" },
            //     { label: "Управление расходами", url: "#" },
            //     { label: "Управление цепочкой поставок", url: "#" },
            //     { label: "Управление человеческим капиталом", url: "#" },
            //     { label: "Клиентский опыт", url: "#" },
            //     { label: "Облачная ERP-система", url: "#" },
            //   ],
            // },
            // {
            //   title: "Другие предложения APSoft",
            //   items: [
            //     { label: "Управление устойчивым развитием", url: "#" },
            //     { label: "APSoft Business Network", url: "#" },
            //   ],
            // },                
        },
    ],
    plans: [],
    trainings: [{ title: "Trainings", items: [{ label: "Обучение", url: "#" }] }],
    community: [{ title: "Community", items: [{ label: "Форумы", url: "#" }] }],
    partners: [{ title: "Partners", items: [{ label: "Наши партнёры", url: "#" }] }],
    about: [{ title: "О компании", items: [{ label: "Миссия", url: "#" }] }],
};

export default dropdownData;
