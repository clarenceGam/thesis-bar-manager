import apiClient from './apiClient';

export const authApi = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  getMe: () =>
    apiClient.get('/auth/me'),

  getPermissions: () =>
    apiClient.get('/auth/me/permissions'),

  registerBarOwner: (formData) =>
    apiClient.post('/auth/register-bar-owner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
