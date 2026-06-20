import { useState, useMemo, useEffect } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useReceipts from '@/hooks/useReceipts'
import ReceiptPrint from '@/components/accountant/ReceiptPrint'
import Modal from '@/components/ui/Modal'
import { formatCurrency, formatDate } from '@/utils/helpers'
import * as classApi from '@/api/classApi'
import TableSkeleton from '@/components/ui/TableSkeleton'
import Input from '@/components/ui/Input'

const PAYMENT_MODE_COLORS = {
  cash: { bg: '#dcfce7', text: '#15803d' },
  online: { bg: '#dbeafe', text: '#1d4ed8' },
  cheque: { bg: '#fef9c3', text: '#a16207' },
  card: { bg: '#f3e8ff', text: '#7e22ce' },
  default: { bg: '#f1f5f9', text: '#475569' },
}

const StatCard = ({ label, value, accent }) => (
  <div
    className="rounded-2xl p-4 flex flex-col gap-1"
    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
  >
    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
      {label}
    </span>
    <span className="text-2xl font-bold" style={{ color: accent || 'var(--color-text-primary)' }}>
      {value}
    </span>
  </div>
)

const ReceiptList = () => {
  usePageTitle('Receipts')
  const [selected, setSelected] = useState(null)
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [classId, setClassId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentMode, setPaymentMode] = useState('')
  const [classes, setClasses] = useState([])

  const { receipts = [], meta, isLoading } = useReceipts({
    page,
    perPage: 20,
    from: dateFrom,
    to: dateTo,
    class_id: classId,
    payment_mode: paymentMode,
    search: searchQuery,
  })

  useEffect(() => {
    classApi.getClasses().then((res) => {
      setClasses(classApi.getClassOptions(res))
    }).catch(() => {})
  }, [])

  const resetPage = () => setPage(1)

  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setClassId('')
    setPaymentMode('')
    setSearchQuery('')
    setPage(1)
  }

  const hasFilters = dateFrom || dateTo || classId || paymentMode || searchQuery

  return (
    <div className="space-y-5">
      {/* Header */}
      <div
        className="rounded-[28px] border p-5 flex items-center justify-between"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Receipts
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Fee payment records
          </p>
        </div>
        <div
          className="text-sm font-semibold px-4 py-2 rounded-full"
          style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent-emphasis)' }}
        >
          {meta?.total || 0} record{meta?.total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Receipts" value={meta?.total || 0} />
        <StatCard label="Total Collected" value={formatCurrency(meta?.totalAmount || 0)} accent="#15803d" />
        <StatCard
          label="Payment Mode"
          value={paymentMode || 'All'}
          accent="#a16207"
        />
        <StatCard
          label="Current Page"
          value={`${page} of ${meta?.totalPages || 1}`}
          accent="#1d4ed8"
        />
      </div>

      {/* Filters */}
      <div
        className="rounded-[24px] border p-4"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Search
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Student name or receipt no..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); resetPage() }}
                className="w-full rounded-xl pl-9 pr-3 py-2 text-sm border outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--color-bg-input)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
          </div>

          {/* Date From */}
          <div className="min-w-[140px]">
            <Input
              type="date"
              label="From Date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); resetPage() }}
              max={dateTo || undefined}
            />
          </div>

          {/* Date To */}
          <div className="min-w-[140px]">
            <Input
              type="date"
              label="To Date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); resetPage() }}
              min={dateFrom || undefined}
            />
          </div>

          {/* Class */}
          <div className="min-w-[130px]">
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Class
            </label>
            <select
              value={classId}
              onChange={(e) => { setClassId(e.target.value); resetPage() }}
              className="w-full rounded-xl px-3 py-2 text-sm border outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--color-bg-input)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Payment Mode */}
          <div className="min-w-[130px]">
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => { setPaymentMode(e.target.value); resetPage() }}
              className="w-full rounded-xl px-3 py-2 text-sm border outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--color-bg-input)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="">All Modes</option>
              <option value="cash">Cash</option>
              <option value="online">Online</option>
              <option value="cheque">Cheque</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl px-4 py-2 text-sm font-semibold border transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        className="overflow-x-auto rounded-[28px] border"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {isLoading ? (
          <div className="p-6"><TableSkeleton rows={8} cols={8} /></div>
        ) : receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              No receipts found
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                {['Receipt No', 'Date', 'Student', 'Class', 'Amount', 'Mode', 'Generated By', 'Actions'].map((head) => (
                  <th
                    key={head}
                    className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt, i) => {
                const modeStyle =
                  PAYMENT_MODE_COLORS[receipt.payment_mode?.toLowerCase()] ||
                  PAYMENT_MODE_COLORS.default
                return (
                  <tr
                    key={receipt.id}
                    className="transition-colors hover:bg-orange-50/30"
                    style={{
                      borderBottom:
                        i < receipts.length - 1 ? '1px solid var(--color-border)' : 'none',
                    }}
                  >
                    <td className="px-4 py-3.5">
                      <span
                        className="text-xs font-bold tracking-wide px-2 py-1 rounded-lg"
                        style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent-emphasis)' }}
                      >
                        {receipt.receipt_no}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(receipt.payment_date)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {receipt.student_name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {receipt.class_name}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold" style={{ color: '#15803d' }}>
                        {formatCurrency(receipt.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="text-xs font-semibold capitalize px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: modeStyle.bg, color: modeStyle.text }}
                      >
                        {receipt.payment_mode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {receipt.received_by_name || (
                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => setSelected(receipt)}
                        className="rounded-full px-4 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-80 shadow-sm"
                        style={{ backgroundColor: 'var(--color-brand)' }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Footer / Pagination */}
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface-2)' }}>
                <td colSpan={4} className="px-4 py-3">
                   <span className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                    Showing {(meta?.page - 1) * meta?.perPage + 1}–{Math.min(meta?.page * meta?.perPage, meta?.total)} of {meta?.total} receipts
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-bold" style={{ color: '#15803d' }}>
                  {formatCurrency(meta?.totalAmount || 0)}
                </td>
                <td colSpan={3} className="px-4 py-3">
                   <div className="flex items-center gap-1 justify-end">
                    <button 
                      type="button" 
                      disabled={page === 1} 
                      onClick={() => setPage(p => p - 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border disabled:opacity-30 transition-colors hover:bg-orange-50"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    >‹</button>
                    
                    {Array.from({ length: meta?.totalPages || 1 }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === meta?.totalPages || Math.abs(p - page) <= 1)
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx-1] > 1) acc.push('...');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, idx) => p === '...' ? (
                        <span key={`ell-${idx}`} className="px-2 text-xs text-muted">...</span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-all"
                          style={{ 
                            borderColor: p === page ? 'var(--color-brand)' : 'var(--color-border)',
                            backgroundColor: p === page ? 'var(--color-brand)' : 'transparent',
                            color: p === page ? '#fff' : 'var(--color-text-primary)'
                          }}
                        >{p}</button>
                      ))
                    }

                    <button 
                      type="button" 
                      disabled={page === meta?.totalPages} 
                      onClick={() => setPage(p => p + 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border disabled:opacity-30 transition-colors hover:bg-orange-50"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    >›</button>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Receipt Preview">
        <ReceiptPrint receipt={selected} />
      </Modal>
    </div>
  )
}

export default ReceiptList