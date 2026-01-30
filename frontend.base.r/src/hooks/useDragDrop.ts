import { useState } from "react";
import { reorderProducts } from "@/actions/productActions";
import { useUserStore } from "@/shared/stores/userStore";

export const useDragDrop = <T extends { id: number }>(initialItems: T[]) => {
  const [items, setItems] = useState<T[]>(initialItems);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const { profile } = useUserStore();

  const reorder = (list: T[], start: number, end: number): T[] => {
    const result = [...list];
    const [removed] = result.splice(start, 1);
    result.splice(end, 0, removed);
    return result;
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) return;

    const oldItems = [...items];
    const newItems = reorder(items, dragIndex, dropIndex);
    setItems(newItems);
    setDragIndex(null);

    try {
      const itemsForBackend = newItems.map((item, i) => ({
        id: item.id,
        order: i,
      }));
      
      await reorderProducts(itemsForBackend);
      await profile();
    } catch (err) {
      console.error("Reorder failed:", err);
      setItems(oldItems); 
    }
  };

  return {
    items,
    setItems,
    dragIndex,
    handleDragStart,
    handleDragOver,
    handleDrop,
  };
};