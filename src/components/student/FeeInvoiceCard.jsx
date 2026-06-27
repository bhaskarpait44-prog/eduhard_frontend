import { AlertCircle, ChevronRight, Clock, XCircle, Calendar, CreditCard, CheckCircle2 } from 'lucide-react'
import { formatCurrency, formatDate, getFeeMonthLabel } from '@/utils/helpers'

const FeeInvoiceCard = ({ invoice, onOpen }) => {
  const balance = Number(invoice?.balance_remaining || 0)
  const isOverdue = balance > 0 && invoice?.due_date && new Date(invoice.due_date) < new Date()
  const overdueDays = isOverdue ? Math.max(Math.ceil((Date.now() - new Date(invoice.due_date).getTime()) / 86400000), 1) : 0

  const isUpiPending = invoice.upi_latest_status === 'pending'
  const isUpiRejected = invoice.upi_latest_status === 'rejected'

  const tone = getUrgencyTone(invoice.status, isOverdue)

  return (
    <button
      type="button"
      onClick={() => onOpen?.(invoice)}
      className="fic-card"
      style={{
        borderColor: tone.border,
        '--accent-color': tone.color,
        '--accent-bg': tone.bg,
      }}
    >
      {/* Left Accent Indicator Bar */}
      <span className="fic-card__bar" style={{ backgroundColor: tone.color }} />

      {/* Main Content */}
      <div className="fic-card__main">
        {/* Header: Month/Period & Status */}
        <div className="fic-card__header">
          <div className="fic-card__period-info">
            <span className="fic-card__period-label">Monthly Fee</span>
            <h3 className="fic-card__period-title">
              {invoice.due_date ? getFeeMonthLabel(invoice.due_date) : humanize(invoice.period)}
            </h3>
          </div>
          <div className="fic-card__status-wrap">
            <span className="fic-card__status-badge" style={{ backgroundColor: tone.bg, color: tone.color, borderColor: tone.border }}>
              {statusIcon(invoice.status, isOverdue)}
              {statusLabel(invoice.status, isOverdue)}
            </span>
            <ChevronRight size={16} className="fic-card__chevron" />
          </div>
        </div>

        {/* Sub-info: Fee Type & Due Date */}
        <div className="fic-card__subinfo">
          <div className="fic-card__subinfo-item">
            <CreditCard size={13} />
            <span>Type: <strong>{invoice.fee_type_name}</strong></span>
          </div>
          <div className="fic-card__subinfo-item" style={{ color: isOverdue ? '#dc2626' : 'var(--color-text-secondary)' }}>
            <Calendar size={13} />
            <span>Due: <strong>{formatDate(invoice.due_date, 'short')}</strong></span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="fic-grid">
          <div className="fic-cell">
            <span className="fic-cell__label">Total Fee</span>
            <span className="fic-cell__value">{formatCurrency(invoice.amount_due)}</span>
          </div>
          <div className="fic-cell">
            <span className="fic-cell__label">Paid Amount</span>
            <span className="fic-cell__value" style={{ color: '#16a34a' }}>{formatCurrency(invoice.amount_paid || 0)}</span>
          </div>
          <div className="fic-cell fic-cell--highlight" style={{ backgroundColor: balance > 0 ? 'rgba(239,68,68,0.04)' : 'rgba(34,197,94,0.04)' }}>
            <span className="fic-cell__label">Remaining Balance</span>
            <span className="fic-cell__value font-bold" style={{ color: balance > 0 ? '#dc2626' : '#16a34a' }}>
              {formatCurrency(balance)}
            </span>
          </div>
        </div>

        {/* Warnings & UPI Statuses */}
        {isUpiPending && (
          <div className="fic-alert fic-alert--warning">
            <Clock size={14} />
            <span>Awaiting UPI Confirmation</span>
          </div>
        )}

        {isUpiRejected && (
          <div className="fic-alert fic-alert--danger">
            <div className="flex items-center gap-2">
              <XCircle size={14} />
              <span>Payment Rejected</span>
            </div>
            {invoice.upi_rejected_reason && (
              <p className="fic-alert__reason">Reason: {invoice.upi_rejected_reason}</p>
            )}
          </div>
        )}

        {isOverdue && !isUpiPending && (
          <div className="fic-alert fic-alert--danger">
            <div className="flex items-start gap-2">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Overdue by {overdueDays} day(s)</p>
                {Number(invoice.late_fee_amount || 0) > 0 && (
                  <p className="mt-0.5 text-[11px] opacity-90">Late fee added: {formatCurrency(invoice.late_fee_amount)}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .fic-card {
          width: 100%;
          display: flex;
          background-color: var(--color-surface);
          border: 1.5px solid var(--color-border);
          border-radius: 18px;
          padding: 0;
          text-align: left;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
          position: relative;
          overflow: hidden;
          outline: none;
        }

        .fic-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
          background-color: var(--color-surface-raised);
        }

        .fic-card:active {
          transform: translateY(0);
        }

        .fic-card__bar {
          display: block;
          width: 5px;
          min-width: 5px;
          align-self: stretch;
          flex-shrink: 0;
        }

        .fic-card__main {
          flex: 1;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 0;
        }

        .fic-card__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .fic-card__period-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .fic-card__period-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .fic-card__period-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--color-text-primary);
          margin: 0;
        }

        .fic-card__status-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .fic-card__status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border: 1px solid transparent;
        }

        .fic-card__chevron {
          color: var(--color-text-muted);
        }

        .fic-card__subinfo {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 12px;
          color: var(--color-text-secondary);
        }

        .fic-card__subinfo-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Metrics Grid */
        .fic-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          background-color: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 8px;
        }

        @media (max-width: 480px) {
          .fic-grid {
            grid-template-columns: 1fr;
          }
        }

        .fic-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 6px 8px;
          border-radius: 8px;
        }

        .fic-cell--highlight {
          border: 1px solid var(--color-border);
        }

        .fic-cell__label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .fic-cell__value {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        /* Alert Banners */
        .fic-alert {
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 12px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .fic-alert--warning {
          background-color: #fffbeb;
          border: 1.5px solid #fde68a;
          color: #b45309;
          font-weight: 600;
          flex-direction: row;
          align-items: center;
        }

        .fic-alert--danger {
          background-color: #fef2f2;
          border: 1.5px solid #fecaca;
          color: #dc2626;
        }

        .fic-alert__reason {
          font-size: 10px;
          font-style: italic;
          margin: 0;
          opacity: 0.9;
        }
      `}</style>
    </button>
  )
}

function humanize(value) {
  if (!value) return '--'
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function statusLabel(status, isOverdue) {
  if (status === 'paid') return 'Fully Paid'
  if (status === 'partial') return 'Partially Unpaid'
  if (status === 'pending') return isOverdue ? 'Overdue (Unpaid)' : 'Unpaid'
  if (status === 'carried_forward') return 'Carried Forward'
  return humanize(status)
}

function statusIcon(status, isOverdue) {
  if (status === 'paid') return '✓ '
  if (status === 'partial') return '◒ '
  if (status === 'pending') return isOverdue ? '⚠ ' : '○ '
  return ''
}

function getUrgencyTone(status, isOverdue) {
  if (status === 'paid') {
    return { color: '#16a34a', bg: 'rgba(22,163,74,0.08)', border: '#86efac' }
  }
  if (status === 'partial') {
    return { color: '#d97706', bg: 'rgba(245,158,11,0.08)', border: '#fcd34d' }
  }
  if (isOverdue) {
    return { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: '#fca5a5' }
  }
  if (status === 'carried_forward') {
    return { color: '#2563eb', bg: 'rgba(37,99,235,0.08)', border: '#93c5fd' }
  }
  return { color: '#dc2626', bg: 'rgba(220,38,38,0.06)', border: 'var(--color-border)' }
}

export default FeeInvoiceCard
