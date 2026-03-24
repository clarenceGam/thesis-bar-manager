import apiClient from './apiClient';

export const barApi = {
  getDetails: () =>
    apiClient.get('/owner/bar/details'),

  updateDetails: (data) =>
    apiClient.patch('/owner/bar/details', data),

  uploadImage: (formData) =>
    apiClient.post('/owner/bar/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  uploadIcon: (formData) =>
    apiClient.post('/owner/bar/icon', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  uploadVideo: (formData) =>
    apiClient.post('/owner/bar/gif', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  deleteBar: (bar_id) =>
    apiClient.post('/owner/bar/delete', { bar_id }),

  toggleStatus: (bar_id, status) =>
    apiClient.post('/owner/bar/toggle-status', { bar_id, status }),

  updateSettings: (data) =>
    apiClient.patch('/owner/bar/settings', data),

  getDashboardSummary: (config) =>
    apiClient.get('/owner/bar/dashboard/summary', config),

  getCustomerInsights: () =>
    apiClient.get('/owner/bar/customer-insights', { silentError: true }),

  getStaffPerformance: () =>
    apiClient.get('/owner/bar/staff-performance', { silentError: true }),

  getFollowers: () =>
    apiClient.get('/owner/bar/followers', { silentError: true }),

  getPosts: () =>
    apiClient.get('/owner/bar/posts', { silentError: true }),

  getComments: (params) =>
    apiClient.get('/owner/bar/comments', { params, silentError: true }),

  createPost: (data, imageFile) => {
    const fd = new FormData();
    fd.append('content', data.content || '');
    if (imageFile) fd.append('image', imageFile);
    return apiClient.post('/social/bar-posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  deletePost: (postId) =>
    apiClient.delete(`/owner/bar/posts/${postId}`),

  deleteComment: (type, commentId) =>
    apiClient.delete(`/owner/bar/comments/${type}/${commentId}`),
};
