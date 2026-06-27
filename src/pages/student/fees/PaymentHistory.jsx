import { useEffect, useMemo, useState } from 'react'
import { Download, Receipt, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentPayments from '@/hooks/useStudentPayments'
import useToast from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/utils/helpers'

const PaymentHistory = () => {
  usePageTitle('Payment History')

  const { toastError, toastInfo, toastSuccess } = useToast()
  const {
    payments,
    loading,
    refreshing,
    receiptLoadingId,
    error,
    refresh,
    fetchReceipt,
  } = useStudentPayments()

  const [modeFilter, setModeFilter] = useState('all')
  const [receipt, setReceipt] = useState(null)

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const filteredPayments = useMemo(() => {
    if (modeFilter === 'all') return payments
    return payments.filter((payment) => payment.payment_mode === modeFilter)
  }, [modeFilter, payments])

  const openReceipt = async (paymentId) => {
    try {
      const data = await fetchReceipt(paymentId)
      setReceipt(data)
    } catch (err) {
      toastError(err?.message || 'Unable to load receipt.')
    }
  }

  const printReceipt = () => {
    if (!receipt) return
    const popup = window.open('', '_blank', 'noopener,noreferrer')
    if (!popup) {
      toastError('Unable to open receipt print window.')
      return
    }

    popup.document.write(`
      <html>
        <head>
          <title>Receipt ${receipt.receipt_no || ''}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 24px; }
            .wrap { max-width: 720px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 18px; padding: 24px; }
            h1 { margin: 0 0 6px; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
            .item { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; background: #f8fafc; }
            .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
            .value { margin-top: 8px; font-size: 15px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <h1>Fee Receipt</h1>
            <p>Student payment receipt</p>
            <div class="grid">
              <div class="item"><div class="label">Receipt No</div><div class="value">${receipt.receipt_no || '--'}</div></div>
              <div class="item"><div class="label">Date</div><div class="value">${formatDate(receipt.payment_date, 'long')}</div></div>
              <div class="item"><div class="label">Fee Type</div><div class="value">${receipt.fee_type_name || '--'}</div></div>
              <div class="item"><div class="label">Payment Mode</div><div class="value">${String(receipt.payment_mode || '').toUpperCase()}</div></div>
              <div class="item"><div class="label">Amount</div><div class="value">${formatCurrency(receipt.amount)}</div></div>
              <div class="item"><div class="label">Balance After</div><div class="value">${formatCurrency(receipt.balance_after || 0)}</div></div>
            </div>
          </div>
        </body>
      </html>
    `)
    popup.document.close()
    popup.focus()
    popup.print()
    toastSuccess('Receipt opened for print/PDF.')
  }

  return (
    <>
      <style>{`
        /* ── Action Bar ─────────────────────────────────── */
        .ph-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 16px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
        }
        .ph-action-bar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ph-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(22, 163, 74, 0.10);
          color: #16a34a;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ph-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          line-height: 1;
          margin-bottom: 3px;
        }
        .ph-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text-primary);
          line-height: 1.2;
          margin: 0;
        }

        /* ── Filter Toolbar ─────────────────────────────── */
        .ph-filter-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          overflow-x: auto;
        }
        .ph-filter-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--color-text-muted);
          white-space: nowrap;
          margin-right: 4px;
          flex-shrink: 0;
        }
        .ph-tab {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid transparent;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          background: transparent;
          color: var(--color-text-secondary);
        }
        .ph-tab:hover:not(.ph-tab--active) {
          background: var(--color-surface-raised);
        }
        .ph-tab--active {
          background: #16a34a;
          color: #fff;
          border-color: #16a34a;
        }

        /* ── Payment List Card ──────────────────────────── */
        .ph-list-card {
          border-radius: 18px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          overflow: hidden;
        }
        .ph-list-header {
          display: grid;
          grid-template-columns: 1fr auto auto auto;
          gap: 12px;
          align-items: center;
          padding: 10px 18px;
          background: var(--color-surface-raised);
          border-bottom: 1px solid var(--color-border);
        }
        .ph-list-header-cell {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.13em;
          color: var(--color-text-muted);
        }
        .ph-list-header-cell.right {
          text-align: right;
        }

        /* ── Payment Row ────────────────────────────────── */
        .ph-row {
          display: grid;
          grid-template-columns: 1fr auto auto auto;
          gap: 12px;
          align-items: center;
          padding: 0 18px 0 0;
          border-bottom: 1px solid var(--color-border);
          transition: background 0.12s;
          position: relative;
          overflow: hidden;
          min-height: 62px;
        }
        .ph-row:last-child {
          border-bottom: none;
        }
        .ph-row:hover {
          background: var(--color-surface-raised);
        }
        .ph-row-accent {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: #16a34a;
          border-radius: 0;
        }
        .ph-row-info {
          padding: 14px 12px 14px 22px;
          min-width: 0;
        }
        .ph-row-fee-type {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ph-row-meta {
          font-size: 11px;
          color: var(--color-text-secondary);
          margin-top: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ph-row-date-mode {
          font-size: 12px;
          color: var(--color-text-secondary);
          text-align: right;
          white-space: nowrap;
        }
        .ph-row-amount {
          font-size: 14px;
          font-weight: 700;
          color: #16a34a;
          text-align: right;
          white-space: nowrap;
          min-width: 80px;
        }
        .ph-row-action {
          display: flex;
          justify-content: flex-end;
          min-width: 90px;
        }

        /* ── Skeleton ───────────────────────────────────── */
        .ph-skeleton {
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          animation: ph-pulse 1.4s ease-in-out infinite;
        }
        .ph-skeleton-row {
          height: 62px;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface-raised);
          opacity: 0.5;
        }
        .ph-skeleton-row:last-child { border-bottom: none; }
        @keyframes ph-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        /* ── Modal Receipt Row ──────────────────────────── */
        .ph-receipt-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--color-border);
        }
        .ph-receipt-row:last-child {
          border-bottom: none;
        }
        .ph-receipt-row-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--color-text-muted);
          flex-shrink: 0;
        }
        .ph-receipt-row-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          text-align: right;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* ── Action Bar ── */}
        <div className="ph-action-bar">
          <div className="ph-action-bar-left">
            <div className="ph-icon-box">
              <Receipt size={18} />
            </div>
            <div>
              <div className="ph-label">Fees</div>
              <h1 className="ph-title">Payment History</h1>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={async () => {
              toastInfo('Refreshing payment history')
              await refresh()
            }}
            loading={refreshing}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>

        {/* ── Filter Toolbar ── */}
        <div className="ph-filter-bar">
          <span className="ph-filter-label">Mode:</span>
          {['all', 'cash', 'online', 'cheque', 'dd'].map((mode) => (
            <button
              key={mode}
              type="button"
              className={`ph-tab${modeFilter === mode ? ' ph-tab--active' : ''}`}
              onClick={() => setModeFilter(mode)}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* ── Payment List ── */}
        {loading ? (
          <div className="ph-skeleton">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="ph-skeleton-row" />
            ))}
          </div>
        ) : filteredPayments.length > 0 ? (
          <div className="ph-list-card">
            {/* Table header */}
            <div className="ph-list-header">
              <div className="ph-list-header-cell">Fee Type</div>
              <div className="ph-list-header-cell right">Date &amp; Mode</div>
              <div className="ph-list-header-cell right">Amount</div>
              <div className="ph-list-header-cell right">Action</div>
            </div>
            {/* Rows */}
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="ph-row">
                <div className="ph-row-accent" />
                <div className="ph-row-info">
                  <div className="ph-row-fee-type">{payment.fee_type_name}</div>
                  <div className="ph-row-meta">Receipt {payment.receipt_no || '--'}</div>
                </div>
                <div className="ph-row-date-mode">
                  <div>{formatDate(payment.payment_date, 'long')}</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {String(payment.payment_mode || '').toUpperCase()}
                  </div>
                </div>
                <div className="ph-row-amount">{formatCurrency(payment.amount)}</div>
                <div className="ph-row-action">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Receipt}
                    loading={receiptLoadingId === payment.id}
                    onClick={() => openReceipt(payment.id)}
                  >
                    Receipt
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Receipt}
            title="No payments found"
            description="Payments matching this filter will appear here."
          />
        )}
      </div>

      {/* ── Receipt Modal ── */}
      <Modal
        open={Boolean(receipt)}
        onClose={() => setReceipt(null)}
        title="Receipt Detail"
        footer={
          <div className="flex w-full justify-between gap-3">
            <Button variant="secondary" onClick={() => setReceipt(null)}>Close</Button>
            <Button onClick={printReceipt} icon={Download}>Print / Save PDF</Button>
          </div>
        }
      >
        {receipt && (
          <div>
            <ReceiptRow label="Receipt No"    value={receipt.receipt_no} />
            <ReceiptRow label="Fee Type"      value={receipt.fee_type_name} />
            <ReceiptRow label="Payment Date"  value={formatDate(receipt.payment_date, 'long')} />
            <ReceiptRow label="Payment Mode"  value={String(receipt.payment_mode || '').toUpperCase()} />
            <ReceiptRow label="Amount"        value={formatCurrency(receipt.amount)} />
            <ReceiptRow label="Balance After" value={formatCurrency(receipt.balance_after || 0)} />
          </div>
        )}
      </Modal>
    </>
  )
}

const ReceiptRow = ({ label, value }) => (
  <div className="ph-receipt-row">
    <span className="ph-receipt-row-label">{label}</span>
    <span className="ph-receipt-row-value">{value || '--'}</span>
  </div>
)

export default PaymentHistory
