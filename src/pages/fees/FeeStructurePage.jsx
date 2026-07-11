// src/pages/fees/FeeStructurePage.jsx
import { useState, useEffect, useMemo, Fragment } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Select as AntSelect,
  Input as AntInput,
  ConfigProvider,
  Tag,
  Modal,
  Empty,
  Skeleton,
  Space,
  theme as antdTheme
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  DownloadOutlined,
  SearchOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  SlidersOutlined
} from '@ant-design/icons'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import AddFeeComponentModal from './AddFeeComponentModal'
import { formatCurrency } from '@/utils/helpers'
import { getClasses, getClassOptions } from '@/api/classApi'
import * as feesApi from '@/api/feesApi'
import * as accountantApi from '@/api/accountantApi'
import useUiStore from '@/store/uiStore'

const FREQUENCY_BADGE = {
  monthly    : { label: 'Monthly',    color: 'blue'  },
  quarterly  : { label: 'Quarterly',  color: 'green' },
  annual     : { label: 'Annual',     color: 'gold'  },
  one_time   : { label: 'One Time',   color: 'default' },
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
      <div className="flex items-center gap-1.5 max-w-[160px]">
        <AntInput
          size="small"
          autoFocus
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
          className="rounded-lg font-bold"
        />
        <Button 
          type="text" 
          size="small"
          onClick={() => { onSave(tempValue); setIsEditing(false) }} 
          className="text-emerald-600 hover:text-emerald-700 flex items-center justify-center p-0 w-6 h-6 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
          icon={<CheckOutlined className="text-xs" />}
        />
        <Button 
          type="text" 
          size="small"
          onClick={() => { setTempValue(value); setIsEditing(false) }} 
          className="text-rose-600 hover:text-rose-700 flex items-center justify-center p-0 w-6 h-6 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20"
          icon={<CloseOutlined className="text-xs" />}
        />
      </div>
    )
  }

  return (
    <div 
      className="group flex items-center gap-2 cursor-pointer min-h-[24px] font-bold text-gray-700 dark:text-gray-300"
      onDoubleClick={() => setIsEditing(true)}
    >
      <span>{value}</span>
      <EditOutlined className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs" />
    </div>
  )
}

