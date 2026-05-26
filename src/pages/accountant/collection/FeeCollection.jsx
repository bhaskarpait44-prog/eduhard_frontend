import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Printer, Wallet, Calendar, Hash, Landmark, FileEdit } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import StudentSearchBox from '@/components/accountant/StudentSearchBox'
import CollectionStepper from '@/components/accountant/CollectionStepper'
import PaymentModeSelector from '@/components/accountant/PaymentModeSelector'
import ReceiptPrint from '@/components/accountant/ReceiptPrint'
import Input from '@/components/ui/Input'
import useFeeCollection from '@/hooks/useFeeCollection'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency, formatDate } from '@/utils/helpers'

const today = new Date().toISOString().slice(0, 10)

const FeeCollection = () => {
  usePageTitle('Fee Collection')
  const { toastSuccess, toastError, toastWarning } = useToast()
  const { collect, isSaving } = useFeeCollection()
  const [step, setStep] = useState(0)
  const [student, setStudent] = useState(null)
  const [invoicePayload, setInvoicePayload] = useState(null)
  const [selectedInvoices, setSelectedInvoices] = useState([])
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_mode: 'cash',
    payment_date: today,
    reference: '',
    remarks: '',
    bank_name: '',
    cheque_number: '',
    cheque_date: today,
    upi_id: '',
  })
  const [receipt, setReceipt] = useState(null)
  const [errors, setErrors] = useState({})

  const selectedRows = useMemo(
    () => (invoicePayload?.pending_invoices || []).filter((row) => selectedInvoices.includes(row.id)),
    [invoicePayload, selectedInvoices]
  )
  const selectedTotal = selectedRows.reduce((sum, row) => sum + Number(row.balance || 0), 0)

  const selectStudent = async (selectedStudent) => {
    setStudent(selectedStudent)
    try {
      const response = await accountantApi.getStudentPendingInvoices(selectedStudent.id)
      setInvoicePayload(response.data)
      setSelectedInvoices([])
      setPaymentData((current) => ({ ...current, amount: '' }))
      setStep(1)
    } catch (error) {
      toastError(error.message || 'Failed to load pending invoices')
    }
  }

  const toggleInvoice = (invoiceId) => {
    setSelectedInvoices((current) => current.includes(invoiceId) ? current.filter((id) => id !== invoiceId) : [...current, invoiceId])
  }

  const moveToPayment = () => {
    if (selectedInvoices.length === 0) {
      toastWarning('Please select at least one invoice to proceed')
      return
    }
    setPaymentData((current) => ({ ...current, amount: selectedTotal.toFixed(2) }))
    setStep(2)
  }

  const validateStep2 = () => {
    const newErrors = {}
    const amountNum = parseFloat(paymentData.amount)

    if (!paymentData.amount || isNaN(amountNum)) {
      newErrors.amount = 'Valid amount is required'
    } else if (amountNum <= 0) {
      newErrors.amount = 'Amount must be greater than zero'
    } else if (amountNum > selectedTotal) {
      newErrors.amount = `Amount cannot exceed total due (${formatCurrency(selectedTotal)})`
    }

    if (!paymentData.payment_date) {
      newErrors.payment_date = 'Payment date is required'
    }

    if (paymentData.payment_mode === 'cheque') {
      if (!paymentData.cheque_number) newErrors.cheque_number = 'Cheque number is required'
      if (!paymentData.bank_name) newErrors.bank_name = 'Bank name is required'
    }

    if (paymentData.payment_mode === 'upi') {
      if (!paymentData.upi_id) newErrors.upi_id = 'UPI ID is required'
      if (!paymentData.bank_name) newErrors.bank_name = 'Bank / App name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const confirmCollection = async () => {
    try {
      const response = await collect({
        student_id: student.id,
        invoice_ids: selectedInvoices,
        ...paymentData,
      })
      toastSuccess('Receipt generated successfully')
      setReceipt({
        ...response,
        student_name: `${student.first_name} ${student.last_name}`,
        admission_no: student.admission_no,
        class_name: student.class_name,
        section_name: student.section_name,
        amount: response.total_applied,
        payment_mode: paymentData.payment_mode,
        payment_date: paymentData.payment_date,
        fee_name: selectedRows.map((row) => row.fee_name).join(', '),
      })
      setStep(4)
    } catch (error) {
      toastError(error.message || 'Failed to collect fee')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Counter Fee Collection</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Fast keyboard-friendly collection workflow for repeated daily use.</p>
          </div>
          <CollectionStepper step={step} />
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <StudentSearchBox onSelect={selectStudent} autoFocus />
          </div>
        )}

        {step === 1 && student && (
          <div className="space-y-5">
            <div className="rounded-[24px] border p-4 shadow-sm" style={{ backgroundColor: 'var(--color-accent-subtle)', borderColor: 'var(--color-accent-muted)' }}>
              <div className="text-lg font-bold" style={{ color: 'var(--color-accent-emphasis)' }}>{student.first_name} {student.last_name}</div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-accent-emphasis)' }}>
                {student.admission_no} | {invoicePayload?.student?.class_name || student.class_name} {invoicePayload?.student?.section_name ? `Section ${invoicePayload.student.section_name}` : ''}
              </div>
              <div className="mt-2 text-sm font-bold" style={{ color: Number(invoicePayload?.summary?.balance || 0) > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                Total pending: {formatCurrency(invoicePayload?.summary?.balance || 0)}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setSelectedInvoices((invoicePayload?.pending_invoices || []).map((row) => row.id))} className="rounded-full border px-3 py-2 text-xs font-semibold transition-colors hover:bg-brand/10" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>Select All Pending</button>
              <button type="button" onClick={() => setSelectedInvoices([])} className="rounded-full border px-3 py-2 text-xs font-semibold transition-colors hover:bg-surface-raised" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>Clear Selection</button>
            </div>

            <div className="space-y-3">
              {(invoicePayload?.pending_invoices || []).map((invoice) => {
                const overdue = new Date(invoice.due_date) < new Date(today)
                const selected = selectedInvoices.includes(invoice.id)
                return (
                  <label key={invoice.id} className="flex cursor-pointer items-start gap-3 rounded-[22px] border px-4 py-4 transition-all hover:border-brand/40" style={{ borderColor: selected ? 'var(--color-brand)' : 'var(--color-border)', backgroundColor: selected ? 'var(--color-accent-subtle)' : 'var(--color-surface)' }}>
                    <input type="checkbox" checked={selected} onChange={() => toggleInvoice(invoice.id)} className="mt-1 accent-brand" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{invoice.fee_name}</span>
                        {overdue && <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-black text-danger border border-danger/20">OVERDUE</span>}
                      </div>
                      <div className="mt-1 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        Due {formatDate(invoice.due_date)} | Amount {formatCurrency(invoice.balance)}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>

            <div className="flex items-center justify-between rounded-[22px] border px-5 py-5 shadow-sm" style={{ backgroundColor: 'var(--color-accent-subtle)', borderColor: 'var(--color-accent-muted)' }}>
              <div>
                <div className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-accent-emphasis)' }}>Selected Total</div>
                <div className="text-xs font-medium" style={{ color: 'var(--color-accent-emphasis)', opacity: 0.8 }}>{selectedInvoices.length} item(s) to be collected</div>
              </div>
              <div className="text-2xl font-black" style={{ color: 'var(--color-accent-emphasis)' }}>{formatCurrency(selectedTotal)}</div>
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(0)} className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold" style={{ borderColor: 'var(--color-border)' }}>
                <ArrowLeft size={16} />
                Back
              </button>
              <button type="button" onClick={moveToPayment} className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg" style={{ backgroundColor: 'var(--color-brand)' }}>
                Next
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-[24px] border px-6 py-4 shadow-sm" style={{ backgroundColor: 'var(--color-accent-subtle)', borderColor: 'var(--color-accent-muted)' }}>
              <div className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-accent-emphasis)' }}>Total to Collect</div>
              <div className="text-2xl font-black" style={{ color: 'var(--color-accent-emphasis)' }}>{formatCurrency(selectedTotal)}</div>
            </div>

            <div className="rounded-[22px] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <div className="mb-4 text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Payment Mode</div>
              <PaymentModeSelector value={paymentData.payment_mode} onChange={(payment_mode) => setPaymentData((current) => ({ ...current, payment_mode }))} />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Input 
                label="Collection Amount" 
                icon={Wallet}
                value={paymentData.amount} 
                onChange={(e) => { setPaymentData({ ...paymentData, amount: e.target.value }); setErrors({ ...errors, amount: '' }) }} 
                placeholder="0.00"
                error={errors.amount}
                required
              />
              <Input 
                type="date"
                label="Payment Date" 
                icon={Calendar}
                max={today} 
                value={paymentData.payment_date} 
                onChange={(e) => { setPaymentData({ ...paymentData, payment_date: e.target.value }); setErrors({ ...errors, payment_date: '' }) }} 
                error={errors.payment_date}
                required
              />
              <Input 
                label="Reference / Transaction ID" 
                icon={Hash}
                value={paymentData.reference} 
                onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })} 
                placeholder="Optional ID" 
              />
              <Input 
                label={paymentData.payment_mode === 'upi' ? "Bank / App Name" : "Bank Name"}
                icon={Landmark}
                value={paymentData.bank_name} 
                onChange={(e) => { setPaymentData({ ...paymentData, bank_name: e.target.value }); setErrors({ ...errors, bank_name: '' }) }} 
                placeholder={paymentData.payment_mode === 'upi' ? "e.g. GPay, PhonePe, HDFC" : "e.g. HDFC Bank"} 
                error={errors.bank_name}
                required={['cheque', 'upi'].includes(paymentData.payment_mode)}
              />
              {paymentData.payment_mode === 'upi' && (
                <Input 
                  label="UPI ID (VPA)" 
                  icon={Hash}
                  value={paymentData.upi_id} 
                  onChange={(e) => { setPaymentData({ ...paymentData, upi_id: e.target.value }); setErrors({ ...errors, upi_id: '' }) }} 
                  placeholder="e.g. school@upi" 
                  error={errors.upi_id}
                  required
                />
              )}
              {paymentData.payment_mode === 'cheque' && (
                <>
                  <Input 
                    label="Cheque Number" 
                    icon={Hash}
                    value={paymentData.cheque_number} 
                    onChange={(e) => { setPaymentData({ ...paymentData, cheque_number: e.target.value }); setErrors({ ...errors, cheque_number: '' }) }} 
                    placeholder="6-digit number" 
                    error={errors.cheque_number}
                    required
                  />
                  <Input 
                    type="date"
                    label="Cheque Date" 
                    icon={Calendar}
                    value={paymentData.cheque_date} 
                    onChange={(e) => setPaymentData({ ...paymentData, cheque_date: e.target.value })} 
                  />
                </>
              )}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Remarks</label>
              <textarea 
                value={paymentData.remarks} 
                onChange={(event) => setPaymentData((current) => ({ ...current, remarks: event.target.value }))} 
                rows={3} 
                placeholder="Any internal notes..." 
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all focus:border-brand" 
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} 
              />
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold" style={{ borderColor: 'var(--color-border)' }}>
                <ArrowLeft size={16} />
                Back
              </button>
              <button 
                type="button" 
                onClick={() => validateStep2() && setStep(3)} 
                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg" 
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                Review
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-[24px] border p-6" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
                <FileEdit size={16} className="text-brand" />
                Review and Confirm
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-2xl bg-gray-50 p-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <div className="flex justify-between"><span>Student</span><span className="font-bold text-text-primary">{student.first_name} {student.last_name}</span></div>
                  <div className="flex justify-between"><span>Invoices</span><span className="font-bold text-text-primary">{selectedRows.length}</span></div>
                  <div className="flex justify-between"><span>Payment Mode</span><span className="font-bold uppercase text-text-primary">{paymentData.payment_mode}</span></div>
                  <div className="flex justify-between"><span>Date</span><span className="font-bold text-text-primary">{formatDate(paymentData.payment_date)}</span></div>
                </div>
                <div className="flex flex-col items-center justify-center rounded-2xl bg-brand/10 p-4">
                  <span className="text-xs font-bold uppercase text-brand">Total Collection</span>
                  <span className="mt-1 text-3xl font-black text-brand">{formatCurrency(paymentData.amount || 0)}</span>
                </div>
              </div>
              <div className="mt-6 space-y-2 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
                <div className="text-xs font-bold uppercase tracking-widest text-muted mb-2">Item Breakdown</div>
                {selectedRows.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--color-text-primary)' }}>{invoice.fee_name}</span>
                    <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(invoice.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold" style={{ borderColor: 'var(--color-border)' }}>
                <ArrowLeft size={16} />
                Back
              </button>
              <button type="button" disabled={isSaving} onClick={confirmCollection} className="inline-flex items-center gap-2 rounded-full px-8 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-60" style={{ backgroundColor: 'var(--color-brand)' }}>
                {isSaving ? 'Processing...' : 'Confirm & Generate Receipt'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && receipt && (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 shadow-sm">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Collection Successful</h2>
                <p className="mt-1 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Receipt {receipt.receipt_no} has been recorded.</p>
              </div>
            </div>
            <ReceiptPrint receipt={receipt} />
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-semibold shadow-sm transition-all hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                <Printer size={16} />
                Print Receipt
              </button>
              <button type="button" onClick={() => { setStep(0); setStudent(null); setReceipt(null); setInvoicePayload(null); setSelectedInvoices([]) }} className="rounded-full px-8 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg" style={{ backgroundColor: 'var(--color-brand)' }}>
                Collect Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FeeCollection
