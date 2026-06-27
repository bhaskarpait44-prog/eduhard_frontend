import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, GraduationCap, RefreshCw, TrendingUp } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import PerformanceTrend from '@/components/student/PerformanceTrend'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import * as studentApi from '@/api/studentApi'
import { formatDate, formatPercent } from '@/utils/helpers'

const AcademicHistory = () => {
  usePageTitle('Academic History')

  const { toastError, toastInfo, toastSuccess } = useToast()
  const [history, setHistory] = useState([])
  const [timeline, setTimeline] = useState([])
  const [trend, setTrend] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)

  const load = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await studentApi.getStudentAcademicHistory()
      setHistory(res?.data?.history || [])
      setTimeline(res?.data?.timeline || [])
      setTrend(res?.data?.performance_trend || [])
      setLoading(false)
      setRefreshing(false)
    } catch (err) {
      setLoading(false)
      setRefreshing(false)
      toastError(err?.message || 'Unable to load academic history.')
    }
  }

  useEffect(() => {
    load().catch(() => {})
  }, [])

  const handleRefresh = async () => {
    toastInfo('Refreshing academic history')
    await load({ silent: true })
  }

  return (
    <div className="space-y-5">
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden rounded-3xl border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(109,40,217,0.18), rgba(37,99,235,0.06) 52%, var(--color-surface) 100%)',
          boxShadow: '0 4px 24px rgba(109,40,217,0.08)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #7c3aed, #2563eb)' }} />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm"
              style={{ backgroundColor: 'rgba(124,58,237,0.12)', color: 'var(--student-accent)' }}
            >
              <GraduationCap size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--student-accent)' }}>
                Academic History
              </p>
              <h1 className="mt-1.5 text-2xl font-bold sm:text-3xl">Full Academic Journey</h1>
              <p className="mt-1.5 max-w-2xl text-[13px] text-[var(--color-text-secondary)] sm:text-[15px]">
                Review every session, track your progression class by class, and see how your long-term performance has moved over time.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="secondary" onClick={handleRefresh} loading={refreshing} icon={RefreshCw}>
              Refresh
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="space-y-5 animate-pulse">
          <div className="rounded-3xl bg-[var(--color-surface)] p-20" />
          <div className="rounded-3xl bg-[var(--color-surface)] p-24" />
        </div>
      ) : history.length ? (
        <>
          {/* ── Session History Table ── */}
          <section
            className="overflow-hidden rounded-3xl border"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'rgba(124,58,237,0.12)', color: 'var(--student-accent)' }}
              >
                <GraduationCap size={16} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-[var(--color-text-primary)]">Session History</h2>
                <p className="text-xs text-[var(--color-text-muted)]">Click any row to expand details</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-surface-raised)' }}>
                    {['Session', 'Class', 'Section', 'Roll No', 'Result', 'Attendance', 'Status', ''].map((head) => (
                      <th
                        key={head}
                        className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]"
                        style={{ borderBottom: '1px solid var(--color-border)' }}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => {
                    const expanded = expandedRow === row.enrollment_id
                    return (
                      <>
                        <tr
                          key={row.enrollment_id}
                          className="cursor-pointer transition-colors duration-150"
                          style={{
                            borderTop: '1px solid var(--color-border)',
                            backgroundColor: expanded ? 'var(--color-surface-raised)' : 'transparent',
                          }}
                          onClick={() => setExpandedRow(expanded ? null : row.enrollment_id)}
                        >
                          <td className="px-4 py-3.5 font-bold text-[var(--color-text-primary)]">{row.session_name}</td>
                          <td className="px-4 py-3.5 text-[var(--color-text-secondary)]">{row.class_name}</td>
                          <td className="px-4 py-3.5 text-[var(--color-text-secondary)]">{row.section_name}</td>
                          <td className="px-4 py-3.5 text-[var(--color-text-secondary)]">{row.roll_number || '—'}</td>
                          <td className="px-4 py-3.5">
                            <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={resultStyle(row.result)}>
                              {String(row.result || '—').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-bold" style={{ color: getAttendanceTone(row.attendance_percentage) }}>
                            {formatPercent(row.attendance_percentage || 0, 0)}
                          </td>
                          <td className="px-4 py-3.5 text-[var(--color-text-secondary)] text-xs font-medium uppercase tracking-wider">
                            {row.enrollment_status || '—'}
                          </td>
                          <td className="px-4 py-3.5">
                            <span style={{ color: 'var(--color-text-muted)' }}>
                              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                          </td>
                        </tr>
                        {expanded && (
                          <tr style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                            <td colSpan={8} className="px-4 pb-4 pt-3">
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <DetailCell label="Joined Date" value={formatDate(row.joined_date, 'long')} />
                                <DetailCell label="Left Date" value={row.left_date ? formatDate(row.left_date, 'long') : 'Active / Not recorded'} />
                                <DetailCell label="Percentage" value={formatPercent(row.percentage || 0, 0)} />
                                <DetailCell label="Promotion" value={row.is_promoted ? '✓ Promoted' : 'Not marked'} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Timeline + Trend ── */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            {/* Visual Timeline */}
            <section
              className="rounded-3xl border p-5"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div className="mb-5 flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'rgba(124,58,237,0.12)', color: 'var(--student-accent)' }}
                >
                  <GraduationCap size={16} />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[var(--color-text-primary)]">Visual Timeline</h2>
                  <p className="text-xs text-[var(--color-text-secondary)]">Your class-by-class progression.</p>
                </div>
              </div>

              <div className="space-y-0">
                {timeline.map((item, index) => {
                  const style = resultStyle(item.result)
                  return (
                    <div key={`${item.session_name}-${index}`} className="relative flex gap-4">
                      {/* Rail */}
                      <div className="flex flex-col items-center w-8 shrink-0">
                        <div
                          className="h-8 w-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ borderColor: style.color, backgroundColor: style.color }}
                        >
                          {index + 1}
                        </div>
                        {index < timeline.length - 1 && (
                          <div className="mt-0 w-0.5 flex-1 min-h-[16px]" style={{ backgroundColor: 'var(--color-border)' }} />
                        )}
                      </div>

                      {/* Card */}
                      <div
                        className="mb-3 flex-1 rounded-2xl border p-4"
                        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
                      >
                        <p className="text-[13px] font-bold text-[var(--color-text-primary)]">{item.session_name}</p>
                        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{item.class_name} {item.section_name}</p>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={resultStyle(item.result)}>
                            {String(item.result || '—').toUpperCase()}
                          </span>
                          <span className="rounded-full bg-[rgba(37,99,235,0.10)] px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                            {formatPercent(item.attendance_percentage || 0, 0)} attendance
                          </span>
                          <span className="rounded-full bg-[rgba(22,163,74,0.10)] px-2.5 py-0.5 text-[11px] font-bold text-green-700">
                            {item.promoted ? '✓ Promoted' : 'In record'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Performance Trend */}
            <section
              className="rounded-3xl border p-5"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div className="mb-5 flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'rgba(37,99,235,0.12)', color: '#2563eb' }}
                >
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[var(--color-text-primary)]">Performance Trend</h2>
                  <p className="text-xs text-[var(--color-text-secondary)]">Session-wise percentage across your record.</p>
                </div>
              </div>
              <PerformanceTrend data={trend} />
            </section>
          </div>
        </>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="No academic history found"
          description="Once session records are available, your academic journey will appear here."
        />
      )}
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

const DetailCell = ({ label, value }) => (
  <div className="rounded-2xl border px-4 py-3.5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-1.5 text-[13px] font-semibold text-[var(--color-text-primary)]">{value || '—'}</p>
  </div>
)

/* ─── Utility helpers ─────────────────────────────────────────────────────── */

function resultStyle(result) {
  if (result === 'pass') return { backgroundColor: '#dcfce7', color: '#15803d' }
  if (result === 'compartment') return { backgroundColor: '#fef3c7', color: '#b45309' }
  if (result === 'fail') return { backgroundColor: '#fee2e2', color: '#dc2626' }
  return { backgroundColor: '#e5e7eb', color: '#4b5563' }
}

function getAttendanceTone(percentage) {
  const value = Number(percentage || 0)
  if (value >= 85) return '#16a34a'
  if (value >= 75) return '#d97706'
  return '#ef4444'
}

export default AcademicHistory
