import { useEffect, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useSessionStore from '@/store/sessionStore'
import { getSessions, getSessionStats } from '@/api/sessionsApi'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/helpers'

const SessionSummary = () => {
  usePageTitle('Session Summary')
  const { currentSession } = useSessionStore()
  const [sessions, setSessions] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSessions().then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data?.sessions || [])
      setSessions(data)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (currentSession && !sessionId) setSessionId(String(currentSession.id))
  }, [currentSession, sessionId])

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    getSessionStats(sessionId).then(res => {
      setStats(res.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [sessionId])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Session Summary Report</h1>
        <div className="w-64">
          <Select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            options={sessions.map(s => ({ value: String(s.id), label: `${s.name}${s.is_current ? ' (Current)' : ''}` }))}
          />
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Enrolled Students" value={stats.students} />
          <StatCard title="Avg Attendance" value={`${stats.attendance_rate}%`} />
          <StatCard title="Holidays" value={stats.holidays} />
          <StatCard title="Exams Conducted" value={stats.exams} />
          <StatCard title="Fee Collection Target" value={formatCurrency(stats.fee_stats?.target)} />
          <StatCard title="Fees Collected" value={formatCurrency(stats.fee_stats?.collected)} />
          <StatCard title="Collection Rate" value={`${stats.fee_stats?.percentage || 0}%`} />
        </div>
      ) : (
        <div className="p-10 text-center text-gray-500">No stats available</div>
      )}
    </div>
  )
}

const StatCard = ({ title, value }) => (
  <div className="p-6 rounded-2xl border bg-white" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500" style={{ color: 'var(--color-text-muted)' }}>{title}</h3>
    <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
  </div>
)

export default SessionSummary
