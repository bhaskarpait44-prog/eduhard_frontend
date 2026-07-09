import api from './axios';

export const getDashboardInsights = (sessionId) => 
  api.get('/ai-insights-module/dashboard/ai-insights', { params: { session_id: sessionId } });

export const getRiskStudents = (page = 1, limit = 50, sessionId) => 
  api.get(`/ai-insights-module/dashboard/ai-risk-students`, { 
    params: { page, limit, session_id: sessionId } 
  });
const getExamInsights = (examId) => api.get(`/ai-insights-module/analytics/exams/${examId}/ai-insights`);
