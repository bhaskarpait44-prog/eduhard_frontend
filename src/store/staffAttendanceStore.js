// src/store/staffAttendanceStore.js
import { create } from 'zustand'
import * as api from '@/api/staffAttendanceApi'

const useStaffAttendanceStore = create((set, get) => ({
  dailyAttendance: [],
  registerData: [],
  isLoading: false,
  error: null,

  fetchDailyAttendance: async (date) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getDailyStaffAttendance(date)
      set({ dailyAttendance: res.data.staff || [], isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  markBulk: async (date, records) => {
    set({ isLoading: true })
    try {
      const res = await api.markStaffAttendanceBulk({ date, records })
      set({ isLoading: false })
      return res
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  fetchMonthlyRegister: async (month, year) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getStaffMonthlyRegister(month, year)
      set({ registerData: res.data.staff || [], isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  clearData: () => set({ dailyAttendance: [], registerData: [], error: null })
}))

export default useStaffAttendanceStore
