import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Download, Receipt, RefreshCw, QrCode, Info, ChevronRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentMyFees from '@/hooks/useStudentMyFees'
import useToast from '@/hooks/useToast'
import * as studentApi from '@/api/studentApi'
import { ROUTES } from '@/constants/app'
import { formatCurrency, formatDate } from '@/utils/helpers'
import FeeProgressBar from '@/components/student/FeeProgressBar'
import FeeInvoiceCard from '@/components/student/FeeInvoiceCard'

const filters = ['all', 'pending', 'paid', 'partial', 'waived', 'carried_forward']

const MyFees = () => {
  usePageTitle('My Fees')

  const navigate = useNavigate()
  const { toastError, toastInfo, toastSuccess } = useToast()
  const {
    summary,
    invoices,
    carriedForwardInvoices,
    schoolUpi,
    schoolName,
    loading,
    refreshing,
    detailLoading,
    selectedInvoice,
    error,
    refresh,
    openInvoice,
    closeInvoice,
    fetchReceipt,
  } = useStudentMyFees()

  const [filter, setFilter] = useState('all')

  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')
  const [upiAmount, setUpiAmount] = useState('')
  const [upiTxId, setUpiTxId] = useState('')
  const [upiNote, setUpiNote] = useState('')
  const [upiConfirm, setUpiConfirm] = useState(false)
  const [submittingUpi, setSubmittingUpi] = useState(false)

  const unpaidInvoices = useMemo(() => {
    return [...carriedForwardInvoices, ...invoices].filter(
      (inv) => inv.balance_remaining > 0
    )
  }, [carriedForwardInvoices, invoices])

  const selectedInvoiceForUpi = useMemo(() => {
    return unpaidInvoices.find((inv) => String(inv.id) === String(selectedInvoiceId))
  }, [unpaidInvoices, selectedInvoiceId])

  useEffect(() => {
    if (unpaidInvoices.length > 0) {
      const isValid = unpaidInvoices.some((inv) => String(inv.id) === String(selectedInvoiceId))
      if (!isValid) {
        setSelectedInvoiceId(String(unpaidInvoices[0].id))
      }
    } else {
      setSelectedInvoiceId('')
    }
  }, [unpaidInvoices, selectedInvoiceId])

  useEffect(() => {
    if (selectedInvoiceForUpi) {
      setUpiAmount(String(selectedInvoiceForUpi.balance_remaining || ''))
      setUpiTxId('')
      setUpiNote('')
      setUpiConfirm(false)
    } else {
      setUpiAmount('')
      setUpiTxId('')
      setUpiNote('')
      setUpiConfirm(false)
    }
  }, [selectedInvoiceForUpi])

  const handleUpiSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedInvoiceForUpi) {
      return toastError('Please select a pending invoice.')
    }
    
    const trimmedAmount = upiAmount.trim()
    const trimmedTxId = upiTxId.trim()
    const trimmedNote = upiNote.trim()

    const amt = parseFloat(trimmedAmount)
    if (isNaN(amt) || amt <= 0) {
      return toastError('Please enter a valid amount greater than 0.')
    }
    if (amt > selectedInvoiceForUpi.balance_remaining) {
      return toastError(`Amount cannot exceed the remaining balance of ${formatCurrency(selectedInvoiceForUpi.balance_remaining)}.`)
    }

    const txIdRegex = /^[a-zA-Z0-9]{8,18}$/
    if (!txIdRegex.test(trimmedTxId)) {
      return toastError('Invalid transaction ID. Must be 8-18 alphanumeric characters without spaces.')
    }

    if (!upiConfirm) {
      return toastError('Please confirm the payment certification checkbox.')
    }

    setSubmittingUpi(true)
    try {
      await studentApi.createStudentUpiPaymentRequest({
        invoice_id: selectedInvoiceForUpi.id,
        amount: amt,
        upi_transaction_id: trimmedTxId,
        student_note: trimmedNote || null,
      })
      toastSuccess('Payment reference submitted successfully for verification!')
      setUpiTxId('')
      setUpiNote('')
      setUpiConfirm(false)
      await refresh()
    } catch (err) {
      toastError(err?.message || 'Failed to submit payment reference.')
    } finally {
      setSubmittingUpi(false)
    }
  }

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const filteredInvoices = useMemo(() => {
    if (filter === 'all') return invoices
    return invoices.filter((invoice) => invoice.status === filter)
  }, [filter, invoices])

  const miniCards = [
    { label: 'This Month Due', value: formatCurrency(sumByStatus(invoices, ['pending', 'partial'])), tone: '#dc2626' },
    { label: 'Paid', value: formatCurrency(summary?.total_paid || 0), tone: '#16a34a' },
    { label: 'Balance', value: formatCurrency(summary?.total_pending || 0), tone: Number(summary?.total_pending || 0) > 0 ? '#dc2626' : '#16a34a' },
  ]

  const handleRefresh = async () => {
    toastInfo('Refreshing fee details')
    try {
      await refresh()
    } catch {}
  }

  const upiQrUrl = useMemo(() => {
    if (!schoolUpi) return null
    let upiLink = `upi://pay?pa=${schoolUpi}&pn=${encodeURIComponent(schoolName || 'School')}&cu=INR`
    const amt = parseFloat(upiAmount)
    if (!isNaN(amt) && amt > 0) {
      upiLink += `&am=${amt}`
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`
  }, [schoolUpi, schoolName, upiAmount])

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(109,40,217,0.16), rgba(239,68,68,0.05) 52%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--student-accent)' }}>
              {schoolName || 'Student Fees'}
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">My Fees</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
              Track session fees, see pending balances, open invoice details, and review payment history and receipts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleRefresh} loading={refreshing} icon={RefreshCw}>
              Refresh
            </Button>
            <Button variant="secondary" onClick={() => navigate(ROUTES.STUDENT_FEE_PAYMENTS)} icon={Receipt}>
              Payment History
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <FeesSkeleton />
      ) : (
        <>
          <FeeProgressBar summary={summary} />

          <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
            <div className="space-y-6">
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {miniCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-[24px] border p-4"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{card.label}</p>
                    <p className="mt-2 text-2xl font-bold" style={{ color: card.tone }}>{card.value}</p>
                  </div>
                ))}
              </section>

              {carriedForwardInvoices.length > 0 && (
                <section
                  className="rounded-[28px] border p-5"
                  style={{ borderColor: '#93c5fd', backgroundColor: 'rgba(37,99,235,0.06)' }}
                >
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Carried from Previous Session</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    These invoices include balances carried forward into the current session.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    {carriedForwardInvoices.map((invoice) => (
                      <FeeInvoiceCard key={invoice.id} invoice={invoice} onOpen={(row) => openInvoice(row.id).catch((err) => toastError(err?.message || 'Unable to load invoice detail.'))} />
                    ))}
                  </div>
                </section>
              )}

              <section
                className="rounded-[28px] border p-5"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Current Session Invoices</h2>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      Tap any invoice card to view details and payment history.
                    </p>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {filters.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setFilter(item)}
                        className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] whitespace-nowrap"
                        style={{
                          backgroundColor: filter === item ? 'var(--student-accent)' : 'var(--color-surface-raised)',
                          color: filter === item ? '#fff' : 'var(--color-text-secondary)',
                        }}
                      >
                        {item.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4">
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice) => (
                      <FeeInvoiceCard
                        key={invoice.id}
                        invoice={invoice}
                        onOpen={(row) => openInvoice(row.id).catch((err) => toastError(err?.message || 'Unable to load invoice detail.'))}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon={CreditCard}
                      title="No invoices in this filter"
                      description="Try another fee status filter to see your invoices."
                    />
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              {upiQrUrl && Number(summary?.total_pending || 0) > 0 && (
                <section
                  className="rounded-[28px] border p-6 text-center"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                >
                  <div className="flex items-center justify-center gap-2 text-brand mb-4">
                    <QrCode size={20} />
                    <h3 className="font-bold text-lg">Pay via UPI</h3>
                  </div>
                  
                  <div className="bg-white p-4 rounded-3xl inline-block shadow-sm border border-border mb-4">
                    <img 
                      src={upiQrUrl} 
                      alt="School UPI QR" 
                      className="w-48 h-48 rounded-xl mx-auto"
                    />
                  </div>

                  <div className="mb-4 text-center">
                    <p className="text-xs text-[var(--color-text-muted)]">Payee Name: <span className="font-semibold text-[var(--color-text-primary)]">{schoolName}</span></p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">UPI ID: <span className="font-bold text-brand select-all">{schoolUpi}</span></p>
                  </div>
                  
                  <p className="text-sm font-bold text-[var(--color-text-primary)] mb-1">
                    Scan to pay any amount
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mb-5">
                    Use any UPI app (GPay, PhonePe, Paytm etc.)
                  </p>

                  <div className="mt-6 border-t pt-6 text-left">
                    <h4 className="font-bold text-sm text-[var(--color-text-primary)] mb-4">Submit UPI Reference</h4>
                    
                    {unpaidInvoices.length === 0 ? (
                      <p className="text-xs text-[var(--color-text-muted)] italic">No pending invoices to submit payments for.</p>
                    ) : (
                      <form onSubmit={handleUpiSubmit} className="space-y-4">
                        <Select
                          label="Select Invoice"
                          value={selectedInvoiceId}
                          onChange={(e) => setSelectedInvoiceId(e.target.value)}
                          options={unpaidInvoices.map((inv) => ({
                            value: String(inv.id),
                            label: `${inv.fee_type_name} (${inv.period}) - Bal: ${formatCurrency(inv.balance_remaining)}`
                          }))}
                          required
                          className="text-xs px-3 border h-9 rounded-xl"
                        />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                              Amount Paid (INR) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={upiAmount}
                              onChange={(e) => setUpiAmount(e.target.value)}
                              placeholder={selectedInvoiceForUpi ? `Max ${selectedInvoiceForUpi.balance_remaining}` : ''}
                              className="w-full text-xs px-3 border outline-none h-9 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                              style={{ borderColor: 'var(--color-border)' }}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                              UPI Txn ID / UTR * (8-18 chars)
                            </label>
                            <input
                              type="text"
                              value={upiTxId}
                              onChange={(e) => setUpiTxId(e.target.value)}
                              placeholder="e.g. 612345678901"
                              className="w-full text-xs px-3 border outline-none h-9 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                              style={{ borderColor: 'var(--color-border)' }}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                            Student Note (Optional)
                          </label>
                          <input
                            type="text"
                            value={upiNote}
                            onChange={(e) => setUpiNote(e.target.value)}
                            placeholder="Any additional details"
                            className="w-full text-xs px-3 border outline-none h-9 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                            style={{ borderColor: 'var(--color-border)' }}
                          />
                        </div>

                        <div className="flex items-start gap-2 pt-1">
                          <input
                            type="checkbox"
                            id="confirmCheckbox"
                            checked={upiConfirm}
                            onChange={(e) => setUpiConfirm(e.target.checked)}
                            className="mt-0.5 shrink-0"
                            required
                          />
                          <label htmlFor="confirmCheckbox" className="text-[10px] text-[var(--color-text-secondary)] font-medium leading-tight select-none cursor-pointer">
                            I certify that the transaction ID is correct and corresponds to a successful transfer of INR {upiAmount || '0'} to the school's account.
                          </label>
                        </div>

                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          className="w-full rounded-xl font-bold mt-2"
                          loading={submittingUpi}
                          disabled={submittingUpi || !upiConfirm || !upiAmount || !upiTxId || !selectedInvoiceId}
                        >
                          Submit for Verification
                        </Button>
                      </form>
                    )}
                  </div>
                </section>
              )}

              <section
                className="rounded-[28px] border p-5"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
              >
                <h3 className="font-semibold text-[var(--color-text-primary)]">Quick Links</h3>
                <div className="mt-4 space-y-2">
                  <QuickLink 
                    label="Payment History" 
                    icon={Receipt} 
                    onClick={() => navigate(ROUTES.STUDENT_FEE_PAYMENTS)} 
                  />
                  <QuickLink 
                    label="Download Receipts" 
                    icon={Download} 
                    onClick={() => navigate(ROUTES.STUDENT_FEE_PAYMENTS)} 
                  />
                </div>
              </section>
            </aside>
          </div>
        </>
      )}

      <Modal
        open={Boolean(selectedInvoice)}
        onClose={closeInvoice}
        title="Invoice Detail"
        size="lg"
        footer={
          <div className="flex w-full justify-between gap-3">
            <Button variant="secondary" onClick={closeInvoice}>Close</Button>
            <Button variant="secondary" onClick={() => navigate(ROUTES.STUDENT_FEE_PAYMENTS)} icon={Receipt}>
              All Payments
            </Button>
          </div>
        }
      >
        {detailLoading && !selectedInvoice ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 rounded-2xl bg-[var(--color-surface-raised)]" />
            <div className="h-36 rounded-2xl bg-[var(--color-surface-raised)]" />
          </div>
        ) : selectedInvoice && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoCard label="Fee Type" value={selectedInvoice.fee_type_name} />
              <InfoCard label="Period" value={selectedInvoice.period} />
              <InfoCard label="Due Date" value={formatDate(selectedInvoice.due_date, 'long')} />
              <InfoCard label="Status" value={selectedInvoice.status} />
              <InfoCard label="Original Amount" value={formatCurrency(selectedInvoice.original_amount)} />
              <InfoCard label="Total Payable" value={formatCurrency(selectedInvoice.total_payable)} />
              <InfoCard label="Concession" value={formatCurrency(selectedInvoice.concession_amount || 0)} />
              <InfoCard label="Late Fee" value={formatCurrency(selectedInvoice.late_fee_amount || 0)} />
              <InfoCard label="Amount Paid" value={formatCurrency(selectedInvoice.amount_paid || 0)} />
              <InfoCard label="Balance Remaining" value={formatCurrency(selectedInvoice.balance_remaining || 0)} />
            </div>



            <section
              className="rounded-[24px] border p-4"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
            >
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Payment History for This Invoice</h3>
              <div className="mt-4 space-y-3">
                {selectedInvoice.payments?.length ? selectedInvoice.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-3 rounded-[18px] border px-3 py-3"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{formatCurrency(payment.amount)}</p>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                        {formatDate(payment.payment_date, 'short')} • {String(payment.payment_mode || '').toUpperCase()} • {payment.receipt_no || 'No receipt no'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Download}
                      onClick={async () => {
                        try {
                          const receipt = await fetchReceipt(payment.id)
                          toastSuccess(`Receipt ${receipt?.receipt_no || payment.receipt_no || 'loaded'}`)
                          navigate(ROUTES.STUDENT_FEE_PAYMENTS)
                        } catch (err) {
                          toastError(err?.message || 'Unable to load receipt.')
                        }
                      }}
                    >
                      Receipt
                    </Button>
                  </div>
                )) : (
                  <EmptyState
                    icon={Receipt}
                    title="No payments on this invoice yet"
                    description="Payment rows will appear here when any amount is recorded."
                    className="py-10"
                  />
                )}
              </div>
            </section>
          </div>
        )}
      </Modal>
    </div>
  )
}

const InfoCard = ({ label, value }) => (
  <div className="rounded-[20px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value || '--'}</p>
  </div>
)

const QuickLink = ({ label, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-transparent p-3 text-sm font-medium transition-all hover:border-[var(--color-border)] hover:bg-[var(--color-surface)]"
    style={{ color: 'var(--color-text-primary)' }}
  >
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-surface)] shadow-sm">
        <Icon size={16} className="text-[var(--student-accent)]" />
      </div>
      {label}
    </div>
    <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
  </button>
)

const FeesSkeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="rounded-[28px] bg-[var(--color-surface)] p-10" />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-24 rounded-[24px] bg-[var(--color-surface)]" />)}
    </div>
    <div className="rounded-[28px] bg-[var(--color-surface)] p-12" />
  </div>
)

function sumByStatus(invoices, statuses) {
  return invoices
    .filter((invoice) => statuses.includes(invoice.status))
    .reduce((sum, invoice) => sum + Number(invoice.balance_remaining || 0), 0)
}

export default MyFees
