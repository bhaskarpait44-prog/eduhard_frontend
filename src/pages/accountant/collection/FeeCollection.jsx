import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  Steps,
  Button,
  Checkbox,
  Tag,
  Input as AntInput,
  Result,
  Avatar,
  ConfigProvider,
  theme as antdTheme,
  DatePicker
} from 'antd'
import dayjs from 'dayjs'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  PrinterOutlined,
  WalletOutlined,
  CalendarOutlined,
  NumberOutlined,
  BankOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  MobileOutlined,
  ProfileOutlined,
  CreditCardOutlined,
  RedoOutlined
} from '@ant-design/icons'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import StudentSearchBox from '@/components/accountant/StudentSearchBox'
import ReceiptPrint from '@/components/accountant/ReceiptPrint'
import useFeeCollection from '@/hooks/useFeeCollection'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency, formatDate, getInitials, getFeeMonthLabel } from '@/utils/helpers'
import useUiStore from '@/store/uiStore'

const today = new Date().toISOString().slice(0, 10)

const MODES = [
  { value: 'cash', label: 'Cash', icon: WalletOutlined },
  { value: 'online', label: 'Online', icon: BankOutlined },
  { value: 'cheque', label: 'Cheque', icon: ProfileOutlined },
  { value: 'dd', label: 'DD', icon: CreditCardOutlined },
  { value: 'upi', label: 'UPI', icon: MobileOutlined },
]

