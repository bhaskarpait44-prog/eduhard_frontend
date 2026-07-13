import { Link } from 'react-router-dom'
import { Row, Col } from 'antd'
import {
  CalendarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  FileTextOutlined,
  AlertOutlined,
  PercentageOutlined,
  SettingOutlined,
  WalletOutlined,
  UserDeleteOutlined,
  DownloadOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import usePageTitle from '@/hooks/usePageTitle'
import { ROUTES } from '@/constants/app'
import PageHeader from '@/components/ui/PageHeader'
import UIButton from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

const REPORTS = [
  { label: 'Daily Report',     path: ROUTES.ACCOUNTANT_REPORT_DAILY,      icon: CalendarOutlined,    description: 'Summary of collections and expenses for today.' },
  { label: 'Monthly Report',   path: ROUTES.ACCOUNTANT_REPORT_MONTHLY,    icon: ClockCircleOutlined,  description: 'Detailed financial performance for the current month.' },
  { label: 'Class Wise Report',path: ROUTES.ACCOUNTANT_REPORT_CLASSWISE,  icon: TeamOutlined,         description: 'Fee status breakdown across different classes and sections.' },
  { label: 'Session Summary',  path: ROUTES.ACCOUNTANT_REPORT_SESSION,    icon: FileTextOutlined,     description: 'Comprehensive overview of the entire academic session.' },
  { label: 'Defaulter Report', path: ROUTES.ACCOUNTANT_REPORT_DEFAULTERS, icon: AlertOutlined,        description: 'List of students with pending dues and overdue history.' },
  { label: 'Concession Report',path: ROUTES.ACCOUNTANT_REPORT_CONCESSIONS,icon: PercentageOutlined,   description: 'Tracking all fee waivers and discounts applied.' },
  { label: 'Custom Report',    path: ROUTES.ACCOUNTANT_REPORT_CUSTOM,     icon: SettingOutlined,      description: 'Generate reports with custom date ranges and filters.' },
]

const QUICK_ACTIONS = [
  { label: 'Collect Fee',       path: ROUTES.ACCOUNTANT_COLLECTION,      icon: WalletOutlined,    color: 'var(--color-brand)' },
  { label: 'View Defaulters',   path: ROUTES.ACCOUNTANT_DEFAULTERS,      icon: UserDeleteOutlined, color: 'var(--color-danger)' },
  { label: "Today's Report",    path: ROUTES.ACCOUNTANT_REPORT_DAILY,    icon: DownloadOutlined,   color: 'var(--color-success)' },
]

const ReportsHome = () => {
  usePageTitle('Reports')

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports Center"
        subtitle="Access financial summaries, collection trends, concessions, and student fee positions"
        action={<Badge variant="blue">Analytics</Badge>}
      />

      {/* Quick Actions Strip */}
      <div
        className="rounded-2xl border p-4"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--color-text-muted)' }}>Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.label} to={action.path}>
              <UIButton variant="secondary" size="sm">
                <action.icon /> {action.label}
                <ArrowRightOutlined className="ml-1 text-xs" />
              </UIButton>
            </Link>
          ))}
        </div>
      </div>

      {/* Reports Navigation Grid */}
      <Row gutter={[16, 16]}>
        {REPORTS.map((report) => {
          const Icon = report.icon
          return (
            <Col xs={24} sm={12} lg={8} key={report.path}>
              <Link to={report.path}>
                <div
                  className="rounded-2xl border p-5 h-full flex flex-col gap-4 transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="p-2.5 rounded-xl"
                      style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-brand)' }}
                    >
                      <Icon style={{ fontSize: 18 }} />
                    </div>
                    <ArrowRightOutlined style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      {report.label}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                      {report.description}
                    </p>
                  </div>
                </div>
              </Link>
            </Col>
          )
        })}
      </Row>
    </div>
  )
}

export default ReportsHome
