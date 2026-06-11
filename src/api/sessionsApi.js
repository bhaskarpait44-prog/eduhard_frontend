// src/api/sessions.js
import api from './axios'

export const getSessions       = (params) => api.get('/sessions', { params })
export const getCurrentSession = ()       => api.get('/sessions/current')
export const getSession        = (id)     => api.get(`/sessions/${id}`)
export const createSession     = (data)   => api.post('/sessions', data)
export const updateSession     = (id, data) => api.patch(`/sessions/${id}`, data)
export const activateSession   = (id)     => api.patch(`/sessions/${id}/activate`)
export const lockSession       = (id)     => api.patch(`/sessions/${id}/lock`)
export const unlockSession     = (id)     => api.patch(`/sessions/${id}/unlock`)
export const archiveSession    = (id)     => api.patch(`/sessions/${id}/archive`)
export const getSessionStats   = (id)     => api.get(`/sessions/${id}/stats`)
export const updateWorkingDays = (id, data) => api.patch(`/sessions/${id}/working-days`, { working_days: data })
export const getHolidays       = (id)     => api.get(`/sessions/${id}/holidays`)
export const addHoliday        = (id, data) => api.post(`/sessions/${id}/holidays`, data)
export const removeHoliday     = (id, holidayId) => api.delete(`/sessions/${id}/holidays/${holidayId}`)
export const deleteSession     = (id)     => api.delete(`/sessions/${id}`)