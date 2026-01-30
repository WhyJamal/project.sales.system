import axiosInstance from "@shared/services/axiosInstance";

export const reorderProducts = async (items: { id: number; order: number }[]) => {
  try {
    const response = await axiosInstance.post("organizations/product/add/reorder/", { items });
    return response.data;
  } catch (error) {
    console.error("Reorder failed:", error);
    throw error;
  }
};

export const toggleProductChosen = async (id: number) => {
  try {
    const response = await axiosInstance.post(`organizations/product/add/${id}/toggle-chosen/`);
    return response.data;
  } catch (error) {
    console.error("Toggle chosen failed:", error);
    throw error;
  }
};

export const fetchProducts = async () => {
  try {
    const response = await axiosInstance.get("organizations/product/add/");
    return response.data;
  } catch (error) {
    console.error("Fetch products failed:", error);
    throw error;
  }
};

export const deleteProduct = async (id: number) => {
  try {
    const response = await axiosInstance.delete(`organizations/product/add/${id}/`);
    return response.data;
  } catch (error) {
    console.error("Delete product failed:", error);
    throw error;
  }
};

export const updateProduct = async (id: number, data: any) => {
  try {
    const response = await axiosInstance.put(`organizations/product/add/${id}/`, { ...data, title: data.title });
    return response.data;
  } catch (error) {
    console.error("Update product failed:", error);
    throw error;
  }
};