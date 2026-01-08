import axiosInstance from './axiosInstance';

export const registerUser = (data: any) => {
  return axiosInstance.post('/users/auth/register/', data);
};

export const loginUser = (data: any) => {
  return axiosInstance.post('/users/auth/login/', data);
};

export const googleAuth = (token: string) => {
  return axiosInstance.post("/users/auth/google/", {
    token,
  });
};