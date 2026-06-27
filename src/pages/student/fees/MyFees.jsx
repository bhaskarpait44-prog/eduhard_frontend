import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard, Download, Receipt, RefreshCw, QrCode, ChevronRight,
  AlertCircle, CheckCircle2, Clock, Wallet, TrendingDown, BadgeIndianRupee,
  CalendarClock, Hash, FileText, ArrowRight,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentMyFees from '@/hooks/useStudentMyFees'
import useToast from '@/hooks/useToast'
import * as studentApi from '@/api/studentApi'
import { ROUTES } from '@/constants/app'
import { formatCurrency, formatDate, getFeeMonthLabel } from '@/utils/helpers'
import FeeProgressBar from '@/components/student/FeeProgressBar'
import FeeInvoiceCard from '@/components/student/FeeInvoiceCard'

const filters = ['all', 'pending', 'paid', 'partial', 'waived', 'carried_forward']

const STATUS_META = {
  pending:          { color: '#dc2626', bg: 'rgba(220,38,38,0.08)',   border: '#fca5a5', icon: AlertCircle,    label: 'Pending'          },
  partial:          { color: '#d97706', bg: 'rgba(245,158,11,0.08)',  border: '#fcd34d', icon: Clock,          label: 'Partial'          },
  paid:             { color: '#16a34a', bg: 'rgba(22,163,74,0.08)',   border: '#86efac', icon: CheckCircle2,   label: 'Paid'             },
  waived:           { color: '#6d28d9', bg: 'rgba(124,58,237,0.08)', border: '#c4b5fd', icon: CheckCircle2,   label: 'Waived'           },
  carried_forward:  { color: '#2563eb', bg: 'rgba(37,99,235,0.08)',  border: '#93c5fd', icon: ArrowRight,     label: 'Carried Forward'  },
}

