import { useState, useEffect } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useReceipts from '@/hooks/useReceipts'
import ReceiptPrint from '@/components/accountant/ReceiptPrint'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import TableSkeleton from '@/components/ui/TableSkeleton'
import UIButton from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { paymentModeBadge } from '@/utils/feeStatus'
import * as classApi from '@/api/classApi'

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

  const selectStyle = {
    backgroundColor: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-primary)',
    borderRadius: 10,
    height: 36,
    padding: '0 10px',
    fontSize: 13,
    border: '1px solid var(--color-border)',
    outline: 'none',
    width: '100%',
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Receipts"
        subtitle="Fee payment records"
        action={<Badge variant="blue">{meta?.total || 0} record{meta?.total !== 1 ? 's' : ''}</Badge>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Receipts"   value={meta?.total || 0} />
        <StatCard label="Total Collected"  value={formatCurrency(meta?.totalAmount || 0)} color="var(--color-success)" />
        <StatCard label="Payment Mode"     value={paymentMode || 'All'} />
        <StatCard label="Current Page"     value={`${page} / ${meta?.totalPages || 1}`} color="var(--color-brand)" />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Student name or receipt no…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); resetPage() }}
                style={{ ...selectStyle, paddingLeft: 32 }}
              />
            </div>
          </div>
          <div className="min-w-[140px]">
            <Input type="date" label="From Date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); resetPage() }} max={dateTo || undefined} />
          </div>
          <div className="min-w-[140px]">
            <Input type="date" label="To Date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); resetPage() }} min={dateFrom || undefined} />
          </div>
          <div className="min-w-[130px]">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Class</label>
            <select value={classId} onChange={(e) => { setClassId(e.target.value); resetPage() }} style={selectStyle}>
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="min-w-[130px]">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Mode</label>
            <select value={paymentMode} onChange={(e) => { setPaymentMode(e.target.value); resetPage() }} style={selectStyle}>
              <option value="">All Modes</option>
              <option value="cash">Cash</option>
              <option value="online">Online</option>
              <option value="cheque">Cheque</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          {hasFilters && <UIButton variant="ghost" size="sm" onClick={clearFilters}>Clear</UIButton>}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="-mx-5 -mb-5 overflow-x-auto">
          {isLoading ? (
            <TableSkeleton rows={8} cols={8} />
          ) : receipts.length === 0 ? (
            <EmptyState
              title="No receipts found"
              description={hasFilters ? 'Try adjusting your filters' : 'No receipts available'}
              action={hasFilters && <UIButton variant="outline" size="sm" onClick={clearFilters}>Clear filters</UIButton>}
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                  {['Receipt No', 'Date', 'Student', 'Class', 'Amount', 'Mode', 'Generated By', ''].map((head) => (
                    <th key={head} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt, i) => (
                  <tr
                    key={receipt.id}
                    className="transition-colors"
                    style={{ borderBottom: i < receipts.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                  >
                    <td className="px-4 py-3.5">
                      <Badge variant="blue">{receipt.receipt_no}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(receipt.payment_date)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {receipt.student_name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {receipt.class_name}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
                        {formatCurrency(receipt.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={paymentModeBadge(receipt.payment_mode)} dot>
                        {receipt.payment_mode}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {receipt.received_by_name || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <UIButton variant="outline" size="xs" onClick={() => setSelected(receipt)}>
                        View
                      </UIButton>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                  <td colSpan={4} className="px-4 py-3">
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Showing {(meta?.page - 1) * meta?.perPage + 1}–{Math.min(meta?.page * meta?.perPage, meta?.total)} of {meta?.total} receipts
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
                    {formatCurrency(meta?.totalAmount || 0)}
                  </td>
                  <td colSpan={3} className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button type="button" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs border disabled:opacity-30"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>‹
                      </button>
                      {Array.from({ length: meta?.totalPages || 1 }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === meta?.totalPages || Math.abs(p - page) <= 1)
                        .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…'); acc.push(p); return acc }, [])
                        .map((p, idx) => p === '…' ? (
                          <span key={`ell-${idx}`} className="px-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>…</span>
                        ) : (
                          <button key={p} type="button" onClick={() => setPage(p)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs border transition-all"
                            style={{ borderColor: p === page ? 'var(--color-brand)' : 'var(--color-border)', backgroundColor: p === page ? 'var(--color-brand)' : 'transparent', color: p === page ? '#fff' : 'var(--color-text-primary)' }}>
                            {p}
                          </button>
                        ))
                      }
                      <button type="button" disabled={page === meta?.totalPages} onClick={() => setPage(p => p + 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs border disabled:opacity-30"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>›
                      </button>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Receipt Preview">
        <ReceiptPrint receipt={selected} />
      </Modal>
    </div>
  )
}

export default ReceiptList