const FeeCollection = () => {
  usePageTitle('Fee Collection')
  const { toastSuccess, toastError, toastWarning } = useToast()
  const { collect, isSaving } = useFeeCollection()
  const { theme: storeTheme } = useUiStore()
  
  const [step, setStep] = useState(0)
  const [student, setStudent] = useState(null)
  const [invoicePayload, setInvoicePayload] = useState(null)
  const [selectedInvoices, setSelectedInvoices] = useState([])
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_mode: 'cash',
    payment_date: today,
    reference: '',
    remarks: '',
    bank_name: '',
    cheque_number: '',
    cheque_date: today,
    upi_id: '',
  })
  const [receipt, setReceipt] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        if (step !== 0) {
          setStep(0)
          setStudent(null)
          setInvoicePayload(null)
          setSelectedInvoices([])
          setPaymentData({
            amount: '',
            payment_mode: 'cash',
            payment_date: today,
            reference: '',
            remarks: '',
            bank_name: '',
            cheque_number: '',
            cheque_date: today,
            upi_id: '',
          })
          setReceipt(null)
          setErrors({})
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [step])

  const isDark = storeTheme === 'dark' || (storeTheme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)

  const allInvoices = useMemo(() => {
    const pending = invoicePayload?.pending_invoices || []
    const carried = invoicePayload?.carried_forward_invoices || []
    return [...pending, ...carried]
  }, [invoicePayload])

  const selectedRows = useMemo(
    () => allInvoices.filter((row) => selectedInvoices.includes(row.id)),
    [allInvoices, selectedInvoices]
  )
  const selectedTotal = selectedRows.reduce((sum, row) => sum + Number(row.balance || 0), 0)

  const selectStudent = async (selectedStudent) => {
    setStudent(selectedStudent)
    try {
      const response = await accountantApi.getStudentPendingInvoices(selectedStudent.id)
      setInvoicePayload(response.data)
      setSelectedInvoices([])
      setPaymentData((current) => ({ ...current, amount: '' }))
      setStep(1)
    } catch (error) {
      toastError(error.message || 'Failed to load pending invoices')
    }
  }

  const toggleInvoice = (invoiceId) => {
    setSelectedInvoices((current) => current.includes(invoiceId) ? current.filter((id) => id !== invoiceId) : [...current, invoiceId])
  }

  const moveToPayment = () => {
    if (selectedInvoices.length === 0) {
      toastWarning('Please select at least one invoice to proceed')
      return
    }
    setPaymentData((current) => ({ ...current, amount: selectedTotal.toFixed(2) }))
    setStep(2)
  }

  const validateStep2 = () => {
    const newErrors = {}
    const amountNum = parseFloat(paymentData.amount)

    if (!paymentData.amount || isNaN(amountNum)) {
      newErrors.amount = 'Valid amount is required'
    } else if (amountNum <= 0) {
      newErrors.amount = 'Amount must be greater than zero'
    } else if (amountNum > selectedTotal) {
      newErrors.amount = `Amount cannot exceed total due (${formatCurrency(selectedTotal)})`
    }

    if (!paymentData.payment_date) {
      newErrors.payment_date = 'Payment date is required'
    }

    if (paymentData.payment_mode === 'cheque') {
      if (!paymentData.cheque_number) newErrors.cheque_number = 'Cheque number is required'
      if (!paymentData.bank_name) newErrors.bank_name = 'Bank name is required'
    }

    if (paymentData.payment_mode === 'upi') {
      if (!paymentData.upi_id) newErrors.upi_id = 'UPI ID is required'
      if (!paymentData.bank_name) newErrors.bank_name = 'Bank / App name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const confirmCollection = async () => {
    try {
      const response = await collect({
        student_id: student.id,
        invoice_ids: selectedInvoices,
        ...paymentData,
      })
      toastSuccess('Receipt generated successfully')
      setReceipt({
        ...response,
        student_name: `${student.first_name} ${student.last_name}`,
        admission_no: student.admission_no,
        class_name: student.class_name,
        section_name: student.section_name,
        amount: response.total_applied,
        payment_mode: paymentData.payment_mode,
        payment_date: paymentData.payment_date,
        fee_name: selectedRows.map((row) => `${row.fee_name}${row.due_date ? ` (${getFeeMonthLabel(row.due_date)})` : ''}`).join(', '),
      })
      setStep(4)
    } catch (error) {
      toastError(error.message || 'Failed to collect fee')
    }
  }

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
        {/* Header Block */}
        <div
          className="flex flex-wrap items-center justify-between gap-6 rounded-[32px] border p-6 shadow-sm relative overflow-hidden backdrop-blur-md"
          style={{ 
            background: isDark 
              ? 'linear-gradient(135deg, rgba(67, 97, 238, 0.15) 0%, #1e1b4b 100%)'
              : 'linear-gradient(135deg, #eef2ff 0%, #fffdf9 100%)', 
            borderColor: isDark ? '#4361ee30' : '#c7d2fe'
          }}
        >
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          
          <div className="z-10">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Counter Fee Collection</h1>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-semibold">
              Fast, keyboard-friendly counter workflow for repeated daily collections.
            </p>
          </div>
          <div className="w-full md:w-auto z-10">
            <Steps
              current={step}
              size="small"
              items={[
                { title: 'Student' },
                { title: 'Invoices' },
                { title: 'Payment' },
                { title: 'Review' },
                { title: 'Receipt' }
              ]}
            />
          </div>
        </div>

        {/* Wizard Main Card */}
        <Card 
          className="rounded-[32px] shadow-sm border-gray-100 dark:border-gray-800"
          styles={{ body: { padding: '32px' } }}
        >
          {step === 0 && (
            <div className="space-y-5">
              <div className="text-sm font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Select Student</div>
              <StudentSearchBox onSelect={selectStudent} autoFocus />
            </div>
          )}

          {step === 1 && student && (
            <div className="space-y-6">
              {/* Student Profile Hero Card */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-950/30">
                <div className="flex items-center gap-3.5">
                  <Avatar 
                    size="large"
                    className="bg-indigo-100 text-indigo-700 font-extrabold dark:bg-indigo-950/40 dark:text-indigo-300"
                  >
                    {getInitials(`${student.first_name} ${student.last_name}`)}
                  </Avatar>
                  <div>
                    <h2 className="text-base font-extrabold text-gray-800 dark:text-gray-100">{student.first_name} {student.last_name}</h2>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
                      {student.admission_no} • {invoicePayload?.student?.class_name || student.class_name} {invoicePayload?.student?.section_name ? `Section ${invoicePayload.student.section_name}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Pending Dues</span>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                    {formatCurrency(invoicePayload?.summary?.balance || 0)}
                  </div>
                </div>
              </div>

              {/* Select Actions */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="small" 
                  className="rounded-full font-bold text-xs"
                  onClick={() => setSelectedInvoices(allInvoices.map((row) => row.id))}
                >
                  Select All Pending
                </Button>
                <Button 
                  size="small" 
                  className="rounded-full font-bold text-xs"
                  onClick={() => setSelectedInvoices([])}
                >
                  Clear Selection
                </Button>
              </div>

              {/* Invoices List */}
              <div className="space-y-3">
                {allInvoices.map((invoice) => {
                  const overdue = new Date(invoice.due_date) < new Date(today)
                  const selected = selectedInvoices.includes(invoice.id)
                  const isCarriedForward = !!invoice.carry_from_invoice_id
                  return (
                    <div
                      key={invoice.id}
                      onClick={() => toggleInvoice(invoice.id)}
                      className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-all hover:border-indigo-400 hover:shadow-sm ${
                        selected 
                          ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10' 
                          : 'border-gray-100 dark:border-gray-800/80 bg-white dark:bg-gray-900'
                      }`}
                    >
                      <Checkbox 
                        checked={selected} 
                        className="mt-1" 
                        onChange={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-extrabold text-gray-800 dark:text-gray-100">
                            {invoice.fee_name} {invoice.due_date ? `(${getFeeMonthLabel(invoice.due_date)})` : ''}
                          </span>
                          {overdue && <Tag color="error" className="rounded-full font-black text-[9px] px-2 py-0 border-0">OVERDUE</Tag>}
                          {isCarriedForward && <Tag color="warning" className="rounded-full font-black text-[9px] px-2 py-0 border-0">CARRIED FORWARD</Tag>}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
                          Due Date: {formatDate(invoice.due_date)} • Balance: <span className="font-extrabold text-gray-700 dark:text-gray-300">{formatCurrency(invoice.balance)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Selected Total Summary Card */}
              <div className="flex items-center justify-between p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-950/30">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Selected Total</span>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-0.5">{selectedInvoices.length} item(s) to collect</p>
                </div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(selectedTotal)}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800/40">
                <Button 
                  size="large"
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => setStep(0)} 
                  className="rounded-full font-bold px-6"
                >
                  Back
                </Button>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={moveToPayment} 
                  className="rounded-full font-bold px-8 border-0"
                  style={{ background: 'linear-gradient(90deg, #4361ee 0%, #1d4ed8 100%)' }}
                >
                  <span className="mr-1">Next</span>
                  <ArrowRightOutlined />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Total amount summary banner */}
              <div className="flex items-center justify-between p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-950/30">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Total Selected Dues</span>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(selectedTotal)}</div>
              </div>

              {/* Payment Mode Selector Choice Cards */}
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800/80 p-5 bg-white dark:bg-gray-900">
                <div className="mb-4 text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Payment Mode</div>
                
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
                  {MODES.map((mode) => {
                    const Icon = mode.icon
                    const active = paymentData.payment_mode === mode.value
                    return (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setPaymentData({ ...paymentData, payment_mode: mode.value })}
                        className={`rounded-2xl border p-4 text-center transition-all flex flex-col items-center justify-center gap-2 font-bold text-xs cursor-pointer ${
                          active
                            ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'border-gray-100 dark:border-gray-800/80 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:border-indigo-300'
                        }`}
                      >
                        <Icon className={`text-lg ${active ? 'text-indigo-500' : 'text-gray-400'}`} />
                        <span>{mode.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Inputs Grid */}
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase mb-1.5">Collection Amount *</label>
                  <AntInput 
                    size="large"
                    prefix={<WalletOutlined className="text-gray-400" />}
                    value={paymentData.amount} 
                    onChange={(e) => { setPaymentData({ ...paymentData, amount: e.target.value }); setErrors({ ...errors, amount: '' }) }} 
                    placeholder="0.00"
                    status={errors.amount ? 'error' : ''}
                    className="rounded-xl font-bold"
                  />
                  {errors.amount && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.amount}</p>}
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase mb-1.5">Payment Date *</label>
                  <DatePicker 
                    maxDate={dayjs(today)} 
                    value={paymentData.payment_date ? dayjs(paymentData.payment_date) : null} 
                    onChange={(date, dateString) => {
                      const val = date ? date.format('YYYY-MM-DD') : '';
                      setPaymentData({ ...paymentData, payment_date: val });
                      setErrors({ ...errors, payment_date: '' });
                    }} 
                    className={`w-full h-[40px] px-3.5 border rounded-xl font-bold text-sm bg-transparent outline-none focus:border-indigo-400 ${
                      errors.payment_date ? 'border-rose-500' : 'border-gray-200 dark:border-gray-700'
                    }`}
                    style={{ color: 'inherit' }}
                    format="DD-MM-YYYY"
                    allowClear={false}
                  />
                  {errors.payment_date && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.payment_date}</p>}
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase mb-1.5">Reference / Transaction ID</label>
                  <AntInput 
                    size="large"
                    prefix={<NumberOutlined className="text-gray-400" />}
                    value={paymentData.reference} 
                    onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })} 
                    placeholder="Optional reference identifier" 
                    className="rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase mb-1.5">
                    {paymentData.payment_mode === 'upi' ? "Bank / App Name *" : "Bank Name" + (['cheque', 'upi'].includes(paymentData.payment_mode) ? ' *' : '')}
                  </label>
                  <AntInput 
                    size="large"
                    prefix={<BankOutlined className="text-gray-400" />}
                    value={paymentData.bank_name} 
                    onChange={(e) => { setPaymentData({ ...paymentData, bank_name: e.target.value }); setErrors({ ...errors, bank_name: '' }) }} 
                    placeholder={paymentData.payment_mode === 'upi' ? "e.g. GPay, PhonePe, HDFC" : "e.g. HDFC Bank"} 
                    status={errors.bank_name ? 'error' : ''}
                    className="rounded-xl font-bold"
                  />
                  {errors.bank_name && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.bank_name}</p>}
                </div>

                {paymentData.payment_mode === 'upi' && (
                  <div>
                    <label className="block text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase mb-1.5">UPI ID (VPA) *</label>
                    <AntInput 
                      size="large"
                      prefix={<NumberOutlined className="text-gray-400" />}
                      value={paymentData.upi_id} 
                      onChange={(e) => { setPaymentData({ ...paymentData, upi_id: e.target.value }); setErrors({ ...errors, upi_id: '' }) }} 
                      placeholder="e.g. school@upi" 
                      status={errors.upi_id ? 'error' : ''}
                      className="rounded-xl font-bold"
                    />
                    {errors.upi_id && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.upi_id}</p>}
                  </div>
                )}

                {paymentData.payment_mode === 'cheque' && (
                  <>
                    <div>
                      <label className="block text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase mb-1.5">Cheque Number *</label>
                      <AntInput 
                        size="large"
                        prefix={<NumberOutlined className="text-gray-400" />}
                        value={paymentData.cheque_number} 
                        onChange={(e) => { setPaymentData({ ...paymentData, cheque_number: e.target.value }); setErrors({ ...errors, cheque_number: '' }) }} 
                        placeholder="6-digit number" 
                        status={errors.cheque_number ? 'error' : ''}
                        className="rounded-xl font-bold"
                      />
                      {errors.cheque_number && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.cheque_number}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase mb-1.5">Cheque Date</label>
                      <DatePicker 
                        value={paymentData.cheque_date ? dayjs(paymentData.cheque_date) : null} 
                        onChange={(date, dateString) => {
                          const val = date ? date.format('YYYY-MM-DD') : '';
                          setPaymentData({ ...paymentData, cheque_date: val });
                        }} 
                        className="w-full h-[40px] px-3.5 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm bg-transparent outline-none focus:border-indigo-400"
                        style={{ color: 'inherit' }}
                        format="DD-MM-YYYY"
                        allowClear={false}
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase mb-1.5">Remarks</label>
                <AntInput.TextArea 
                  value={paymentData.remarks} 
                  onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })} 
                  rows={3} 
                  placeholder="Write internal notes or remarks..." 
                  className="rounded-xl font-semibold"
                />
              </div>

              {/* Navigation Controls */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800/40">
                <Button 
                  size="large"
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => setStep(1)} 
                  className="rounded-full font-bold px-6"
                >
                  Back
                </Button>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => validateStep2() && setStep(3)} 
                  className="rounded-full font-bold px-8 border-0"
                  style={{ background: 'linear-gradient(90deg, #4361ee 0%, #1d4ed8 100%)' }}
                >
                  <span className="mr-1">Review</span>
                  <ArrowRightOutlined />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {/* Review confirmation panel */}
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800/85 p-6 bg-white dark:bg-gray-900/60">
                <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 mb-4">
                  <InfoCircleOutlined className="text-indigo-500" />
                  Review Details
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3 rounded-2xl bg-gray-50/50 dark:bg-gray-900/40 border border-gray-100/50 dark:border-gray-800/50 p-5 text-sm font-semibold text-gray-500 dark:text-gray-400">
                    <div className="flex justify-between border-b border-gray-100/40 pb-2">
                      <span>Student:</span>
                      <span className="font-extrabold text-gray-900 dark:text-white">{student.first_name} {student.last_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100/40 py-2">
                      <span>Invoices selected:</span>
                      <span className="font-extrabold text-gray-900 dark:text-white">{selectedRows.length} item(s)</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100/40 py-2">
                      <span>Payment Mode:</span>
                      <span className="font-extrabold uppercase text-gray-900 dark:text-white">{paymentData.payment_mode}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span>Payment Date:</span>
                      <span className="font-extrabold text-gray-900 dark:text-white">{formatDate(paymentData.payment_date)}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-white p-6 shadow-md border-0">
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-100">Total Collection</span>
                    <span className="mt-2 text-3xl font-black">{formatCurrency(paymentData.amount || 0)}</span>
                  </div>
                </div>
                
                <div className="mt-6 space-y-3 border-t border-gray-100 dark:border-gray-800/60 pt-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Invoice Item Breakdown</div>
                  {selectedRows.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                      <span>{invoice.fee_name} {invoice.due_date ? `(${getFeeMonthLabel(invoice.due_date)})` : ''}</span>
                      <span className="font-extrabold text-gray-500 dark:text-gray-400">{formatCurrency(invoice.balance)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800/40">
                <Button 
                  size="large"
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => setStep(2)} 
                  className="rounded-full font-bold px-6"
                >
                  Back
                </Button>
                <Button 
                  type="primary" 
                  size="large"
                  loading={isSaving}
                  onClick={confirmCollection} 
                  className="rounded-full font-black px-10 border-0"
                  style={{ background: 'linear-gradient(90deg, #4361ee 0%, #1d4ed8 100%)' }}
                >
                  {isSaving ? 'Processing...' : 'Confirm & Collect'}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && receipt && (
            <div className="space-y-6">
              <Result
                status="success"
                title={<span className="font-black text-2xl tracking-tight text-gray-800 dark:text-gray-100">Collection Successful</span>}
                subTitle={<span className="font-semibold text-sm text-gray-400 dark:text-gray-500">Receipt {receipt.receipt_no} has been recorded and finalized.</span>}
                className="py-6"
              />
              
              <div className="border border-gray-100 dark:border-gray-850 rounded-2xl p-6 bg-white dark:bg-gray-950/30">
                <ReceiptPrint receipt={receipt} />
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Button 
                  type="dashed"
                  size="large"
                  icon={<PrinterOutlined />}
                  onClick={() => window.print()}
                  className="rounded-full font-bold px-6"
                >
                  Print Receipt
                </Button>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<RedoOutlined />}
                  onClick={() => { setStep(0); setStudent(null); setReceipt(null); setInvoicePayload(null); setSelectedInvoices([]) }}
                  className="rounded-full font-bold px-8 border-0"
                  style={{ background: 'linear-gradient(90deg, #4361ee 0%, #1d4ed8 100%)' }}
                >
                  Collect Another
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </ConfigProvider>
  )
}

export default FeeCollection
