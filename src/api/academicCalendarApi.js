import api from './axios'

export const listEvents      = (params)    => api.get('/academic-calendar', { params })
export const downloadCalendarPdf = (params) => api.get('/academic-calendar/download', { params, responseType: 'blob' })
export const createEvent     = (data)      => api.post('/academic-calendar', data)
export const updateEvent     = (id, data)  => api.patch(`/academic-calendar/${id}`, data)
export const deleteEvent     = (id)        => api.delete(`/academic-calendar/${id}`)
export const togglePublish   = (id)        => api.patch(`/academic-calendar/${id}/publish`)

// Student portal calendar
export const listStudentEvents = (params)  => api.get('/student/calendar', { params })
