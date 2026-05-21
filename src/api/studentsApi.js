// src/api/students.js
import api from './axios'

export const getStudents    = (params)     => api.get('/students', { params })
export const getStudent     = (id)         => api.get(`/students/${id}`)
export const createStudent  = (data)       => api.post('/students', data)
export const deleteStudent  = (id, data)   => api.delete(`/students/${id}`, { data })
export const updateIdentity = (id, data)   => api.patch(`/students/${id}/identity`, data)
export const updateProfile  = (id, data) => api.patch(`/students/${id}/profile`, data)
export const toggleStudentStatus = (id) => api.patch(`/students/${id}/toggle-status`)
export const resetPassword  = (id, data)   => api.post(`/students/${id}/reset-password`, data)
export const resetParentPassword = (id, data) => api.post(`/students/${id}/reset-parent-password`, data)
export const getHistory     = (id)         => api.get(`/students/${id}/history`)
export const getAuditLog    = (table, id)  => api.get(`/audit/${table}/${id}`)
export const getIDCardData  = (id)         => api.get(`/students/${id}/id-card/data`)
export const getTCData      = (id)         => api.get(`/students/${id}/tc/data`)
export const getClassIDCardsData = (params) => api.get('/students/bulk/id-cards/data', { params })

// ── Bulk Import ──────────────────────────────────────────────────────────
export const getAdmissionTemplate = ()      => api.get('/students/import/template')
export const previewAdmission      = (data)  => api.post('/students/import/preview', data)
export const confirmAdmission      = (data)  => api.post('/students/import/confirm', data)
export const getAdmissionStatus    = (jobId) => api.get(`/students/import/${jobId}/status`)

// ── Documents ─────────────────────────────────────────────────────────────
export const getDocuments   = (id)         => api.get(`/students/${id}/documents`)
export const uploadDocument = (id, data)   => api.post(`/students/${id}/documents`, data, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const deleteDocument = (id, docId)  => api.delete(`/students/${id}/documents/${docId}`)

export const createEnrollment = (data)     => api.post('/enrollments', data)
export const getClasses     = ()           => api.get('/classes')
export const getSections    = (classId) => api.get(`/classes/${classId}/sections`)
