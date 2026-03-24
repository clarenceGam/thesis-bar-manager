import apiClient from './apiClient';

export const leaveApi = {
  apply: (data) =>
    apiClient.post('/api/leaves', data),

  myLeaves: () =>
    apiClient.get('/api/leaves/my'),

  list: (params) =>
    apiClient.get('/api/leaves', { params }),

  decide: (id, action) =>
    apiClient.patch(`/api/leaves/${id}/decision`, { action }),
};
