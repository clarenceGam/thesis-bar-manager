import apiClient from './apiClient';

export const reservationApi = {
  list: (params) =>
    apiClient.get('/owner/reservations', { params }),

  approve: (id) =>
    apiClient.patch(`/owner/reservations/${id}/status`, { action: 'approve' }),

  reject: (id) =>
    apiClient.patch(`/owner/reservations/${id}/status`, { action: 'reject' }),

  cancel: (id) =>
    apiClient.patch(`/owner/reservations/${id}/status`, { action: 'cancel' }),

  lookup: (txn) =>
    apiClient.get(`/reservations/lookup/${encodeURIComponent(txn)}`),
};
