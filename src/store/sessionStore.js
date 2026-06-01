// src/store/sessionStore.js
import { create } from 'zustand'
import * as api from '@/api/sessionsApi'

const useSessionStore = create((set, get) => ({
  sessions       : [],
  pagination     : { total: 0, page: 1, limit: 20, totalPages: 0 },
  currentSession : null,
  selectedSession: null,
  isLoading      : false,
  isSaving       : false,
  error          : null,

  // ── Fetch all sessions ──────────────────────────────────────────────
  fetchSessions: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const fetchParams = { limit: 20, page: 1, search: '', status: 'all', ...params }
      const res = await api.getSessions(fetchParams)
      
      const sessions = res.data?.sessions || []
      const pagination = res.data?.pagination || { total: sessions.length, page: 1, limit: 20, totalPages: 1 }
      
      const currentSession = sessions.find((session) => session.is_current === true) || null
      set({ sessions, pagination, currentSession, isLoading: false })
      return res.data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  // ── Fetch current session ───────────────────────────────────────────
  fetchCurrentSession: async () => {
    try {
      const res = await api.getCurrentSession()
      set({ currentSession: res.data })
      return res.data
    } catch {
      // Not critical — silently fail
    }
  },

  // ── Fetch single session ────────────────────────────────────────────
  fetchSession: async (id) => {
    const currentSelected = get().selectedSession
    // Only clear stats if we're switching sessions to avoid flicker on re-nav
    const shouldClearStats = !currentSelected || currentSelected.id !== Number(id)
    
    set({ 
      isLoading: true, 
      error: null, 
      ...(shouldClearStats ? { sessionStats: null } : {}) 
    })
    try {
      const res = await api.getSession(id)
      set({ selectedSession: res.data, isLoading: false })
      return res.data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  // ── Fetch session stats ─────────────────────────────────────────────
  fetchSessionStats: async (id) => {
    try {
      const res = await api.getSessionStats(id)
      set({ sessionStats: res.data })
      return { success: true, data: res.data }
    } catch (err) {
      return { success: false, message: err.message }
    }
  },

  // ── Create session ──────────────────────────────────────────────────
  createSession: async (data) => {
    set({ isSaving: true })
    try {
      const res = await api.createSession(data)
      // Prepend to list and update pagination totals
      set(s => {
        const newTotal = s.pagination.total + 1
        return {
          sessions: [res.data, ...s.sessions],
          pagination: {
            ...s.pagination,
            total: newTotal,
            totalPages: Math.ceil(newTotal / s.pagination.limit),
          },
          isSaving: false
        }
      })
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Update session ──────────────────────────────────────────────────
  updateSession: async (id, data) => {
    set({ isSaving: true })
    try {
      const res = await api.updateSession(id, data)
      const updated = res.data
      
      set(s => ({
        isSaving: false,
        sessions: s.sessions.map(sess => sess.id === Number(id) ? updated : sess),
        selectedSession: s.selectedSession?.id === Number(id) ? updated : s.selectedSession,
      }))
      return { success: true, data: updated }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Activate session ────────────────────────────────────────────────
  activateSession: async (id) => {
    set({ isSaving: true })
    try {
      const res = await api.activateSession(id)
      const activated = res.data
      // Update in list + set as current
      set(s => ({
        isSaving       : false,
        currentSession : activated,
        sessions       : s.sessions.map(sess =>
          sess.id === Number(id)
            ? activated
            : { ...sess, is_current: false, is_locked: false, status: sess.status === 'active' ? 'closed' : sess.status }
        ),
        selectedSession: s.selectedSession?.id === Number(id)
          ? activated
          : s.selectedSession,
      }))
      return { success: true }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Lock session ────────────────────────────────────────────────────
  lockSession: async (id) => {
    set({ isSaving: true })
    try {
      const res = await api.lockSession(id)
      const locked = res.data
      set(s => ({
        isSaving       : false,
        sessions       : s.sessions.map(sess => (sess.id === Number(id) ? locked : sess)),
        selectedSession: s.selectedSession?.id === Number(id) ? locked : s.selectedSession,
      }))
      return { success: true }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Archive session ─────────────────────────────────────────────────
  archiveSession: async (id) => {
    set({ isSaving: true })
    try {
      const res = await api.archiveSession(id)
      const updated = res.data
      set(s => ({
        isSaving       : false,
        sessions       : s.sessions.map(sess => (sess.id === Number(id) ? updated : sess)),
        selectedSession: s.selectedSession?.id === Number(id) ? updated : s.selectedSession,
      }))
      return { success: true, data: updated }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Add holiday ─────────────────────────────────────────────────────
  addHoliday: async (sessionId, data) => {
    set({ isSaving: true })
    try {
      const res = await api.addHoliday(sessionId, data)
      const newHoliday = res.data?.holiday
      
      set(s => {
        if (s.selectedSession?.id !== Number(sessionId)) {
          return { isSaving: false }
        }

        const updatedHolidays = [...(s.selectedSession.holidays || []).filter(Boolean), newHoliday]
          .sort((a, b) => new Date(a.holiday_date) - new Date(b.holiday_date))

        return {
          isSaving: false,
          selectedSession: {
            ...s.selectedSession,
            holidays: updatedHolidays,
          }
        }
      })
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Remove holiday ──────────────────────────────────────────────────
  removeHoliday: async (sessionId, holidayId) => {
    set({ isSaving: true })
    try {
      await api.removeHoliday(sessionId, holidayId)
      set(s => ({
        isSaving       : false,
        selectedSession: s.selectedSession?.id === Number(sessionId)
          ? {
              ...s.selectedSession,
              holidays: (s.selectedSession.holidays || []).filter(h => h && h.id !== Number(holidayId)),
            }
          : s.selectedSession,
      }))
      return { success: true }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Update working days ─────────────────────────────────────────────
  updateWorkingDays: async (sessionId, workingDays) => {
    set({ isSaving: true })
    try {
      const res = await api.updateWorkingDays(sessionId, workingDays)
      const updated = res.data
      set(s => ({
        isSaving       : false,
        sessions       : s.sessions.map(sess => (sess.id === Number(sessionId) ? updated : sess)),
        selectedSession: s.selectedSession?.id === Number(sessionId) ? updated : s.selectedSession,
      }))
      return { success: true, data: updated }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Delete session ─────────────────────────────────────────────────
  deleteSession: async (id) => {
    set({ isSaving: true })
    try {
      await api.deleteSession(id)
      set(s => {
        const newTotal = Math.max(0, s.pagination.total - 1)
        return {
          isSaving: false,
          sessions: s.sessions.filter(sess => sess.id !== Number(id)),
          selectedSession: s.selectedSession?.id === Number(id) ? null : s.selectedSession,
          pagination: {
            ...s.pagination,
            total: newTotal,
            totalPages: Math.ceil(newTotal / s.pagination.limit),
          },
        }
      })
      return { success: true }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  clearSelected: () => set({ selectedSession: null }),
}))

export default useSessionStore
