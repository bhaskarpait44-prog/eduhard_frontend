// src/api/staffAttendanceApi.js
import api from './axios'

export const getDailyStaffAttendance = (date) => 
  api.get('/staff-attendance/daily', { params: { date } })

export const markStaffAttendanceBulk = (data) => 
  api.post('/staff-attendance/bulk', data)

export const getStaffMonthlyRegister = (month, year) => 
  api.get('/staff-attendance/register', { params: { month, year } })

const getStaffAttendanceStats = (userId, params) => 
  api.get(`/staff-attendance/stats/${userId}`, { params })
