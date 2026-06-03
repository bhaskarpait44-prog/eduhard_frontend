import api from './axios';

export const getComplianceReport = (sessionId) =>
  api.get('/compliance/report', { params: { session_id: sessionId } });
