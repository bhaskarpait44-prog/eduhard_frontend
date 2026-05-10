// src/api/expenseApi.js
import api from './axios'

export const getExpenses = (params) => api.get('/expenses', { params })
export const getExpenseSummary = (params) => api.get('/expenses/summary', { params })
export const createExpense = (data) => api.post('/expenses', data)
export const updateExpenseStatus = (id, status) => api.patch(`/expenses/${id}/status`, { status })
export const deleteExpense = (id) => api.delete(`/expenses/${id}`)
