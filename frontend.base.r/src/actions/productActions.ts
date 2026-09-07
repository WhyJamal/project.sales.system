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

export const fetchProductUsers = async (id: number) => {
  try {
    const response = await axiosInstance.get(`organizations/product/add/${id}/users/`);
    return response.data;
  } catch (error) {
    console.error("Fetch product users failed:", error);
    throw error;
  }
};

export const toggle1CUser = async (id: number, userId: string, statusVal: boolean) => {
  try {
    const response = await axiosInstance.post(
      `organizations/product/add/${id}/users/toggle/`,
      { id: userId, status: statusVal }
    );
    return response.data;
  } catch (error) {
    console.error("Toggle 1C user failed:", error);
    throw error;
  }
};

export const fetchProductSettingsInfo = async (id: number) => {
  try {
    const response = await axiosInstance.get(`organizations/product/add/${id}/settings-info/`);
    return response.data;
  } catch (error) {
    console.error("Fetch product settings info failed:", error);
    throw error;
  }
};

export const applyProductSettings = async (
  id: number,
  data: { plan_id?: number; user_count?: number }
) => {
  try {
    const response = await axiosInstance.post(
      `organizations/product/add/${id}/settings-apply/`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Apply product settings failed:", error);
    throw error;
  }
};