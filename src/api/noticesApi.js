import api from './axios'

// Admin
export const adminListNotices = (params) => 
  api.get('/notices/admin', { params })
export const adminCreateNotice = (data) => 
  api.post('/notices/admin', data)
export const adminUpdateNotice = (id, data) => 
  api.patch(`/notices/admin/${id}`, data)
export const adminDeleteNotice = (id) => 
  api.delete(`/notices/admin/${id}`)

// Teacher
export const teacherListNotices = (params) => 
  api.get('/notices/teacher', { params })
export const teacherCreateNotice = (data) => 
  api.post('/notices/teacher', data)
export const teacherUpdateNotice = (id, data) => 
  api.patch(`/notices/teacher/${id}`, data)
export const teacherDeleteNotice = (id) => 
  api.delete(`/notices/teacher/${id}`)

// Accountant
export const accountantCreateNotice = (data) => 
  api.post('/notices/accountant', data)

// Student portal
export const getStudentNotices = (params) => 
  api.get('/notices/student', { params })
export const markNoticeRead = (id) => 
  api.post(`/notices/student/${id}/read`)
export const pinNotice = (id) => 
  api.post(`/notices/student/${id}/pin`)
export const unpinNotice = (id) => 
  api.delete(`/notices/student/${id}/pin`)

// Shared
export const getNoticeById = (id) => 
  api.get(`/notices/${id}`)
