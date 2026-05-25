import { useState, useMemo } from 'react'
import { Download, Bell, CheckSquare, Square, AlertCircle } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useDefaulters from '@/hooks/useDefaulters'
import ReminderModal from '@/components/accountant/ReminderModal'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency, formatDate } from '@/utils/helpers'

const SEVERITY = (balance) => {
  if (balance >= 10000) return { label: 'Critical', bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' }
  if (balance >= 5000) return { label: 'High', bg: 'var(--color-accent-subtle)', text: 'var(--color-accent-emphasis)', dot: '#f97316' }
  return { label: 'Moderate', bg: '#fefce8', text: '#a16207', dot: '#eab308' }
}

const StatCard = ({ label, value, accent, sub }) => (
  <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
    <span className="text-2xl font-bold leading-tight" style={{ color: accent || 'var(--color-text-primary)' }}>{value}</span>
    {sub && <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{sub}</span>}
  </div>
)

const DefaulterList = () => {
  usePageTitle('Defaulters')
  const { defaulters = [], currentSession } = useDefaulters()
  const [selected, setSelected] = useState([])
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [selectedClass, setSelectedClass] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [sortBy, setSortBy] = useState('balance_desc')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const classes = useMemo(() => {
    const set = new Set(defaulters.map((r) => r.class_name).filter(Boolean))
    return Array.from(set).sort()
  }, [defaulters])

  const filtered = useMemo(() => {
    let list = [...defaulters]
    if (selectedClass) list = list.filter((r) => r.class_name === selectedClass)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((r) => r.student_name?.toLowerCase().includes(q))
    }
    if (severityFilter) {
      list = list.filter((r) => {
        const s = SEVERITY(Number(r.balance))
        return s.label === severityFilter
      })
    }
    if (sortBy === 'balance_desc') list.sort((a, b) => b.balance - a.balance)
    else if (sortBy === 'balance_asc') list.sort((a, b) => a.balance - b.balance)
    else if (sortBy === 'due_asc') list.sort((a, b) => new Date(a.first_due_date) - new Date(b.first_due_date))
    else if (sortBy === 'name_asc') list.sort((a, b) => a.student_name?.localeCompare(b.student_name))
    return list
  }, [defaulters, selectedClass, searchQuery, severityFilter, sortBy])

  const totalDue = useMemo(() => filtered.reduce((s, r) => s + Number(r.balance || 0), 0), [filtered])
  const criticalCount = useMemo(() => filtered.filter((r) => Number(r.balance) >= 10000).length, [filtered])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page])

  const toggleRow = (id) => setSelected((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map((r) => r.student_id))

  const send = async ({ type, message }) => {
    await accountantApi.sendReminderBulk({ student_ids: selected, type, message }).catch(() => {})
    setOpen(false)
    setSelected([])
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await accountantApi.downloadDefaultersPdf({
        session_id: currentSession?.id,
        class_id: selectedClass ? defaulters.find(d => d.class_name === selectedClass)?.class_id : undefined
      })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Defaulters_List_${new Date().toISOString().split('T')[0]}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch {} finally { setDownloading(false) }
  }

  const clearFilters = () => {
    setSelectedClass('')
    setSearchQuery('')
    setSeverityFilter('')
    setPage(1)
  }

  const hasFilters = selectedClass || searchQuery || severityFilter

  const inputStyle = {
    backgroundColor: 'var(--color-bg-input)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-primary)',
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Defaulter Management</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>Track pending dues and send reminders to guardians.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold border transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <Download size={14} />
            {downloading ? 'Preparing...' : 'Export List'}
          </button>

          <div className="h-8 w-px bg-gray-200 mx-1" />

          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold border transition-all hover:bg-gray-50 active:scale-95"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            {selected.length === filtered.length && filtered.length > 0 ? <CheckSquare size={14} className="text-brand" /> : <Square size={14} />}
            {selected.length === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All'}
          </button>

          <div className="group relative">
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
              style={{ backgroundColor: 'var(--color-brand)' }}
            >
              <Bell size={14} />
              Send Reminders {selected.length > 0 && `(${selected.length})`}
            </button>
            {selected.length === 0 && (
              <div className="absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-[11px] font-medium text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 pointer-events-none z-50">
                <div className="flex items-start gap-1.5">
                  <AlertCircle size={12} className="mt-0.5 text-orange-400" />
                  Select one or more students to enable reminders.
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Defaulters" value={filtered.length} />
        <StatCard label="Total Due" value={formatCurrency(totalDue)} accent="#b91c1c" />
        <StatCard label="Critical" value={criticalCount} accent="#b91c1c" sub="≥ ₹10,000 due" />
        <StatCard label="Selected" value={selected.length} accent={selected.length > 0 ? 'var(--color-brand)' : undefined} sub={selected.length > 0 ? 'for bulk reminder' : 'none selected'} />
      </div>

      {/* Filters */}
      <div className="rounded-[24px] border p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Student name..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                className="w-full rounded-xl pl-9 pr-3 py-2 text-sm border outline-none transition-all focus:border-brand" style={inputStyle} />
            </div>
          </div>

          {/* Class */}
          <div className="min-w-[140px]">
            <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Class</label>
            <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setPage(1) }} className="w-full rounded-xl px-3 py-2 text-sm border outline-none" style={inputStyle}>
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Severity */}
          <div className="min-w-[140px]">
            <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Severity</label>
            <select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(1) }} className="w-full rounded-xl px-3 py-2 text-sm border outline-none" style={inputStyle}>
              <option value="">All Levels</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Moderate">Moderate</option>
            </select>
          </div>

          {/* Sort */}
          <div className="min-w-[160px]">
            <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Sort By</label>
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1) }} className="w-full rounded-xl px-3 py-2 text-sm border outline-none" style={inputStyle}>
              <option value="balance_desc">Amount: High → Low</option>
              <option value="balance_asc">Amount: Low → High</option>
              <option value="due_asc">Due Date: Oldest First</option>
              <option value="name_asc">Name: A → Z</option>
            </select>
          </div>

          {hasFilters && (
            <button type="button" onClick={clearFilters} className="rounded-xl px-4 py-2 text-sm font-semibold border transition-colors hover:bg-gray-50" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[28px] border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg className="w-10 h-10 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>No defaulters match your filters</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="rounded cursor-pointer accent-brand"
                  />
                </th>
                {['Student', 'Class', 'Severity', 'Total Due', 'Overdue Since', 'Open Invoices', 'Actions'].map((head) => (
                  <th key={head} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((row, i) => {
                const isSelected = selected.includes(row.student_id)
                const sev = SEVERITY(Number(row.balance))
                return (
                  <tr
                    key={row.student_id}
                    className="group transition-colors hover:bg-orange-50/20"
                    style={{
                      borderBottom: i < paginated.length - 1 ? '1px solid var(--color-border)' : 'none',
                      backgroundColor: isSelected ? 'rgba(234,88,12,0.04)' : undefined,
                    }}
                  >
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleRow(row.student_id)} className="rounded cursor-pointer accent-brand" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent-emphasis)' }}>
                          {(row.student_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.student_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{row.class_name}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm" style={{ backgroundColor: sev.bg, color: sev.text }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: sev.dot }} />
                        {sev.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold" style={{ color: '#b91c1c' }}>{formatCurrency(row.balance)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {row.first_due_date ? formatDate(row.first_due_date) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shadow-sm" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fee2e2' }}>
                        {row.open_invoices}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => { setSelected([row.student_id]); setOpen(true) }}
                        className="rounded-full px-4 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
                        style={{ backgroundColor: 'var(--color-brand)' }}
                      >
                        Remind
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface-2)' }}>
                <td colSpan={4} className="px-4 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} students
                </td>
                <td className="px-4 py-4 text-sm font-bold" style={{ color: '#b91c1c' }}>{formatCurrency(totalDue)}</td>
                <td colSpan={2} />
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border disabled:opacity-30 transition-colors hover:bg-orange-50"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    >
                      ‹
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…')
                        acc.push(p)
                        return acc
                      }, [])
                      .map((p, idx) =>
                        p === '…' ? (
                          <span key={`ellipsis-${idx}`} className="w-7 h-7 flex items-center justify-center text-xs" style={{ color: 'var(--color-text-muted)' }}>…</span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPage(p)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors"
                            style={{
                              borderColor: p === page ? 'var(--color-brand)' : 'var(--color-border)',
                              backgroundColor: p === page ? 'var(--color-brand)' : 'transparent',
                              color: p === page ? '#fff' : 'var(--color-text-primary)',
                            }}
                          >
                            {p}
                          </button>
                        )
                      )}
                    <button
                      type="button"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border disabled:opacity-30 transition-colors hover:bg-orange-50"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    >
                      ›
                    </button>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-5 rounded-[22px] px-6 py-4 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={{ backgroundColor: '#18181b', color: '#ffffff' }}
        >
          <div className="flex flex-col">
            <span className="text-sm font-bold">{selected.length} students selected</span>
            <span className="text-[10px] opacity-60 font-medium">Bulk action for reminders</span>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <button 
            type="button" 
            onClick={() => setOpen(true)} 
            className="flex items-center gap-2 text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors"
          >
            <Bell size={14} />
            Send Bulk Reminder
          </button>
          <button 
            type="button" 
            onClick={() => setSelected([])} 
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
            title="Clear Selection"
          >
            ✕
          </button>
        </div>
      )}

      <ReminderModal open={open} onClose={() => { setOpen(false) }} onSend={send} selectedCount={selected.length} />
    </div>
  )
}

export default DefaulterList