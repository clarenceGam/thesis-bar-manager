import apiClient from './apiClient';

export const payrollApi = {
  preview: (params) =>
    apiClient.get('/hr/payroll/payroll', { params }),

  createRun: (data) =>
    apiClient.post('/hr/payroll/run', data),

  listRuns: () =>
    apiClient.get('/hr/payroll/runs'),

  generateItems: (runId) =>
    apiClient.post(`/hr/payroll/runs/${runId}/generate`),

  getRunDetails: (runId) =>
    apiClient.get(`/hr/payroll/runs/${runId}/items`),

  finalizeRun: (runId) =>
    apiClient.patch(`/hr/payroll/runs/${runId}/finalize`),

  cancelRun: (runId) =>
    apiClient.delete(`/hr/payroll/runs/${runId}`),

  myPayroll: () =>
    apiClient.get('/hr/payroll/my-payroll'),
};
