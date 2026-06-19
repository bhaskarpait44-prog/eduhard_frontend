import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Progress,
  Table,
  Button,
  ConfigProvider,
  Space,
  Avatar,
  Tag,
  Empty,
  Skeleton,
  theme as antdTheme
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
  CheckCircleOutlined
} from '@ant-design/icons'
import { ROUTES } from '@/constants/app'
import usePageTitle from '@/hooks/usePageTitle'
import useAccountantDashboard from '@/hooks/useAccountantDashboard'
import useUiStore from '@/store/uiStore'
import CollectionChart from '@/components/accountant/CollectionChart'
import { formatCurrency, formatDate, getInitials } from '@/utils/helpers'
import useAuthStore from '@/store/authStore'

const AccountantDashboard = () => {
  usePageTitle('Accountant Dashboard')
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { theme: storeTheme } = useUiStore()
  const { dashboard, todayStats, recentTransactions, pendingTasks, weekTrend, isLoading, refresh } = useAccountantDashboard()

  const isDark = storeTheme === 'dark' || (storeTheme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)

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
      render: (text) => <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{formatDate(text, 'short')}</span>
    },
    {
      title: 'Student',
      dataIndex: 'student_name',
      key: 'student_name',
      render: (text) => (
        <div className="flex items-center gap-2.5">
          <Avatar size="small" className="bg-cyan-100 text-cyan-700 font-bold dark:bg-cyan-950/40 dark:text-cyan-300">
            {getInitials(text)}
          </Avatar>
          <span className="font-extrabold text-gray-800 dark:text-gray-200 hover:text-cyan-500 transition-colors">{text}</span>
        </div>
      )
    },
    {
      title: 'Class',
      dataIndex: 'class_name',
      key: 'class_name',
      render: (text) => <Tag className="rounded-md border-0 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 font-bold text-[11px]">{text}</Tag>
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(val)}</span>
    },
    {
      title: 'Mode',
      dataIndex: 'payment_mode',
      key: 'payment_mode',
      render: (text) => {
        let color = 'default'
        const mode = text?.toLowerCase() || ''
        if (mode === 'cash') color = 'cyan'
        else if (mode === 'online' || mode === 'upi') color = 'blue'
        else if (mode === 'bank' || mode === 'cheque' || mode === 'card') color = 'green'
        return <Tag color={color} className="uppercase font-extrabold text-[10px] rounded-full px-2">{text}</Tag>
      }
    },
    {
      title: 'Receipt',
      dataIndex: 'receipt_no',
      key: 'receipt_no',
      render: (text) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 underline decoration-cyan-500/20 underline-offset-4 hover:text-cyan-700 transition-colors">
          <FileTextOutlined className="text-[10px]" />
          {text}
        </span>
      )
    }
  ]

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
        {/* Welcome Header */}
        <div 
          className="flex flex-wrap items-center justify-between gap-6 rounded-[32px] border p-6 shadow-sm relative overflow-hidden backdrop-blur-md" 
          style={{ 
            background: isDark 
              ? 'linear-gradient(135deg, rgba(76, 192, 212, 0.15) 0%, #1e1b4b 100%)'
              : 'linear-gradient(135deg, #e0f7fa 0%, #fffdf9 100%)', 
            borderColor: isDark ? '#4cc0d430' : '#b2ebf2'
          }}
        >
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-4 z-10">
            <Avatar 
              size={64} 
              className="shadow-md border-2 border-cyan-400 bg-gradient-to-tr from-cyan-400 to-cyan-600 text-white font-extrabold text-xl flex items-center justify-center"
            >
              {getInitials(user?.name || 'Accountant')}
            </Avatar>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">{greeting}</span>
              <h1 className="mt-0.5 text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{user?.name || 'Accountant'}</h1>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1.5">
                Today: <span className="text-gray-700 dark:text-gray-200">{formatDate(new Date(), 'long')}</span> 
                <span className="opacity-30">•</span> 
                Session: <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300 font-bold text-[10px]">{dashboard?.session_id || todayStats?.session?.name || 'Current'}</span>
              </p>
            </div>
          </div>
          <Space size="middle" className="z-10">
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined className="font-bold" />}
              onClick={() => navigate(ROUTES.ACCOUNTANT_COLLECTION)}
              className="rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center border-0"
              style={{ height: '48px', padding: '0 28px', background: 'linear-gradient(90deg, #4cc0d4 0%, #0891b2 100%)' }}
            >
              Collect Fee
            </Button>
            <Button
              size="large"
              icon={<RedoOutlined className={isLoading ? 'animate-spin' : ''} />}
              onClick={() => refresh().catch(() => {})}
              className="rounded-full font-bold border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 hover:text-cyan-500 hover:border-cyan-400"
              style={{ height: '48px', padding: '0 24px' }}
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* Stats Grid */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}>
            <div className="h-full">
              <Card className="rounded-[28px] shadow-sm hover:shadow-md transition-all border-gray-100 dark:border-gray-800 h-full" styles={{ body: { padding: '24px' } }}>
                {isLoading && !todayStats ? (
                  <Skeleton active paragraph={{ rows: 2 }} />
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 block mb-1">Today's Collection</span>
                        <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                          {formatCurrency(todayStats?.today?.total_amount || 0)}
                        </div>
                      </div>
                      <Avatar 
                        size="large" 
                        className="bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border-0"
                        icon={<WalletOutlined />}
                      />
                    </div>
                    <div className="text-xs font-semibold text-gray-500 mt-2">
                      {todayStats?.today?.transaction_count || 0} transaction(s) today
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        collectionDirection 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' 
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                      }`}>
                        {collectionDirection ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                        {formatCurrency(Math.abs(collectionDelta))}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 font-medium">vs yesterday</span>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <div className="h-full">
              <Card className="rounded-[28px] shadow-sm hover:shadow-md transition-all border-gray-100 dark:border-gray-800 h-full" styles={{ body: { padding: '24px' } }}>
                {isLoading && !todayStats ? (
                  <Skeleton active paragraph={{ rows: 2 }} />
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 block mb-1">Pending Today</span>
                        <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                          {formatCurrency(todayStats?.pending_today?.amount || 0)}
                        </div>
                      </div>
                      <Avatar 
                        size="large" 
                        className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border-0"
                        icon={<ClockCircleOutlined />}
                      />
                    </div>
                    <div className="text-xs font-semibold text-gray-500 mt-2">
                      {todayStats?.pending_today?.student_count || 0} student(s) with dues
                    </div>
                    <div className="mt-4">
                      <Tag color="red" className="rounded-full border-0 font-extrabold text-[10px] px-3 py-0.5">ACTION REQUIRED</Tag>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <div className="h-full">
              <Card className="rounded-[28px] shadow-sm hover:shadow-md transition-all border-gray-100 dark:border-gray-800 h-full" styles={{ body: { padding: '24px' } }}>
                {isLoading && !todayStats ? (
                  <Skeleton active paragraph={{ rows: 2 }} />
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 block mb-1">This Month</span>
                        <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                          {formatCurrency(todayStats?.month?.total_amount || 0)}
                        </div>
                      </div>
                      <Avatar 
                        size="large" 
                        className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border-0"
                        icon={<CalendarOutlined />}
                      />
                    </div>
                    <div className="mt-2 text-xs font-semibold text-gray-500 flex justify-between">
                      <span>Target: {formatCurrency(todayStats?.month?.target_amount || 0)}</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold">{monthPercent}%</span>
                    </div>
                    <div className="mt-3">
                      <Progress
                        percent={monthPercent}
                        strokeColor={{ '0%': '#4cc0d4', '100%': '#0891b2' }}
                        showInfo={false}
                        strokeWidth={8}
                        className="m-0"
                      />
                    </div>
                  </>
                )}
              </Card>
            </div>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <div className="h-full">
              <Card className="rounded-[28px] shadow-sm hover:shadow-md transition-all border-gray-100 dark:border-gray-800 h-full" styles={{ body: { padding: '24px' } }}>
                {isLoading && !todayStats ? (
                  <Skeleton active paragraph={{ rows: 2 }} />
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 block mb-1">Session Summary</span>
                      <Avatar 
                        size="small" 
                        className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border-0"
                        icon={<SafetyCertificateOutlined />}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-2 h-[72px]">
                      <Progress
                        type="circle"
                        percent={Math.round(circularPct)}
                        strokeColor={{ '0%': '#4cc0d4', '100%': '#10b981' }}
                        width={64}
                        strokeWidth={9}
                        format={(p) => <span className="text-xs font-black text-gray-800 dark:text-gray-100">{p}%</span>}
                      />
                      <div className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 font-semibold flex-1">
                        <div className="flex justify-between border-b border-gray-50 dark:border-gray-800/40 pb-1">
                          <span>Collected:</span> 
                          <span className="text-gray-800 dark:text-gray-200">{formatCurrency(todayStats?.session_overview?.total_collected || 0)}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 dark:border-gray-800/40 py-1">
                          <span>Expected:</span> 
                          <span className="text-gray-900 dark:text-white font-bold">{formatCurrency(todayStats?.session_overview?.total_expected || 0)}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span>Pending:</span> 
                          <span className="text-rose-600 dark:text-rose-400">{formatCurrency(todayStats?.session_overview?.total_pending || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </Col>
        </Row>

        {/* Lower Dashboard Grid */}
        <Row gutter={[16, 16]}>
          {/* Recent Transactions Table */}
          <Col xs={24} xl={15}>
            <div className="h-full">
              <Card 
                className="rounded-[28px] shadow-sm border-gray-100 dark:border-gray-800 h-full overflow-hidden"
                styles={{ header: { borderBottom: '1px solid rgba(0,0,0,0.06)' }, body: { padding: '0px' } }}
                title={
                  <div className="flex items-center justify-between py-1">
                    <span className="text-base font-black flex items-center gap-2 text-gray-900 dark:text-white tracking-tight">
                      <WalletOutlined className="text-cyan-500" />
                      Recent Transactions
                    </span>
                    {isLoading && <span className="text-[10px] font-black text-cyan-500 animate-pulse tracking-widest">UPDATING...</span>}
                  </div>
                }
              >
                {isLoading && !recentTransactions ? (
                  <div className="p-6"><Skeleton active paragraph={{ rows: 6 }} /></div>
                ) : !recentTransactions || recentTransactions.length === 0 ? (
                  <div className="py-12">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No transactions recorded today" />
                  </div>
                ) : (
                  <Table
                    dataSource={recentTransactions}
                    columns={tableColumns}
                    rowKey="id"
                    pagination={false}
                    size="middle"
                    onRow={(record) => ({
                      onClick: () => navigate(ROUTES.ACCOUNTANT_RECEIPT_DETAIL.replace(':id', record.id)),
                    })}
                    rowClassName="cursor-pointer hover:bg-cyan-50/20 dark:hover:bg-cyan-950/10 transition-colors"
                    className="premium-table"
                  />
                )}
              </Card>
            </div>
          </Col>

          {/* Sidebar Analytics */}
          <Col xs={24} xl={9}>
            <div className="flex flex-col gap-6 h-full">
              {/* Collection by Mode */}
              <div>
                <Card 
                  className="rounded-[28px] shadow-sm border-gray-100 dark:border-gray-800"
                  title={<span className="font-black text-gray-900 dark:text-white tracking-tight">Collection by Mode</span>}
                >
                  {isLoading && !modeBreakdown ? (
                    <Skeleton active paragraph={{ rows: 3 }} />
                  ) : (
                    <CollectionChart items={modeBreakdown} />
                  )}
                </Card>
              </div>

              {/* Weekly Trend */}
              <div>
                <Card 
                  className="rounded-[28px] shadow-sm border-gray-100 dark:border-gray-800"
                  title={<span className="font-black text-gray-900 dark:text-white tracking-tight">Weekly Collection Trend</span>}
                >
                  {isLoading && !weekTrend ? (
                    <Skeleton active paragraph={{ rows: 4 }} />
                  ) : weekTrend.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center text-sm text-gray-400">
                      <RiseOutlined style={{ fontSize: '28px', opacity: 0.2, marginBottom: '8px' }} />
                      No trend data yet
                    </div>
                  ) : (
                    <div className="relative h-48 w-full pt-6">
                      {/* Grid Lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-6">
                        <div className="w-full border-b border-gray-100 dark:border-gray-800/40" />
                        <div className="w-full border-b border-gray-100 dark:border-gray-800/40" />
                        <div className="w-full border-b border-gray-100 dark:border-gray-800/40" />
                        <div className="w-full border-b border-gray-100 dark:border-gray-800/40" />
                      </div>
                      
                      {/* Bars */}
                      <div className="relative flex items-end gap-3 h-full z-10">
                        {weekTrend.map((item) => {
                          const barHeight = Math.max((Number(item.amount || 0) / weekMax) * 100, 4)
                          return (
                            <div key={item.collection_date} className="group relative flex-1 text-center h-full flex flex-col justify-end">
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 mb-2 w-28 -translate-x-1/2 rounded-xl bg-gray-900/95 dark:bg-gray-950/95 px-2.5 py-2 text-[10px] text-white opacity-0 shadow-xl transition-all duration-200 group-hover:opacity-100 pointer-events-none z-30 translate-y-1 group-hover:translate-y-0 border border-gray-800">
                                <div className="font-extrabold text-cyan-400">{formatCurrency(item.amount)}</div>
                                <div className="opacity-60 text-[9px] mt-0.5">{formatDate(item.collection_date)}</div>
                              </div>
                              
                              <div className="w-full flex items-end h-32 cursor-pointer">
                                <div
                                  className="w-full rounded-t-xl transition-all duration-300 group-hover:brightness-110 shadow-sm"
                                  style={{
                                    height: `${barHeight}%`,
                                    background: 'linear-gradient(180deg, #4cc0d4 0%, #0891b2 100%)',
                                  }}
                                />
                              </div>
                              <div className="mt-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 truncate">
                                {new Date(item.collection_date).toLocaleDateString(undefined, { weekday: 'short' })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Action Required */}
              <div>
                <Card 
                  className="rounded-[28px] shadow-sm border-gray-100 dark:border-gray-800"
                  title={<span className="font-black text-gray-900 dark:text-white tracking-tight">Action Required</span>}
                >
                  {isLoading && !pendingTasks ? (
                    <Skeleton active paragraph={{ rows: 3 }} />
                  ) : !pendingTasks || pendingTasks.length === 0 ? (
                    <div className="py-6 flex flex-col items-center justify-center text-xs text-gray-400">
                      <CheckCircleOutlined className="text-emerald-500 text-lg mb-2" />
                      All tasks completed!
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {(pendingTasks || []).map((task) => (
                        <div 
                          key={task.key} 
                          className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 dark:border-gray-800/80 p-4 transition-all hover:border-cyan-200 hover:bg-cyan-50/10 dark:hover:bg-cyan-950/10 hover:translate-x-1 duration-200" 
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            <div>
                              <div className="text-xs font-bold text-gray-900 dark:text-white">
                                {task.count || 0} {task.label}
                              </div>
                              {task.amount ? (
                                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">
                                  {formatCurrency(task.amount)}
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => navigate(task.route)}
                            className="rounded-full font-bold text-[11px] px-3 border-0"
                            style={{ backgroundColor: '#4cc0d4', borderColor: '#4cc0d4' }}
                          >
                            Resolve
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  )
}

export default AccountantDashboard
