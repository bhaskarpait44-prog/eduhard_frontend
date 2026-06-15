import api from './axios';

export const getDashboardInsights = () => api.get('/ai-insights-module/dashboard/ai-insights');
export const getRiskStudents = () => api.get('/ai-insights-module/dashboard/ai-risk-students');
export const getExamInsights = (examId) => api.get(`/ai-insights-module/analytics/exams/${examId}/ai-insights`);
