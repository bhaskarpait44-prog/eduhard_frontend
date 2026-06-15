import api from './axios';

export const getDashboardSummary = () => api.get('/ai-analysis/dashboard-summary');
