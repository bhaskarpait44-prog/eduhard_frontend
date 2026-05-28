// src/pages/fees/FeeStructurePage.jsx
import { useState, useEffect, useMemo, Fragment } from 'react'
import { Plus, Trash2, Settings2, Download, Search, Pencil, Check, X } from 'lucide-react'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import TableSkeleton from '@/components/ui/TableSkeleton'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import AddFeeComponentModal from './AddFeeComponentModal'
import { formatCurrency } from '@/utils/helpers'
import { getClasses, getClassOptions } from '@/api/classApi'
import * as feesApi from '@/api/feesApi'
import * as accountantApi from '@/api/accountantApi'

const FREQUENCY_BADGE = {
  monthly    : { label: 'Monthly',    variant: 'blue'  },
  quarterly  : { label: 'Quarterly',  variant: 'green' },
  annual     : { label: 'Annual',     variant: 'yellow'},
  one_time   : { label: 'One Time',   variant: 'grey'  },
}

const ordinal = (n) => {
  if (!n) return '—'
  const s = ['th','st','nd','rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

const EditableCell = ({ value, onSave, isLoading }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)

  useEffect(() => {
    setTempValue(value)
  }, [value])

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded outline-none focus:ring-1 focus:ring-brand"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSave(tempValue)
              setIsEditing(false)
            }
            if (e.key === 'Escape') {
              setTempValue(value)
              setIsEditing(false)
            }
          }}
          disabled={isLoading}
        />
        <button onClick={() => { onSave(tempValue); setIsEditing(false) }} className="text-green-600 p-1 hover:bg-green-50 rounded">
          <Check size={14} />
        </button>
        <button onClick={() => { setTempValue(value); setIsEditing(false) }} className="text-red-600 p-1 hover:bg-red-50 rounded">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div 
      className="group flex items-center gap-2 cursor-pointer min-h-[24px]"
      onDoubleClick={() => setIsEditing(true)}
    >
      <span>{value}</span>
      <Pencil size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}

