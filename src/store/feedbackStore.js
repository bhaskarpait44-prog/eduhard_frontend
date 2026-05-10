// src/store/feedbackStore.js
import { create } from 'zustand'
import * as api from '@/api/feedbackApi'

const useFeedbackStore = create((set, get) => ({
  records: [],
  isLoading: false,
  error: null,

  fetchFeedback: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getFeedback(params)
      set({ records: res.data, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  submit: async (data) => {
    set({ isLoading: true })
    try {
      const res = await api.submitFeedback(data)
      set({ records: [res.data, ...get().records], isLoading: false })
      return res
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  reply: async (id, data) => {
    set({ isLoading: true })
    try {
      const res = await api.replyFeedback(id, data)
      set({ records: get().records.map(r => r.id === id ? { ...r, ...res.data } : r), isLoading: false })
      return res
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  remove: async (id) => {
    set({ isLoading: true })
    try {
      await api.deleteFeedback(id)
      set({ records: get().records.filter(r => r.id !== id), isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  }
}))

export default useFeedbackStore
