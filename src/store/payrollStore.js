// src/store/payrollStore.js
import { create } from 'zustand'
import * as api from '@/api/payrollApi'

const usePayrollStore = create((set, get) => ({
  structures: [],
  payrolls: [],
  isLoading: false,
  error: null,

  fetchStructures: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getSalaryStructures()
      set({ structures: res.data, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  updateStructure: async (userId, data) => {
    set({ isLoading: true })
    try {
      await api.updateSalaryStructure(userId, data)
      await get().fetchStructures()
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  fetchPayrolls: async (month, year) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getPayrolls(month, year)
      set({ payrolls: res.data, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  generatePayroll: async (month, year) => {
    set({ isLoading: true })
    try {
      await api.generatePayroll(month, year)
      await get().fetchPayrolls(month, year)
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  markPaid: async (id, data, month, year) => {
    set({ isLoading: true })
    try {
      await api.markPayrollPaid(id, data)
      await get().fetchPayrolls(month, year)
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  fetchPayslip: async (id) => {
    set({ isLoading: true })
    try {
      const res = await api.getPayslip(id)
      set({ isLoading: false })
      return res.data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  }
}))

export default usePayrollStore
