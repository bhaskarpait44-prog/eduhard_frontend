// src/store/expenseStore.js
import { create } from 'zustand'
import * as api from '@/api/expenseApi'

const useExpenseStore = create((set, get) => ({
  expenses: [],
  summary: [],
  isLoading: false,
  error: null,

  fetchExpenses: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getExpenses(params)
      set({ expenses: res.data, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  fetchSummary: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getExpenseSummary(params)
      set({ summary: res.data, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  createExpense: async (data) => {
    set({ isLoading: true })
    try {
      const res = await api.createExpense(data)
      set({ expenses: [res.data, ...get().expenses], isLoading: false })
      return res
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  updateStatus: async (id, status) => {
    set({ isLoading: true })
    try {
      const res = await api.updateExpenseStatus(id, status)
      set({ 
        expenses: get().expenses.map(e => e.id === id ? res.data : e), 
        isLoading: false 
      })
      return res
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  deleteExpense: async (id) => {
    set({ isLoading: true })
    try {
      await api.deleteExpense(id)
      set({ 
        expenses: get().expenses.filter(e => e.id !== id), 
        isLoading: false 
      })
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  }
}))

export default useExpenseStore
