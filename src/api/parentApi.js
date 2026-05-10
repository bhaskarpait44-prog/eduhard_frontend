// src/api/parentApi.js
import api from './axios'

export const getWards = () => api.get('/parent/wards')
export const getWardAttendance = (studentId) => api.get(`/parent/wards/${studentId}/attendance`)
export const getWardFees = (studentId) => api.get(`/parent/wards/${studentId}/fees`)
export const getWardResults = (studentId) => api.get(`/parent/wards/${studentId}/results`)
export const getWardHomework = (studentId) => api.get(`/parent/wards/${studentId}/homework`)
