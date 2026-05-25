import { useEffect, useMemo, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency } from '@/utils/helpers'
import useSessionStore from '@/store/sessionStore'

const CarryForward = () => {
  usePageTitle('Carry Forward')
  const { toastSuccess, toastError } = useToast()
  
  const [rows, setRows] = useState([])
  const [fromSessionId, setFromSessionId] = useState('')
  const [toSessionId, setToSessionId] = useState('')
  const [processingId, setProcessingId] = useState(null)
  
  const { sessions, currentSession, fetchSessions, fetchCurrentSession } = useSessionStore()

  useEffect(() => {
    fetchSessions().catch(() => {})
    fetchCurrentSession().catch(() => {})
    accountantApi.getCarryForwardEligible()
      .then((response) => setRows(response.data?.students || []))
      .catch(() => toastError('Failed to fetch eligible students'))
  }, [])

  useEffect(() => {
    if (currentSession?.id && !fromSessionId) setFromSessionId(String(currentSession.id))
  }, [currentSession, fromSessionId])

  const nextSession = useMemo(
    () => (sessions || []).find((session) => String(session.id) !== String(fromSessionId)),
    [sessions, fromSessionId]
  )

  useEffect(() => {
    if (nextSession?.id && !toSessionId) setToSessionId(String(nextSession.id))
  }, [nextSession, toSessionId])

  const handleCarryForward = async (studentId) => {
    if (!fromSessionId || !toSessionId) {
      return toastError('Please select both sessions')
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

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Carry Forward</h1>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <select value={fromSessionId} onChange={(event) => setFromSessionId(event.target.value)} className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
            <option value="">From Session</option>
            {(sessions || []).map((session) => <option key={session.id} value={session.id}>{session.name}</option>)}
          </select>
          <select value={toSessionId} onChange={(event) => setToSessionId(event.target.value)} className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
            <option value="">To Session</option>
            {(sessions || []).map((session) => <option key={session.id} value={session.id}>{session.name}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No students with pending dues found.</div>
        ) : rows.map((row) => (
          <div key={row.student_id} className="flex items-center justify-between rounded-[22px] border px-4 py-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.student_name}</div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.class_name} • {row.invoices_count} invoices</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-red-700">{formatCurrency(row.total_pending)}</div>
              <button
                type="button"
                onClick={() => handleCarryForward(row.student_id)}
                disabled={processingId === row.student_id}
                className="rounded-full px-4 py-2 text-xs font-semibold text-white transition-opacity disabled:opacity-50"
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
