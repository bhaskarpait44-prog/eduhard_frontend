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
      const fetchParams = { limit: 20, ...params }
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
    set({ isLoading: true, error: null, sessionStats: null })
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
      // Prepend to list
      set(s => ({ sessions: [res.data, ...s.sessions], isSaving: false }))
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
      await api.updateSession(id, data)
      set(s => ({
        isSaving: false,
        sessions: s.sessions.map(sess => sess.id === id ? { ...sess, ...data } : sess),
        selectedSession: s.selectedSession?.id === id ? { ...s.selectedSession, ...data } : s.selectedSession,
      }))
      return { success: true }
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
      // Update in list + set as current
      set(s => ({
        isSaving       : false,
        currentSession : res.data,
        sessions       : s.sessions.map(sess =>
          sess.id === id
            ? { ...sess, status: 'active', is_current: true }
            : { ...sess, is_current: false, status: sess.status === 'active' ? 'closed' : sess.status }
        ),
        selectedSession: s.selectedSession?.id === id
          ? { ...s.selectedSession, status: 'active', is_current: true }
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
      set(s => ({
        isSaving       : false,
        sessions       : s.sessions.map(sess => (sess.id === id ? res.data : sess)),
        selectedSession: s.selectedSession?.id === id ? res.data : s.selectedSession,
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
      await api.archiveSession(id)
      set(s => ({
        isSaving       : false,
        sessions       : s.sessions.map(sess => (sess.id === id ? { ...sess, status: 'archived' } : sess)),
        selectedSession: s.selectedSession?.id === id ? { ...s.selectedSession, status: 'archived' } : s.selectedSession,
      }))
      return { success: true }
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
      // res.data is { holiday: {...}, retroactive: {...} }
      const newHoliday = res.data?.holiday
      
      set(s => ({
        isSaving       : false,
        selectedSession: s.selectedSession?.id === Number(sessionId)
          ? {
              ...s.selectedSession,
              holidays: [...(s.selectedSession.holidays || []).filter(Boolean), newHoliday],
            }
          : s.selectedSession,
      }))
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
      await api.updateWorkingDays(sessionId, workingDays)
      set(s => ({
        isSaving       : false,
        selectedSession: s.selectedSession?.id === Number(sessionId)
          ? { ...s.selectedSession, ...workingDays, working_days: workingDays }
          : s.selectedSession,
      }))
      return { success: true }
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
      set(s => ({
        isSaving: false,
        sessions: s.sessions.filter(sess => sess.id !== id),
        selectedSession: s.selectedSession?.id === id ? null : s.selectedSession,
      }))
      return { success: true }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  clearSelected: () => set({ selectedSession: null }),
}))

export default useSessionStore
