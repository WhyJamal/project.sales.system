import axiosInstance from './axiosInstance';

export const getUsers = () => {
  return axiosInstance.get('/users/');
};

export const getUserProfile = (id: number) => {
  return axiosInstance.get(`/users/${id}/`);
};
