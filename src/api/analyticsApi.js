import api from './axios'

export const getExamAnalytics = (examId) => api.get('/analytics/exams/' + examId)
