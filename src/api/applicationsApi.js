// src/api/applicationsApi.js
import api from './axios'

export const getApplications = (params) => api.get('/applications', { params })
const getApplicationById = (id) => api.get(`/applications/${id}`)
export const updateApplicationStatus = (id, data) => api.patch(`/applications/${id}/status`, data)
