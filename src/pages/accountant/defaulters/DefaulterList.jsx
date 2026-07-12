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

const BRAND = '#4361ee'
const BRAND_GRADIENT = 'linear-gradient(90deg, #4361ee 0%, #1d4ed8 100%)'

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

  const isDark =
    storeTheme === 'dark' ||
    (storeTheme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)

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

  const totalDue = useMemo(
    () => filtered.reduce((s, r) => s + Number(r.balance || 0), 0),
    [filtered]
  )
  const criticalCount = useMemo(
    () => filtered.filter((r) => Number(r.balance) >= 10000).length,
    [filtered]
  )

  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map((r) => r.student_id))

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
        class_id: selectedClass
          ? defaulters.find((d) => d.class_name === selectedClass)?.class_id
          : undefined
      })
      downloadBlob(response, `Defaulters_List_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Failed to download defaulters PDF', error)
    } finally {
      setDownloading(false)
    }
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
            size={40}
            style={{ backgroundColor: isDark ? '#1e293b' : '#eef2ff', color: BRAND }}
            className="flex-shrink-0 font-bold"
          >
            {getInitials(text)}
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate leading-tight">
              {text}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">
              {record.admission_no || '-'}
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Class',
      dataIndex: 'class_name',
      key: 'class_name',
      render: (text) => (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{text || '—'}</span>
      )
    },
    {
      title: 'Severity',
      dataIndex: 'balance',
      key: 'severity',
      render: (val) => {
        const sev = SEVERITY(Number(val))
        let bgClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
        if (sev.color === 'orange')
          bgClass = 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300'
        else if (sev.color === 'gold')
          bgClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'

        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${bgClass}`}
          >
            {sev.label}
          </span>
        )
      }
    },
    {
      title: 'Total Due',
      dataIndex: 'balance',
      key: 'balance',
      render: (val) => (
        <span className="font-bold text-sm text-rose-600 dark:text-rose-400 tabular-nums">
          {formatCurrency(val)}
        </span>
      )
    },
    {
      title: 'Overdue Since',
      dataIndex: 'first_due_date',
      key: 'first_due_date',
      render: (val) => (
        <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
          {val ? formatDate(val) : '-'}
        </span>
      )
    },
    {
      title: 'Open Invoices',
      dataIndex: 'open_invoices',
      key: 'open_invoices',
      render: (val) => (
        <span className="inline-flex items-center justify-center min-w-[26px] h-6 px-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 tabular-nums">
          {val}
        </span>
      )
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<BellOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            setSelected([record.student_id])
            setOpen(true)
          }}
          className="rounded-full font-bold text-[10px] uppercase tracking-wider h-7 px-3 border-0 inline-flex items-center justify-center gap-1 shadow-sm transition-all hover:scale-[1.03] active:scale-[0.97]"
          style={{ backgroundColor: BRAND }}
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
        token: { colorPrimary: BRAND, borderRadius: 12, fontFamily: 'inherit' }
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* Header Block */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                Defaulter Management
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-rose-600 dark:text-rose-300">
                <AlertOutlined />
                Action Required
              </span>
            </div>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
              Track pending fee dues, view detailed records, and dispatch reminders to guardians.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              icon={<DownloadOutlined />}
              disabled={downloading || filtered.length === 0}
              onClick={handleDownload}
              className="h-10 px-4 rounded-xl font-semibold inline-flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {downloading ? 'Preparing...' : 'Export List'}
            </Button>
            <Button
              icon={selected.length > 0 ? <CheckSquareOutlined /> : <BorderOutlined />}
              onClick={toggleAll}
              className="h-10 px-4 rounded-xl font-semibold inline-flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {selected.length === filtered.length && filtered.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </Button>
            <Button
              type="primary"
              icon={<BellOutlined />}
              disabled={selected.length === 0}
              onClick={() => setOpen(true)}
              className="h-10 px-5 rounded-xl font-semibold inline-flex items-center justify-center gap-2 border-0 shadow-sm transition-all disabled:opacity-50"
              style={{ background: BRAND_GRADIENT }}
            >
              Send Reminders {selected.length > 0 && `(${selected.length})`}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              variant="borderless"
              className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm"
              styles={{ body: { padding: 0 } }}
            >
              <div className="h-1 w-full bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-start justify-between p-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Total Defaulters
                  </p>
                  <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white tabular-nums">
                    {filtered.length}
                  </p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-lg">
                  <UserOutlined />
                </span>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              variant="borderless"
              className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm"
              styles={{ body: { padding: 0 } }}
            >
              <div className="h-1 w-full bg-blue-500" />
              <div className="flex items-start justify-between p-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Total Outstanding
                  </p>
                  <p className="mt-2 text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                    {formatCurrency(totalDue)}
                  </p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-300 text-lg">
                  <CreditCardOutlined />
                </span>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              variant="borderless"
              className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm"
              styles={{ body: { padding: 0 } }}
            >
              <div className="h-1 w-full bg-rose-500" />
              <div className="flex items-start justify-between p-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Critical Defaulters
                  </p>
                  <p className="mt-2 text-3xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
                    {criticalCount}
                  </p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-300 text-lg">
                  <AlertOutlined />
                </span>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              variant="borderless"
              className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm"
              styles={{ body: { padding: 0 } }}
            >
              <div className="h-1 w-full" style={{ backgroundColor: BRAND }} />
              <div className="flex items-start justify-between p-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Selected Students
                  </p>
                  <p className="mt-2 text-3xl font-black tabular-nums" style={{ color: BRAND }}>
                    {selected.length}
                  </p>
                </div>
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full text-lg"
                  style={{ backgroundColor: isDark ? '#1e293b' : '#eef2ff', color: BRAND }}
                >
                  <CheckSquareOutlined />
                </span>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Filters Card */}
        <Card
          variant="borderless"
          className="rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm"
          styles={{ body: { padding: 20 } }}
        >
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Search Student
              </label>
              <AntInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                prefix={<SearchOutlined className="text-gray-400" />}
                allowClear
                className="rounded-xl font-medium text-xs h-[38px]"
              />
            </div>

            <div className="flex-1 min-w-[160px]">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Class
              </label>
              <AntSelect
                value={selectedClass || undefined}
                onChange={(val) => setSelectedClass(val || '')}
                placeholder="All classes"
                options={classes.map((c) => ({ value: c, label: c }))}
                allowClear
                className="w-full rounded-xl text-xs h-[38px]"
              />
            </div>

            <div className="flex-1 min-w-[160px]">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Severity Level
              </label>
              <AntSelect
                value={severityFilter || undefined}
                onChange={(val) => setSeverityFilter(val || '')}
                placeholder="All severities"
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
                icon={<CloseOutlined />}
                onClick={clearFilters}
                className="h-[38px] px-4 rounded-xl font-semibold inline-flex items-center gap-1.5 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </Card>

        {/* Results Card */}
        <Card
          variant="borderless"
          className="rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm"
          styles={{ body: { padding: 0 } }}
          title={
            <div className="flex flex-wrap items-center justify-between gap-3 py-1">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Defaulter Students
                </h2>
                <p className="text-xs font-normal text-gray-400 dark:text-gray-500 mt-0.5">
                  Showing {filtered.length} students matching parameters.
                </p>
              </div>
              <Tag
                icon={<SlidersOutlined />}
                className="rounded-full font-black text-[9px] uppercase tracking-wider bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50 px-3 py-0.5"
              >
                Outstanding Dues View
              </Tag>
            </div>
          }
        >
          {isLoading ? (
            <div className="p-6">
              <Skeleton active paragraph={{ rows: 6 }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16">
              <Empty description="No defaulters match your filters" />
            </div>
          ) : (
            <>
              <Table
                rowKey="student_id"
                columns={tableColumns}
                dataSource={filtered}
                rowSelection={rowSelection}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                className="defaulter-table"
                scroll={{ x: 'max-content' }}
              />
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">
                Total outstanding:{' '}
                <span className="text-rose-600 dark:text-rose-400 tabular-nums">
                  {formatCurrency(totalDue)}
                </span>
              </div>
            </>
          )}
        </Card>

        {/* Bulk Action Footer Banner */}
        {selected.length > 0 && (
          <div className="sticky bottom-4 z-20 mx-auto flex max-w-3xl items-center gap-4 rounded-2xl bg-slate-900 dark:bg-slate-800 px-5 py-3 shadow-2xl ring-1 ring-white/10">
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">{selected.length} selected</p>
              <p className="text-xs text-slate-400">Reminders pending</p>
            </div>
            <div className="flex-1" />
            <Button
              type="primary"
              icon={<BellOutlined />}
              onClick={() => setOpen(true)}
              className="rounded-full font-bold text-[11px] uppercase tracking-wider h-8 px-4 border-0 inline-flex items-center gap-1 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: BRAND }}
            >
              Send Bulk Reminder
            </Button>
            <Button
              type="text"
              onClick={() => setSelected([])}
              className="text-slate-400 hover:text-white p-0 flex items-center justify-center w-7 h-7 rounded-full hover:bg-slate-800/50 transition-colors"
              icon={<CloseOutlined />}
            />
          </div>
        )}

        <ReminderModal
          open={open}
          onClose={() => setOpen(false)}
          onSend={send}
          selectedCount={selected.length}
        />
      </div>
    </ConfigProvider>
  )
}

export default DefaulterList