const FeeStructurePage = ({ apiMode = 'default' }) => {
  const { toastSuccess, toastError } = useToast()
  const { sessions, currentSession, fetchSessions } = useSessionStore()
  const [structures, setStructures] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [classes,      setClasses]      = useState([])
  const [sessionId,    setSessionId]    = useState('')
  const [classId,      setClassId]      = useState('')
  const [search,       setSearch]       = useState('')
  const [addModal,     setAddModal]     = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const apiClient = apiMode === 'accountant' ? accountantApi : feesApi

  useEffect(() => {
    fetchSessions().catch(() => {})
    getClasses()
      .then(r => setClasses(getClassOptions(r)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (currentSession && !sessionId) setSessionId(String(currentSession.id))
  }, [currentSession])

  const fetchStructures = () => {
    if (!sessionId) return
    setIsLoading(true)
    const fetcher = apiMode === 'accountant' ? accountantApi.getFeeStructure : feesApi.getFeeStructures
    fetcher({ session_id: sessionId, class_id: classId || undefined })
      .then((response) => setStructures(response.data?.structures || []))
      .catch(() => toastError('Failed to load fee structures'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchStructures()
  }, [sessionId, classId, apiMode])

  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsSaving(true)
    try {
      if (apiClient.deleteFeeStructure) {
        await apiClient.deleteFeeStructure(deleteTarget.id)
      } else {
        await feesApi.deleteFeeStructure(deleteTarget.id)
      }
      setStructures((current) => current.filter((row) => row.id !== deleteTarget.id))
      setDeleteTarget(null)
      toastSuccess('Fee component removed')
    } catch (error) {
      toastError(error?.message || 'Failed to delete')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async (id, data) => {
    if (!apiClient.updateFeeStructure) {
      toastError('Inline edit not available in this mode')
      return
    }

    try {
      await apiClient.updateFeeStructure(id, data)
      setStructures(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
      toastSuccess('Updated successfully')
    } catch (error) {
      toastError(error?.message || 'Failed to update')
    }
  }

  const handleDownload = async () => {
    if (!sessionId) return
    setIsDownloading(true)
    try {
      const response = await apiClient.downloadFeeStructurePdf({
        session_id: sessionId,
        class_id: classId || undefined,
      })
      
      if (!response) {
        throw new Error('No response received from server')
      }

      if (response.type === 'application/json') {
        const text = await response.text()
        const errorData = JSON.parse(text)
        throw new Error(errorData.message || 'Failed to generate PDF')
      }

      const sessionName = sessions.find(s => String(s.id) === sessionId)?.name || 'Session'
      const className = classId ? (classes.find(c => c.value === classId)?.label || 'Class') : 'All_Classes'
      const fileName = `Fee_Structure_${className.replace(/\s+/g, '_')}_${sessionName.replace(/\s+/g, '_')}.pdf`

      const url = window.URL.createObjectURL(response)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      setTimeout(() => window.URL.revokeObjectURL(url), 100)
    } catch (error) {
      console.error('[Download Error]', error)
      toastError(error.message || 'Failed to download PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  const filteredStructures = useMemo(() => {
    return structures.filter(f =>
      (!search || f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.class_name?.toLowerCase().includes(search.toLowerCase()))
    )
  }, [structures, search])

  const stats = useMemo(() => {
    const nonOptional = structures.filter(s => !s.is_optional)
    const annualTotal = nonOptional.reduce((acc, curr) => {
      const amount = parseFloat(curr.amount) || 0
      const multiplier = curr.frequency === 'monthly' ? 12 : curr.frequency === 'quarterly' ? 4 : 1
      return acc + (amount * multiplier)
    }, 0)
    return { count: structures.length, annualTotal }
  }, [structures])

  const groupedStructures = useMemo(() => {
    if (classId) return { [structures[0]?.class_name || 'Class']: filteredStructures }
    
    return filteredStructures.reduce((acc, curr) => {
      const key = curr.class_name || 'Unassigned'
      if (!acc[key]) acc[key] = []
      acc[key].push(curr)
      return acc
    }, {})
  }, [filteredStructures, classId])

  const calculateAnnual = (fee) => {
    const amt = parseFloat(fee.amount) || 0
    if (fee.frequency === 'monthly') return amt * 12
    if (fee.frequency === 'quarterly') return amt * 4
    return amt
  }

  const totalsFooter = useMemo(() => {
    const nonOptional = filteredStructures.filter(s => !s.is_optional)
    const amountSum = nonOptional.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0)
    const annualSum = nonOptional.reduce((acc, curr) => acc + calculateAnnual(curr), 0)
    return { count: filteredStructures.length, amountSum, annualSum }
  }, [filteredStructures])

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div 
        className="rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-900/10"
        style={{ background: 'linear-gradient(135deg, #1e40af 0%, #4f46e5 100%)' }}
      >
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fee Structure</h1>
            <p className="mt-2 text-blue-100 max-w-md">
              Manage fee components for each class and session. These components define what students are charged.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Total Components</p>
              <p className="text-2xl font-bold mt-1">{stats.count}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Est. Annual (Non-optional)</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.annualTotal)}</p>
            </div>
          </div>
        </div>
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full -ml-24 -mb-24 blur-2xl"></div>
      </div>

      {/* Filter Card */}
      <div
        className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 rounded-[24px] shadow-sm border border-border"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="md:col-span-3">
          <Select
            label="Academic Session"
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
            options={(sessions || []).map(s => ({ value: String(s.id), label: s.name }))}
          />
        </div>
        <div className="md:col-span-3">
          <Select
            label="Target Class"
            value={classId}
            onChange={e => setClassId(e.target.value)}
            options={classes}
            placeholder="All classes"
          />
        </div>
        <div className="md:col-span-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Search Fee</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input
                className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                style={{ backgroundColor: 'var(--color-bg-input)', borderColor: 'var(--color-border)' }}
                placeholder="Search by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="md:col-span-3 flex items-end justify-end gap-2 pb-0.5">
          <Button
            variant="secondary"
            icon={Download}
            onClick={handleDownload}
            loading={isDownloading}
            disabled={!sessionId || structures.length === 0}
            title={structures.length === 0 ? "No fee components to export" : "Download Fee Structure PDF"}
          />
          <Button 
            variant="primary"
            icon={Plus} 
            onClick={() => setAddModal(true)}
            disabled={!sessionId}
          >
            Add Component
          </Button>
        </div>
      </div>

      {/* Table Content */}
      <div
        className="rounded-[28px] overflow-hidden border border-border shadow-sm"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        {isLoading ? (
          <TableSkeleton cols={8} rows={6} />
        ) : filteredStructures.length === 0 ? (
          <EmptyState
            icon={Settings2}
            title={search ? "No matches found" : "No fee components found"}
            description={search ? `No components match "${search}" in this selection.` : "Fee components define what invoices are generated for each student."}
            action={
              <div className="flex gap-3">
                <Button variant="secondary" disabled={!sessionId || structures.length === 0} onClick={handleDownload} icon={Download}>Download PDF</Button>
                <Button icon={Plus} onClick={() => setAddModal(true)} disabled={!sessionId}>Add Component</Button>
              </div>
            }
            className="border-0 rounded-none py-16"
          >
            <p className="text-xs text-text-muted mt-4 italic">Tip: Use academic sessions to manage fees across different years.</p>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-raised/30 border-b border-border">
                  {['Fee Name', 'Amount', 'Annual Cost', 'Frequency', 'Due Day', 'Optional', 'Remarks', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em]"
                      style={{ color: 'var(--color-text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Object.entries(groupedStructures).map(([className, classFees]) => (
                  <Fragment key={className}>
                    {!classId && (
                      <tr>
                        <td colSpan={8} className="px-5 py-2.5 bg-green-50/50 text-[11px] font-black uppercase text-green-700 border-y border-green-100 tracking-[0.2em] text-center">
                          {className}
                        </td>
                      </tr>
                    )}
                    {classFees.map((fee) => {
                      const freqCfg = FREQUENCY_BADGE[fee.frequency] || { label: fee.frequency, variant: 'grey' }
                      const annual = calculateAnnual(fee)
                      
                      return (
                        <tr key={fee.id} className="group hover:bg-surface-raised/30 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-text-primary">
                              {fee.name}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <EditableCell
                              value={fee.amount}
                              onSave={(val) => handleUpdate(fee.id, { amount: val })}
                              isLoading={isSaving}
                            />
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-bold text-brand">
                              {formatCurrency(annual)}
                              {fee.frequency === 'one_time' && <span className="text-[10px] text-text-muted font-normal ml-1">(once)</span>}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={freqCfg.variant} size="sm">{freqCfg.label}</Badge>
                          </td>
                          <td className="px-5 py-4 text-sm font-medium text-text-secondary">
                            {ordinal(fee.due_day)}
                          </td>
                          <td className="px-5 py-4">
                            {fee.is_optional ? (
                              <Badge variant="grey" size="xs">Optional</Badge>
                            ) : (
                              <span className="text-xs text-text-muted opacity-40">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="max-w-[200px]">
                              <EditableCell
                                value={fee.remarks || '—'}
                                onSave={(val) => handleUpdate(fee.id, { remarks: val === '—' ? null : val })}
                                isLoading={isSaving}
                              />
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setEditTarget(fee)}
                                className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand/5 transition-all"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(fee)}
                                className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-all"
                                title="Remove"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </Fragment>
                ))}
              </tbody>
              <tfoot className="bg-surface-raised/50 border-t border-border">
                <tr className="font-bold text-text-primary text-sm">
                  <td className="px-5 py-4">Total Components: {totalsFooter.count}</td>
                  <td className="px-5 py-4">{formatCurrency(totalsFooter.amountSum)}</td>
                  <td colSpan={6} className="px-5 py-4 text-right">
                    <span className="text-text-muted font-semibold uppercase text-[10px] tracking-wider mr-2">Est. Annual (Non-optional):</span>
                    <span className="text-lg text-brand">{formatCurrency(totalsFooter.annualSum)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      <AddFeeComponentModal
        open={addModal || !!editTarget}
        onClose={() => { setAddModal(false); setEditTarget(null) }}
        sessionId={sessionId}
        classId={classId}
        apiMode={apiMode}
        editTarget={editTarget}
        onCreated={(structure) => {
          if (editTarget) {
             setStructures(prev => prev.map(s => s.id === structure.id ? structure : s))
          } else {
             setStructures((current) => [...current, structure])
          }
          setEditTarget(null)
          setAddModal(false)
        }}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Fee Component?"
        description={`Remove "${deleteTarget?.name}" from the fee structure? This won't affect already-generated invoices.`}
        confirmLabel="Remove"
        loading={isSaving}
      />
    </div>
  )
}

export default FeeStructurePage
