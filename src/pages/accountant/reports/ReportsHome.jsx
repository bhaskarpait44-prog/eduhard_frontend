import { Link } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  ConfigProvider,
  theme as antdTheme
} from 'antd'
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
  ArrowRightOutlined
} from '@ant-design/icons'
import usePageTitle from '@/hooks/usePageTitle'
import { ROUTES } from '@/constants/app'
import useUiStore from '@/store/uiStore'

const REPORTS = [
  { 
    label: 'Daily Report', 
    path: ROUTES.ACCOUNTANT_REPORT_DAILY, 
    icon: CalendarOutlined, 
    description: 'Summary of collections and expenses for today.' 
  },
  { 
    label: 'Monthly Report', 
    path: ROUTES.ACCOUNTANT_REPORT_MONTHLY, 
    icon: ClockCircleOutlined, 
    description: 'Detailed financial performance for the current month.' 
  },
  { 
    label: 'Class Wise Report', 
    path: ROUTES.ACCOUNTANT_REPORT_CLASSWISE, 
    icon: TeamOutlined, 
    description: 'Fee status breakdown across different classes and sections.' 
  },
  { 
    label: 'Session Summary', 
    path: ROUTES.ACCOUNTANT_REPORT_SESSION, 
    icon: FileTextOutlined, 
    description: 'Comprehensive overview of the entire academic session.' 
  },
  { 
    label: 'Defaulter Report', 
    path: ROUTES.ACCOUNTANT_REPORT_DEFAULTERS, 
    icon: AlertOutlined, 
    description: 'List of students with pending dues and overdue history.' 
  },
  { 
    label: 'Concession Report', 
    path: ROUTES.ACCOUNTANT_REPORT_CONCESSIONS, 
    icon: PercentageOutlined, 
    description: 'Tracking all fee waivers and discounts applied.' 
  },
  { 
    label: 'Custom Report', 
    path: ROUTES.ACCOUNTANT_REPORT_CUSTOM, 
    icon: SettingOutlined, 
    description: 'Generate reports with custom date ranges and filters.' 
  },
]

const QUICK_ACTIONS = [
  { label: 'Collect Fee', path: ROUTES.ACCOUNTANT_COLLECTION, icon: WalletOutlined, color: '#4CC0D4' },
  { label: 'View Defaulters', path: ROUTES.ACCOUNTANT_DEFAULTERS, icon: UserDeleteOutlined, color: '#dc2626' },
  { label: "Today's Report", path: ROUTES.ACCOUNTANT_REPORT_DAILY, icon: DownloadOutlined, color: '#16a34a' },
]

const ReportsHome = () => {
  usePageTitle('Reports')
  const { theme: storeTheme } = useUiStore()

  const isDark = storeTheme === 'dark' || (storeTheme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)

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
        {/* Banner Block */}
        <div
          className="rounded-[32px] border p-6 shadow-sm relative overflow-hidden backdrop-blur-md"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(76, 192, 212, 0.15) 0%, #1e1b4b 100%)'
              : 'linear-gradient(135deg, #e0f7fa 0%, #fffdf9 100%)',
            borderColor: isDark ? 'rgba(76, 192, 212, 0.3)' : '#b2ebf2'
          }}
        >
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="z-10 relative">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Reports Center</h1>
              <Tag color="cyan" className="font-extrabold uppercase text-[9px] border-0 px-2 rounded-full">Analytics</Tag>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-semibold leading-relaxed">
              Access financial summaries, collection trends, concessions, and student fee positions.
            </p>

            {/* Quick Actions Strip */}
            <div className="mt-6 flex flex-wrap gap-3 border-t border-dashed pt-6 border-cyan-200/50 dark:border-cyan-900/50">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.label} to={action.path}>
                  <Button
                    size="large"
                    icon={<action.icon />}
                    className="rounded-xl font-bold flex items-center justify-center border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:shadow-md transition-all"
                    style={{ height: '42px', padding: '0 16px' }}
                  >
                    {action.label}
                    <ArrowRightOutlined className="ml-1 text-xs" />
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Reports Navigation Grid */}
        <Row gutter={[16, 16]}>
          {REPORTS.map((report) => {
            const Icon = report.icon
            return (
              <Col xs={24} sm={12} lg={8} key={report.path}>
                <Link to={report.path}>
                  <Card
                    hoverable
                    className="rounded-[24px] border-gray-100 dark:border-gray-850 h-full flex flex-col justify-between"
                    styles={{ body: { padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-2xl w-fit">
                          <Icon className="text-xl" />
                        </div>
                        <ArrowRightOutlined className="text-gray-450 dark:text-gray-500 text-sm" />
                      </div>
                      <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-2">{report.label}</h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold leading-relaxed">
                        {report.description}
                      </p>
                    </div>
                  </Card>
                </Link>
              </Col>
            )
          })}
        </Row>
      </div>
    </ConfigProvider>
  )
}

export default ReportsHome
