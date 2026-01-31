export interface DropdownItem {
    label?: string;
    url: string;
    labelKey?: string;
}

export interface DropdownSection {
    title?: string;      
    titleKey?: string;
    items: DropdownItem[];
}

export type MobileStep = "menu" | "sections" | "items";

export type DropdownKeys =
    | "products"
    | "industries"
    | "plans"
    | "trainings"
    | "community"
    | "partners"
    | "about";

