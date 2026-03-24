import apiClient from './apiClient';

export const attendanceApi = {
  clockInOut: (action) =>
    apiClient.post('/attendance/employee/attendance', { action }),

  getMyAttendance: (params) =>
    apiClient.get('/attendance/my/attendance', { params }),

  hrList: (params) =>
    apiClient.get('/attendance/hr/attendance', { params }),

  hrCreate: (data) =>
    apiClient.post('/attendance/hr/attendance', data),

  hrUpdate: (id, data) =>
    apiClient.patch(`/attendance/hr/attendance/${id}`, data),

  hrSummary: (params) =>
    apiClient.get('/hr/attendance', { params }),
};
