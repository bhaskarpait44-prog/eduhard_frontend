import api from './axios'

export const getStreams = () => api.get('/streams')
export const createStream = (data) => api.post('/streams', data)
export const deleteStream = (id) => api.delete(`/streams/${id}`)
