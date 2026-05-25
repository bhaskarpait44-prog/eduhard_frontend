import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, ArrowUpRight, ArrowDownRight, Plus, TrendingUp, Wallet } from 'lucide-react'
import { ROUTES } from '@/constants/app'
import usePageTitle from '@/hooks/usePageTitle'
import useAccountantDashboard from '@/hooks/useAccountantDashboard'
import CollectionChart from '@/components/accountant/CollectionChart'
import { formatCurrency, formatDate } from '@/utils/helpers'
import useAuthStore from '@/store/authStore'

const StatCard = ({ title, value, sub, children }) => (
  <div className="rounded-[28px] border p-5 transition-shadow hover:shadow-md" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>{title}</p>
    <p className="mt-3 text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
    {sub && <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{sub}</p>}
    {children}
  </div>
)

const AccountantDashboard = () => {
  usePageTitle('Accountant Dashboard')
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { dashboard, todayStats, recentTransactions, pendingTasks, weekTrend, isLoading, refresh } = useAccountantDashboard()

  const collectionDelta = Number(todayStats?.today?.difference_from_yesterday || 0)
  const collectionDirection = collectionDelta >= 0
  const modeBreakdown = todayStats?.today?.mode_breakdown || []
  const circularPct = Number(todayStats?.session_overview?.collection_percentage || dashboard?.summary?.collection_rate || 0)
  const progressAngle = `${Math.max(Math.min(circularPct, 100), 0) * 3.6}deg`
  const weekMax = Math.max(...weekTrend.map((item) => Number(item.amount || 0)), 1)

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[32px] border p-6 shadow-sm" 
        style={{ 
          background: 'linear-gradient(135deg, var(--color-accent-subtle) 0%, var(--color-bg) 100%)', 
          borderColor: 'var(--color-accent-muted)' 
        }}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--color-accent-emphasis)' }}>{greeting}</p>
          <h1 className="mt-2 text-3xl font-bold" style={{ color: 'var(--color-accent-heading)' }}>{user?.name || 'Accountant'}</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-accent-emphasis)' }}>
            Today: {formatDate(new Date(), 'long')} | Session: {dashboard?.session_id || todayStats?.session?.name || 'Current'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate(ROUTES.ACCOUNTANT_COLLECTION)}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-95"
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            <Plus size={18} />
            Collect Fee
          </button>
          <button
            type="button"
            onClick={() => refresh().catch(() => {})}
            className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-bold transition-all hover:bg-surface-raised active:scale-95"
            style={{ borderColor: 'var(--color-accent-muted)', color: 'var(--color-accent-emphasis)', backgroundColor: 'var(--color-surface)' }}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <StatCard
          title="Today's Collection"
          value={formatCurrency(todayStats?.today?.total_amount || 0)}
          sub={`${todayStats?.today?.transaction_count || 0} transaction(s)`}
        >
          <div className="mt-4 flex items-center gap-2 text-sm font-medium" style={{ color: collectionDirection ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {collectionDirection ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {formatCurrency(Math.abs(collectionDelta))} {collectionDirection ? 'more' : 'less'} than yesterday
          </div>
        </StatCard>

        <StatCard
          title="Pending Today"
          value={formatCurrency(todayStats?.pending_today?.amount || 0)}
          sub={`${todayStats?.pending_today?.student_count || 0} students with due today`}
        />

        <StatCard
          title="This Month"
          value={formatCurrency(todayStats?.month?.total_amount || 0)}
          sub={`Target ${formatCurrency(todayStats?.month?.target_amount || 0)}`}
        >
          <div className="mt-4 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-accent-subtle)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${todayStats?.month?.target_amount ? Math.min((Number(todayStats.month.total_amount || 0) / Number(todayStats.month.target_amount || 1)) * 100, 100) : 0}%`,
                backgroundColor: 'var(--color-brand)',
              }}
            />
          </div>
        </StatCard>

        <StatCard title="Session Summary" value={formatCurrency(todayStats?.session_overview?.total_pending || 0)} sub="Outstanding in session">
          <div className="mt-4 flex items-center gap-4">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full text-lg font-bold shadow-inner"
              style={{ background: `conic-gradient(var(--color-brand) 0 ${progressAngle}, var(--color-accent-subtle) ${progressAngle} 360deg)` }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full text-sm font-black shadow-sm" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-accent-emphasis)' }}>
                {circularPct.toFixed(0)}%
              </div>
            </div>
            <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Collected {formatCurrency(todayStats?.session_overview?.total_collected || 0)}
              <br />
              <span className="font-bold">Expected {formatCurrency(todayStats?.session_overview?.total_expected || 0)}</span>
            </div>
          </div>
        </StatCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <Wallet size={20} className="text-brand" />
              Recent Transactions
            </h2>
            {isLoading && <span className="text-xs font-semibold animate-pulse" style={{ color: 'var(--color-brand)' }}>UPDATING...</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Time', 'Student', 'Class', 'Amount', 'Mode', 'Receipt'].map((head) => (
                    <th key={head} className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((row) => (
                  <tr
                    key={row.id}
                    className="group cursor-pointer transition-colors hover:bg-brand/5"
                    onClick={() => navigate(ROUTES.ACCOUNTANT_RECEIPT_DETAIL.replace(':id', row.id))}
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <td className="px-3 py-4 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(row.payment_date)}</td>
                    <td className="px-3 py-4 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{row.student_name}</td>
                    <td className="px-3 py-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.class_name}</td>
                    <td className="px-3 py-4 text-sm font-black" style={{ color: 'var(--color-success)' }}>{formatCurrency(row.amount)}</td>
                    <td className="px-3 py-4">
                      <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-secondary)' }}>{row.payment_mode}</span>
                    </td>
                    <td className="px-3 py-4">
                      <span className="text-xs font-bold underline decoration-brand/20 decoration-2 underline-offset-4 group-hover:decoration-brand" style={{ color: 'var(--color-accent-emphasis)' }}>{row.receipt_no}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h2 className="mb-6 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Collection by Mode</h2>
            <CollectionChart items={modeBreakdown} />
          </div>

          <div className="rounded-[28px] border p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Weekly Collection Trend</h2>
            {weekTrend.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <TrendingUp size={24} className="mb-2 opacity-20" />
                No trend data yet
              </div>
            ) : (
              <div className="flex items-end gap-3 pt-6 h-48">
                {weekTrend.map((item) => (
                  <div key={item.collection_date} className="group relative flex-1 text-center">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 transition-opacity group-hover:opacity-100" style={{ color: 'var(--color-brand)' }}>
                      {formatCurrency(item.amount)}
                    </div>
                    <div className="mx-auto flex h-32 items-end cursor-help">
                      <div
                        className="w-full rounded-t-xl transition-all group-hover:opacity-80"
                        style={{
                          height: `${Math.max((Number(item.amount || 0) / weekMax) * 100, 4)}%`,
                          backgroundColor: 'var(--color-brand)',
                        }}
                      />
                    </div>
                    <div className="mt-2 text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(item.collection_date).toLocaleDateString(undefined, { weekday: 'short' })}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 mb-10 w-24 -translate-x-1/2 rounded-lg bg-gray-900 px-2 py-1.5 text-[10px] text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 pointer-events-none z-10">
                      <div className="font-bold">{formatCurrency(item.amount)}</div>
                      <div className="opacity-60">{formatDate(item.collection_date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h2 className="mb-5 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Action Required</h2>
            <div className="space-y-3">
              {(pendingTasks || []).map((task) => (
                <div key={task.key} className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors hover:border-brand/20 hover:bg-brand/5" style={{ borderColor: 'var(--color-border)' }}>
                  <div>
                    <div className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{task.count || 0} {task.label}</div>
                    {task.amount ? <div className="text-[11px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(task.amount)}</div> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(task.route)}
                    className="rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:shadow-md"
                    style={{ backgroundColor: 'var(--color-brand)' }}
                  >
                    Resolve
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountantDashboard
