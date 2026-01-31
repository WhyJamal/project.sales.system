import { DropdownKeys, DropdownItem } from "../navbar.types";
import { useProductStore } from "@/shared/stores/productsStore";

/**
 * NOTE:
 * - dropdown sections use titleKey (i18n key) for translation.
 * - items may have `labelKey` (static, translatable) OR `label` (dynamic, from backend).
 */

export interface DropdownSection {
  titleKey: string;
  items: DropdownItem[]; // DropdownItem: { label?:string; url:string; labelKey?:string; productId?:number }
}

export interface NavbarMenu {
  key: DropdownKeys;
  labelKey: string; 
  url?: string;
  dropdown?: DropdownSection[];
}

/**
 * Hook-like factory: returns the menu config (reads products from store).
 * Use it in components like: const menus = useNavbarConfig();
 */
export const useNavbarConfig = (): NavbarMenu[] => {
  const { products } = useProductStore();

  return [
    {
      key: "products",
      labelKey: "menu.products",
      url: "/products",
    },

    {
      key: "industries",
      labelKey: "menu.industries",
      dropdown:
        products.length > 0
          ? [
              {
                titleKey: "sections.industries",
                items: products.map((product) => ({
                  // product.title is dynamic from backend — do NOT translate here
                  label: product.title,
                  url: `/product/${product.id}`,
                  productId: product.id,
                })),
              },
            ]
          : [], // empty if no products
    },

    {
      key: "plans",
      labelKey: "menu.plans",
      url: "/plans",
    },

    {
      key: "trainings",
      labelKey: "menu.trainings",
      dropdown: [
        {
          titleKey: "sections.trainings",
          items: [{ labelKey: "items.training", url: "#" }],
        },
      ],
    },

    {
      key: "community",
      labelKey: "menu.community",
      dropdown: [
        {
          titleKey: "sections.community",
          items: [{ labelKey: "items.forums", url: "#" }],
        },
      ],
    },

    {
      key: "partners",
      labelKey: "menu.partners",
      dropdown: [
        {
          titleKey: "sections.partners",
          items: [{ labelKey: "items.partners", url: "#" }],
        },
      ],
    },

    {
      key: "about",
      labelKey: "menu.about",
      dropdown: [
        {
          titleKey: "sections.about",
          items: [{ labelKey: "items.mission", url: "#" }],
        },
      ],
    },
  ];
};

export default useNavbarConfig;
