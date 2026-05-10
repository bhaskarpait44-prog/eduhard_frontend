// src/api/transportApi.js
import api from './axios'

export const getRoutes = () => api.get('/transport/routes')
export const createRoute = (data) => api.post('/transport/routes', data)
export const updateRoute = (id, data) => api.patch(`/transport/routes/${id}`, data)
export const deleteRoute = (id) => api.delete(`/transport/routes/${id}`)

export const createStop = (routeId, data) => api.post(`/transport/routes/${routeId}/stops`, data)
export const updateStop = (id, data) => api.patch(`/transport/stops/${id}`, data)
export const deleteStop = (id) => api.delete(`/transport/stops/${id}`)

export const assignStudent = (data) => api.post('/transport/assign', data)
