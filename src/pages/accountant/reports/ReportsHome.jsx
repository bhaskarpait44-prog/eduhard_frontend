import { Link } from 'react-router-dom'
import { 
  Calendar, 
  FileText, 
  Users, 
  Clock, 
  AlertCircle, 
  Percent, 
  Settings2,
  Wallet,
  UserX,
  FileDown,
  ArrowRight
} from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import { ROUTES } from '@/constants/app'

const REPORTS = [
  { 
    label: 'Daily Report', 
    path: ROUTES.ACCOUNTANT_REPORT_DAILY, 
    icon: Calendar, 
    description: 'Summary of collections and expenses for today.' 
  },
  { 
    label: 'Monthly Report', 
    path: ROUTES.ACCOUNTANT_REPORT_MONTHLY, 
    icon: Clock, 
    description: 'Detailed financial performance for the current month.' 
  },
  { 
    label: 'Class Wise Report', 
    path: ROUTES.ACCOUNTANT_REPORT_CLASSWISE, 
    icon: Users, 
    description: 'Fee status breakdown across different classes and sections.' 
  },
  { 
    label: 'Session Summary', 
    path: ROUTES.ACCOUNTANT_REPORT_SESSION, 
    icon: FileText, 
    description: 'Comprehensive overview of the entire academic session.' 
  },
  { 
    label: 'Defaulter Report', 
    path: ROUTES.ACCOUNTANT_REPORT_DEFAULTERS, 
    icon: AlertCircle, 
    description: 'List of students with pending dues and overdue history.' 
  },
  { 
    label: 'Concession Report', 
    path: ROUTES.ACCOUNTANT_REPORT_CONCESSIONS, 
    icon: Percent, 
    description: 'Tracking all fee waivers and discounts applied.' 
  },
  { 
    label: 'Custom Report', 
    path: ROUTES.ACCOUNTANT_REPORT_CUSTOM, 
    icon: Settings2, 
    description: 'Generate reports with custom date ranges and filters.' 
  },
]

const QUICK_ACTIONS = [
  { label: 'Collect Fee', path: ROUTES.ACCOUNTANT_COLLECTION, icon: Wallet, color: 'var(--color-brand)' },
  { label: 'View Defaulters', path: ROUTES.ACCOUNTANT_DEFAULTERS, icon: UserX, color: '#dc2626' },
  { label: "Today's Report", path: ROUTES.ACCOUNTANT_REPORT_DAILY, icon: FileDown, color: '#15803d' },
]

const ReportsHome = () => {
  usePageTitle('Reports')

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Reports Center</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Access financial summaries, collection trends, and student fee positions.</p>
        
        {/* Quick Actions Strip */}
        <div className="mt-6 flex flex-wrap gap-3 border-t pt-6" style={{ borderColor: 'var(--color-border)' }}>
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.path}
              className="group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all hover:shadow-md"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${action.color}15`, color: action.color }}>
                <action.icon size={18} />
              </div>
              {action.label}
              <ArrowRight size={14} className="opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report) => (
          <Link
            key={report.path}
            to={report.path}
            className="group rounded-[24px] border p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px]" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent-emphasis)' }}>
                <report.icon size={24} />
              </div>
              <ArrowRight size={20} className="text-muted opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
            </div>
            <div className="mt-4">
              <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>{report.label}</h3>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{report.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default ReportsHome
