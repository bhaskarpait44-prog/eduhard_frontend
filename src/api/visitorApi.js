import api from './axios'

export const getTodayStats = () => api.get('/visitors/stats')
export const listVisitors = (params) => api.get('/visitors', { params })
export const logVisitor = (data) => api.post('/visitors', data)
export const checkoutVisitor = (id) => api.patch(`/visitors/${id}/checkout`)