const FeeStructurePage = ({ apiMode = 'default' }) => {
  const { toastSuccess, toastError } = useToast()
  const { theme: storeTheme } = useUiStore()
  const { sessions, currentSession, fetchSessions } = useSessionStore()
  
  const [sessionId,    setSessionId]    = useState('')
  const selectedSessionId = sessionId || (currentSession ? String(currentSession.id) : '')

  const [structures, setStructures] = useState([])
  const [isLoading, setIsLoading] = useState(!!selectedSessionId)
  const [isSaving, setIsSaving] = useState(false)

  const [classes,      setClasses]      = useState([])
  const [classId,      setClassId]      = useState('')
  const [search,       setSearch]       = useState('')
  const [addModal,     setAddModal]     = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const [prevApiMode, setPrevApiMode] = useState(apiMode)
  const [prevSelectedSessionId, setPrevSelectedSessionId] = useState(selectedSessionId)
  const [prevClassId, setPrevClassId] = useState(classId)

  if (apiMode !== prevApiMode || selectedSessionId !== prevSelectedSessionId || classId !== prevClassId) {
    setPrevApiMode(apiMode)
    setPrevSelectedSessionId(selectedSessionId)
    setPrevClassId(classId)
    if (selectedSessionId) {
      setStructures([])
      setIsLoading(true)
    } else {
      setStructures([])
      setIsLoading(false)
    }
  }

  const isDark = storeTheme === 'dark' || (storeTheme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  const apiClient = apiMode === 'accountant' ? accountantApi : feesApi

  useEffect(() => {
    fetchSessions().catch(() => {})
    getClasses()
      .then(r => setClasses(getClassOptions(r)))
      .catch(() => {})
  }, [])

  const fetchStructures = () => {
    if (!selectedSessionId) {
      setIsLoading(false)
      return
    }
    const fetcher = apiMode === 'accountant' ? accountantApi.getFeeStructure : feesApi.getFeeStructures
    fetcher({ session_id: selectedSessionId, class_id: classId || undefined })
      .then((response) => setStructures(response.data?.structures || []))
      .catch(() => toastError('Failed to load fee structures'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    if (isLoading) {
      fetchStructures()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

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
    if (!selectedSessionId) return
    setIsDownloading(true)
    try {
      const response = await apiClient.downloadFeeStructurePdf({
        session_id: selectedSessionId,
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

      const sessionName = sessions.find(s => String(s.id) === selectedSessionId)?.name || 'Session'
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


  const calculateAnnual = (fee) => {
    const amt = parseFloat(fee.amount) || 0
    if (fee.frequency === 'monthly') return amt * 12
    if (fee.frequency === 'quarterly') return amt * 4
    return amt
  }

  const groupedStructures = useMemo(() => {
    if (classId) return { [structures[0]?.class_name || 'Class']: filteredStructures }
    
    return filteredStructures.reduce((acc, curr) => {
      const key = curr.class_name || 'Unassigned'
      if (!acc[key]) acc[key] = []
      acc[key].push(curr)
      return acc
    }, {})
  }, [filteredStructures, classId])

  const totalsFooter = useMemo(() => {
    const nonOptional = filteredStructures.filter(s => !s.is_optional)
    const amountSum = nonOptional.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0)
    const annualSum = nonOptional.reduce((acc, curr) => acc + calculateAnnual(curr), 0)
    return { count: filteredStructures.length, amountSum, annualSum }
  }, [filteredStructures])

  const tableColumns = [
    {
      title: 'Fee Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="font-extrabold text-gray-800 dark:text-gray-200">{text}</span>
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (val, record) => (
        <EditableCell
          value={val}
          onSave={(newVal) => handleUpdate(record.id, { amount: newVal })}
          isLoading={isSaving}
        />
      )
    },
    {
      title: 'Annual Cost',
      key: 'annual_cost',
      render: (_, record) => {
        const annual = calculateAnnual(record)
        return (
          <span className="font-extrabold text-orange-600 dark:text-orange-400">
            {formatCurrency(annual)}
            {record.frequency === 'one_time' && <span className="text-[10px] text-gray-400 font-semibold ml-1">(once)</span>}
          </span>
        )
      }
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
      render: (freq) => {
        const cfg = FREQUENCY_BADGE[freq] || { label: freq, color: 'default' }
        return <Tag color={cfg.color} className="rounded-full font-bold text-[10px] border-0 px-2.5">{cfg.label}</Tag>
      }
    },
    {
      title: 'Due Day',
      dataIndex: 'due_day',
      key: 'due_day',
      render: (val) => <span className="font-bold text-gray-500 dark:text-gray-400">{ordinal(val)}</span>
    },
    {
      title: 'Optional',
      dataIndex: 'is_optional',
      key: 'is_optional',
      render: (val) => val ? <Tag className="rounded-full font-bold text-[10px] border-0 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 px-2.5">Optional</Tag> : <span className="text-gray-400 dark:text-gray-600 font-bold">•</span>
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (val, record) => (
        <div className="max-w-[200px]">
          <EditableCell
            value={val || '—'}
            onSave={(newVal) => handleUpdate(record.id, { remarks: newVal === '—' ? null : newVal })}
            isLoading={isSaving}
          />
        </div>
      )
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            onClick={() => setEditTarget(record)}
            icon={<EditOutlined />}
            className="text-gray-400 hover:text-orange-500 flex items-center justify-center"
          />
          <Button
            type="text"
            size="small"
            onClick={() => setDeleteTarget(record)}
            icon={<DeleteOutlined />}
            className="text-gray-400 hover:text-rose-600 flex items-center justify-center"
          />
        </Space>
      )
    }
  ]

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#4CC0D4',
          borderRadius: 24,
          fontFamily: 'inherit',
        },
      }}
    >
      <div className="space-y-6">

        {/* Filter Card */}
        <Card 
          className="rounded-[28px] shadow-sm border-gray-100 dark:border-gray-800"
          styles={{ body: { padding: '24px' } }}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Academic Session</label>
              <AntSelect
                value={selectedSessionId || undefined}
                onChange={val => setSessionId(val || '')}
                options={(sessions || []).map(s => ({ 
                  value: String(s.id), 
                  label: `${s.name}${s.is_current ? ' (Current)' : ''}` 
                }))}
                className="w-full rounded-xl text-xs h-[38px]"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Target Class</label>
              <AntSelect
                placeholder="All classes"
                value={classId || undefined}
                onChange={val => setClassId(val || '')}
                options={classes}
                allowClear
                className="w-full rounded-xl text-xs h-[38px]"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Search Fee</label>
              <AntInput
                placeholder="Search by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                prefix={<SearchOutlined className="text-gray-400" />}
                allowClear
                className="rounded-xl font-semibold text-xs h-[38px]"
              />
            </div>

            <div className="md:col-span-3 flex gap-2">
              <Button
                size="large"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                loading={isDownloading}
                disabled={!selectedSessionId || structures.length === 0}
                title={structures.length === 0 ? "No components to export" : "Download PDF"}
                className="rounded-xl font-bold flex items-center justify-center border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200"
                style={{ height: '38px', width: '45px', padding: 0 }}
              />
              <Button 
                type="primary"
                size="large"
                icon={<PlusOutlined />} 
                onClick={() => setAddModal(true)}
                disabled={!selectedSessionId}
                className="rounded-xl font-bold flex items-center justify-center flex-1 border-0"
                style={{ height: '38px', background: 'linear-gradient(90deg, #4cc0d4 0%, #0891b2 100%)' }}
              >
                Add Component
              </Button>
            </div>
          </div>
        </Card>

        {/* Structures Tables */}
        {isLoading ? (
          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[28px]">
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : filteredStructures.length === 0 ? (
          <Card className="rounded-[28px] border-gray-100 dark:border-gray-800 text-center py-8">
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
              description={search ? "No matches found in this selection" : "No fee components found for this session"} 
            />
            <div className="flex justify-center gap-3 mt-4">
              <Button type="default" disabled={!selectedSessionId || structures.length === 0} onClick={handleDownload} icon={<DownloadOutlined />} className="rounded-full font-bold">Download PDF</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)} disabled={!selectedSessionId} className="rounded-full font-bold border-0" style={{ backgroundColor: '#4CC0D4' }}>Add Component</Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedStructures).map(([className, classFees]) => (
              <div key={className} className="rounded-[28px] overflow-hidden border border-gray-100 dark:border-gray-800/80 bg-white dark:bg-gray-900 shadow-sm">
                {!classId && (
                  <div className="px-6 py-3 bg-cyan-50/40 dark:bg-cyan-950/10 border-b border-gray-100 dark:border-gray-850 text-[11px] font-black uppercase text-cyan-600 dark:text-cyan-400 tracking-[0.2em]">
                    {className}
                  </div>
                )}
                <Table
                  dataSource={classFees}
                  columns={tableColumns}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                  className="premium-table"
                />
              </div>
            ))}

            {/* Totals Summary Panel */}
            <div className="rounded-[28px] border border-cyan-100/50 dark:border-cyan-950/20 p-6 bg-cyan-50/30 dark:bg-cyan-950/10 flex flex-wrap items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Components</span>
                  <p className="text-lg font-black text-gray-900 dark:text-white mt-0.5">{totalsFooter.count}</p>
                </div>
                <div className="w-px h-8 bg-gray-200 dark:bg-gray-800" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Sum of Base Amounts</span>
                  <p className="text-lg font-black text-gray-900 dark:text-white mt-0.5">{formatCurrency(totalsFooter.amountSum)}</p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-400">Estimated Annual Dues (Non-optional)</span>
                <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-0.5">{formatCurrency(totalsFooter.annualSum)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit modal */}
        <AddFeeComponentModal
          open={addModal || !!editTarget}
          onClose={() => { setAddModal(false); setEditTarget(null) }}
          sessionId={selectedSessionId}
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

        {/* Delete confirm Modal */}
        <Modal
          open={!!deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onOk={handleDelete}
          okText="Remove"
          okButtonProps={{ danger: true, loading: isSaving }}
          cancelButtonProps={{ disabled: isSaving }}
          title={<span className="font-black text-lg tracking-tight">Remove Fee Component?</span>}
          className="rounded-2xl"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mt-2 leading-relaxed">
            Remove "{deleteTarget?.name}" from the fee structure? This won't affect already-generated invoices.
          </p>
        </Modal>
      </div>
    </ConfigProvider>
  )
}

export default FeeStructurePage
