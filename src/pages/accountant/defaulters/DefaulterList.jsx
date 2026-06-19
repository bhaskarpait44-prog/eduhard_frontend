import { useCallback, useMemo, useState } from 'react'
import { Download, Bell, CheckSquare, Square, AlertCircle, Search, X, Users, CreditCard, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import usePageTitle from '@/hooks/usePageTitle'
import useDefaulters from '@/hooks/useDefaulters'
import useSessionStore from '@/store/sessionStore'
import ReminderModal from '@/components/accountant/ReminderModal'
import AgTable from '@/components/ui/AgTable'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { downloadBlob } from '@/utils/downloadBlob'

const SEVERITY = (balance) => {
  if (balance >= 10000) return { label: 'Critical', tone: 'critical' }
  if (balance >= 5000) return { label: 'High', tone: 'high' }
  return { label: 'Moderate', tone: 'moderate' }
}

const StatCard = ({ label, value, icon: Icon, accent, sub, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: index * 0.06 }}
    className="relative rounded-2xl border p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all group overflow-hidden"
    style={{ 
      backgroundColor: 'var(--color-surface)', 
      borderColor: 'var(--color-border)',
    }}
  >
    <div 
      className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2"
      style={{ backgroundColor: accent || 'var(--color-brand)' }}
    />
    <div className="flex flex-col gap-1 pl-1">
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="text-3xl font-extrabold leading-tight tracking-tight" style={{ color: accent || 'var(--color-text-primary)' }}>{value}</span>
      {sub && <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>{sub}</span>}
    </div>
    {Icon && (
      <div className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors"
        style={{ 
          backgroundColor: accent ? `color-mix(in srgb, ${accent} 8%, var(--color-surface-raised))` : 'var(--color-accent-subtle)',
          color: accent || 'var(--color-brand)' 
        }}
      >
        <Icon size={20} className="transition-transform group-hover:scale-110" />
      </div>
    )}
  </motion.div>
)

