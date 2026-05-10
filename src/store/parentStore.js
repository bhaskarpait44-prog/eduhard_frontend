// src/store/parentStore.js
import { create } from 'zustand'
import * as api from '@/api/parentApi'

const useParentStore = create((set, get) => ({
  wards: [],
  attendance: [],
  fees: [],
  results: [],
  homework: [],
  isLoading: false,
  error: null,

  fetchWards: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getWards()
      set({ wards: res.data, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  fetchWardDetails: async (studentId) => {
    set({ isLoading: true, error: null, attendance: [], fees: [], results: [], homework: [] })
    try {
      const [attRes, feeRes, resRes, hwRes] = await Promise.all([
        api.getWardAttendance(studentId),
        api.getWardFees(studentId),
        api.getWardResults(studentId),
        api.getWardHomework(studentId)
      ])
      set({ 
        attendance: attRes.data,
        fees: feeRes.data,
        results: resRes.data,
        homework: hwRes.data,
        isLoading: false 
      })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  }
}))

export default useParentStore
