import { useCallback, useMemo, useState } from 'react'
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
  Avatar,
  Empty,
  Skeleton,
  Space,
  theme as antdTheme
} from 'antd'
import {
  DownloadOutlined,
  BellOutlined,
  CheckSquareOutlined,
  BorderOutlined,
  SearchOutlined,
  CloseOutlined,
  UserOutlined,
  CreditCardOutlined,
  AlertOutlined,
  SlidersOutlined
} from '@ant-design/icons'
import usePageTitle from '@/hooks/usePageTitle'
import useDefaulters from '@/hooks/useDefaulters'
import useSessionStore from '@/store/sessionStore'
import ReminderModal from '@/components/accountant/ReminderModal'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency, formatDate, getInitials } from '@/utils/helpers'
import { downloadBlob } from '@/utils/downloadBlob'
import useUiStore from '@/store/uiStore'

const SEVERITY = (balance) => {
  if (balance >= 10000) return { label: 'Critical', color: 'red' }
  if (balance >= 5000) return { label: 'High', color: 'orange' }
  return { label: 'Moderate', color: 'gold' }
}

const DefaulterList = () => {
  usePageTitle('Defaulters')
  const { defaulters = [], isLoading = false } = useDefaulters()
  const { currentSession } = useSessionStore()
  const { theme: storeTheme } = useUiStore()
  
  const [selected, setSelected] = useState([])
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [selectedClass, setSelectedClass] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')

  const isDark = storeTheme === 'dark' || (storeTheme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)

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

  const rowSelection = {
    selectedRowKeys: selected,
    onChange: (keys) => {
      setSelected(keys)
    }
  }

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

  const tableColumns = [
    {
      title: 'Student Details',
      dataIndex: 'student_name',
      key: 'student_name',
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar 
            className="bg-cyan-100 text-cyan-700 font-extrabold dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200/20"
          >
            {getInitials(text)}
          </Avatar>
          <div>
            <div className="text-sm font-extrabold text-gray-800 dark:text-gray-100">{text}</div>
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-0.5">{record.admission_no || '-'}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Class',
      dataIndex: 'class_name',
      key: 'class_name',
      render: (text) => <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{text || '—'}</span>
    },
    {
      title: 'Severity',
      dataIndex: 'balance',
      key: 'severity',
      render: (val) => {
        const sev = SEVERITY(Number(val))
        return <Tag color={sev.color} className="rounded-full font-black text-[10px] uppercase border-0 px-2.5 py-0.5">{sev.label}</Tag>
      }
    },
    {
      title: 'Total Due',
      dataIndex: 'balance',
      key: 'balance',
      render: (val) => <span className="font-extrabold text-rose-600 dark:text-rose-400">{formatCurrency(val)}</span>
    },
    {
      title: 'Overdue Since',
      dataIndex: 'first_due_date',
      key: 'first_due_date',
      render: (val) => <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{val ? formatDate(val) : '-'}</span>
    },
    {
      title: 'Open Invoices',
      dataIndex: 'open_invoices',
      key: 'open_invoices',
      render: (val) => <Tag className="font-extrabold text-xs rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0 px-2.5 py-0.5">{val}</Tag>
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<BellOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            setSelected([record.student_id])
            setOpen(true)
          }}
          className="rounded-full font-bold text-[11px] border-0"
          style={{ backgroundColor: '#4CC0D4' }}
        >
          Remind
        </Button>
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
        {/* Header Block */}
        <div
          className="flex flex-wrap items-center justify-between gap-6 rounded-[32px] border p-6 shadow-sm relative overflow-hidden backdrop-blur-md"
          style={{ 
            background: isDark 
              ? 'linear-gradient(135deg, rgba(76, 192, 212, 0.15) 0%, #1e1b4b 100%)'
              : 'linear-gradient(135deg, #e0f7fa 0%, #fffdf9 100%)', 
            borderColor: isDark ? 'rgba(76, 192, 212, 0.3)' : '#b2ebf2'
          }}
        >
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          
          <div className="z-10">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Defaulter Management</h1>
              <Tag color="red" className="font-extrabold uppercase text-[9px] border-0 px-2 rounded-full">Action Required</Tag>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-semibold leading-relaxed">
              Track pending fee dues, view detailed records, and dispatch reminders to guardians.
            </p>
          </div>

          <Space size="small" className="z-10 flex-wrap">
            <Button
              type="default"
              size="large"
              icon={<DownloadOutlined />}
              disabled={downloading || filtered.length === 0}
              onClick={handleDownload}
              className="rounded-xl font-bold flex items-center justify-center border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200"
              style={{ height: '40px', padding: '0 16px' }}
            >
              {downloading ? 'Preparing...' : 'Export List'}
            </Button>
            <Button
              type="default"
              size="large"
              icon={selected.length === filtered.length && filtered.length > 0 ? <CheckSquareOutlined /> : <BorderOutlined />}
              onClick={toggleAll}
              className="rounded-xl font-bold flex items-center justify-center border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200"
              style={{ height: '40px', padding: '0 16px' }}
            >
              {selected.length === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All'}
            </Button>
            <Button 
              type="primary"
              size="large"
              icon={<BellOutlined />} 
              disabled={selected.length === 0}
              onClick={() => setOpen(true)}
              className="rounded-xl font-bold flex items-center justify-center border-0"
              style={{ height: '40px', padding: '0 20px', background: 'linear-gradient(90deg, #4cc0d4 0%, #0891b2 100%)' }}
            >
              Send Reminders {selected.length > 0 && `(${selected.length})`}
            </Button>
          </Space>
        </div>

        {/* Stats Grid */}
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Card className="rounded-[24px] shadow-sm border-gray-100 dark:border-gray-800" styles={{ body: { padding: '20px' } }}>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 block mb-1">Total Defaulters</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{filtered.length}</p>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card className="rounded-[24px] shadow-sm border-gray-100 dark:border-gray-800" styles={{ body: { padding: '20px' } }}>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 block mb-1">Total Outstanding</span>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(totalDue)}</p>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card className="rounded-[24px] shadow-sm border-gray-100 dark:border-gray-800" styles={{ body: { padding: '20px' } }}>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 block mb-1">Critical Defaulters</span>
              <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{criticalCount}</p>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card className="rounded-[24px] shadow-sm border-gray-100 dark:border-gray-800" styles={{ body: { padding: '20px' } }}>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 block mb-1">Selected Students</span>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">{selected.length}</p>
            </Card>
          </Col>
        </Row>

        {/* Filters Card */}
        <Card 
          className="rounded-[28px] shadow-sm border-gray-100 dark:border-gray-800"
          styles={{ body: { padding: '20px' } }}
        >
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Search Student</label>
              <AntInput
                placeholder="Type student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefix={<SearchOutlined className="text-gray-400" />}
                allowClear
                className="rounded-xl font-semibold text-xs h-[38px]"
              />
            </div>

            <div className="min-w-[160px] flex-1 sm:flex-initial">
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Class</label>
              <AntSelect
                placeholder="All Classes"
                value={selectedClass || undefined}
                onChange={(val) => setSelectedClass(val || '')}
                options={classes.map((c) => ({ value: c, label: c }))}
                allowClear
                className="w-full rounded-xl text-xs h-[38px]"
              />
            </div>

            <div className="min-w-[160px] flex-1 sm:flex-initial">
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Severity Level</label>
              <AntSelect
                placeholder="All Levels"
                value={severityFilter || undefined}
                onChange={(val) => setSeverityFilter(val || '')}
                options={[
                  { value: 'Critical', label: 'Critical (≥ ₹10K)' },
                  { value: 'High', label: 'High (≥ ₹5K)' },
                  { value: 'Moderate', label: 'Moderate (< ₹5K)' }
                ]}
                allowClear
                className="w-full rounded-xl text-xs h-[38px]"
              />
            </div>

            {hasFilters && (
              <Button
                type="dashed"
                onClick={clearFilters}
                className="rounded-xl font-bold flex items-center justify-center text-xs h-[38px]"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </Card>

        {/* Results Card */}
        <Card
          className="rounded-[28px] shadow-sm border-gray-100 dark:border-gray-800 overflow-hidden"
          styles={{ header: { borderBottom: '1px solid rgba(0,0,0,0.06)' }, body: { padding: '0px' } }}
          title={
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-base font-black text-gray-900 dark:text-white tracking-tight">Defaulter Students</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold block mt-0.5">
                  Showing {filtered.length} students matching parameters.
                </span>
              </div>
              <Tag icon={<SlidersOutlined />} color="default" className="font-extrabold uppercase text-[10px] rounded-full px-3 py-0.5">
                Outstanding Dues View
              </Tag>
            </div>
          }
        >
          {isLoading ? (
            <div className="p-6"><Skeleton active paragraph={{ rows: 8 }} /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No defaulters match selected filter criteria" />
            </div>
          ) : (
            <>
              <Table
                rowSelection={rowSelection}
                dataSource={filtered}
                columns={tableColumns}
                rowKey="student_id"
                pagination={{ pageSize: 20 }}
                size="middle"
                className="premium-table"
                rowClassName="hover:bg-orange-50/10 dark:hover:bg-orange-950/10 transition-colors"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800/80 px-6 py-4 text-xs font-semibold text-gray-400 dark:text-gray-500">
                <span>Total outstanding: <span className="font-black text-rose-600 dark:text-rose-400 text-sm">{formatCurrency(totalDue)}</span></span>
              </div>
            </>
          )}
        </Card>

        {/* Bulk Action Footer Banner */}
        {selected.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-5 rounded-2xl border border-gray-100 dark:border-gray-800 px-6 py-4 shadow-2xl z-50 bg-gray-900 text-white dark:bg-gray-950 dark:border-gray-800/80">
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-wide">{selected.length} students selected</span>
              <span className="text-[9px] opacity-60 font-semibold uppercase tracking-wider mt-0.5">Bulk reminder action</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <Button 
              type="primary" 
              icon={<BellOutlined />}
              onClick={() => setOpen(true)} 
              className="rounded-full font-bold text-xs border-0"
              style={{ backgroundColor: '#4CC0D4' }}
            >
              Send Bulk Reminder
            </Button>
            <Button 
              type="text" 
              onClick={() => setSelected([])} 
              className="text-white hover:text-cyan-400 p-0 flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10"
              icon={<CloseOutlined className="text-xs" />}
            />
          </div>
        )}

        <ReminderModal open={open} onClose={() => setOpen(false)} onSend={send} selectedCount={selected.length} />
      </div>
    </ConfigProvider>
  )
}

export default DefaulterList
