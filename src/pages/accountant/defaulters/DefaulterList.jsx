import { useCallback, useMemo, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Select as AntSelect,
  Input as AntInput,
  Tag,
  Avatar,
  Empty,
  Skeleton,
  Space,
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
import StatCard from '@/components/ui/StatCard'

const BRAND = 'var(--color-brand)'

const SEVERITY = (balance) => {
  if (balance >= 10000) return { label: 'Critical', color: 'red' }
  if (balance >= 5000) return { label: 'High', color: 'orange' }
  return { label: 'Moderate', color: 'gold' }
}

const DefaulterList = () => {
  usePageTitle('Defaulters')
  const { defaulters = [], isLoading = false } = useDefaulters()
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
            size={36}
            style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-brand)', flexShrink: 0, fontWeight: 600 }}
          >
            {getInitials(text)}
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              {text}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
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
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{text || '—'}</span>
      )
    },
    {
      title: 'Severity',
      dataIndex: 'balance',
      key: 'severity',
      render: (val) => {
        const sev = SEVERITY(Number(val))
        const colors = {
          red:    { bg: 'var(--color-danger-subtle,#fef2f2)',   text: 'var(--color-danger)' },
          orange: { bg: 'var(--color-warning-subtle,#fff7ed)', text: 'var(--color-warning,#ea7c18)' },
          gold:   { bg: 'var(--color-info-subtle,#fffbeb)',    text: 'var(--color-info,#b45309)' },
        }
        const c = colors[sev.color] || colors.gold
        return (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide"
            style={{ backgroundColor: c.bg, color: c.text }}
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
        <span className="font-semibold text-sm tabular-nums" style={{ color: 'var(--color-danger)' }}>
          {formatCurrency(val)}
        </span>
      )
    },
    {
      title: 'Overdue Since',
      dataIndex: 'first_due_date',
      key: 'first_due_date',
      render: (val) => (
        <span className="text-sm tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
          {val ? formatDate(val) : '-'}
        </span>
      )
    },
    {
      title: 'Open Invoices',
      dataIndex: 'open_invoices',
      key: 'open_invoices',
      render: (val) => (
        <span
          className="inline-flex items-center justify-center min-w-[26px] h-6 px-2 rounded-lg text-xs font-medium tabular-nums"
          style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
        >
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
          className="rounded-full text-[10px] uppercase tracking-wider h-7 px-3 border-0 inline-flex items-center gap-1"
        >
          Remind
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-5">
      {/* Header Block */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              Defaulter Management
            </h1>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-wide"
              style={{ backgroundColor: 'var(--color-danger-subtle,#fef2f2)', color: 'var(--color-danger)' }}
            >
              <AlertOutlined />
              Action Required
            </span>
          </div>
          <p className="mt-1.5 text-sm max-w-2xl" style={{ color: 'var(--color-text-muted)' }}>
            Track pending fee dues, view detailed records, and dispatch reminders to guardians.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            icon={<DownloadOutlined />}
            disabled={downloading || filtered.length === 0}
            onClick={handleDownload}
            className="h-9 px-4 rounded-xl font-medium inline-flex items-center gap-2 transition-colors"
          >
            {downloading ? 'Preparing...' : 'Export List'}
          </Button>
          <Button
            icon={selected.length > 0 ? <CheckSquareOutlined /> : <BorderOutlined />}
            onClick={toggleAll}
            className="h-9 px-4 rounded-xl font-medium inline-flex items-center gap-2 transition-colors"
          >
            {selected.length === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            type="primary"
            icon={<BellOutlined />}
            disabled={selected.length === 0}
            onClick={() => setOpen(true)}
            className="h-9 px-5 rounded-xl font-medium inline-flex items-center gap-2 border-0 transition-all disabled:opacity-50"
          >
            Send Reminders {selected.length > 0 && `(${selected.length})`}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard label="Total Defaulters" value={filtered.length} sub={`${classes.length} classes`} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard label="Total Outstanding" value={formatCurrency(totalDue)} color="var(--color-brand)" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard label="Critical Defaulters" value={criticalCount} sub="Balance >= Rs 10K" color="var(--color-danger)" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard label="Selected Students" value={selected.length} sub="for bulk action" color="var(--color-brand)" />
        </Col>
      </Row>

      {/* Filters Card */}
      <Card
        variant="borderless"
        className="rounded-2xl"
        styles={{ body: { padding: 20 } }}
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
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
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
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
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Severity Level
            </label>
              <AntSelect
                value={severityFilter || undefined}
                onChange={(val) => setSeverityFilter(val || '')}
                placeholder="All severities"
                options={[
                  { value: 'Critical', label: 'Critical (>= ₹10K)' },
                  { value: 'High', label: 'High (>= ₹5K)' },
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
              className="h-[38px] px-4 rounded-xl font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Results Card */}
      <Card
        variant="borderless"
        className="rounded-2xl"
        styles={{ body: { padding: 0 } }}
        title={
          <div className="flex flex-wrap items-center justify-between gap-3 py-1">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Defaulter Students</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Showing {filtered.length} students matching parameters.</p>
            </div>
            <Tag className="rounded-full text-[9px] uppercase tracking-wider border-0 px-3 py-0.5" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}>
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
          <div>
            <Table
              rowKey="student_id"
              columns={tableColumns}
              dataSource={filtered}
              rowSelection={rowSelection}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              className="defaulter-table"
              scroll={{ x: 'max-content' }}
            />
            <div className="px-6 py-4 text-right text-sm font-medium" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
              Total outstanding:{' '}
              <span className="font-semibold tabular-nums" style={{ color: 'var(--color-danger)' }}>
                {formatCurrency(totalDue)}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Bulk Action Footer Banner */}
      {selected.length > 0 && (
        <div
          className="sticky bottom-4 z-20 mx-auto flex max-w-3xl items-center gap-4 rounded-2xl px-5 py-3 shadow-xl"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{selected.length} selected</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Reminders pending</p>
          </div>
          <div className="flex-1" />
          <Button
            type="primary"
            icon={<BellOutlined />}
            onClick={() => setOpen(true)}
            className="rounded-full text-[11px] uppercase tracking-wider h-8 px-4 border-0 inline-flex items-center gap-1"
          >
            Send Bulk Reminder
          </Button>
          <Button
            type="text"
            onClick={() => setSelected([])}
            className="p-0 flex items-center justify-center w-7 h-7 rounded-full transition-colors"
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
  )
}

export default DefaulterList