const MyFees = () => {
  usePageTitle('My Fees')

  const navigate  = useNavigate()
  const { toastError, toastInfo, toastSuccess } = useToast()
  const {
    summary, invoices, carriedForwardInvoices,
    schoolUpi, schoolName,
    loading, refreshing, detailLoading, selectedInvoice, error,
    refresh, openInvoice, closeInvoice, fetchReceipt,
  } = useStudentMyFees()

  const [filter, setFilter] = useState('all')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')
  const [upiAmount, setUpiAmount]   = useState('')
  const [upiTxId, setUpiTxId]       = useState('')
  const [upiNote, setUpiNote]       = useState('')
  const [upiConfirm, setUpiConfirm] = useState(false)
  const [submittingUpi, setSubmittingUpi] = useState(false)

  const unpaidInvoices = useMemo(() =>
    [...carriedForwardInvoices, ...invoices].filter(inv => inv.balance_remaining > 0),
    [carriedForwardInvoices, invoices]
  )

  const selectedInvoiceForUpi = useMemo(() =>
    unpaidInvoices.find(inv => String(inv.id) === String(selectedInvoiceId)),
    [unpaidInvoices, selectedInvoiceId]
  )

  useEffect(() => {
    if (unpaidInvoices.length > 0) {
      const isValid = unpaidInvoices.some(inv => String(inv.id) === String(selectedInvoiceId))
      if (!isValid) setSelectedInvoiceId(String(unpaidInvoices[0].id))
    } else {
      setSelectedInvoiceId('')
    }
  }, [unpaidInvoices, selectedInvoiceId])

  useEffect(() => {
    if (selectedInvoiceForUpi) {
      setUpiAmount(String(selectedInvoiceForUpi.balance_remaining || ''))
      setUpiTxId(''); setUpiNote(''); setUpiConfirm(false)
    } else {
      setUpiAmount(''); setUpiTxId(''); setUpiNote(''); setUpiConfirm(false)
    }
  }, [selectedInvoiceForUpi])

  const handleUpiSubmit = async (e) => {
    e.preventDefault()
    if (!selectedInvoiceForUpi) return toastError('Please select a pending invoice.')
    const amt = parseFloat(upiAmount.trim())
    if (isNaN(amt) || amt <= 0) return toastError('Please enter a valid amount greater than 0.')
    if (amt > selectedInvoiceForUpi.balance_remaining)
      return toastError(`Amount cannot exceed ${formatCurrency(selectedInvoiceForUpi.balance_remaining)}.`)
    if (!/^[a-zA-Z0-9]{8,18}$/.test(upiTxId.trim()))
      return toastError('Transaction ID must be 8–18 alphanumeric characters.')
    if (!upiConfirm) return toastError('Please confirm the payment certification.')

    setSubmittingUpi(true)
    try {
      await studentApi.createStudentUpiPaymentRequest({
        invoice_id: selectedInvoiceForUpi.id,
        amount: amt,
        upi_transaction_id: upiTxId.trim(),
        student_note: upiNote.trim() || null,
      })
      toastSuccess('Payment reference submitted for verification!')
      setUpiTxId(''); setUpiNote(''); setUpiConfirm(false)
      await refresh()
    } catch (err) {
      toastError(err?.message || 'Failed to submit payment reference.')
    } finally {
      setSubmittingUpi(false)
    }
  }

  useEffect(() => { if (error) toastError(error) }, [error, toastError])

  const filteredInvoices = useMemo(() =>
    filter === 'all' ? invoices : invoices.filter(inv => inv.status === filter),
    [filter, invoices]
  )

  const upiQrUrl = useMemo(() => {
    if (!schoolUpi) return null
    let link = `upi://pay?pa=${schoolUpi}&pn=${encodeURIComponent(schoolName || 'School')}&cu=INR`
    const amt = parseFloat(upiAmount)
    if (!isNaN(amt) && amt > 0) link += `&am=${amt}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`
  }, [schoolUpi, schoolName, upiAmount])

  const totalDue   = sumByStatus(invoices, ['pending', 'partial'])
  const totalPaid  = summary?.total_paid  || 0
  const totalBal   = summary?.total_pending || 0

  return (
    <div className="mf-page">

      {loading ? <FeesSkeleton /> : (
        <>
          <div className="mf-grid">
            {/* ── Left: Invoices ── */}
            <div className="mf-left">

              {/* Carried Forward */}
              {carriedForwardInvoices.length > 0 && (
                <div className="mf-section">
                  <div className="mf-section__header mf-section__header--blue">
                    <div className="mf-section__icon mf-section__icon--blue"><ArrowRight size={14} /></div>
                    <div>
                      <p className="mf-section__title">Carried from Previous Session</p>
                      <p className="mf-section__desc">Balances brought forward from last session</p>
                    </div>
                  </div>
                  <div className="mf-section__body">
                    {carriedForwardInvoices.map(invoice => (
                      <FeeInvoiceCard
                        key={invoice.id}
                        invoice={invoice}
                        onOpen={row => openInvoice(row.id).catch(err => toastError(err?.message || 'Unable to load invoice.'))}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Current Invoices */}
              <div className="mf-section">
                <div className="mf-section__header">
                  <div className="mf-section__icon"><FileText size={14} /></div>
                  <div>
                    <p className="mf-section__title">Current Session Invoices</p>
                    <p className="mf-section__desc">Tap any invoice to view full details</p>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="mf-filter-bar">
                  {filters.map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setFilter(item)}
                      className={`mf-filter-pill${filter === item ? ' mf-filter-pill--active' : ''}`}
                    >
                      {item.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>

                <div className="mf-section__body">
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map(invoice => (
                      <FeeInvoiceCard
                        key={invoice.id}
                        invoice={invoice}
                        onOpen={row => openInvoice(row.id).catch(err => toastError(err?.message || 'Unable to load invoice.'))}
                      />
                    ))
                  ) : (
                    <EmptyState icon={CreditCard} title="No invoices in this filter" description="Try another status filter to see invoices." />
                  )}
                </div>
              </div>
            </div>

            {/* ── Right: UPI + Quick Links ── */}
            <aside className="mf-right">

              {/* UPI Section */}
              {upiQrUrl && Number(totalBal) > 0 && (
                <div className="mf-upi-card">
                  <div className="mf-upi-card__header">
                    <div className="mf-upi-card__icon"><QrCode size={16} /></div>
                    <div>
                      <p className="mf-upi-card__title">Pay via UPI</p>
                      <p className="mf-upi-card__sub">Scan with GPay, PhonePe, Paytm…</p>
                    </div>
                  </div>

                  {/* QR */}
                  <div className="mf-qr-wrap">
                    <div className="mf-qr-box">
                      <img src={upiQrUrl} alt="School UPI QR" className="mf-qr-img" />
                    </div>
                    <p className="mf-qr-payee">{schoolName}</p>
                    <p className="mf-qr-upiid">{schoolUpi}</p>
                  </div>

                  {/* UPI Form */}
                  <div className="mf-upi-form-section">
                    <p className="mf-upi-form-title">Submit Payment Reference</p>
                    {unpaidInvoices.length === 0 ? (
                      <p className="mf-upi-no-invoices">No pending invoices to submit payment for.</p>
                    ) : (
                      <form onSubmit={handleUpiSubmit} className="mf-upi-form">
                        <Select
                          label="Invoice"
                          value={selectedInvoiceId}
                          onChange={e => setSelectedInvoiceId(e.target.value)}
                          options={unpaidInvoices.map(inv => ({
                            value: String(inv.id),
                            label: `${inv.fee_type_name} (${inv.due_date ? getFeeMonthLabel(inv.due_date) : inv.period}) — Balance: ${formatCurrency(inv.balance_remaining)}`,
                          }))}
                          required
                        />

                        <div className="mf-upi-form__row">
                          <UpiField
                            label="Amount (INR) *"
                            type="number"
                            step="0.01"
                            value={upiAmount}
                            onChange={e => setUpiAmount(e.target.value)}
                            placeholder={selectedInvoiceForUpi ? `Max ${formatCurrency(selectedInvoiceForUpi.balance_remaining)}` : 'Amount'}
                            required
                          />
                          <UpiField
                            label="UPI Txn ID / UTR *"
                            type="text"
                            value={upiTxId}
                            onChange={e => setUpiTxId(e.target.value)}
                            placeholder="8–18 alphanumeric"
                            required
                          />
                        </div>

                        <UpiField
                          label="Note (optional)"
                          type="text"
                          value={upiNote}
                          onChange={e => setUpiNote(e.target.value)}
                          placeholder="Any additional details"
                        />

                        <div className="mf-upi-confirm">
                          <input
                            type="checkbox"
                            id="upiConfirm"
                            checked={upiConfirm}
                            onChange={e => setUpiConfirm(e.target.checked)}
                            className="mf-upi-confirm__check"
                            required
                          />
                          <label htmlFor="upiConfirm" className="mf-upi-confirm__label">
                            I confirm the transaction ID is correct and ₹{upiAmount || '0'} was transferred to the school's account.
                          </label>
                        </div>

                        <Button
                          type="submit"
                          variant="primary"
                          fullWidth
                          loading={submittingUpi}
                          disabled={submittingUpi || !upiConfirm || !upiAmount || !upiTxId || !selectedInvoiceId}
                        >
                          Submit for Verification
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="mf-quicklinks">
                <p className="mf-quicklinks__title">Quick Links</p>
                <QuickLink icon={Receipt}  label="Payment History"   onClick={() => navigate(ROUTES.STUDENT_FEE_PAYMENTS)} />
                <QuickLink icon={Download} label="Download Receipts" onClick={() => navigate(ROUTES.STUDENT_FEE_PAYMENTS)} />
              </div>
            </aside>
          </div>
        </>
      )}

      {/* ── Invoice Detail Modal ── */}
      <Modal
        open={Boolean(selectedInvoice) || detailLoading}
        onClose={closeInvoice}
        title="Invoice Detail"
        size="lg"
        footer={
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', gap: '10px' }}>
            <Button variant="secondary" onClick={closeInvoice}>Close</Button>
            <Button variant="secondary" onClick={() => navigate(ROUTES.STUDENT_FEE_PAYMENTS)} icon={Receipt}>All Payments</Button>
          </div>
        }
      >
        {detailLoading && !selectedInvoice ? (
          <div className="mf-modal-skeleton">
            <div className="mf-modal-skeleton__block" style={{ height: '80px' }} />
            <div className="mf-modal-skeleton__block" style={{ height: '120px' }} />
            <div className="mf-modal-skeleton__block" style={{ height: '100px' }} />
          </div>
        ) : selectedInvoice && (
          <div className="mf-modal-body">

            {/* Status Hero */}
            <div className="mf-modal-hero" style={invoiceHeroStyle(selectedInvoice.status)}>
              <div className="mf-modal-hero__left">
                <span className="mf-modal-hero__badge" style={invoiceBadgeStyle(selectedInvoice.status)}>
                  {(STATUS_META[selectedInvoice.status]?.label || selectedInvoice.status).toUpperCase()}
                </span>
                <p className="mf-modal-hero__name">{selectedInvoice.fee_type_name}</p>
                <p className="mf-modal-hero__period">
                  {selectedInvoice.due_date ? getFeeMonthLabel(selectedInvoice.due_date) : selectedInvoice.period}
                </p>
              </div>
              <div className="mf-modal-hero__amount">
                <p className="mf-modal-hero__amount-label">Balance Remaining</p>
                <p className="mf-modal-hero__amount-value" style={{ color: selectedInvoice.balance_remaining > 0 ? '#dc2626' : '#16a34a' }}>
                  {formatCurrency(selectedInvoice.balance_remaining || 0)}
                </p>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="mf-modal-section">
              <p className="mf-modal-section__title">Fee Breakdown</p>
              <div className="mf-modal-breakdown">
                <BreakdownRow label="Original Amount"  value={formatCurrency(selectedInvoice.original_amount)}           />
                <BreakdownRow label="Concession"        value={`– ${formatCurrency(selectedInvoice.concession_amount || 0)}`} muted />
                <BreakdownRow label="Late Fee Added"    value={`+ ${formatCurrency(selectedInvoice.late_fee_amount || 0)}`}  warn={selectedInvoice.late_fee_amount > 0} />
                <BreakdownRow label="Total Payable"     value={formatCurrency(selectedInvoice.total_payable)}             bold />
                <BreakdownRow label="Amount Paid"       value={formatCurrency(selectedInvoice.amount_paid || 0)}          green />
                <BreakdownRow label="Balance Remaining" value={formatCurrency(selectedInvoice.balance_remaining || 0)}    bold red={selectedInvoice.balance_remaining > 0} />
              </div>
            </div>

            {/* Key Details */}
            <div className="mf-modal-section">
              <p className="mf-modal-section__title">Invoice Details</p>
              <div className="mf-modal-details-grid">
                <DetailItem icon={<CalendarClock size={13} />} label="Due Date" value={formatDate(selectedInvoice.due_date, 'long')} />
                <DetailItem icon={<Hash size={13} />}          label="Monthly Fee" value={selectedInvoice.due_date ? getFeeMonthLabel(selectedInvoice.due_date) : selectedInvoice.period} />
              </div>
            </div>

            {/* Payment History */}
            <div className="mf-modal-section">
              <p className="mf-modal-section__title">Payments on This Invoice</p>
              {selectedInvoice.payments?.length ? (
                <div className="mf-modal-payments">
                  {selectedInvoice.payments.map(payment => (
                    <div key={payment.id} className="mf-modal-payment-row">
                      <div className="mf-modal-payment-row__bar" />
                      <div className="mf-modal-payment-row__body">
                        <p className="mf-modal-payment-row__amount">{formatCurrency(payment.amount)}</p>
                        <p className="mf-modal-payment-row__meta">
                          {formatDate(payment.payment_date, 'short')} &nbsp;·&nbsp;
                          {String(payment.payment_mode || '').toUpperCase()} &nbsp;·&nbsp;
                          Receipt {payment.receipt_no || '--'}
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
                  ))}
                </div>
              ) : (
                <div className="mf-modal-no-payments">
                  <Receipt size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  <p>No payments recorded for this invoice yet.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </Modal>

      <style>{`
        /* ── Page ── */
        .mf-page { display: flex; flex-direction: column; gap: 16px; }

        /* ── Action Bar ── */
        .mf-action-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .mf-action-bar__left { display: flex; align-items: center; gap: 12px; }
        .mf-action-bar__right { display: flex; gap: 8px; flex-wrap: wrap; }
        .mf-page-icon { display: flex; height: 38px; width: 38px; align-items: center; justify-content: center; border-radius: 12px; background-color: rgba(220,38,38,0.10); color: #dc2626; flex-shrink: 0; }
        .mf-page-label { font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-text-muted); margin: 0; line-height: 1; }
        .mf-page-title { font-size: 20px; font-weight: 700; color: var(--color-text-primary); margin: 2px 0 0 0; line-height: 1.2; }

        /* ── Summary Strip ── */
        .mf-summary-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        @media (max-width: 600px) { .mf-summary-strip { grid-template-columns: 1fr; } }

        .mf-summary-card { border-radius: 16px; border: 1.5px solid; padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
        .mf-summary-card__icon { display: flex; height: 36px; width: 36px; align-items: center; justify-content: center; border-radius: 10px; flex-shrink: 0; }
        .mf-summary-card__label { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-text-muted); margin: 0; }
        .mf-summary-card__value { font-size: 18px; font-weight: 800; margin: 2px 0 0; line-height: 1.2; }

        /* ── Layout Grid ── */
        .mf-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 1280px) { .mf-grid { grid-template-columns: 1.6fr 1fr; } }
        .mf-left { display: flex; flex-direction: column; gap: 16px; }
        .mf-right { display: flex; flex-direction: column; gap: 16px; }

        /* ── Section Card ── */
        .mf-section { background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: 18px; overflow: hidden; }
        .mf-section__header { display: flex; align-items: center; gap: 10px; padding: 13px 16px; background-color: var(--color-surface-raised); border-bottom: 1px solid var(--color-border); }
        .mf-section__header--blue { background-color: rgba(37,99,235,0.06); border-bottom-color: #93c5fd; }
        .mf-section__icon { display: flex; height: 28px; width: 28px; align-items: center; justify-content: center; border-radius: 8px; background-color: rgba(124,58,237,0.10); color: var(--student-accent); flex-shrink: 0; }
        .mf-section__icon--blue { background-color: rgba(37,99,235,0.10); color: #2563eb; }
        .mf-section__title { font-size: 13px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
        .mf-section__desc { font-size: 11px; color: var(--color-text-muted); margin: 2px 0 0; }
        .mf-section__body { padding: 12px; display: flex; flex-direction: column; gap: 10px; }

        /* ── Filter Pills ── */
        .mf-filter-bar { display: flex; gap: 6px; overflow-x: auto; padding: 10px 14px; border-bottom: 1px solid var(--color-border); flex-wrap: nowrap; }
        .mf-filter-pill { padding: 5px 12px; border-radius: 99px; font-size: 10px; font-weight: 700; letter-spacing: 0.10em; text-transform: uppercase; white-space: nowrap; border: 1.5px solid transparent; cursor: pointer; background-color: var(--color-surface-raised); color: var(--color-text-secondary); transition: all 0.13s ease; }
        .mf-filter-pill--active { background-color: var(--student-accent); color: #fff; border-color: var(--student-accent); }
        .mf-filter-pill:hover:not(.mf-filter-pill--active) { border-color: var(--color-border); }

        /* ── UPI Card ── */
        .mf-upi-card { background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: 18px; overflow: hidden; }
        .mf-upi-card__header { display: flex; align-items: center; gap: 10px; padding: 13px 16px; background-color: var(--color-surface-raised); border-bottom: 1px solid var(--color-border); }
        .mf-upi-card__icon { display: flex; height: 28px; width: 28px; align-items: center; justify-content: center; border-radius: 8px; background-color: rgba(22,163,74,0.10); color: #16a34a; flex-shrink: 0; }
        .mf-upi-card__title { font-size: 13px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
        .mf-upi-card__sub { font-size: 11px; color: var(--color-text-muted); margin: 2px 0 0; }

        .mf-qr-wrap { display: flex; flex-direction: column; align-items: center; padding: 16px 16px 8px; }
        .mf-qr-box { background: #fff; border: 1px solid var(--color-border); border-radius: 16px; padding: 12px; display: inline-block; margin-bottom: 10px; }
        .mf-qr-img { width: 160px; height: 160px; display: block; border-radius: 8px; }
        .mf-qr-payee { font-size: 13px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
        .mf-qr-upiid { font-size: 11px; color: #16a34a; font-weight: 600; margin: 3px 0 0; user-select: all; }

        .mf-upi-form-section { padding: 14px 16px; border-top: 1px solid var(--color-border); }
        .mf-upi-form-title { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-text-muted); margin: 0 0 12px; }
        .mf-upi-no-invoices { font-size: 12px; color: var(--color-text-muted); font-style: italic; }
        .mf-upi-form { display: flex; flex-direction: column; gap: 10px; }
        .mf-upi-form__row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

        .mf-upi-field-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-text-muted); display: block; margin-bottom: 4px; }
        .mf-upi-field-input { width: 100%; border: 1.5px solid var(--color-border); border-radius: 10px; padding: 8px 10px; font-size: 12px; font-family: inherit; color: var(--color-text-primary); background-color: var(--color-surface); outline: none; transition: border-color 0.14s ease; box-sizing: border-box; }
        .mf-upi-field-input:focus { border-color: #16a34a; }

        .mf-upi-confirm { display: flex; align-items: flex-start; gap: 8px; }
        .mf-upi-confirm__check { width: 14px; height: 14px; margin-top: 2px; flex-shrink: 0; cursor: pointer; }
        .mf-upi-confirm__label { font-size: 11px; color: var(--color-text-secondary); line-height: 1.5; cursor: pointer; }

        /* ── Quick Links ── */
        .mf-quicklinks { background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: 18px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; }
        .mf-quicklinks__title { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-text-muted); margin: 0 0 8px; }
        .mf-quicklink { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 10px; border-radius: 10px; border: 1px solid transparent; cursor: pointer; background: transparent; text-align: left; transition: all 0.12s ease; }
        .mf-quicklink:hover { background-color: var(--color-surface-raised); border-color: var(--color-border); }
        .mf-quicklink__left { display: flex; align-items: center; gap: 8px; }
        .mf-quicklink__icon { display: flex; height: 28px; width: 28px; align-items: center; justify-content: center; border-radius: 8px; background-color: rgba(124,58,237,0.08); color: var(--student-accent); flex-shrink: 0; }
        .mf-quicklink__label { font-size: 13px; font-weight: 500; color: var(--color-text-primary); }
        .mf-quicklink__arrow { color: var(--color-text-muted); }

        /* ── Skeleton ── */
        .mf-skeleton { display: flex; flex-direction: column; gap: 16px; animation: mfPulse 1.6s ease-in-out infinite; }
        .mf-skeleton__strip { height: 80px; border-radius: 16px; background-color: var(--color-surface); border: 1px solid var(--color-border); }
        .mf-skeleton__grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; }
        .mf-skeleton__block { height: 280px; border-radius: 18px; background-color: var(--color-surface); border: 1px solid var(--color-border); }
        @keyframes mfPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }

        /* ── Modal Body ── */
        .mf-modal-body { display: flex; flex-direction: column; gap: 14px; }
        .mf-modal-skeleton { display: flex; flex-direction: column; gap: 12px; animation: mfPulse 1.6s ease-in-out infinite; }
        .mf-modal-skeleton__block { border-radius: 12px; background-color: var(--color-surface-raised); }

        /* Modal Hero */
        .mf-modal-hero { border-radius: 14px; border: 1.5px solid; padding: 14px 16px; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .mf-modal-hero__left { display: flex; flex-direction: column; gap: 4px; }
        .mf-modal-hero__badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; width: fit-content; margin-bottom: 4px; }
        .mf-modal-hero__name { font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
        .mf-modal-hero__period { font-size: 12px; color: var(--color-text-secondary); margin: 0; }
        .mf-modal-hero__amount { text-align: right; flex-shrink: 0; }
        .mf-modal-hero__amount-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-text-muted); margin: 0; }
        .mf-modal-hero__amount-value { font-size: 22px; font-weight: 800; margin: 4px 0 0; line-height: 1; }

        /* Modal Section */
        .mf-modal-section { border: 1px solid var(--color-border); border-radius: 14px; overflow: hidden; }
        .mf-modal-section__title { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-text-muted); padding: 10px 14px; background-color: var(--color-surface-raised); border-bottom: 1px solid var(--color-border); margin: 0; }

        /* Breakdown */
        .mf-modal-breakdown { display: flex; flex-direction: column; }
        .mf-breakdown-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; border-bottom: 1px solid var(--color-border); }
        .mf-breakdown-row:last-child { border-bottom: none; }
        .mf-breakdown-row__label { font-size: 12px; color: var(--color-text-secondary); }
        .mf-breakdown-row__value { font-size: 13px; font-weight: 500; color: var(--color-text-primary); }
        .mf-breakdown-row--bold .mf-breakdown-row__label,
        .mf-breakdown-row--bold .mf-breakdown-row__value { font-weight: 700; color: var(--color-text-primary); }
        .mf-breakdown-row--muted .mf-breakdown-row__value { color: var(--color-text-muted); }
        .mf-breakdown-row--green .mf-breakdown-row__value { color: #16a34a; font-weight: 700; }
        .mf-breakdown-row--red .mf-breakdown-row__value { color: #dc2626; font-weight: 700; }
        .mf-breakdown-row--warn .mf-breakdown-row__value { color: #d97706; }

        /* Details Grid */
        .mf-modal-details-grid { display: grid; grid-template-columns: 1fr 1fr; }
        .mf-detail-item { display: flex; align-items: center; gap: 8px; padding: 11px 14px; border-bottom: 1px solid var(--color-border); }
        .mf-detail-item:nth-last-child(-n+2) { border-bottom: none; }
        .mf-detail-item__icon { color: var(--color-text-muted); flex-shrink: 0; }
        .mf-detail-item__label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-text-muted); margin: 0 0 2px; }
        .mf-detail-item__value { font-size: 12px; font-weight: 600; color: var(--color-text-primary); margin: 0; }

        /* Payments in modal */
        .mf-modal-payments { display: flex; flex-direction: column; }
        .mf-modal-payment-row { display: flex; align-items: center; gap: 10px; padding: 11px 14px 11px 0; border-bottom: 1px solid var(--color-border); }
        .mf-modal-payment-row:last-child { border-bottom: none; }
        .mf-modal-payment-row__bar { width: 4px; min-width: 4px; align-self: stretch; background-color: #22c55e; border-radius: 0 3px 3px 0; flex-shrink: 0; }
        .mf-modal-payment-row__body { flex: 1; min-width: 0; padding-left: 6px; }
        .mf-modal-payment-row__amount { font-size: 14px; font-weight: 700; color: #16a34a; margin: 0; }
        .mf-modal-payment-row__meta { font-size: 11px; color: var(--color-text-secondary); margin: 2px 0 0; }
        .mf-modal-no-payments { display: flex; align-items: center; gap: 8px; padding: 14px; font-size: 12px; color: var(--color-text-muted); font-style: italic; }
      `}</style>
    </div>
  )
}

/* ── Sub-components ── */

const SummaryCard = ({ icon, label, value, tone, bg, border }) => (
  <div className="mf-summary-card" style={{ backgroundColor: bg, borderColor: border }}>
    <div className="mf-summary-card__icon" style={{ backgroundColor: `${tone}20`, color: tone }}>{icon}</div>
    <div>
      <p className="mf-summary-card__label">{label}</p>
      <p className="mf-summary-card__value" style={{ color: tone }}>{value}</p>
    </div>
  </div>
)

const UpiField = ({ label, ...inputProps }) => (
  <div>
    <label className="mf-upi-field-label">{label}</label>
    <input className="mf-upi-field-input" {...inputProps} />
  </div>
)

const QuickLink = ({ icon: Icon, label, onClick }) => (
  <button className="mf-quicklink" onClick={onClick}>
    <div className="mf-quicklink__left">
      <div className="mf-quicklink__icon"><Icon size={14} /></div>
      <span className="mf-quicklink__label">{label}</span>
    </div>
    <ChevronRight size={14} className="mf-quicklink__arrow" />
  </button>
)

const BreakdownRow = ({ label, value, bold, muted, green, red, warn }) => {
  let cls = 'mf-breakdown-row'
  if (bold)  cls += ' mf-breakdown-row--bold'
  if (muted) cls += ' mf-breakdown-row--muted'
  if (green) cls += ' mf-breakdown-row--green'
  if (red)   cls += ' mf-breakdown-row--red'
  if (warn)  cls += ' mf-breakdown-row--warn'
  return (
    <div className={cls}>
      <span className="mf-breakdown-row__label">{label}</span>
      <span className="mf-breakdown-row__value">{value}</span>
    </div>
  )
}

const DetailItem = ({ icon, label, value }) => (
  <div className="mf-detail-item">
    <div className="mf-detail-item__icon">{icon}</div>
    <div>
      <p className="mf-detail-item__label">{label}</p>
      <p className="mf-detail-item__value">{value || '—'}</p>
    </div>
  </div>
)

const FeesSkeleton = () => (
  <div className="mf-skeleton">
    <div className="mf-skeleton__grid">
      <div className="mf-skeleton__block" />
      <div className="mf-skeleton__block" />
    </div>
  </div>
)

/* ── Modal style helpers ── */
function invoiceHeroStyle(status) {
  const m = STATUS_META[status]
  if (!m) return { backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }
  return { backgroundColor: m.bg, borderColor: m.border }
}
function invoiceBadgeStyle(status) {
  const m = STATUS_META[status]
  if (!m) return {}
  return { backgroundColor: `${m.color}18`, color: m.color }
}

function sumByStatus(invoices, statuses) {
  return invoices
    .filter(inv => statuses.includes(inv.status))
    .reduce((sum, inv) => sum + Number(inv.balance_remaining || 0), 0)
}

export default MyFees
