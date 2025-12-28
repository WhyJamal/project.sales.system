import { DropdownKeys } from "../navbar.types";

const menus: { key: DropdownKeys; label: string; url?: string }[] = [
    { key: "products", label: "Продукты", url: "/products" },
    { key: "industries", label: "Промышленности" },
    { key: "plans", label: "Тарифы", url: "/plans" },
    { key: "trainings", label: "Тренинги" },
    { key: "community", label: "Сообщество" },
    { key: "partners", label: "Партнеры" },
    { key: "about", label: "О Нас" },
];

export default menus;

