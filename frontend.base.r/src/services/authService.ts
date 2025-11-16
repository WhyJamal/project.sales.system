import axiosInstance from './axiosInstance';

export const registerUser = (data: any) => {
  return axiosInstance.post('/users/auth/register/', data);
};

export const loginUser = (data: any) => {
  return axiosInstance.post('/users/auth/login/', data);
};
