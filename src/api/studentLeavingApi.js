// src/api/studentLeavingApi.js
import api from './axios';

/**
 * Fetch summary stats for leaving module (active, left, graduated, readmitted).
 * @param {Object} params - { session_id }
 */
export const getLeavingSummary = (params) => api.get('/student-leaving/leaving-summary', { params });

/**
 * Fetch list of students who have left.
 * @param {Object} params - { page, perPage, search, leaving_reason, class_id, session_id, from_date, to_date }
 */
export const getLeftStudents = (params) => api.get('/student-leaving/left', { params });

/**
 * Fetch list of graduated students.
 * @param {Object} params - { page, perPage, search, class_id, session_id }
 */
export const getGraduatedStudents = (params) => api.get('/student-leaving/graduated', { params });

/**
 * Mark a student as left.
 * @param {Number} id - Student ID
 * @param {Object} data - { left_date, leaving_reason, leaving_remarks }
 */
export const markAsLeft = (id, data) => api.patch(`/student-leaving/${id}/mark-left`, data);

/**
 * Fetch full enrollment history for a student.
 * @param {Number} id - Student ID
 */
export const getEnrollmentHistory = (id) => api.get(`/student-leaving/${id}/enrollment-history`);

/**
 * Re-admit a left or graduated student.
 * @param {Number} id - Student ID
 * @param {Object} data - { session_id, class_id, section_id, joined_date, roll_number }
 */
export const readmitStudent = (id, data) => api.post(`/student-leaving/${id}/readmit`, data);
