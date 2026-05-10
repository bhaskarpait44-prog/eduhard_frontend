// src/api/familyApi.js
import api from './axios'

export const getFamilies = () => api.get('/families')
export const createFamily = (data) => api.post('/families', data)
export const updateFamily = (id, data) => api.patch(`/families/${id}`, data)
export const deleteFamily = (id) => api.delete(`/families/${id}`)
export const getStudentFamily = (studentId) => api.get(`/families/student/${studentId}`)
