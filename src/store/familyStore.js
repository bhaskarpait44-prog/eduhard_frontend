// src/store/familyStore.js
import { create } from 'zustand'
import * as api from '@/api/familyApi'

const useFamilyStore = create((set, get) => ({
  families: [],
  total: 0,
  page: 1,
  limit: 50,
  isLoading: false,
  error: null,

  fetchFamilies: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getFamilies(params)
      // res.data now returns { families, total, page, limit }
      if (res.data && res.data.families) {
        set({ 
          families: res.data.families, 
          total: res.data.total,
          page: res.data.page,
          limit: res.data.limit,
          isLoading: false 
        })
      } else {
        // Fallback for old response shape if any
        set({ families: res.data, isLoading: false })
      }
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  createFamily: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await api.createFamily(data)
      const { page, limit } = get()
      await get().fetchFamilies({ page, limit })
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  updateFamily: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      await api.updateFamily(id, data)
      const { page, limit } = get()
      await get().fetchFamilies({ page, limit })
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  deleteFamily: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await api.deleteFamily(id)
      const { page, limit } = get()
      await get().fetchFamilies({ page, limit })
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  clearError: () => set({ error: null })
}))

export default useFamilyStore
