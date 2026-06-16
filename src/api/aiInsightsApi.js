import api from './axios';

export const getDashboardInsights = () => api.get('/ai-insights-module/dashboard/ai-insights');
export const getRiskStudents = (page = 1, limit = 50) => 
  api.get(`/ai-insights-module/dashboard/ai-risk-students?page=${page}&limit=${limit}`);
export const getExamInsights = (examId) => api.get(`/ai-insights-module/analytics/exams/${examId}/ai-insights`);
