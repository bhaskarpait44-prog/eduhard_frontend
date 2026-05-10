// src/store/healthStore.js
import { create } from 'zustand'
import * as api from '@/api/healthApi'

const useHealthStore = create((set, get) => ({
  profile: null,
  vaccinations: [],
  incidents: [],
  isLoading: false,
  error: null,

  fetchHealthData: async (studentId) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getHealthProfile(studentId)
      set({ 
        profile: res.data.profile, 
        vaccinations: res.data.vaccinations, 
        incidents: res.data.incidents, 
        isLoading: false 
      })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  updateProfile: async (studentId, data) => {
    set({ isLoading: true })
    try {
      await api.updateHealthProfile(studentId, data)
      await get().fetchHealthData(studentId)
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  addVaccination: async (studentId, data) => {
    set({ isLoading: true })
    try {
      await api.addVaccination(studentId, data)
      await get().fetchHealthData(studentId)
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  deleteVaccination: async (studentId, id) => {
    set({ isLoading: true })
    try {
      await api.deleteVaccination(id)
      await get().fetchHealthData(studentId)
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  addIncident: async (studentId, data) => {
    set({ isLoading: true })
    try {
      await api.addIncident(studentId, data)
      await get().fetchHealthData(studentId)
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  deleteIncident: async (studentId, id) => {
    set({ isLoading: true })
    try {
      await api.deleteIncident(id)
      await get().fetchHealthData(studentId)
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  }
}))

export default useHealthStore
