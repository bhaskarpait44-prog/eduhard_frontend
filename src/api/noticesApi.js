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
export const accountantListNotices = (params) => 
  api.get('/notices/accountant', { params })
export const getAccountantPortalNotices = (params) => 
  api.get('/notices/accountant-portal', { params })
export const markAccountantNoticeRead = (id, source = 'unified') => 
  api.post(`/notices/accountant-portal/${id}/read?source=${source}`)
export const accountantCreateNotice = (data) => 
  api.post('/notices/accountant', data)

// Receptionist
export const getReceptionistNotices = (params) => 
  api.get('/notices/receptionist', { params })
export const markReceptionistNoticeRead = (id, source = 'unified') => 
  api.post(`/notices/receptionist/${id}/read?source=${source}`)

// Student portal
export const getStudentNotices = (params) => 
  api.get('/notices/student', { params })
export const markNoticeRead = (id, source = 'unified') => 
  api.post(`/notices/student/${id}/read?source=${source}`)
export const pinNotice = (id, source = 'unified') => 
  api.post(`/notices/student/${id}/pin?source=${source}`)
export const unpinNotice = (id, source = 'unified') => 
  api.delete(`/notices/student/${id}/pin?source=${source}`)

// Parent portal
export const getParentNotices = (params) => 
  api.get('/notices/parent', { params })
export const markParentNoticeRead = (id, source = 'unified') => 
  api.post(`/notices/parent/${id}/read?source=${source}`)

// Librarian portal
export const getLibrarianNotices = (params) =>
  api.get('/notices/librarian', { params })
export const markLibrarianNoticeRead = (id, source = 'unified') =>
  api.post(`/notices/librarian/${id}/read?source=${source}`)

// Shared
export const getNoticeById = (id) => 
  api.get(`/notices/${id}`)
