export interface DropdownItem {
    label: string;
    url: string;
}

export interface DropdownSection {
    title: string;
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


// export interface Region {
//     code: string;
//     name: string;
//     countries: string[];
// }
