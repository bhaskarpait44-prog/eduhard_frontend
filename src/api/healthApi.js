// src/api/healthApi.js
import api from './axios'

export const getHealthProfile = (studentId) => api.get(`/health/${studentId}`)
export const updateHealthProfile = (studentId, data) => api.patch(`/health/${studentId}`, data)
export const addVaccination = (studentId, data) => api.post(`/health/${studentId}/vaccinations`, data)
export const deleteVaccination = (id) => api.delete(`/health/vaccinations/${id}`)
export const addIncident = (studentId, data) => api.post(`/health/${studentId}/incidents`, data)
export const deleteIncident = (id) => api.delete(`/health/incidents/${id}`)
