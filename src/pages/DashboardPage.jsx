import { useEffect, useCallback, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Users, CalendarCheck, IndianRupee, ClipboardList,
  Plus, RefreshCw, ClipboardCheck,
  UserPlus, Wallet, LogOut, GraduationCap,
  ArrowRight, Search, Clock, ArrowRightLeft
} from 'lucide-react'

import useDashboardStore from '@/store/dashboardStore'
import useSessionStore   from '@/store/sessionStore'
import useAuthStore      from '@/store/authStore'
import usePageTitle      from '@/hooks/usePageTitle'
import useToast          from '@/hooks/useToast'
import { ROUTES }        from '@/constants/app'
import { formatCurrency, formatPercent, getInitials, cn } from '@/utils/helpers'
import StatCard from '@/components/ui/StatCard'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

const AUTO_REFRESH_MS = 10 * 60 * 1000 // 10 minutes

const DashboardPage = () => {
  usePageTitle('Admin Dashboard')
  const navigate = useNavigate()
  const { toastInfo } = useToast()
  
  const { user } = useAuthStore()
  const { currentSession, sessions, fetchSessions, isLoading: sessionLoading } = useSessionStore()
  const {
    stats, recentAdmissions, leavingStats,
    isLoading, fetchAll, clearDashboard, error
  } = useDashboardStore()

  const [isRefreshing, setIsRefreshing] = useState(false)

  // Ensure sessions are loaded to distinguish between "No Sessions" and "No Active Session"
  useEffect(() => {
    if (sessions.length === 0) fetchSessions().catch(console.error)
  }, [sessions.length, fetchSessions])

  const loadData = useCallback(async () => {
    try {
      await fetchAll(currentSession?.id)
    } catch (err) {
      console.error('Refresh error:', err)
    }
  }, [currentSession?.id, fetchAll])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        fetchAll(currentSession?.id),
        fetchSessions()
      ])
      toastInfo('📊 Dashboard data updated')
    } catch (err) {
      console.error('Refresh error:', err)
    } finally {
      setIsRefreshing(false)
    }
  }, [currentSession?.id, fetchAll, fetchSessions, toastInfo])

  useEffect(() => {
    loadData()
    const timer = setInterval(loadData, AUTO_REFRESH_MS)
    return () => {
      clearInterval(timer)
      clearDashboard()
    }
  }, [loadData, clearDashboard])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Clock size={32} />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Something went wrong</h2>
        <p className="text-text-secondary max-w-md mb-6">{error}</p>
        <Button variant="primary" onClick={handleRefresh}>Retry Loading</Button>
      </div>
    )
  }

  const hasSessions = sessions.length > 0
  const noStats = !stats && !isLoading && !sessionLoading
  const showWarning = noStats || !currentSession

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {showWarning && !isLoading && !sessionLoading && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-5 rounded-2xl text-sm font-medium flex items-center gap-4 shadow-sm">
          <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
            <Clock size={20} />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold">
              {!hasSessions ? "No academic sessions found." : "Academic session not activated."}
            </p>
            <p className="text-sm opacity-90 mt-0.5">
              {!hasSessions 
                ? "You need to create your first academic session to start managing the school." 
                : "You have sessions created, but none are marked as 'Current'. Activate a session to view live dashboard statistics."}
            </p>
          </div>
          <div className="flex items-center gap-3">
             <Button 
                variant="primary" 
                size="sm"
                onClick={() => navigate(hasSessions ? ROUTES.SESSIONS : ROUTES.SESSION_NEW)}
             >
                {hasSessions ? "Go to Sessions" : "Create Session"}
             </Button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {greeting()}, <span className="text-brand">{user?.name?.split(' ')[0]}!</span>
          </h1>
          <p className="text-sm text-text-secondary">
            Manage <span className="font-semibold text-text-primary">{currentSession?.name || 'Academic Session'}</span> operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            icon={RefreshCw} 
            loading={isRefreshing}
            onClick={handleRefresh}
            size="sm"
          >
            Refresh
          </Button>
          <Button 
            variant="primary" 
            icon={Plus} 
            onClick={() => navigate(ROUTES.STUDENT_NEW)}
            size="sm"
          >
            New Admission
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={stats?.totalStudents || 0}
          icon={Users}
          color="var(--color-brand)"
        />
        <StatCard
          label="Today's Attendance"
          value={formatPercent(stats?.attendanceToday?.percentage || 0)}
          sub={`${stats?.attendanceToday?.present || 0} students present`}
          icon={CalendarCheck}
          color="#10b981"
        />
        <StatCard
          label="Revenue (Month)"
          value={formatCurrency(stats?.feeCollection?.collected || 0)}
          sub={`${formatPercent(stats?.feeCollection?.percentage || 0)} of session target`}
          icon={IndianRupee}
          color="#f59e0b"
        />
        <StatCard
          label="Upcoming Exams"
          value={stats?.upcomingExams?.count || 0}
          sub={stats?.upcomingExams?.next ? `Next: ${stats.upcomingExams.next}` : 'None scheduled'}
          icon={ClipboardList}
          color="#8b5cf6"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Attendance Summary */}
        <div className="lg:col-span-2 bg-surface border border-border-base rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-primary">Today's Attendance Summary</h3>
            <Link to={ROUTES.ATTENDANCE} className="text-xs font-semibold flex items-center gap-1 text-brand">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border-base">
                  <th className="pb-3 font-semibold text-text-muted">Class</th>
                  <th className="pb-3 font-semibold text-text-muted">Total</th>
                  <th className="pb-3 font-semibold text-text-muted">Present</th>
                  <th className="pb-3 font-semibold text-text-muted">Absent</th>
                  <th className="pb-3 font-semibold text-right text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base">
                {stats?.classAttendance?.length > 0 ? (
                  stats.classAttendance.map((cls) => (
                    <tr key={cls.id} className="group hover:bg-surface-raised transition-colors">
                      <td className="py-3 font-medium text-text-primary">{cls.class_name}</td>
                      <td className="py-3 text-text-secondary">{cls.total}</td>
                      <td className="py-3 text-emerald-600 font-bold">{cls.present}</td>
                      <td className="py-3 text-red-600 font-bold">{cls.absent}</td>
                      <td className="py-3 text-right">
                        <Badge variant={cls.total_marked > 0 ? 'green' : 'grey'}>
                          {cls.total_marked > 0 ? 'Marked' : 'Pending'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-text-muted italic">
                      {isLoading ? 'Loading attendance...' : 'No attendance data for today.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-4">
          {/* Leaving Trends */}
          <div className="bg-surface border border-border-base rounded-2xl p-5">
            <h3 className="font-bold text-text-primary mb-4">Leaving Trends</h3>
            <div className="space-y-3">
              <TrendItem icon={LogOut} label="Left this Session" value={leavingStats?.left_this_session || 0} color="red" />
              <TrendItem icon={GraduationCap} label="Graduated" value={leavingStats?.graduated_this_session || 0} color="indigo" />
              <TrendItem icon={ArrowRightLeft} label="Re-admissions" value={leavingStats?.readmissions_this_session || 0} color="emerald" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-surface border border-border-base rounded-2xl p-5">
            <h3 className="font-bold text-text-primary mb-3">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              <ShortcutButton icon={UserPlus} label="Student Admission" onClick={() => navigate(ROUTES.STUDENT_NEW)} />
              <ShortcutButton icon={ClipboardCheck} label="Daily Attendance" onClick={() => navigate(ROUTES.ATTENDANCE)} />
              <ShortcutButton icon={Wallet} label="Collect Fees" onClick={() => navigate(ROUTES.FEES)} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Admissions */}
        <div className="lg:col-span-2 bg-surface border border-border-base rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-primary">Recent Admissions</h3>
            <Link to={ROUTES.STUDENTS} className="text-xs font-semibold flex items-center gap-1 text-brand">
              View Registry <ArrowRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border-base">
                  <th className="pb-3 font-semibold text-text-muted">Student</th>
                  <th className="pb-3 font-semibold text-text-muted">Admission No</th>
                  <th className="pb-3 font-semibold text-text-muted">Class</th>
                  <th className="pb-3 font-semibold text-right text-text-muted">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base">
                {recentAdmissions.length > 0 ? (
                  recentAdmissions.slice(0, 5).map((student) => (
                    <tr key={student.id} className="group hover:bg-surface-raised transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-surface-raised flex items-center justify-center text-text-muted font-bold text-[9px] overflow-hidden">
                             {student.photo_path ? (
                               <img src={student.photo_path} alt="" className="h-full w-full object-cover" />
                             ) : getInitials(`${student.first_name} ${student.last_name}`)}
                          </div>
                          <div className="font-medium text-text-primary truncate max-w-[120px]">{student.first_name} {student.last_name}</div>
                        </div>
                      </td>
                      <td className="py-3 text-text-secondary">{student.admission_no || 'N/A'}</td>
                      <td className="py-3">
                        <Badge variant="grey">{student.class_name || 'Unassigned'}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        <button 
                          onClick={() => navigate(`${ROUTES.STUDENTS}/${student.id}`)}
                          className="text-brand hover:underline text-xs font-semibold"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-text-muted italic">
                      {isLoading ? 'Loading admissions...' : 'No recent admissions found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Checklist */}
        <div className="bg-surface border border-border-base rounded-2xl p-5">
           <h3 className="font-bold text-text-primary mb-3">Daily Checklist</h3>
           <ul className="text-xs space-y-3 text-text-secondary">
             <CheckItem label="Verify today's student attendance" />
             <CheckItem label="Review pending fee collections" />
             <CheckItem label="Check system audit logs for updates" />
             <CheckItem label="Verify and publish upcoming results" />
           </ul>
        </div>
      </div>
    </div>
  )
}

const TrendItem = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    red: "bg-red-50 text-red-600 border-red-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  }
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-raised">
      <div className="flex items-center gap-3">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border", colorClasses[color])}>
          <Icon size={16} />
        </div>
        <span className="text-xs font-medium text-text-secondary">{label}</span>
      </div>
      <span className="font-bold text-text-primary">{value}</span>
    </div>
  )
}

const CheckItem = ({ label }) => (
  <li className="flex gap-2">
    <input type="checkbox" className="mt-0.5 rounded border-border-base text-brand focus:ring-brand" />
    <span>{label}</span>
  </li>
)

const ShortcutButton = ({ icon: Icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-surface-raised border border-transparent hover:border-border-base transition-all group"
  >
    <div className="h-8 w-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
      <Icon size={16} />
    </div>
    <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary">{label}</span>
    <ArrowRight size={14} className="ml-auto text-text-muted group-hover:translate-x-1 transition-transform" />
  </button>
)

export default DashboardPage
