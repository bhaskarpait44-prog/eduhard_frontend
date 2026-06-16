// src/store/dashboardStore.js
import { create } from 'zustand'
import api from '@/api/axios'
import { getAuditLogs } from '@/api/auditApi'
import * as studentsApi from '@/api/studentsApi'
import * as studentLeavingApi from '@/api/studentLeavingApi'

const useDashboardStore = create((set) => ({
  stats            : null,
  attendanceChart  : [],
  recentAdmissions : [],
  feeDefaulters    : [],
  recentAudit      : [],
  leavingStats     : null,
  isLoading        : false,
  lastRefreshed    : null,
  error            : null,

  fetchAll: async (sessionId) => {
    // Sanitize sessionId for API call
    const cleanSessionId = (sessionId === 'null' || sessionId === 'undefined') ? undefined : sessionId
    
    set({ isLoading: true, error: null })

    try {
      const [statsRes, auditRes, leavingRes, trendRes] = await Promise.allSettled([
        api.get('/dashboard/admin/stats', { params: { session_id: cleanSessionId } }),
        getAuditLogs({ limit: 5, page: 1 }),
        studentLeavingApi.getLeavingSummary({ session_id: cleanSessionId }),
        api.get('/dashboard/admin/attendance-trend', { params: { days: 7 } })
      ])

      // statsRes.value is the body { success, data, message }
      const statsBody = statsRes.status === 'fulfilled' ? statsRes.value : null
      const auditBody = auditRes.status === 'fulfilled' ? auditRes.value : null
      const leavingBody = leavingRes.status === 'fulfilled' ? leavingRes.value : null
      const trendBody = trendRes.status === 'fulfilled' ? trendRes.value : null

      if (statsRes.status === 'rejected') {
        const reason = statsRes.reason?.message || statsRes.reason
        if (reason === 'No active session found.') {
          // This is a configuration state, not a system failure
          console.warn('Dashboard stats: No active session found.')
        } else {
          set({ error: reason })
          console.error('Stats fetch failed:', reason)
        }
      }

      const recentStudents = await studentsApi.getStudents({ perPage: 10, sort: 'created_at:desc' })
        .then((r) => r.data?.students || [])
        .catch((err) => {
          console.error('Recent students fetch failed:', err)
          return []
        })

      set({
        stats           : statsBody?.data || null,
        attendanceChart : trendBody?.data || [],
        recentAdmissions: recentStudents,
        feeDefaulters   : [],
        recentAudit     : auditBody?.logs || (Array.isArray(auditBody) ? auditBody : []),
        leavingStats    : leavingBody?.data || null,
        isLoading       : false,
        lastRefreshed   : new Date(),
      })
    } catch (err) {
      console.error('Dashboard fetchAll error:', err)
      set({ error: err.message, isLoading: false })
    }
  },

  clearDashboard: () => set({
    stats: null,
    attendanceChart: [],
    recentAdmissions: [],
    feeDefaulters: [],
    recentAudit: [],
    lastRefreshed: null,
  }),
}))

export default useDashboardStore
