import { formatCurrency, formatDate } from '@/utils/helpers'

const Row = ({ label, value, bold = false }) => (
  <div className="flex items-center justify-between gap-4 py-1.5 border-b border-dashed last:border-0" style={{ borderColor: 'var(--color-border)' }}>
    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
    <span className={`text-sm ${bold ? 'font-black' : 'font-semibold'}`} style={{ color: 'var(--color-text-primary)' }}>{value}</span>
  </div>
)

const Section = ({ title, children }) => (
  <div className="space-y-1">
    <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 px-2 py-1 bg-surface-raised rounded-lg w-fit" style={{ color: 'var(--color-text-muted)' }}>{title}</div>
    {children}
  </div>
)

const PayslipPrint = ({ payslip }) => {
  if (!payslip) return null

  const monthName = new Date(0, payslip.month - 1).toLocaleString('default', { month: 'long' })
  const totalAllowances = Number(payslip.hra || 0) + Number(payslip.da || 0) + Number(payslip.allowances || 0)

  return (
    <div className="student-report-print-root rounded-[32px] border p-8 space-y-8" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>{payslip.school_name || 'Greenwood Academy'}</h2>
          <p className="text-xs max-w-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{payslip.school_address || 'Main Campus'}</p>
        </div>
        <div className="text-right">
          <div className="inline-block px-4 py-2 rounded-2xl bg-brand/10 border border-brand/20">
            <p className="text-[10px] font-black uppercase tracking-widest text-brand">Salary Slip</p>
            <p className="text-sm font-bold text-brand">{monthName} {payslip.year}</p>
          </div>
        </div>
      </div>

      {/* Staff Details */}
      <div className="grid grid-cols-2 gap-8 p-6 rounded-[24px] bg-surface-raised border" style={{ borderColor: 'var(--color-border)' }}>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Staff Member</p>
          <p className="text-lg font-black" style={{ color: 'var(--color-text-primary)' }}>{payslip.name}</p>
          <p className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>{payslip.employee_id}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Designation</p>
          <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{payslip.designation || 'Senior Faculty'}</p>
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{payslip.department || 'Academic'}</p>
        </div>
      </div>

      {/* Earnings & Deductions */}
      <div className="grid grid-cols-2 gap-12">
        <Section title="Earnings">
          <Row label="Basic Salary" value={formatCurrency(payslip.basic)} />
          <Row label="HRA" value={formatCurrency(payslip.hra)} />
          <Row label="DA" value={formatCurrency(payslip.da)} />
          <Row label="Other Allowances" value={formatCurrency(payslip.allowances)} />
          <div className="pt-2">
            <Row label="Total Earnings" value={formatCurrency(Number(payslip.basic) + totalAllowances)} bold />
          </div>
        </Section>
        
        <Section title="Deductions">
          <Row label="Tax / PF / Other" value={formatCurrency(payslip.deductions)} />
          <div className="pt-2">
            <Row label="Total Deductions" value={formatCurrency(payslip.deductions)} bold />
          </div>
        </Section>
      </div>

      {/* Summary */}
      <div className="border-t pt-8 flex items-end justify-between" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Payment Mode</p>
          <p className="text-sm font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>{payslip.payment_mode || 'Bank Transfer'}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Paid on {formatDate(payslip.payment_date, 'long')}</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--color-text-muted)' }}>Net Salary Disbursed</div>
          <div className="text-4xl font-black text-brand">{formatCurrency(payslip.net_salary)}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-8">
        <p className="text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>This is a computer-generated document and does not require a physical signature.</p>
      </div>
    </div>
  )
}

export default PayslipPrint
