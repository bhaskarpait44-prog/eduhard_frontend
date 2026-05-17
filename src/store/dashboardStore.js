// src/store/dashboardStore.js
import { create } from 'zustand'
import { getAuditLogs } from '@/api/auditApi'

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
    set({ isLoading: true, error: null })

    try {
      const [statsRes, auditRes, leavingRes] = await Promise.allSettled([
        import('@/api/axios').then((m) => m.default.get('/dashboard/admin/stats', { params: { session_id: sessionId } })),
        getAuditLogs({ limit: 5, page: 1 }),
        import('@/api/studentLeavingApi').then((m) => m.getLeavingSummary({ session_id: sessionId })),
      ])

      const statsData = statsRes.status === 'fulfilled' ? statsRes.value?.data : null
      const auditData = auditRes.status === 'fulfilled' ? auditRes.value?.data : null
      const leavingData = leavingRes.status === 'fulfilled' ? leavingRes.value?.data : null

      const recentStudents = await import('@/api/studentsApi')
        .then((m) => m.getStudents({ perPage: 10, sort: 'created_at:desc' }))
        .then((r) => Array.isArray(r.data) ? r.data : r.data?.students || r.data?.data || [])
        .catch(() => [])

      set({
        stats           : statsData?.data || null,
        attendanceChart : [],
        recentAdmissions: recentStudents,
        feeDefaulters   : [],
        recentAudit     : auditData?.logs || (Array.isArray(auditData) ? auditData : []),
        leavingStats    : leavingData,
        isLoading       : false,
        lastRefreshed   : new Date(),
      })
    } catch (err) {
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
