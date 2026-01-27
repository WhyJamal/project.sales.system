import axiosInstance from "@shared/services/axiosInstance";

export const createOrganization = (payload: any) =>
  axiosInstance.post("/organizations/", payload);

export const addProductsToOrganization = (orgId: number, productIds: number[]) =>
  axiosInstance.post(`/organizations/${orgId}/add_products/`, { products: productIds });

export const getProducts = () =>
  axiosInstance.get("/products/");

export const getCurrentUser = () =>
  axiosInstance.get("/users/me/");
