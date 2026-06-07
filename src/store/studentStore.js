// src/store/studentStore.js
import { create } from 'zustand'
import * as studentsApi from '@/api/studentsApi'

const useAdminStudentStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────
  students      : [],
  selectedStudent: null,
  history       : null,
  pagination    : { page: 1, perPage: 20, total: 0, totalPages: 1 },
  isLoading     : false,
  isSaving      : false,
  error         : null,

  // ── Fetch list ──────────────────────────────────────────────────────────
  fetchStudents: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const res = await studentsApi.getStudents(params)
      const data = res.data

      // Explicitly extract students and metadata
      // Backend returns { students: [...], meta: {...} }
      let students = []
      let meta = {}

      if (Array.isArray(data)) {
        students = data
      } else if (data && typeof data === 'object') {
        students = data.students || data.data || []
        meta = data.meta || data.pagination || {}
      }

      // Defensive check: if we expected data but got nothing, it might be a silent backend error
      if (!Array.isArray(students)) {
        console.error('[StudentStore] Unexpected response shape:', data)
        throw new Error('Received invalid data format from server.')
      }

      set({
        students,
        pagination: {
          page      : Number(meta.page || params.page || 1),
          perPage   : Number(meta.perPage || params.perPage || 20),
          total     : Number(meta.total || students.length),
          totalPages: Number(meta.totalPages || 1),
        },
        isLoading: false,
      })
      return students
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  // ── Fetch single ────────────────────────────────────────────────────────
  fetchStudent: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const res = await studentsApi.getStudent(id)
      set({ selectedStudent: res.data, isLoading: false })
      return res.data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  // ── Create student (admission) ──────────────────────────────────────────
  createStudent: async (data) => {
    set({ isSaving: true })
    try {
      const res = await studentsApi.createStudent(data)
      set(s => ({ students: [res.data, ...s.students], isSaving: false }))
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  deleteStudent: async (id, data) => {
    set({ isSaving: true })
    try {
      await studentsApi.deleteStudent(id, data)
      set(s => ({
        students       : s.students.filter(student => student.id !== Number(id)),
        selectedStudent: s.selectedStudent?.id === Number(id) ? null : s.selectedStudent,
        isSaving      : false,
      }))
      return { success: true }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message, errors: err.errors || [] }
    }
  },

  toggleStatus: async (id) => {
    set({ isSaving: true })
    try {
      const res = await studentsApi.toggleStudentStatus(id)
      const { is_active } = res.data
      set(state => ({
        students: state.students.map(s => s.id === Number(id) ? { ...s, is_active } : s),
        selectedStudent: state.selectedStudent?.id === Number(id) ? { ...state.selectedStudent, is_active } : state.selectedStudent,
        isSaving: false
      }))
      return { success: true, is_active }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Update identity ─────────────────────────────────────────────────────
  updateIdentity: async (id, data) => {
    set({ isSaving: true })
    try {
      const res = await studentsApi.updateIdentity(id, data)
      set(s => ({
        isSaving       : false,
        selectedStudent: s.selectedStudent
          ? { ...s.selectedStudent, ...res.data }
          : s.selectedStudent,
      }))
      return { success: true }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Update profile ──────────────────────────────────────────────────────
  updateProfile: async (id, data) => {
    set({ isSaving: true })
    try {
      const res = await studentsApi.updateProfile(id, data)
      set(s => ({
        isSaving       : false,
        selectedStudent: s.selectedStudent?.id === Number(id)
          ? { ...s.selectedStudent, ...res.data }
          : s.selectedStudent,
        // Also update in the list if present
        students: s.students.map(std => std.id === Number(id) ? { ...std, ...res.data } : std)
      }))
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Fetch history ───────────────────────────────────────────────────────
  fetchHistory: async (id) => {
    set({ isLoading: true })
    try {
      const res = await studentsApi.getHistory(id)
      set({ history: res.data, isLoading: false })
      return res.data
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  fetchIDCardData: async (id) => {
    try {
      const res = await studentsApi.getIDCardData(id)
      return res.data
    } catch (err) {
      throw err
    }
  },

  fetchTCData: async (id) => {
    try {
      const res = await studentsApi.getTCData(id)
      return res.data
    } catch (err) {
      throw err
    }
  },

  fetchClassIDCardsData: async (params) => {
    try {
      const res = await studentsApi.getClassIDCardsData(params)
      return res.data
    } catch (err) {
      throw err
    }
  },

  // ── Password Resets ───────────────────────────────────────────────────
  resetPassword: async (id, data) => {
    set({ isSaving: true })
    try {
      const res = await studentsApi.resetPassword(id, data)
      set({ isSaving: false })
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  resetParentPassword: async (id, data) => {
    set({ isSaving: true })
    try {
      const res = await studentsApi.resetParentPassword(id, data)
      set({ isSaving: false })
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  clearSelected: () => set({ selectedStudent: null, history: null }),
}))

export default useAdminStudentStore
