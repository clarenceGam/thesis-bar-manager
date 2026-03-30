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

  checkIn: (id) =>
    apiClient.patch(`/owner/reservations/${id}/status`, { action: 'check_in' }),

  complete: (id) =>
    apiClient.patch(`/owner/reservations/${id}/status`, { action: 'complete' }),

  lookup: (txn) =>
    apiClient.get(`/reservations/lookup/${encodeURIComponent(txn)}`),
};
