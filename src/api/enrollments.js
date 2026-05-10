// src/api/enrollments.js
import api from './axios'

export const getEnrollment  = (id)   => api.get(`/enrollments/${id}`)
export const createEnrollment= (data)=> api.post('/enrollments', data)
export const promoteStudents= (data) => api.post('/enrollments/promote', data)
export const getPromotionCandidates = (params) => api.get('/enrollments/promotion/candidates', { params })
export const downloadPromotionSummaryPdf = (params) => api.get('/enrollments/promotion/summary/download', { params, responseType: 'blob' })
export const processPromotions = (data) => api.post('/enrollments/promotion/process', data)
export const transferStudent= (data) => api.post('/enrollments/transfer', data)
