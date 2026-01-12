import { create } from "zustand";
import axiosInstance from "@/shared/services/axiosInstance";
import { Product } from "@/types/product";

interface ProductStore {
  products: Product[];
  loading: boolean;
  loadProducts: () => Promise<void>;
  getProductById: (id: number) => Product | undefined;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  loading: false,
  loadProducts: async () => {
    if (get().products.length > 0) return;
    set({ loading: true });
    try {
      const res = await axiosInstance.get("/products/");
      set({ products: res.data });
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },
  getProductById: (id: number) =>
    get().products.find((p) => p.id === id),
}));
