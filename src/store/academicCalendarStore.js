// frontend/src/store/academicCalendarStore.js
import { create } from 'zustand'
import * as api from '@/api/academicCalendarApi'

const useAcademicCalendarStore = create((set, get) => ({
  events      : [],
  isLoading   : false,
  isSaving    : false,
  error       : null,
  activeMonth : new Date().getMonth() + 1,
  activeYear  : new Date().getFullYear(),
  filterType  : null, // 'exam' | 'holiday' | ... | null (show all)

  fetchEvents: async (sessionId, month, year) => {
    set({ isLoading: true, error: null })
    try {
      const params = { session_id: sessionId }
      if (month && year) {
        params.month = month
        params.year = year
      }
      const res = await api.listEvents(params)
      set({ events: res.data || [], isLoading: false })
      return { success: true, data: res.data }
    } catch (err) {
      set({ isLoading: false, error: err.message })
      return { success: false, message: err.message }
    }
  },

  fetchStudentEvents: async (sessionId, month, year) => {
    set({ isLoading: true, error: null })
    try {
      const params = { session_id: sessionId }
      if (month && year) {
        params.month = month
        params.year = year
      }
      const res = await api.listStudentEvents(params)
      set({ events: res.data || [], isLoading: false })
      return { success: true, data: res.data }
    } catch (err) {
      set({ isLoading: false, error: err.message })
      return { success: false, message: err.message }
    }
  },

  createEvent: async (data) => {
    set({ isSaving: true, error: null })
    try {
      const res = await api.createEvent(data)
      set(state => ({ 
        events: [res.data, ...state.events].sort((a, b) => new Date(a.start_date) - new Date(b.start_date)),
        isSaving: false 
      }))
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false, error: err.message })
      return { success: false, message: err.message }
    }
  },

  updateEvent: async (id, data) => {
    set({ isSaving: true, error: null })
    try {
      const res = await api.updateEvent(id, data)
      set(state => ({
        events: state.events.map(ev => ev.id === id ? res.data : ev).sort((a, b) => new Date(a.start_date) - new Date(b.start_date)),
        isSaving: false
      }))
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false, error: err.message })
      return { success: false, message: err.message }
    }
  },

  deleteEvent: async (id) => {
    set({ isSaving: true, error: null })
    try {
      await api.deleteEvent(id)
      set(state => ({
        events: state.events.filter(ev => ev.id !== id),
        isSaving: false
      }))
      return { success: true }
    } catch (err) {
      set({ isSaving: false, error: err.message })
      return { success: false, message: err.message }
    }
  },

  publishEvent: async (id) => {
    set({ isSaving: true, error: null })
    try {
      const res = await api.togglePublish(id)
      set(state => ({
        events: state.events.map(ev => ev.id === id ? res.data : ev),
        isSaving: false
      }))
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false, error: err.message })
      return { success: false, message: err.message }
    }
  },

  downloadPdf: async (sessionId, filterType, filterAudience, month, year, viewType) => {
    try {
      const params = { session_id: sessionId }
      if (filterType) params.event_type = filterType
      if (filterAudience) params.audience = filterAudience
      if (month) params.month = month
      if (year) params.year = year
      if (viewType) params.view_type = viewType
      const blob = await api.downloadCalendarPdf(params)
      return blob
    } catch (err) {
      console.error('PDF Download error:', err)
      throw err
    }
  },

  setMonth: (month, year) => set({ activeMonth: month, activeYear: year }),
  setFilterType: (type) => set({ filterType: type }),
}))

export default useAcademicCalendarStore
