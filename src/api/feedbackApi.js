// src/api/feedbackApi.js
import api from './axios'

export const getFeedback = (params) => api.get('/feedback', { params })
export const submitFeedback = (data) => api.post('/feedback', data)
export const replyFeedback = (id, data) => api.patch(`/feedback/${id}/reply`, data)
export const deleteFeedback = (id) => api.delete(`/feedback/${id}`)
