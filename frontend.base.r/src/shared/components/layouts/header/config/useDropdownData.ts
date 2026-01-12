import { DropdownKeys, DropdownItem } from "../navbar.types";
import { useProductStore } from "@/shared/stores/productsStore";

export interface DropdownSection {
  title: string;
  items: DropdownItem[];
}

const useDropdownData = (): Record<DropdownKeys, DropdownSection[]> => {
  const { products } = useProductStore();

  const industriesSection: DropdownSection[] = products.length
    ? [
        {
          title: "Отрасли",
          items: products.map((product) => ({
            label: product.title,
            url: `/product/${product.id}`,
            productId: product.id,
          })),
        },
      ]
    : [];

  return {
    products: [],
    industries: industriesSection,
    plans: [],
    trainings: [{ title: "Trainings", items: [{ label: "Обучение", url: "#" }] }],
    community: [{ title: "Community", items: [{ label: "Форумы", url: "#" }] }],
    partners: [{ title: "Partners", items: [{ label: "Наши партнёры", url: "#" }] }],
    about: [{ title: "О компании", items: [{ label: "Миссия", url: "#" }] }],
  };
};

export default useDropdownData;
