import api from './axios'

const getExamAnalytics = (examId) => api.get('/analytics/exams/' + examId)
