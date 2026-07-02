// src/store/parentStore.js
import { create } from 'zustand'
import * as api from '@/api/parentApi'

const useParentStore = create((set, get) => ({
  wards: [],
  selectedWardId: null,
  attendance: [],
  attendanceSummary: null,
  fees: [],
  results: [],
  homework: [],
  isLoading: false,
  isDetailsLoading: false,
  error: null,

  fetchWards: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getWards()
      const wards = res.data || []
      set({ wards, isLoading: false })
      
      // Auto-select first ward if none selected
      if (wards.length > 0 && !get().selectedWardId) {
        get().selectWard(wards[0].id)
      }
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  selectWard: (id) => {
    if (get().selectedWardId === id) return
    set({ selectedWardId: id })
    get().fetchWardDetails(id)
  },

  fetchWardDetails: async (studentId) => {
    if (!studentId) return
    set({ isDetailsLoading: true, error: null })
    try {
      const [attRes, feeRes, resRes, hwRes] = await Promise.all([
        api.getWardAttendance(studentId),
        api.getWardFees(studentId),
        api.getWardResults(studentId),
        api.getWardHomework(studentId)
      ])
      const attData = attRes.data || {}
      set({ 
        attendance: attData.records || [],
        attendanceSummary: attData.summary || null,
        fees: feeRes.data || [],
        results: resRes.data || [],
        homework: hwRes.data || [],
        isDetailsLoading: false 
      })
    } catch (err) {
      set({ error: err.message, isDetailsLoading: false })
    }
  }
}))

export default useParentStore
