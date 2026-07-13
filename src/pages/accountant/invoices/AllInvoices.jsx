import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Wallet } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import { ROUTES } from '@/constants/app'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency, formatDate, getFeeMonthLabel } from '@/utils/helpers'
import { feeStatusBadge } from '@/utils/feeStatus'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import TableSkeleton from '@/components/ui/TableSkeleton'
import UIButton from '@/components/ui/Button'

const PAGE_SIZE = 20

const AllInvoices = () => {
  usePageTitle('All Invoices')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    accountantApi.getInvoices()
      .then((res) => setRows(res.data?.invoices || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return <InvoiceTable title="All Invoices" rows={rows} loading={loading} />
}

export const InvoiceTable = ({ title, rows = [], loading = false }) => {
  const navigate = useNavigate()
  const [search, setSearch]           = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatus]     = useState('')
  const [feeFilter, setFeeFilter]     = useState('')
  const [page, setPage]               = useState(1)

  const classes  = useMemo(() => [...new Set(rows.map((r) => r.class_name).filter(Boolean))].sort(), [rows])
  const feeTypes = useMemo(() => [...new Set(rows.map((r) => r.fee_name).filter(Boolean))].sort(), [rows])
  const statuses = useMemo(() => [...new Set(rows.map((r) => r.status).filter(Boolean))].sort(), [rows])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows.filter((r) => {
      if (classFilter  && r.class_name !== classFilter)  return false
      if (statusFilter && r.status     !== statusFilter)  return false
      if (feeFilter    && r.fee_name   !== feeFilter)     return false
      if (q && !r.student_name?.toLowerCase().includes(q) && !String(r.id).includes(q)) return false
      return true
    })
  }, [rows, search, classFilter, statusFilter, feeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page])

  const totalDue   = useMemo(() => filtered.reduce((s, r) => s + Number(r.amount_due  || 0), 0), [filtered])
  const totalPaid  = useMemo(() => filtered.reduce((s, r) => s + Number(r.amount_paid || 0), 0), [filtered])
  const totalBal   = useMemo(() => filtered.reduce((s, r) => s + Number(r.balance     || 0), 0), [filtered])
  const overdueCount = useMemo(() => filtered.filter((r) => r.status?.toLowerCase() === 'overdue').length, [filtered])

  const resetPage = () => setPage(1)
  const clearAll  = () => { setSearch(''); setClassFilter(''); setStatus(''); setFeeFilter(''); setPage(1) }
  const hasFilter = search || classFilter || statusFilter || feeFilter

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
        title={title}
        subtitle="Fee invoices across all students"
        action={
          <Badge variant="blue">{filtered.length} invoice{filtered.length !== 1 ? 's' : ''}</Badge>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Invoiced"  value={formatCurrency(totalDue)}   />
        <StatCard label="Total Collected" value={formatCurrency(totalPaid)}  color="var(--color-success)" />
        <StatCard label="Outstanding"     value={formatCurrency(totalBal)}   color={totalBal > 0 ? 'var(--color-danger)' : 'var(--color-success)'} />
        <StatCard label="Overdue"         value={overdueCount} sub="invoices" color={overdueCount > 0 ? 'var(--color-danger)' : undefined} />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Student name or invoice no…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage() }}
                style={{ ...selectStyle, paddingLeft: 32 }}
              />
            </div>
          </div>
          <div className="min-w-[130px]">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Class</label>
            <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); resetPage() }} style={selectStyle}>
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Fee Type</label>
            <select value={feeFilter} onChange={(e) => { setFeeFilter(e.target.value); resetPage() }} style={selectStyle}>
              <option value="">All Types</option>
              {feeTypes.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="min-w-[130px]">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Status</label>
            <select value={statusFilter} onChange={(e) => { setStatus(e.target.value); resetPage() }} style={selectStyle}>
              <option value="">All Statuses</option>
              {statuses.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
          {hasFilter && (
            <UIButton variant="ghost" size="sm" onClick={clearAll}>Clear</UIButton>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="-mx-5 -mb-5 overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={8} cols={10} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No invoices found"
              description={hasFilter ? 'Try adjusting your filters' : 'No invoices available'}
              action={hasFilter && <UIButton variant="outline" size="sm" onClick={clearAll}>Clear filters</UIButton>}
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                  {['Invoice', 'Student', 'Class', 'Fee Type', 'Due Date', 'Amount', 'Paid', 'Balance', 'Status', ''].map((head) => (
                    <th
                      key={head}
                      className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((row, i) => {
                  const bal = Number(row.balance || 0)
                  return (
                    <tr
                      key={row.id}
                      className="cursor-pointer transition-colors"
                      onClick={() => navigate(ROUTES.ACCOUNTANT_STUDENT_FEES.replace(':id', row.student_id))}
                      style={{ borderBottom: i < paginated.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                    >
                      <td className="px-4 py-3.5">
                        <Badge variant="blue">INV-{row.id}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-medium shrink-0" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>
                            {(row.student_name || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>
                            {row.student_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                        {row.class_name}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs px-2 py-0.5 rounded-lg whitespace-nowrap" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                          {row.fee_name} {row.due_date ? `(${getFeeMonthLabel(row.due_date)})` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatDate(row.due_date)}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>
                        {formatCurrency(row.amount_due)}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium whitespace-nowrap" style={{ color: 'var(--color-success)' }}>
                        {formatCurrency(row.amount_paid)}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold whitespace-nowrap" style={{ color: bal > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        {formatCurrency(bal)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={feeStatusBadge(row.status)} dot>{row.status}</Badge>
                      </td>
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => navigate(ROUTES.ACCOUNTANT_STUDENT_FEES.replace(':id', row.student_id))}
                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                            style={{ color: 'var(--color-text-muted)' }}
                            title="View Detail"
                          >
                            <Eye size={14} />
                          </button>
                          {bal > 0 && (
                            <button
                              type="button"
                              onClick={() => navigate(ROUTES.ACCOUNTANT_COLLECTION)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                              style={{ color: 'var(--color-brand)' }}
                              title="Collect Fee"
                            >
                              <Wallet size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {/* Footer / Pagination */}
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                  <td colSpan={5} className="px-4 py-3">
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(totalDue)}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--color-success)' }}>{formatCurrency(totalPaid)}</td>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: totalBal > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{formatCurrency(totalBal)}</td>
                  <td colSpan={2} className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs border disabled:opacity-30 transition-colors"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>‹
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                        .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…'); acc.push(p); return acc }, [])
                        .map((p, idx) => p === '…'
                          ? <span key={`e${idx}`} className="w-7 h-7 flex items-center justify-center text-xs" style={{ color: 'var(--color-text-muted)' }}>…</span>
                          : <button key={p} type="button" onClick={() => setPage(p)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs border transition-colors"
                              style={{ borderColor: p === page ? 'var(--color-brand)' : 'var(--color-border)', backgroundColor: p === page ? 'var(--color-brand)' : 'transparent', color: p === page ? '#fff' : 'var(--color-text-primary)' }}>
                              {p}
                            </button>
                        )}
                      <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs border disabled:opacity-30 transition-colors"
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
    </div>
  )
}

export default AllInvoices