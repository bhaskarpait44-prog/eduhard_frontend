// src/api/studentSubjects.js
import api from './axios'

export const assignSubjects = (data) =>
  api.post('/student-subjects/assign', data)

const autoAssignCoreSubjects = (data) =>
  api.post('/student-subjects/auto-assign-core', data)

const getStudentSubjects = (studentId, sessionId) =>
  api.get(`/student-subjects/${studentId}/session/${sessionId}`)

const removeSubject = (studentId, sessionId, subjectId) =>
  api.delete(`/student-subjects/${studentId}/session/${sessionId}/subject/${subjectId}`)
