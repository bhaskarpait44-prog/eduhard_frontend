// src/api/payrollApi.js
import api from './axios'

export const getSalaryStructures = () => api.get('/payroll/structures')
export const updateSalaryStructure = (userId, data) => api.patch(`/payroll/structures/${userId}`, data)

export const getPayrolls = (month, year) => api.get('/payroll', { params: { month, year } })
export const generatePayroll = (month, year) => api.post('/payroll/generate', { month, year })
export const markPayrollPaid = (id, data) => api.patch(`/payroll/${id}/pay`, data)
export const getPayslip = (id) => api.get(`/payroll/${id}/payslip`)
