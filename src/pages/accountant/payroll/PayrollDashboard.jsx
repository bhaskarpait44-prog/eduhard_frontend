import { useEffect, useState, useMemo } from 'react'
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
  Modal as AntModal,
  Tabs,
  Avatar,
  Statistic,
  theme as antdTheme
} from 'antd'
import {
  BankOutlined,
  SettingOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  PrinterOutlined,
  EditOutlined,
  DollarOutlined
} from '@ant-design/icons'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import usePayrollStore from '@/store/payrollStore'
import PayslipPrint from '@/components/accountant/PayslipPrint'
import { formatCurrency, formatDate } from '@/utils/helpers'
import useUiStore from '@/store/uiStore'

export default function PayrollDashboard() {
  usePageTitle('Salary & Payroll')
  const { toastSuccess, toastError } = useToast()
  const { theme: storeTheme } = useUiStore()
  const { 
    structures, payrolls, isLoading, 
    fetchStructures, updateStructure, 
    fetchPayrolls, generatePayroll, markPaid,
    fetchPayslip
  } = usePayrollStore()

  const [activeTab, setActiveTab] = useState('payroll') // 'payroll' | 'structures'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [structModalOpen, setStructModalOpen] = useState(false)
  const [editingStruct, setEditingStruct] = useState(null)
  
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [payingRecord, setPayingRecord] = useState(null)
  const [payForm, setPayForm] = useState({ payment_mode: 'Bank Transfer', payment_date: new Date().toISOString().split('T')[0], remarks: '' })

  const [viewPayslip, setViewPayslip] = useState(null)

  const isDark = storeTheme === 'dark' || (storeTheme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    if (activeTab === 'structures') fetchStructures()
    if (activeTab === 'payroll') fetchPayrolls(selectedMonth, selectedYear)
  }, [activeTab, selectedMonth, selectedYear, fetchStructures, fetchPayrolls])

  const filteredStructures = useMemo(() => {
    if (!searchQuery) return structures
    const q = searchQuery.toLowerCase()
    return structures.filter(s => 
      s.name?.toLowerCase().includes(q) || 
      s.employee_id?.toLowerCase().includes(q)
    )
  }, [structures, searchQuery])

  const filteredPayrolls = useMemo(() => {
    if (!searchQuery) return payrolls
    const q = searchQuery.toLowerCase()
    return payrolls.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.employee_id?.toLowerCase().includes(q) ||
      p.receipt_no?.toLowerCase().includes(q)
    )
  }, [payrolls, searchQuery])

  const summary = useMemo(() => {
    const total = payrolls.reduce((sum, p) => sum + Number(p.net_salary || 0), 0)
    const paid = payrolls.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.net_salary || 0), 0)
    const pending = total - paid
    return { total, paid, pending, count: payrolls.length, paidCount: payrolls.filter(p => p.status === 'paid').length }
  }, [payrolls])

  // Handlers
  const handleStructSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateStructure(editingStruct.staff_id, {
        ...editingStruct,
        type: editingStruct.type
      })
      toastSuccess('Salary structure updated')
      setStructModalOpen(false)
    } catch (err) {
      toastError(err.message || 'Failed to update structure')
    }
  }

  const handleGenerate = async () => {
    if (!window.confirm(`Generate payroll for ${selectedMonth}/${selectedYear}?`)) return
    try {
      await generatePayroll(selectedMonth, selectedYear)
      toastSuccess('Payroll generated successfully')
    } catch (err) {
      toastError(err.message || 'Failed to generate payroll')
    }
  }

  const handlePaySubmit = async (e) => {
    e.preventDefault()
    try {
      await markPaid(payingRecord.id, payForm, selectedMonth, selectedYear)
      toastSuccess('Salary marked as paid')
      setPayModalOpen(false)
    } catch (err) {
      toastError(err.message || 'Failed to mark as paid')
    }
  }

  const handleViewPayslip = async (id) => {
    try {
      const data = await fetchPayslip(id)
      setViewPayslip(data)
    } catch (err) {
      toastError(err.message || 'Failed to load payslip')
    }
  }

  const years = useMemo(() => {
    const current = new Date().getFullYear()
    return [current - 1, current, current + 1]
  }, [])

  // Columns for Payroll table
  const payrollColumns = [
    {
      title: 'Staff Member',
      key: 'staff',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar className="bg-orange-100 text-orange-700 font-extrabold dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200/20">
            {record.name?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{record.name}</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
              {record.employee_id} • {record.designation || record.role}
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Basic',
      dataIndex: 'basic',
      key: 'basic',
      align: 'right',
      render: (val) => <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(val)}</span>
    },
    {
      title: 'Allowances',
      key: 'allowances',
      align: 'right',
      render: (_, record) => {
        const totalAllow = Number(record.hra) + Number(record.da) + Number(record.allowances)
        return <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(totalAllow)}</span>
      }
    },
    {
      title: 'Deductions',
      dataIndex: 'deductions',
      key: 'deductions',
      align: 'right',
      render: (val) => <span className="font-semibold text-red-650 dark:text-red-400">{formatCurrency(val)}</span>
    },
    {
      title: 'Net Salary',
      dataIndex: 'net_salary',
      key: 'net_salary',
      align: 'right',
      render: (val) => (
        <Tag color="orange" className="font-black text-xs px-2.5 py-0.5 rounded-lg border-0 m-0">
          {formatCurrency(val)}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (status, record) => (
        <div>
          <Tag color={status === 'paid' ? 'green' : 'gold'} className="rounded-full font-black text-[10px] uppercase border-0 px-2.5 py-0.5">
            {status}
          </Tag>
          {record.payment_date && <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 font-semibold">{formatDate(record.payment_date, 'short')}</p>}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-2">
          {record.status === 'generated' && (
            <Button
              type="primary"
              size="small"
              icon={<ArrowRightOutlined />}
              onClick={() => { setPayingRecord(record); setPayModalOpen(true) }}
              className="rounded-full font-bold text-xs border-0"
              style={{ backgroundColor: '#4361ee' }}
            >
              Mark Paid
            </Button>
          )}
          {record.status === 'paid' && (
            <Button
              type="default"
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => handleViewPayslip(record.id)}
              className="rounded-xl"
              title="View Payslip"
            />
          )}
        </div>
      )
    }
  ]

  // Columns for Templates table
  const templateColumns = [
    {
      title: 'Staff Member',
      key: 'staff',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar className="bg-orange-100 text-orange-700 font-extrabold dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200/20">
            {record.name?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{record.name}</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
              {record.employee_id} • {record.designation || record.role}
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Basic',
      dataIndex: 'basic',
      key: 'basic',
      align: 'right',
      render: (val) => <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(val || 0)}</span>
    },
    {
      title: 'HRA',
      dataIndex: 'hra',
      key: 'hra',
      align: 'right',
      render: (val) => <span className="font-semibold text-gray-600 dark:text-gray-400">{formatCurrency(val || 0)}</span>
    },
    {
      title: 'DA',
      dataIndex: 'da',
      key: 'da',
      align: 'right',
      render: (val) => <span className="font-semibold text-gray-600 dark:text-gray-400">{formatCurrency(val || 0)}</span>
    },
    {
      title: 'Others',
      dataIndex: 'allowances',
      key: 'allowances',
      align: 'right',
      render: (val) => <span className="font-semibold text-gray-600 dark:text-gray-400">{formatCurrency(val || 0)}</span>
    },
    {
      title: 'Deductions',
      dataIndex: 'deductions',
      key: 'deductions',
      align: 'right',
      render: (val) => <span className="font-bold text-red-650 dark:text-red-400">{formatCurrency(val || 0)}</span>
    },
    {
      title: 'Actions',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Button
          type="default"
          size="small"
          icon={<EditOutlined />}
          onClick={() => {
            setEditingStruct({
              staff_id: record.staff_id,
              type: record.type,
              name: record.name,
              basic: record.basic || 0,
              hra: record.hra || 0,
              da: record.da || 0,
              allowances: record.allowances || 0,
              deductions: record.deductions || 0
            })
            setStructModalOpen(true)
          }}
          className="rounded-full font-bold text-xs"
        >
          Edit
        </Button>
      )
    }
  ]

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#4361ee',
          borderRadius: 10,
          fontFamily: 'Roboto, system-ui, sans-serif',
        },
      }}
    >
      <div className="space-y-6">
        {/* Navigation & Search Row */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 rounded-[32px] border p-4 shadow-sm"
          style={{ backgroundColor: isDark ? '#111827' : '#ffffff', borderColor: isDark ? '#1f2937' : '#f3f4f6' }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key)
              setSearchQuery('')
            }}
            items={[
              { label: 'Monthly Payroll', key: 'payroll' },
              { label: 'Salary Templates', key: 'structures' }
            ]}
            className="font-bold border-b-0 custom-premium-tabs"
            style={{ marginBottom: -16, marginTop: -8 }}
          />

          <div className="relative min-w-[240px]">
            <AntInput
              placeholder="Search staff or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              prefix={<SearchOutlined className="text-gray-400" />}
              allowClear
              className="rounded-xl font-semibold text-xs h-[36px]"
            />
          </div>
        </div>

        {activeTab === 'payroll' && (
          <>
            {/* Stats Dashboard Grid */}
            <Row gutter={[16, 16]}>
              <Col xs={12} md={6}>
                <Card className="rounded-[24px] border border-indigo-200/10 shadow-sm" styles={{ body: { padding: '20px' } }}>
                  <Statistic
                    title={<span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 block mb-1">Monthly Budget</span>}
                    value={summary.total}
                    precision={2}
                    formatter={(v) => formatCurrency(v)}
                    valueStyle={{ fontSize: '1.25rem', fontWeight: 900, color: '#4361ee' }}
                  />
                  <span className="text-[10px] font-semibold text-gray-400 block mt-2">{summary.count} records generated</span>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card className="rounded-[24px] border border-indigo-200/10 shadow-sm" styles={{ body: { padding: '20px' } }}>
                  <Statistic
                    title={<span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 block mb-1">Disbursed</span>}
                    value={summary.paid}
                    precision={2}
                    formatter={(v) => formatCurrency(v)}
                    valueStyle={{ fontSize: '1.25rem', fontWeight: 900, color: '#16a34a' }}
                  />
                  <span className="text-[10px] font-semibold text-gray-400 block mt-2">{summary.paidCount} salaries paid</span>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card className="rounded-[24px] border border-indigo-200/10 shadow-sm" styles={{ body: { padding: '20px' } }}>
                  <Statistic
                    title={<span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 block mb-1">Pending</span>}
                    value={summary.pending}
                    precision={2}
                    formatter={(v) => formatCurrency(v)}
                    valueStyle={{ fontSize: '1.25rem', fontWeight: 900, color: '#dc2626' }}
                  />
                  <span className="text-[10px] font-semibold text-gray-400 block mt-2">{summary.count - summary.paidCount} to process</span>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card className="rounded-[24px] border border-indigo-200/10 shadow-sm" styles={{ body: { padding: '20px' } }}>
                  <Statistic
                    title={<span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 block mb-1">Avg Salary</span>}
                    value={summary.total / (summary.count || 1)}
                    precision={2}
                    formatter={(v) => formatCurrency(v)}
                    valueStyle={{ fontSize: '1.25rem', fontWeight: 900 }}
                  />
                  <span className="text-[10px] font-semibold text-gray-400 block mt-2">Per staff member</span>
                </Card>
              </Col>
            </Row>

            {/* Monthly Disbursal table Card */}
            <Card
              className="rounded-[28px] shadow-sm border-gray-100 dark:border-gray-800 overflow-hidden"
              styles={{ header: { borderBottom: '1px solid rgba(0,0,0,0.06)' }, body: { padding: '0px' } }}
              title={
                <div className="flex flex-wrap items-center justify-between gap-4 py-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <CalendarOutlined className="text-lg" />
                    </div>
                    <div>
                      <span className="text-base font-black text-gray-900 dark:text-white tracking-tight">Monthly Disbursal</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold block mt-0.5">
                        Select month and process salary payments
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 z-10">
                    <AntSelect
                      value={selectedMonth}
                      onChange={val => setSelectedMonth(val)}
                      className="min-w-[120px] rounded-xl font-bold"
                      options={Array.from({ length: 12 }, (_, i) => ({
                        value: i + 1,
                        label: new Date(0, i).toLocaleString('default', { month: 'long' })
                      }))}
                    />
                    <AntSelect
                      value={selectedYear}
                      onChange={val => setSelectedYear(val)}
                      className="min-w-[90px] rounded-xl font-bold"
                      options={years.map(y => ({ value: y, label: String(y) }))}
                    />
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={handleGenerate}
                      loading={isLoading}
                      className="rounded-xl font-bold flex items-center justify-center border-0"
                      style={{ height: '36px', background: 'linear-gradient(90deg, #4361ee 0%, #1d4ed8 100%)' }}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              }
            >
              <Table
                dataSource={filteredPayrolls}
                columns={payrollColumns}
                rowKey="id"
                pagination={{ pageSize: 15 }}
                loading={isLoading && !viewPayslip}
                size="middle"
                className="premium-table"
                rowClassName="hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10 transition-colors"
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row className="bg-indigo-500/5 font-bold">
                      <Table.Summary.Cell index={0} className="px-6 py-4">Total Monthly Budget</Table.Summary.Cell>
                      <Table.Summary.Cell index={1} colSpan={3} />
                      <Table.Summary.Cell index={4} align="right">
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(summary.total)}</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5} colSpan={2} />
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Card>
          </>
        )}

        {activeTab === 'structures' && (
          /* Salary Templates list card */
          <Card
            className="rounded-[28px] shadow-sm border-gray-100 dark:border-gray-800 overflow-hidden"
            styles={{ header: { borderBottom: '1px solid rgba(0,0,0,0.06)' }, body: { padding: '0px' } }}
            title={
              <div className="flex items-center gap-3 py-1">
                <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <SettingOutlined className="text-lg" />
                </div>
                <div>
                  <span className="text-base font-black text-gray-900 dark:text-white tracking-tight">Salary Templates</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold block mt-0.5">
                    Configure recurring basic salary, HRA, and deductions per employee
                  </span>
                </div>
              </div>
            }
          >
            <Table
              dataSource={filteredStructures}
              columns={templateColumns}
              rowKey="staff_id"
              pagination={{ pageSize: 15 }}
              loading={isLoading}
              size="middle"
              className="premium-table"
              rowClassName="hover:bg-orange-50/10 dark:hover:bg-orange-950/10 transition-colors"
            />
          </Card>
        )}

        {/* Edit Structure Modal */}
        <AntModal
          open={structModalOpen}
          onCancel={() => !isLoading && setStructModalOpen(false)}
          title={<span className="text-base font-black text-gray-900 dark:text-white">Edit Salary Structure</span>}
          footer={null}
          className="premium-modal"
          centered
        >
          {editingStruct && (
            <form onSubmit={handleStructSubmit} className="space-y-4 py-3">
              <div className="p-4 rounded-2xl mb-4 text-center border border-dashed border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900/50">
                <p className="text-[10px] font-black uppercase tracking-wider text-orange-700 dark:text-orange-300">Staff Member</p>
                <p className="text-base font-black mt-1 text-orange-800 dark:text-orange-200">{editingStruct.name}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Basic Salary</label>
                <AntInput
                  prefix={<DollarOutlined className="text-gray-400" />}
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingStruct.basic}
                  onChange={e => setEditingStruct({ ...editingStruct, basic: e.target.value })}
                  required
                  className="rounded-xl font-semibold text-xs h-[38px]"
                />
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">HRA</label>
                  <AntInput
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingStruct.hra}
                    onChange={e => setEditingStruct({ ...editingStruct, hra: e.target.value })}
                    required
                    className="rounded-xl font-semibold text-xs h-[38px]"
                  />
                </Col>
                <Col span={12}>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">DA</label>
                  <AntInput
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingStruct.da}
                    onChange={e => setEditingStruct({ ...editingStruct, da: e.target.value })}
                    required
                    className="rounded-xl font-semibold text-xs h-[38px]"
                  />
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Other Allowances</label>
                  <AntInput
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingStruct.allowances}
                    onChange={e => setEditingStruct({ ...editingStruct, allowances: e.target.value })}
                    required
                    className="rounded-xl font-semibold text-xs h-[38px]"
                  />
                </Col>
                <Col span={12}>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Deductions</label>
                  <AntInput
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingStruct.deductions}
                    onChange={e => setEditingStruct({ ...editingStruct, deductions: e.target.value })}
                    required
                    className="rounded-xl font-semibold text-xs h-[38px]"
                  />
                </Col>
              </Row>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-2">
                <Button type="button" onClick={() => setStructModalOpen(false)} className="rounded-xl font-bold h-[38px]">
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={isLoading} className="rounded-xl font-bold h-[38px] border-0" style={{ background: 'linear-gradient(90deg, #4361ee 0%, #1d4ed8 100%)' }}>
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </AntModal>

        {/* Mark Paid Modal */}
        <AntModal
          open={payModalOpen}
          onCancel={() => !isLoading && setPayModalOpen(false)}
          title={<span className="text-base font-black text-gray-900 dark:text-white">Process Salary Payment</span>}
          footer={null}
          className="premium-modal"
          centered
        >
          {payingRecord && (
            <form onSubmit={handlePaySubmit} className="space-y-4 py-3">
              <div className="p-6 rounded-2xl mb-4 text-center border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Net Amount to Pay</p>
                <p className="text-3xl font-black mt-2 text-indigo-600 dark:text-indigo-400">{formatCurrency(payingRecord.net_salary)}</p>
                <div className="mt-4 pt-4 border-t border-gray-150/40 flex items-center justify-center gap-2">
                  <Avatar size="small" className="bg-indigo-100 text-indigo-700 font-bold">
                    {payingRecord.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{payingRecord.name}</p>
                </div>
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Payment Mode</label>
                  <AntSelect
                    value={payForm.payment_mode}
                    onChange={val => setPayForm({ ...payForm, payment_mode: val })}
                    className="w-full rounded-xl text-xs h-[38px]"
                    options={[
                      { value: 'Bank Transfer', label: 'Bank Transfer' },
                      { value: 'Cheque', label: 'Cheque' },
                      { value: 'Cash', label: 'Cash' },
                      { value: 'UPI', label: 'UPI' }
                    ]}
                  />
                </Col>
                <Col span={12}>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Payment Date</label>
                  <AntInput
                    type="date"
                    value={payForm.payment_date}
                    onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })}
                    required
                    className="rounded-xl font-semibold text-xs h-[38px]"
                  />
                </Col>
              </Row>

              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Remarks / Ref No</label>
                <AntInput
                  prefix={<FileTextOutlined className="text-gray-400" />}
                  value={payForm.remarks}
                  onChange={e => setPayForm({ ...payForm, remarks: e.target.value })}
                  placeholder="Transaction ID, Cheque No, etc."
                  className="rounded-xl font-semibold text-xs h-[38px]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-2">
                <Button type="button" onClick={() => setPayModalOpen(false)} className="rounded-xl font-bold h-[38px]">
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={isLoading} icon={<CheckCircleOutlined />} className="rounded-xl font-bold h-[38px] border-0" style={{ background: 'linear-gradient(90deg, #4361ee 0%, #1d4ed8 100%)' }}>
                  Confirm Payment
                </Button>
              </div>
            </form>
          )}
        </AntModal>

        {/* Payslip View Modal */}
        <AntModal
          open={!!viewPayslip}
          onCancel={() => setViewPayslip(null)}
          title={<span className="text-base font-black text-gray-900 dark:text-white">Payslip Preview</span>}
          footer={null}
          width={700}
          className="premium-modal"
          centered
        >
          <div className="space-y-6 py-3">
            <PayslipPrint payslip={viewPayslip} />
            <div className="flex justify-center gap-3 pt-4 border-t border-gray-150/40">
              <Button
                icon={<PrinterOutlined />}
                onClick={() => window.print()}
                className="rounded-xl font-bold px-6"
              >
                Print Payslip
              </Button>
              <Button
                type="primary"
                onClick={() => setViewPayslip(null)}
                className="rounded-xl font-bold px-6"
              >
                Close
              </Button>
            </div>
          </div>
        </AntModal>
      </div>
    </ConfigProvider>
  )
}
