// src/pages/fees/CarryForwardModal.jsx
import { useState, useEffect } from 'react'
import { ArrowRightLeft, AlertTriangle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import useFeeStore from '@/store/feeStore'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/utils/helpers'

const CarryForwardModal = ({ open, onClose, student, pendingInvoices, onSuccess }) => {
  const { toastSuccess, toastError } = useToast()
  const { carryForward, isSaving } = useFeeStore()
  const { sessions, fetchSessions } = useSessionStore()

  const [toSessionId, setToSessionId] = useState('')

  const fromSessionId = student?.current_enrollment?.session_id
  const fromSessionName = student?.current_enrollment?.session || 'Unknown Session'
  const toSessionName = sessions?.find(s => String(s.id) === String(toSessionId))?.name || 'Select target session...'

  useEffect(() => {
    fetchSessions().catch(() => {})
  }, [])

  useEffect(() => {
    if (open) setToSessionId('')
  }, [open])

  // Sessions that could be the "to" session
  const availableSessions = (sessions || []).filter(s =>
    (s.status === 'upcoming' || s.status === 'active') && s.id !== fromSessionId
  )

  const totalCarried = pendingInvoices.reduce((sum, inv) => {
    const balance = Number(inv.balance ?? inv.balance_remaining ?? 0)
    return sum + balance
  }, 0)

  const handleConfirm = async () => {
    if (!toSessionId) {
      toastError('Please select a target session')
      return
    }

    if (!fromSessionId) {
      toastError('Could not determine current session')
      return
    }

    const result = await carryForward({
      student_id      : student.id,
      from_session_id : fromSessionId,
      to_session_id   : parseInt(toSessionId),
    })

    if (result.success) {
      const d = result.data
      toastSuccess(
        `${d.invoicesCarried || pendingInvoices.length} invoice(s) carried forward · ₹${d.totalAmountCarried || totalCarried.toFixed(2)}`
      )
      onSuccess?.()
    } else {
      toastError(result.message || 'Failed to carry forward fees')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Carry Forward Pending Fees"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button
            icon={ArrowRightLeft}
            onClick={handleConfirm}
            loading={isSaving}
            disabled={!toSessionId}
          >
            Confirm Carry Forward
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Warning */}
        <div
          className="flex items-start gap-3 p-3 rounded-xl text-sm"
          style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}
        >
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          Pending fees will be moved to the selected session. Original invoices will be marked as "Carried Forward".
        </div>

        {/* Student */}
        {student && (
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ backgroundColor: 'var(--color-brand)' }}
            >
              {student.first_name?.[0]}{student.last_name?.[0]}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {student.first_name} {student.last_name}
              </p>
              <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                {student.admission_no}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Total to carry</p>
              <p className="text-sm font-bold" style={{ color: '#dc2626' }}>{formatCurrency(totalCarried)}</p>
            </div>
          </div>
        )}

        {/* Session Flow Visualizer */}
        <div className="flex items-center justify-between p-4 rounded-xl border text-sm" style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}>
          <div className="flex-1">
            <span className="text-[10px] uppercase font-bold tracking-wider block mb-0.5" style={{ color: 'var(--color-text-muted)' }}>From Session</span>
            <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{fromSessionName}</span>
          </div>
          <div className="flex items-center justify-center px-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)' }}>
              <ArrowRightLeft size={14} className="text-gray-400" />
            </div>
          </div>
          <div className="flex-1 text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider block mb-0.5" style={{ color: 'var(--color-text-muted)' }}>To Session</span>
            <span className="font-semibold text-sm" style={{ color: toSessionId ? 'var(--color-brand)' : 'var(--color-text-muted)' }}>
              {toSessionName}
            </span>
          </div>
        </div>

        {/* Target session */}
        <Select
          label="Carry forward to session"
          required
          value={toSessionId}
          onChange={e => setToSessionId(e.target.value)}
          options={availableSessions.map(s => ({ 
            value: String(s.id), 
            label: `${s.name}${s.is_current ? ' (Current)' : ''}` 
          }))}
          placeholder="Select target session…"
          hint="Student must already be enrolled in the target session"
        />

        {/* Pending invoices list */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>
            {pendingInvoices.length} invoice{pendingInvoices.length !== 1 ? 's' : ''} to carry forward
          </p>
          <div
            className="rounded-xl overflow-hidden max-h-56 overflow-y-auto"
            style={{ border: '1px solid var(--color-border)' }}
          >
            {pendingInvoices.map((inv, i) => {
              const balance = Number(inv.balance ?? inv.balance_remaining ?? 0)
              return (
                <div
                  key={inv.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: i < pendingInvoices.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {inv.fee_name || inv.fee_type_name || inv.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Original due: {formatDate(inv.due_date)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-bold" style={{ color: '#dc2626' }}>
                      {formatCurrency(balance)}
                    </p>
                    <Badge variant={inv.status === 'partial' ? 'yellow' : 'red'}>
                      {inv.status}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default CarryForwardModal
