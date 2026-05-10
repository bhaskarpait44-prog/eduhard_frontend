// src/store/familyStore.js
import { create } from 'zustand'
import * as api from '@/api/familyApi'

const useFamilyStore = create((set, get) => ({
  families: [],
  isLoading: false,
  error: null,

  fetchFamilies: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getFamilies()
      set({ families: res.data, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  createFamily: async (data) => {
    set({ isLoading: true })
    try {
      await api.createFamily(data)
      await get().fetchFamilies()
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  updateFamily: async (id, data) => {
    set({ isLoading: true })
    try {
      await api.updateFamily(id, data)
      await get().fetchFamilies()
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  deleteFamily: async (id) => {
    set({ isLoading: true })
    try {
      await api.deleteFamily(id)
      await get().fetchFamilies()
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  }
}))

export default useFamilyStore
