import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Row,
  Col,
  Progress,
  Table,
  Avatar,
  Empty,
  Skeleton,
} from 'antd'
import {
  PlusOutlined,
  RedoOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { ROUTES } from '@/constants/app'
import usePageTitle from '@/hooks/usePageTitle'
import useAccountantDashboard from '@/hooks/useAccountantDashboard'
import CollectionChart from '@/components/accountant/CollectionChart'
import { formatCurrency, formatDate, getInitials } from '@/utils/helpers'
import { paymentModeBadge } from '@/utils/feeStatus'
import useAuthStore from '@/store/authStore'
import Badge from '@/components/ui/Badge'
import UIButton from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const AccountantDashboard = () => {
  usePageTitle('Accountant Dashboard')
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { dashboard, todayStats, recentTransactions, pendingTasks, weekTrend, isLoading, refresh } = useAccountantDashboard()

  const collectionDelta = Number(todayStats?.today?.difference_from_yesterday || 0)
  const collectionDirection = collectionDelta >= 0
  const modeBreakdown = todayStats?.today?.mode_breakdown || []
  const circularPct = Number(todayStats?.session_overview?.collection_percentage || dashboard?.summary?.collection_rate || 0)
  const weekMax = Math.max(...weekTrend.map((item) => Number(item.amount || 0)), 1)
  const monthPercent = todayStats?.month?.target_amount ? Math.round((Number(todayStats.month.total_amount || 0) / Number(todayStats.month.target_amount || 1)) * 100) : 0

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const tableColumns = [
    {
      title: 'Time',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (text) => (
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {formatDate(text, 'short')}
        </span>
      ),
    },
    {
      title: 'Student',
      dataIndex: 'student_name',
      key: 'student_name',
      render: (text) => (
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-semibold shrink-0"
            style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
          >
            {getInitials(text)}
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {text}
          </span>
        </div>
      ),
    },
    {
      title: 'Class',
      dataIndex: 'class_name',
      key: 'class_name',
      render: (text) => (
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => (
        <span className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: 'Mode',
      dataIndex: 'payment_mode',
      key: 'payment_mode',
      render: (text) => <Badge variant={paymentModeBadge(text)}>{text}</Badge>,
    },
    {
      title: 'Receipt',
      dataIndex: 'receipt_no',
      key: 'receipt_no',
      render: (text) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-brand)' }}>
          <FileTextOutlined className="text-[10px]" />
          {text}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Welcome Header */}
      <div
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border p-5 shadow-sm"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="min-w-0">
          <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-brand)' }}>
            {greeting}
          </p>
          <h1 className="text-2xl font-bold tracking-tight truncate" style={{ color: 'var(--color-text-primary)' }}>
            {user?.name || 'Accountant'}
          </h1>
          <p className="mt-1 text-xs font-medium flex flex-wrap items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
            Today: <span style={{ color: 'var(--color-text-secondary)' }}>{formatDate(new Date(), 'long')}</span>
            <span className="opacity-30">•</span>
            Session:{' '}
            <Badge variant="blue">{dashboard?.session_id || todayStats?.session?.name || 'Current'}</Badge>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <UIButton
            variant="primary"
            icon={PlusOutlined}
            onClick={() => navigate(ROUTES.ACCOUNTANT_COLLECTION)}
          >
            Collect Fee
          </UIButton>
          <UIButton
            variant="secondary"
            onClick={() => refresh().catch(() => {})}
          >
            <RedoOutlined className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </UIButton>
        </div>
      </div>

      {/* Stats Grid */}
      <Row gutter={[16, 16]}>
        {/* Today's Collection */}
        <Col xs={24} sm={12} xl={6}>
          <div
            className="rounded-2xl border shadow-sm p-5 h-full"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderLeft: '3px solid var(--color-brand)' }}
          >
            {isLoading && !todayStats ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : (
              <>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                    Today's Collection
                  </p>
                  <Avatar size="small" icon={<WalletOutlined />} style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-brand)' }} />
                </div>
                <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {formatCurrency(todayStats?.today?.total_amount || 0)}
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  {todayStats?.today?.transaction_count || 0} transaction(s) today
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <Badge variant={collectionDirection ? 'green' : 'red'} dot={false}>
                    {collectionDirection ? <ArrowUpOutlined /> : <ArrowDownOutlined />}{' '}
                    {formatCurrency(Math.abs(collectionDelta))}
                  </Badge>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>vs yesterday</span>
                </div>
              </>
            )}
          </div>
        </Col>

        {/* Pending Today */}
        <Col xs={24} sm={12} xl={6}>
          <div
            className="rounded-2xl border shadow-sm p-5 h-full"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderLeft: '3px solid var(--color-danger)' }}
          >
            {isLoading && !todayStats ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : (
              <>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                    Pending Today
                  </p>
                  <Avatar size="small" icon={<ClockCircleOutlined />} style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-danger)' }} />
                </div>
                <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {formatCurrency(todayStats?.pending_today?.amount || 0)}
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  {todayStats?.pending_today?.student_count || 0} student(s) with dues
                </p>
                <div className="mt-3">
                  <Badge variant="red">Action Required</Badge>
                </div>
              </>
            )}
          </div>
        </Col>

        {/* This Month */}
        <Col xs={24} sm={12} xl={6}>
          <div
            className="rounded-2xl border shadow-sm p-5 h-full"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderLeft: '3px solid var(--color-info)' }}
          >
            {isLoading && !todayStats ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : (
              <>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                    This Month
                  </p>
                  <Avatar size="small" icon={<CalendarOutlined />} style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-info)' }} />
                </div>
                <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {formatCurrency(todayStats?.month?.total_amount || 0)}
                </div>
                <div className="mt-1.5 text-xs flex justify-between" style={{ color: 'var(--color-text-muted)' }}>
                  <span>Target: {formatCurrency(todayStats?.month?.target_amount || 0)}</span>
                  <span style={{ color: 'var(--color-brand)' }}>{monthPercent}%</span>
                </div>
                <div className="mt-3">
                  <Progress
                    percent={monthPercent}
                    strokeColor="var(--color-brand)"
                    showInfo={false}
                    strokeWidth={6}
                    className="m-0"
                  />
                </div>
              </>
            )}
          </div>
        </Col>

        {/* Session Summary */}
        <Col xs={24} sm={12} xl={6}>
          <div
            className="rounded-2xl border shadow-sm p-5 h-full"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderLeft: '3px solid var(--color-success)' }}
          >
            {isLoading && !todayStats ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : (
              <>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                    Session Summary
                  </p>
                  <Avatar size="small" icon={<SafetyCertificateOutlined />} style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-success)' }} />
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <Progress
                    type="circle"
                    percent={Math.round(circularPct)}
                    strokeColor="var(--color-brand)"
                    width={56}
                    strokeWidth={10}
                    format={(p) => (
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {p}%
                      </span>
                    )}
                  />
                  <div className="text-xs flex-1 space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <div className="flex justify-between border-b pb-1" style={{ borderColor: 'var(--color-border)' }}>
                      <span>Collected:</span>
                      <span style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(todayStats?.session_overview?.total_collected || 0)}</span>
                    </div>
                    <div className="flex justify-between border-b py-1" style={{ borderColor: 'var(--color-border)' }}>
                      <span>Expected:</span>
                      <span style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(todayStats?.session_overview?.total_expected || 0)}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span>Pending:</span>
                      <span style={{ color: 'var(--color-danger)' }}>{formatCurrency(todayStats?.session_overview?.total_pending || 0)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </Col>
      </Row>

      {/* Lower Grid */}
      <Row gutter={[16, 16]}>
        {/* Recent Transactions */}
        <Col xs={24} xl={15}>
          <Card
            title="Recent Transactions"
            headerAction={
              isLoading ? (
                <span className="text-[10px] font-medium animate-pulse" style={{ color: 'var(--color-brand)' }}>
                  Updating…
                </span>
              ) : null
            }
            className="h-full"
          >
            {isLoading && !recentTransactions ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : !recentTransactions || recentTransactions.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No transactions recorded today" />
            ) : (
              <div className="-mx-5 -mb-5 overflow-x-auto">
                <Table
                  dataSource={recentTransactions}
                  columns={tableColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  onRow={(record) => ({
                    onClick: () => navigate(ROUTES.ACCOUNTANT_RECEIPT_DETAIL.replace(':id', record.id)),
                  })}
                  rowClassName="cursor-pointer transition-colors"
                />
              </div>
            )}
          </Card>
        </Col>

        {/* Sidebar Analytics */}
        <Col xs={24} xl={9}>
          <div className="flex flex-col gap-4 h-full">
            {/* Collection by Mode */}
            <Card title="Collection by Mode">
              {isLoading && !modeBreakdown ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : (
                <CollectionChart items={modeBreakdown} />
              )}
            </Card>

            {/* Weekly Trend */}
            <Card title="Weekly Collection Trend">
              {isLoading && !weekTrend ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : weekTrend.length === 0 ? (
                <div className="flex h-36 flex-col items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
                  <RiseOutlined style={{ fontSize: '24px', opacity: 0.3, marginBottom: 8 }} />
                  <span className="text-sm">No trend data yet</span>
                </div>
              ) : (
                <div className="relative h-40 w-full pt-4">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-full border-b" style={{ borderColor: 'var(--color-border)' }} />
                    ))}
                  </div>
                  {/* Bars */}
                  <div className="relative flex items-end gap-2 h-full z-10">
                    {weekTrend.map((item) => {
                      const barHeight = Math.max((Number(item.amount || 0) / weekMax) * 100, 4)
                      return (
                        <div key={item.collection_date} className="group relative flex-1 text-center h-full flex flex-col justify-end">
                          <div
                            className="absolute bottom-full left-1/2 mb-2 w-28 -translate-x-1/2 rounded-xl px-2 py-1.5 text-[10px] text-white opacity-0 shadow-sm transition-all group-hover:opacity-100 pointer-events-none z-30 border"
                            style={{ backgroundColor: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
                          >
                            <div className="font-semibold" style={{ color: 'var(--color-brand)' }}>{formatCurrency(item.amount)}</div>
                            <div className="opacity-60 text-[9px] mt-0.5">{formatDate(item.collection_date)}</div>
                          </div>
                          <div className="w-full flex items-end h-28 cursor-pointer" onClick={() => navigate(ROUTES.ACCOUNTANT_REPORTS)}>
                            <div
                              className="w-full rounded-t-lg transition-all duration-200 hover:opacity-80"
                              style={{ height: `${barHeight}%`, backgroundColor: 'var(--color-brand)' }}
                            />
                          </div>
                          <div className="mt-1.5 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                            {new Date(item.collection_date).toLocaleDateString(undefined, { weekday: 'short' })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </Card>

            {/* Action Required */}
            <Card title="Action Required">
              {isLoading && !pendingTasks ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : !pendingTasks || pendingTasks.length === 0 ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2">
                  <CheckCircleOutlined style={{ fontSize: 20, color: 'var(--color-success)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>All tasks completed!</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {(pendingTasks || []).map((task) => (
                    <div
                      key={task.key}
                      className="flex items-center justify-between gap-3 rounded-xl border p-3 transition-all duration-150 hover:translate-x-0.5"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-brand)' }} />
                        <div>
                          <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {task.count || 0} {task.label}
                          </div>
                          {task.amount && (
                            <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                              {formatCurrency(task.amount)}
                            </div>
                          )}
                        </div>
                      </div>
                      <UIButton variant="outline" size="xs" onClick={() => navigate(task.route)}>
                        Resolve
                      </UIButton>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default AccountantDashboard
