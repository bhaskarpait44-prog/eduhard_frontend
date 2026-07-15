import api from './axios'

export const getSubjects = (classId) =>
  api.get(`/classes/${classId}/subjects`)

export const downloadSubjectsPdf = (classId) =>
  api.get(`/classes/${classId}/subjects/pdf`, { responseType: 'blob' })

// Fix #3: was declared as `const` (not exported) — no consumer could use it
export const getSubjectById = (classId, subjectId) =>
  api.get(`/classes/${classId}/subjects/${subjectId}`)

export const createSubject = (classId, data) =>
  api.post(`/classes/${classId}/subjects`, data)

export const updateSubject = (classId, subjectId, data) =>
  api.patch(`/classes/${classId}/subjects/${subjectId}`, data)

export const deleteSubject = (classId, subjectId, reason = '', options = {}) =>
  api.delete(`/classes/${classId}/subjects/${subjectId}`, { data: { reason, ...options } })

/**
 * Fix #11: document the expected payload shape so callers don't guess.
 * @param {number} classId
 * @param {Array<{ id: number, order_number: number }>} subject_orders
 */
export const reorderSubjects = (classId, subject_orders) =>
  api.patch(`/classes/${classId}/subjects/reorder`, { subject_orders })
