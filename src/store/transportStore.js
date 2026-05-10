// src/store/transportStore.js
import { create } from 'zustand'
import * as api from '@/api/transportApi'

const useTransportStore = create((set, get) => ({
  routes: [],
  isLoading: false,
  error: null,

  fetchRoutes: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getRoutes()
      set({ routes: res.data, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  createRoute: async (data) => {
    set({ isLoading: true })
    try {
      await api.createRoute(data)
      await get().fetchRoutes()
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  updateRoute: async (id, data) => {
    set({ isLoading: true })
    try {
      await api.updateRoute(id, data)
      await get().fetchRoutes()
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  deleteRoute: async (id) => {
    set({ isLoading: true })
    try {
      await api.deleteRoute(id)
      await get().fetchRoutes()
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  createStop: async (routeId, data) => {
    set({ isLoading: true })
    try {
      await api.createStop(routeId, data)
      await get().fetchRoutes()
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  updateStop: async (id, data) => {
    set({ isLoading: true })
    try {
      await api.updateStop(id, data)
      await get().fetchRoutes()
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  deleteStop: async (id) => {
    set({ isLoading: true })
    try {
      await api.deleteStop(id)
      await get().fetchRoutes()
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  assignStudent: async (data) => {
    set({ isLoading: true })
    try {
      await api.assignStudent(data)
      await get().fetchRoutes()
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  }
}))

export default useTransportStore
