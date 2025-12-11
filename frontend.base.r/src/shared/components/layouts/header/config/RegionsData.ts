import { Region } from "../navbar.types";

const regionsData: Region[] = [
    {
        code: "americas",
        name: "Americas",
        countries: [
            "Argentina",
            "Bolivia",
            "Brasil",
            "Canada - English",
            "Canada - Français",
            "Chile",
            "Colombia",
            "Costa Rica",
            "Ecuador",
            "El Salvador",
            "Guatemala",
            "Honduras",
        ],
    },
    {
        code: "europe",
        name: "Europe",
        countries: ["France", "Germany", "Italy", "Spain", "United Kingdom"],
    },
    {
        code: "mea",
        name: "Middle East and Africa",
        countries: ["UAE", "Saudi Arabia", "South Africa", "Egypt"],
    },
    {
        code: "apac",
        name: "Asia Pacific",
        countries: ["China", "Japan", "South Korea", "Australia", "India"],
    },
];

export default regionsData;
