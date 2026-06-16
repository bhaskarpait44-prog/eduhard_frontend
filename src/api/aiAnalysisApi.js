import api from './axios';

export const getDashboardSummary = (sessionId) => 
  api.get('/ai-analysis/dashboard-summary', { params: { session_id: sessionId } });
