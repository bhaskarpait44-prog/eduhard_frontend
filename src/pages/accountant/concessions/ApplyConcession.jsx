import { useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import usePermissions from '@/hooks/usePermissions'
import useToast from '@/hooks/useToast'
import StudentSearchBox from '@/components/accountant/StudentSearchBox'
import * as accountantApi from '@/api/accountantApi'
import { LockedView } from './ConcessionList'
import { formatCurrency } from '@/utils/helpers'
import PageHeader from '@/components/ui/PageHeader'

const ApplyConcession = () => {
  usePageTitle('Apply Concession')
  const { can } = usePermissions()
  const { toastSuccess, toastError } = useToast()
  
  const [student, setStudent] = useState(null)
  const [invoiceData, setInvoiceData] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const [form, setForm] = useState({
    invoice_id: '',
    concession_type: 'percentage',
    concession_value: '',
    reason: 'Financial hardship',
    approval_reference: '',
    remarks: '',
  })

  if (!can('fees.waive')) {
    return <LockedView title="Apply Concession" />
  }

  const selectStudent = async (selectedStudent) => {
    setStudent(selectedStudent)
    setForm(prev => ({ ...prev, invoice_id: '' }))
    try {
      const response = await accountantApi.getStudentPendingInvoices(selectedStudent.id)
      setInvoiceData(response.data)
    } catch (err) {
      toastError('Failed to fetch pending invoices')
    }
  }

  const allInvoices = [
    ...(invoiceData?.pending_invoices || []),
    ...(invoiceData?.carried_forward_invoices || [])
  ]

  const selectedInvoice = allInvoices.find((invoice) => String(invoice.id) === String(form.invoice_id))
  
  // Bug 5 & 9 Fix: Use amount_due as base per backend logic
  const originalAmount = Number(selectedInvoice?.amount_due || 0)
  const currentBalance = Number(selectedInvoice?.balance || 0)
  
  const concessionAmount = form.concession_type === 'percentage'
    ? (originalAmount * Number(form.concession_value || 0)) / 100
    : form.concession_type === 'fixed'
      ? Number(form.concession_value || 0)
      : originalAmount

  const handleSubmit = async () => {
    if (!form.invoice_id) return toastError('Please select an invoice')
    if (concessionAmount <= 0) return toastError('Invalid concession amount')
    
    setIsSaving(true)
    try {
      const response = await accountantApi.applyConcession(form)
      if (response.success) {
        toastSuccess('Concession applied successfully')
        // Reset form but keep student selected (refresh invoices)
        setForm({
          invoice_id: '',
          concession_type: 'percentage',
          concession_value: '',
          reason: 'Financial hardship',
          approval_reference: '',
          remarks: '',
        })
        const refresh = await accountantApi.getStudentPendingInvoices(student.id)
        setInvoiceData(refresh.data)
      } else {
        toastError(response.message || 'Failed to apply concession')
      }
    } catch (err) {
      toastError(err.message || 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Apply Concession" subtitle="Apply fee waivers or discounts to student invoices" />
      <StudentSearchBox onSelect={selectStudent} />
      {student && (
        <div className="space-y-4 rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <select 
            value={form.invoice_id} 
            onChange={(event) => setForm((current) => ({ ...current, invoice_id: event.target.value }))} 
            className="w-full rounded-2xl border px-4 py-3 text-sm" 
            style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <option value="">Select Invoice</option>
            {allInvoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.fee_name} • Due: {formatCurrency(invoice.amount_due)} • Balance: {formatCurrency(invoice.balance)}
                {invoice.is_carried_forward ? ' (Carried Forward)' : ''}
              </option>
            ))}
          </select>
          <div className="grid gap-4 md:grid-cols-2">
            <select value={form.concession_type} onChange={(event) => setForm((current) => ({ ...current, concession_type: event.target.value }))} className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
              <option value="full">Full Waiver</option>
            </select>
            <input 
              value={form.concession_value} 
              onChange={(event) => setForm((current) => ({ ...current, concession_value: event.target.value }))} 
              placeholder="Concession value" 
              className="rounded-2xl border px-4 py-3 text-sm" 
              disabled={form.concession_type === 'full'}
              style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} 
            />
            <input value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Reason" className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
            <input value={form.approval_reference} onChange={(event) => setForm((current) => ({ ...current, approval_reference: event.target.value }))} placeholder="Approval reference" className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
          </div>
          <textarea value={form.remarks} onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))} rows={4} placeholder="Remarks" className="w-full rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
          <div className="rounded-[22px] border p-4 text-sm space-y-1" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex justify-between">
              <span>Original Fee (Amount Due):</span>
              <span className="font-semibold">{formatCurrency(originalAmount)}</span>
            </div>
            <div className="flex justify-between" style={{ color: 'var(--color-danger)' }}>
              <span>Concession Amount:</span>
              <span className="font-semibold">- {formatCurrency(concessionAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 mt-1 font-bold" style={{ borderColor: 'var(--color-border)' }}>
              <span>Effective Balance After Concession:</span>
              <span>{formatCurrency(Math.max(currentBalance - concessionAmount, 0))}</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isSaving || !form.invoice_id}
            className="rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50" 
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            {isSaving ? 'Processing...' : 'Confirm Waiver'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ApplyConcession
