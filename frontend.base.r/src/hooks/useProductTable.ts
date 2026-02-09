import { useState, useEffect } from "react";
import { useUserStore } from "@/shared/stores/userStore";
import { formatDate } from "@shared/utils/formatDate";
import { OrganizationProduct } from "@/types";
import { toggleProductChosen, updateProduct } from "@/actions/productActions";
import { useDragDrop } from "./useDragDrop";

interface RowModel {
  id: number;
  title: string;
  product_url: string;
  product_name: string;
  plan_name: string;
  subscription_end_date: string;
  chosen?: boolean;
}

export const useProductTable = (products?: OrganizationProduct[]) => {
  const user = useUserStore((state) => state.user);
  const { profile } = useUserStore();
  const [isLoading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("inbox");

  const dragDrop = useDragDrop<RowModel>([]);

  const handleToggleChosen = async (id: number) => {
    try {
      const response = await toggleProductChosen(id);
      
      dragDrop.setItems(prevItems => 
        prevItems.map(item => 
          item.id === id ? { ...item, chosen: response.chosen } : item
        )
      );
      
      await profile();

      return response;
    } catch (error) {
      console.error("Toggle chosen failed:", error);
      throw error;
    }
  };  
  
  const handleUpdateProduct = async (id: number, changes: Partial<RowModel>) => {
    const prevItems = dragDrop.items;
    dragDrop.setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...changes } : it))
    );

    try {
      const response = await updateProduct(id, changes);
      const updatedName =
        response && typeof response === "object" && "title" in response
          ? (response as any).title
          : (changes.title ?? undefined);

      if (updatedName !== undefined) {
        dragDrop.setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, title: updatedName } : it))
        );
      }

      await profile();

      return response;
    } catch (error) {
      console.error("Update product failed:", error);
      // revert optimistic changes on fail
      dragDrop.setItems(prevItems);
      throw error;
    }
  };

  useEffect(() => {
    const loadProducts = () => {
      const productsToUse = Array.isArray(products) && products.length > 0
        ? products
        : user?.organization?.products || [];

      if (productsToUse.length > 0) {
        const formattedProducts = productsToUse.map((product) => ({
          id: product.id,
          title: product.title,
          product_url: product.product_url,
          product_name: product.product_name,
          plan_name: product.subscription?.plan_name ?? "—",
          subscription_end_date: product.subscription_end_date
            ? formatDate(product.subscription_end_date)
            : "—",
          chosen: product.chosen || false,
        }));
        dragDrop.setItems(formattedProducts);
      } else {
        dragDrop.setItems([]);
      }
    };

    loadProducts();
  }, [products, user]);

  const refreshTable = async () => {
    try {
      setLoading(true);
      await profile();
    } catch (error) {
      console.error("Error refreshing the table:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return {
    rows: dragDrop.items,
    isLoading,
    activeTab,
    setActiveTab,
    refreshTable,
    handleUpdateProduct,
    handleToggleChosen,
    dragDrop
  };
};