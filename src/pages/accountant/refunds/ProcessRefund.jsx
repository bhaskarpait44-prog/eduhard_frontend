import { useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import usePermissions from '@/hooks/usePermissions'
import useToast from '@/hooks/useToast'
import StudentSearchBox from '@/components/accountant/StudentSearchBox'
import * as accountantApi from '@/api/accountantApi'
import { LockedView } from '@/pages/accountant/concessions/ConcessionList'

const ProcessRefund = () => {
  usePageTitle('Process Refund')
  const { can } = usePermissions()
  const { toastSuccess, toastError } = useToast()
  
  const [student, setStudent] = useState(null)
  const [payments, setPayments] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({ amount: '', reason: '', refund_method: 'cash', reference_number: '', payment_id: '' })

  if (!can('fees.refund')) return <LockedView title="Process Refund" />

  const selectStudent = async (selectedStudent) => {
    setStudent(selectedStudent)
    try {
      const response = await accountantApi.getStudentPayments(selectedStudent.id)
      setPayments(response.data?.payments || [])
    } catch (err) {
      toastError('Failed to fetch student payments')
    }
  }

  const handleSubmit = async () => {
    if (!form.payment_id) return toastError('Please select a payment to refund')
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
      return toastError('Please enter a valid refund amount')
    }

    setIsSaving(true)
    try {
      const response = await accountantApi.processRefund({ student_id: student.id, ...form })
      if (response.success) {
        toastSuccess('Refund recorded successfully')
        setForm({ amount: '', reason: '', refund_method: 'cash', reference_number: '', payment_id: '' })
        // Optionally refresh student data
      } else {
        toastError(response.message || 'Failed to record refund')
      }
    } catch (err) {
      toastError(err.message || 'An error occurred while processing refund')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Process Refund</h1>
      </div>
      <StudentSearchBox onSelect={selectStudent} />
      {student && (
        <div className="space-y-4 rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <select 
            value={form.payment_id || ''} 
            onChange={(event) => setForm((current) => ({ ...current, payment_id: event.target.value }))} 
            className="w-full rounded-2xl border px-4 py-3 text-sm" 
            style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <option value="">Select payment to refund</option>
            {payments.map((payment) => (
              <option key={payment.id} value={payment.id}>
                {payment.receipt_no} • {payment.fee_name} • ₹{payment.amount}
              </option>
            ))}
          </select>
          <input 
            value={form.amount} 
            onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} 
            placeholder="Refund amount" 
            className="w-full rounded-2xl border px-4 py-3 text-sm" 
            style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} 
          />
          <input value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Reason" className="w-full rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
          <select value={form.refund_method} onChange={(event) => setForm((current) => ({ ...current, refund_method: event.target.value }))} className="w-full rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
            <option value="cash">Cash</option>
            <option value="online">Online transfer</option>
            <option value="adjustment">Adjustment</option>
          </select>
          <input value={form.reference_number} onChange={(event) => setForm((current) => ({ ...current, reference_number: event.target.value }))} placeholder="Reference number" className="w-full rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
          <button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isSaving || !form.payment_id}
            className="rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50" 
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            {isSaving ? 'Processing...' : 'Record Refund'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ProcessRefund