const DefaulterList = () => {
  usePageTitle('Defaulters')
  const { defaulters = [] } = useDefaulters()
  const { currentSession } = useSessionStore()
  const [selected, setSelected] = useState([])
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [selectedClass, setSelectedClass] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')

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
    return list
  }, [defaulters, selectedClass, searchQuery, severityFilter])

  const totalDue = useMemo(() => filtered.reduce((s, r) => s + Number(r.balance || 0), 0), [filtered])
  const criticalCount = useMemo(() => filtered.filter((r) => Number(r.balance) >= 10000).length, [filtered])

  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map((r) => r.student_id))

  const handleSelectionChanged = useCallback((rows) => {
    setSelected(rows.map((row) => row.student_id))
  }, [])

  const getRowId = useCallback((params) => String(params.data.student_id), [])

  const columnDefs = useMemo(() => [
    {
      headerName: 'Student Details',
      field: 'student_name',
      minWidth: 240,
      flex: 1.5,
      cellRenderer: ({ data }) => (
        <div className="flex h-full items-center gap-3 py-1">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-sm transition-all group-hover:scale-105" 
            style={{ 
              backgroundColor: 'var(--color-accent-subtle)', 
              color: 'var(--color-accent-emphasis)',
              border: '1px solid color-mix(in srgb, var(--color-accent-emphasis) 15%, transparent)'
            }}
          >
            {(data.student_name || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col justify-center leading-tight">
            <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--color-text-primary)' }}>{data.student_name}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{data.admission_no || '-'}</span>
          </div>
        </div>
      ),
    },
    { headerName: 'Class', field: 'class_name', width: 130 },
    {
      headerName: 'Severity',
      field: 'balance',
      width: 145,
      valueGetter: ({ data }) => SEVERITY(Number(data.balance)).label,
      cellRenderer: ({ data }) => {
        const sev = SEVERITY(Number(data.balance))
        return (
          <span className={`severity-pill severity-pill-${sev.tone}`}>
            <span className="severity-dot" />
            {sev.label}
          </span>
        )
      },
    },
    {
      headerName: 'Total Due',
      field: 'balance',
      width: 145,
      sort: 'desc',
      type: 'rightAligned',
      valueFormatter: ({ value }) => formatCurrency(value),
      cellClass: 'defaulter-amount-cell',
    },
    {
      headerName: 'Overdue Since',
      field: 'first_due_date',
      width: 155,
      valueFormatter: ({ value }) => value ? formatDate(value) : '-',
    },
    {
      headerName: 'Open Invoices',
      field: 'open_invoices',
      width: 150,
      type: 'rightAligned',
      cellRenderer: ({ value }) => (
        <span className="invoice-count-pill">
          {value}
        </span>
      ),
    },
    {
      headerName: 'Actions',
      field: 'student_id',
      width: 130,
      sortable: false,
      filter: false,
      cellRenderer: ({ data }) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setSelected([data.student_id])
            setOpen(true)
          }}
          className="defaulter-inline-action flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
          style={{ 
            backgroundColor: 'var(--color-brand)',
            borderRadius: '8px',
            padding: '0.4rem 0.8rem'
          }}
        >
          <Bell size={11} className="text-white" />
          <span>Remind</span>
        </button>
      ),
    },
  ], [])

  const getRowClass = useCallback((params) => {
    const severity = SEVERITY(Number(params.data.balance)).label.toLowerCase()
    return `defaulter-row-${severity}`
  }, [])

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
      downloadBlob(response, `Defaulters_List_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Failed to download defaulters PDF', error)
    } finally { setDownloading(false) }
  }

  const clearFilters = () => {
    setSelectedClass('')
    setSearchQuery('')
    setSeverityFilter('')
  }

  const hasFilters = selectedClass || searchQuery || severityFilter

  const inputStyle = {
    backgroundColor: 'var(--color-bg-input)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-primary)',
  }

  return (
    <div className="defaulters-page space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border p-6 shadow-sm relative overflow-hidden" 
        style={{ 
          backgroundColor: 'var(--color-surface)', 
          borderColor: 'var(--color-border)' 
        }}
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Defaulter Management</h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300">Action Required</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Track pending fee dues, view detailed records, and dispatch reminders to guardians.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="defaulters-action-button hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', borderRadius: '12px' }}
          >
            <Download size={15} />
            {downloading ? 'Preparing PDF...' : 'Export List'}
          </button>

          <button
            type="button"
            onClick={toggleAll}
            className="defaulters-action-button hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', borderRadius: '12px' }}
          >
            {selected.length === filtered.length && filtered.length > 0 ? <CheckSquare size={15} className="text-brand" /> : <Square size={15} />}
            {selected.length === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All'}
          </button>

          <div className="group relative">
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all shadow-md hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              style={{ backgroundColor: 'var(--color-brand)' }}
            >
              <Bell size={15} />
              Send Reminders {selected.length > 0 && `(${selected.length})`}
            </button>
            {selected.length === 0 && (
              <div className="absolute bottom-full left-1/2 mb-2.5 w-52 -translate-x-1/2 rounded-xl bg-slate-900 dark:bg-slate-800 px-3 py-2 text-[11px] font-semibold text-white opacity-0 shadow-2xl transition-opacity group-hover:opacity-100 pointer-events-none z-50 border border-slate-700/50">
                <div className="flex items-start gap-2">
                  <AlertCircle size={13} className="mt-0.5 text-amber-400 flex-shrink-0" />
                  <span>Select one or more students to send manual notifications.</span>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900 dark:border-t-slate-800" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard index={0} label="Total Defaulters" value={filtered.length} icon={Users} />
        <StatCard index={1} label="Total Due" value={formatCurrency(totalDue)} accent="#dc2626" icon={CreditCard} />
        <StatCard index={2} label="Critical" value={criticalCount} accent="#e11d48" sub="≥ ₹10,000 due" icon={AlertTriangle} />
        <StatCard index={3} label="Selected" value={selected.length} accent={selected.length > 0 ? 'var(--color-brand)' : undefined} sub={selected.length > 0 ? 'for bulk reminder' : 'none selected'} icon={CheckSquare} />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border p-5 shadow-sm" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Search Student</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
              <input type="text" placeholder="Type student name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl pl-10 pr-9 py-2.5 text-sm border outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand" style={inputStyle} />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Class */}
          <div className="min-w-[160px]">
            <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Class</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none cursor-pointer focus:ring-2 focus:ring-brand/20 focus:border-brand" style={inputStyle}>
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Severity */}
          <div className="min-w-[160px]">
            <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Severity Level</label>
            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none cursor-pointer focus:ring-2 focus:ring-brand/20 focus:border-brand" style={inputStyle}>
              <option value="">All Levels</option>
              <option value="Critical">Critical (≥ ₹10K)</option>
              <option value="High">High (≥ ₹5K)</option>
              <option value="Moderate">Moderate (&lt; ₹5K)</option>
            </select>
          </div>

          {hasFilters && (
            <button type="button" onClick={clearFilters} className="defaulters-action-button px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 border border-dashed hover:border-solid hover:scale-105 active:scale-95 transition-all cursor-pointer" style={{ borderRadius: '12px' }}>
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg className="w-10 h-10 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>No defaulters match your filters</p>
          </div>
        ) : (
          <>
            <AgTable
              columns={columnDefs}
              data={filtered}
              height={560}
              paginationPageSize={20}
              selectedRowIds={selected}
              onSelectionChanged={handleSelectionChanged}
              getRowId={getRowId}
              gridOptions={{
                getRowClass,
                rowHeight: 58,
                headerHeight: 44,
                selectionColumnDef: {
                  width: 48,
                  pinned: 'left',
                  sortable: false,
                  resizable: false,
                },
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-2 pt-4 text-xs font-semibold" style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
              <span>Showing {filtered.length} students</span>
              <span>Total outstanding: <span className="defaulter-total-amount text-sm">{formatCurrency(totalDue)}</span></span>
            </div>
          </>
        )}
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 40, x: '-50%' }}
            className="fixed bottom-6 left-1/2 flex items-center gap-5 rounded-2xl border px-6 py-4 shadow-2xl z-50 backdrop-blur-md"
            style={{ 
              backgroundColor: 'var(--color-text-primary)', 
              borderColor: 'var(--color-border)', 
              color: 'var(--color-surface)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="flex flex-col">
              <span className="text-sm font-extrabold">{selected.length} students selected</span>
              <span className="text-[10px] opacity-70 font-semibold uppercase tracking-wider">Bulk reminder action</span>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <button 
              type="button" 
              onClick={() => setOpen(true)} 
              className="flex items-center gap-2 text-sm font-extrabold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
            >
              <Bell size={15} className="animate-bounce" />
              Send Bulk Reminder
            </button>
            <button 
              type="button" 
              onClick={() => setSelected([])} 
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Clear Selection"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ReminderModal open={open} onClose={() => { setOpen(false) }} onSend={send} selectedCount={selected.length} />
    </div>
  )
}

export default DefaulterList
