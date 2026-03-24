import apiClient from './apiClient';

export const dssApi = {
  getRecommendations: () =>
    apiClient.get('/owner/dss/recommendations', { silentError: true }),
};
