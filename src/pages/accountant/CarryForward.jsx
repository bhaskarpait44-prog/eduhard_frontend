import { useEffect, useMemo, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency } from '@/utils/helpers'
import useSessionStore from '@/store/sessionStore'
import PageHeader from '@/components/ui/PageHeader'

const CarryForward = () => {
  usePageTitle('Carry Forward')
  const { toastSuccess, toastError } = useToast()
  
  const [rows, setRows] = useState([])
  const [fromSessionId, setFromSessionId] = useState('')
  const [toSessionId, setToSessionId] = useState('')
  const [processingId, setProcessingId] = useState(null)
  
  const { sessions, currentSession, fetchSessions, fetchCurrentSession } = useSessionStore()
  const sourceSessions = sessions || []
  const targetSessions = useMemo(
    () => (sessions || []).filter((session) =>
      String(session.id) !== String(fromSessionId) && session.status === 'upcoming'
    ),
    [sessions, fromSessionId]
  )
  const isSameSession = !!fromSessionId && !!toSessionId && String(fromSessionId) === String(toSessionId)

  useEffect(() => {
    fetchSessions().catch(() => {})
    fetchCurrentSession().catch(() => {})
  }, [])

  useEffect(() => {
    if (currentSession?.id && !fromSessionId) setFromSessionId(String(currentSession.id))
  }, [currentSession, fromSessionId])

  const nextSession = useMemo(
    () => targetSessions[0],
    [targetSessions]
  )

  useEffect(() => {
    if (nextSession?.id) setToSessionId(String(nextSession.id))
    else setToSessionId('')
  }, [nextSession])

  useEffect(() => {
    if (!fromSessionId) return
    setRows([])
    accountantApi.getCarryForwardEligible({ session_id: fromSessionId })
      .then((response) => setRows(response.data?.students || []))
      .catch(() => toastError('Failed to fetch eligible students'))
  }, [fromSessionId])

  const handleCarryForward = async (studentId) => {
    if (!fromSessionId || !toSessionId) {
      return toastError('Please select both sessions')
    }

    if (isSameSession) {
      return toastError('Carry forward is not allowed within the same session')
    }
    
    setProcessingId(studentId)
    try {
      const response = await accountantApi.carryForwardSingle({ 
        student_id: studentId, 
        from_session_id: fromSessionId, 
        to_session_id: toSessionId 
      })
      
      if (response.success) {
        toastSuccess('Fees carried forward successfully')
        setRows(prev => prev.filter(r => r.student_id !== studentId))
      } else {
        toastError(response.message || 'Failed to carry forward')
      }
    } catch (err) {
      toastError(err.message || 'An error occurred')
    } finally {
      setProcessingId(null)
    }
  }

  const selectStyle = {
    backgroundColor: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-primary)',
    borderRadius: 12,
    padding: '8px 12px',
    fontSize: 13,
    border: '1px solid var(--color-border)',
    outline: 'none',
    width: '100%',
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Carry Forward"
        subtitle="Transfer pending dues from one session to the next"
      />
      <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>From Session</label>
            <select value={fromSessionId} onChange={(event) => setFromSessionId(event.target.value)} style={selectStyle}>
              <option value="">Select source session</option>
              {sourceSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}{session.is_current ? ' (Current)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>To Session</label>
            <select value={toSessionId} onChange={(event) => setToSessionId(event.target.value)} style={selectStyle}>
              <option value="">Select target session</option>
              {targetSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name} (New)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="space-y-2.5">
        {rows.length === 0 ? (
          <div className="rounded-2xl border p-10 text-center" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>No students with pending dues found.</div>
        ) : rows.map((row) => (
          <div key={row.student_id} className="flex items-center justify-between rounded-2xl border px-4 py-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{row.student_name}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{row.class_name} · {row.invoices_count} invoices</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>{formatCurrency(row.total_pending)}</div>
              <button
                type="button"
                onClick={() => handleCarryForward(row.student_id)}
                disabled={processingId === row.student_id || !toSessionId || isSameSession}
                className="rounded-full px-4 py-1.5 text-xs font-medium text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                {processingId === row.student_id ? 'Wait...' : 'Carry Forward'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CarryForward
