import { useEffect, useState, useMemo } from 'react'
import {
  Row,
  Col,
  Table,
  Select as AntSelect,
  Input as AntInput,
  Modal as AntModal,
  Tabs,
  Avatar,
} from 'antd'
import {
  SettingOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  ArrowRightOutlined,
  PrinterOutlined,
  EditOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import usePayrollStore from '@/store/payrollStore'
import PayslipPrint from '@/components/accountant/PayslipPrint'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { feeStatusBadge } from '@/utils/feeStatus'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import UIButton from '@/components/ui/Button'

export default function PayrollDashboard() {
  usePageTitle('Salary & Payroll')
  const { toastSuccess, toastError } = useToast()
  const {
    structures, payrolls, isLoading,
    fetchStructures, updateStructure,
    fetchPayrolls, generatePayroll, markPaid,
    fetchPayslip,
  } = usePayrollStore()

  const [activeTab, setActiveTab] = useState('payroll')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchQuery, setSearchQuery] = useState('')

  const [structModalOpen, setStructModalOpen] = useState(false)
  const [editingStruct, setEditingStruct] = useState(null)

  const [payModalOpen, setPayModalOpen] = useState(false)
  const [payingRecord, setPayingRecord] = useState(null)
  const [payForm, setPayForm] = useState({ payment_mode: 'Bank Transfer', payment_date: new Date().toISOString().split('T')[0], remarks: '' })

  const [viewPayslip, setViewPayslip] = useState(null)

  useEffect(() => {
    if (activeTab === 'structures') fetchStructures()
    if (activeTab === 'payroll') fetchPayrolls(selectedMonth, selectedYear)
  }, [activeTab, selectedMonth, selectedYear, fetchStructures, fetchPayrolls])

  const filteredStructures = useMemo(() => {
    if (!searchQuery) return structures
    const q = searchQuery.toLowerCase()
    return structures.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.employee_id?.toLowerCase().includes(q),
    )
  }, [structures, searchQuery])

  const filteredPayrolls = useMemo(() => {
    if (!searchQuery) return payrolls
    const q = searchQuery.toLowerCase()
    return payrolls.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.employee_id?.toLowerCase().includes(q) ||
      p.receipt_no?.toLowerCase().includes(q),
    )
  }, [payrolls, searchQuery])

  const summary = useMemo(() => {
    const total = payrolls.reduce((sum, p) => sum + Number(p.net_salary || 0), 0)
    const paid = payrolls.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.net_salary || 0), 0)
    const pending = total - paid
    return { total, paid, pending, count: payrolls.length, paidCount: payrolls.filter(p => p.status === 'paid').length }
  }, [payrolls])

  const years = useMemo(() => {
    const current = new Date().getFullYear()
    return [current - 1, current, current + 1]
  }, [])

  const handleStructSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateStructure(editingStruct.staff_id, { ...editingStruct, type: editingStruct.type })
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

  const staffCell = (record) => (
    <div className="flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0"
        style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
      >
        {record.name?.charAt(0).toUpperCase()}
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{record.name}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          {record.employee_id} · {record.designation || record.role}
        </p>
      </div>
    </div>
  )

  const amountCell = (val, color = 'var(--color-text-primary)') => (
    <span className="text-sm font-medium" style={{ color }}>{formatCurrency(val)}</span>
  )

  const payrollColumns = [
    { title: 'Staff Member', key: 'staff', render: (_, r) => staffCell(r) },
    { title: 'Basic', dataIndex: 'basic', key: 'basic', align: 'right', render: (v) => amountCell(v) },
    { title: 'Allowances', key: 'allowances', align: 'right', render: (_, r) => amountCell(Number(r.hra) + Number(r.da) + Number(r.allowances), 'var(--color-success)') },
    { title: 'Deductions', dataIndex: 'deductions', key: 'deductions', align: 'right', render: (v) => amountCell(v, 'var(--color-danger)') },
    {
      title: 'Net Salary', dataIndex: 'net_salary', key: 'net_salary', align: 'right',
      render: (val) => <span className="text-sm font-semibold" style={{ color: 'var(--color-brand)' }}>{formatCurrency(val)}</span>,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', align: 'center',
      render: (status, record) => (
        <div>
          <Badge variant={feeStatusBadge(status)} dot>{status}</Badge>
          {record.payment_date && (
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{formatDate(record.payment_date, 'short')}</p>
          )}
        </div>
      ),
    },
    {
      title: 'Actions', key: 'action', align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1.5">
          {record.status === 'generated' && (
            <UIButton size="xs" variant="primary" onClick={() => { setPayingRecord(record); setPayModalOpen(true) }}>
              <ArrowRightOutlined /> Mark Paid
            </UIButton>
          )}
          {record.status === 'paid' && (
            <button
              type="button"
              onClick={() => handleViewPayslip(record.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--color-brand)' }}
              title="View Payslip"
            >
              <FileTextOutlined />
            </button>
          )}
        </div>
      ),
    },
  ]

  const templateColumns = [
    { title: 'Staff Member', key: 'staff', render: (_, r) => staffCell(r) },
    { title: 'Basic', dataIndex: 'basic', key: 'basic', align: 'right', render: (v) => amountCell(v) },
    { title: 'HRA', dataIndex: 'hra', key: 'hra', align: 'right', render: (v) => amountCell(v) },
    { title: 'DA', dataIndex: 'da', key: 'da', align: 'right', render: (v) => amountCell(v) },
    { title: 'Others', dataIndex: 'allowances', key: 'allowances', align: 'right', render: (v) => amountCell(v) },
    { title: 'Deductions', dataIndex: 'deductions', key: 'deductions', align: 'right', render: (v) => amountCell(v, 'var(--color-danger)') },
    {
      title: 'Actions', key: 'action', align: 'right',
      render: (_, record) => (
        <UIButton
          size="xs"
          variant="secondary"
          onClick={() => {
            setEditingStruct({
              staff_id: record.staff_id, type: record.type, name: record.name,
              basic: record.basic || 0, hra: record.hra || 0, da: record.da || 0,
              allowances: record.allowances || 0, deductions: record.deductions || 0,
            })
            setStructModalOpen(true)
          }}
        >
          <EditOutlined /> Edit
        </UIButton>
      ),
    },
  ]

  const modalLabel = (text) => (
    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>{text}</label>
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Salary & Payroll"
        subtitle="Manage staff salary structures and monthly disbursals"
        action={
          <AntInput
            placeholder="Search staff or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            prefix={<SearchOutlined style={{ color: 'var(--color-text-muted)' }} />}
            allowClear
            style={{ width: 220, borderRadius: 10, height: 36 }}
          />
        }
      />

      {/* Tab bar */}
      <div
        className="rounded-2xl border px-4 pt-1"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => { setActiveTab(key); setSearchQuery('') }}
          items={[
            { label: 'Monthly Payroll', key: 'payroll' },
            { label: 'Salary Templates', key: 'structures' },
          ]}
          style={{ marginBottom: 0 }}
        />
      </div>

      {activeTab === 'payroll' && (
        <>
          {/* Stats */}
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}>
              <StatCard label="Monthly Budget" value={formatCurrency(summary.total)} sub={`${summary.count} records`} color="var(--color-brand)" />
            </Col>
            <Col xs={12} md={6}>
              <StatCard label="Disbursed" value={formatCurrency(summary.paid)} sub={`${summary.paidCount} paid`} color="var(--color-success)" />
            </Col>
            <Col xs={12} md={6}>
              <StatCard label="Pending" value={formatCurrency(summary.pending)} sub={`${summary.count - summary.paidCount} to process`} color="var(--color-danger)" />
            </Col>
            <Col xs={12} md={6}>
              <StatCard label="Avg Salary" value={formatCurrency(summary.total / (summary.count || 1))} sub="Per staff member" />
            </Col>
          </Row>

          {/* Payroll Table */}
          <Card
            title="Monthly Disbursal"
            headerAction={
              <div className="flex items-center gap-2">
                <AntSelect
                  value={selectedMonth}
                  onChange={val => setSelectedMonth(val)}
                  style={{ width: 130 }}
                  options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('default', { month: 'long' }) }))}
                />
                <AntSelect
                  value={selectedYear}
                  onChange={val => setSelectedYear(val)}
                  style={{ width: 90 }}
                  options={years.map(y => ({ value: y, label: String(y) }))}
                />
                <UIButton variant="primary" loading={isLoading} onClick={handleGenerate}>
                  <PlayCircleOutlined /> Generate
                </UIButton>
              </div>
            }
          >
            <div className="-mx-5 -mb-5">
              <Table
                dataSource={filteredPayrolls}
                columns={payrollColumns}
                rowKey="id"
                pagination={{ pageSize: 15 }}
                loading={isLoading && !viewPayslip}
                size="small"
                rowClassName="transition-colors"
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4}>
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Total Monthly Budget</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right">
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-brand)' }}>{formatCurrency(summary.total)}</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5} colSpan={2} />
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </div>
          </Card>
        </>
      )}

      {activeTab === 'structures' && (
        <Card title="Salary Templates">
          <div className="-mx-5 -mb-5">
            <Table
              dataSource={filteredStructures}
              columns={templateColumns}
              rowKey="staff_id"
              pagination={{ pageSize: 15 }}
              loading={isLoading}
              size="small"
              rowClassName="transition-colors"
            />
          </div>
        </Card>
      )}

      {/* Edit Structure Modal */}
      <AntModal
        open={structModalOpen}
        onCancel={() => !isLoading && setStructModalOpen(false)}
        title={<span className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Edit Salary Structure</span>}
        footer={null}
        centered
      >
        {editingStruct && (
          <form onSubmit={handleStructSubmit} className="space-y-4 py-3">
            <div className="rounded-xl border p-3 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Staff Member</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{editingStruct.name}</p>
            </div>
            <div>
              {modalLabel('Basic Salary')}
              <AntInput prefix={<DollarOutlined style={{ color: 'var(--color-text-muted)' }} />} type="number" step="0.01" min="0" value={editingStruct.basic} onChange={e => setEditingStruct({ ...editingStruct, basic: e.target.value })} required style={{ height: 36 }} />
            </div>
            <Row gutter={12}>
              <Col span={12}>{modalLabel('HRA')}<AntInput type="number" step="0.01" min="0" value={editingStruct.hra} onChange={e => setEditingStruct({ ...editingStruct, hra: e.target.value })} required style={{ height: 36 }} /></Col>
              <Col span={12}>{modalLabel('DA')}<AntInput type="number" step="0.01" min="0" value={editingStruct.da} onChange={e => setEditingStruct({ ...editingStruct, da: e.target.value })} required style={{ height: 36 }} /></Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>{modalLabel('Other Allowances')}<AntInput type="number" step="0.01" min="0" value={editingStruct.allowances} onChange={e => setEditingStruct({ ...editingStruct, allowances: e.target.value })} required style={{ height: 36 }} /></Col>
              <Col span={12}>{modalLabel('Deductions')}<AntInput type="number" step="0.01" min="0" value={editingStruct.deductions} onChange={e => setEditingStruct({ ...editingStruct, deductions: e.target.value })} required style={{ height: 36 }} /></Col>
            </Row>
            <div className="pt-3 flex justify-end gap-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <UIButton variant="secondary" type="button" onClick={() => setStructModalOpen(false)}>Cancel</UIButton>
              <UIButton variant="primary" type="submit" loading={isLoading}>Save Changes</UIButton>
            </div>
          </form>
        )}
      </AntModal>

      {/* Mark Paid Modal */}
      <AntModal
        open={payModalOpen}
        onCancel={() => !isLoading && setPayModalOpen(false)}
        title={<span className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Process Salary Payment</span>}
        footer={null}
        centered
      >
        {payingRecord && (
          <form onSubmit={handlePaySubmit} className="space-y-4 py-3">
            <div className="rounded-xl border p-4 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Net Amount to Pay</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-brand)' }}>{formatCurrency(payingRecord.net_salary)}</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Avatar size="small" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>
                  {payingRecord.name?.charAt(0).toUpperCase()}
                </Avatar>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{payingRecord.name}</p>
              </div>
            </div>
            <Row gutter={12}>
              <Col span={12}>
                {modalLabel('Payment Mode')}
                <AntSelect value={payForm.payment_mode} onChange={val => setPayForm({ ...payForm, payment_mode: val })} className="w-full" style={{ height: 36 }} options={[{ value: 'Bank Transfer', label: 'Bank Transfer' }, { value: 'Cheque', label: 'Cheque' }, { value: 'Cash', label: 'Cash' }, { value: 'UPI', label: 'UPI' }]} />
              </Col>
              <Col span={12}>
                {modalLabel('Payment Date')}
                <AntInput type="date" value={payForm.payment_date} onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} required style={{ height: 36 }} />
              </Col>
            </Row>
            <div>
              {modalLabel('Remarks / Ref No')}
              <AntInput prefix={<FileTextOutlined style={{ color: 'var(--color-text-muted)' }} />} value={payForm.remarks} onChange={e => setPayForm({ ...payForm, remarks: e.target.value })} placeholder="Transaction ID, Cheque No, etc." style={{ height: 36 }} />
            </div>
            <div className="pt-3 flex justify-end gap-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <UIButton variant="secondary" type="button" onClick={() => setPayModalOpen(false)}>Cancel</UIButton>
              <UIButton variant="primary" type="submit" loading={isLoading}>
                <CheckCircleOutlined /> Confirm Payment
              </UIButton>
            </div>
          </form>
        )}
      </AntModal>

      {/* Payslip Modal */}
      <AntModal
        open={!!viewPayslip}
        onCancel={() => setViewPayslip(null)}
        title={<span className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Payslip Preview</span>}
        footer={null}
        width={700}
        centered
      >
        <div className="space-y-5 py-3">
          <PayslipPrint payslip={viewPayslip} />
          <div className="flex justify-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <UIButton variant="secondary" onClick={() => window.print()}>
              <PrinterOutlined /> Print Payslip
            </UIButton>
            <UIButton variant="primary" onClick={() => setViewPayslip(null)}>Close</UIButton>
          </div>
        </div>
      </AntModal>
    </div>
  )
}
