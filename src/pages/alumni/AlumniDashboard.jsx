import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  GraduationCap,
  Heart,
  Calendar,
  ArrowRight,
  TrendingUp,
  Briefcase,
  RefreshCw,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

import { alumniApi } from '@/api'
import { ROUTES } from '@/constants/app'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import StatCard from '@/components/ui/StatCard'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

const AlumniDashboard = () => {
  usePageTitle('Alumni Dashboard')
  const navigate = useNavigate()
  const { toastError } = useToast()

  const [stats, setStats] = useState(null)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, eventsRes] = await Promise.all([
        alumniApi.getAlumniStats(),
        alumniApi.listAlumniEvents({ status: 'upcoming' })
      ])
      setStats(statsRes.data)
      setUpcomingEvents(eventsRes.data.slice(0, 3))
    } catch (err) {
      toastError('Failed to load alumni dashboard data')
      console.error(err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [toastError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchData()
  }

  const occupationData = stats?.byOccupation ? Object.entries(stats.byOccupation).map(([key, value]) => ({
    name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value
  })) : []

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b']

  const batchData = stats?.byBatchYear || []

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Alumni Overview</h1>
          <p className="text-sm text-text-secondary">
            Insights and engagement tracking for graduated and left students.
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
            icon={Users}
            onClick={() => navigate(ROUTES.ALUMNI_DIRECTORY)}
            size="sm"
          >
            Alumni Directory
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Alumni"
          value={stats?.total || 0}
          icon={Users}
          color="var(--color-brand)"
        />
        <StatCard
          label="Profiles Filled"
          value={stats?.withProfile || 0}
          sub={`${Math.round((stats?.withProfile / (stats?.total || 1)) * 100)}% coverage`}
          icon={Briefcase}
          color="#3b82f6"
        />
        <StatCard
          label="Mentor Volunteers"
          value={stats?.mentorVolunteers || 0}
          icon={Heart}
          color="#f43f5e"
        />
        <StatCard
          label="Upcoming Events"
          value={stats?.upcomingEvents || 0}
          icon={Calendar}
          color="#8b5cf6"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupation Breakdown */}
        <div className="bg-surface border border-border-base rounded-2xl p-5">
          <h3 className="font-bold text-text-primary mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-brand" />
            Occupation Distribution
          </h3>
          <div className="h-[300px]">
            {occupationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {occupationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border-base)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted italic">
                No occupation data available.
              </div>
            )}
          </div>
        </div>

        {/* Batch Trends */}
        <div className="bg-surface border border-border-base rounded-2xl p-5">
          <h3 className="font-bold text-text-primary mb-6 flex items-center gap-2">
            <GraduationCap size={18} className="text-brand" />
            Graduation Trend (By Year)
          </h3>
          <div className="h-[300px]">
            {batchData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...batchData].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-base)" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'var(--color-surface-raised)' }}
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border-base)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted italic">
                No batch trend data available.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="lg:col-span-2 bg-surface border border-border-base rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-primary">Upcoming Alumni Events</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-brand font-semibold text-xs"
              onClick={() => navigate(ROUTES.ALUMNI_EVENTS)}
            >
              Manage Events <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>

          <div className="space-y-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border-base hover:bg-surface-raised transition-colors group"
                >
                  <div className="h-12 w-12 rounded-lg bg-brand/10 flex flex-col items-center justify-center text-brand shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {new Date(event.event_date).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {new Date(event.event_date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-text-primary truncate">{event.title}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {event.event_time || 'TBD'}
                      </span>
                      {event.venue && (
                        <span className="truncate">@ {event.venue}</span>
                      )}
                    </div>
                  </div>
                  <Badge variant="blue" className="capitalize">{event.type}</Badge>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-text-muted italic border border-dashed border-border-base rounded-xl">
                No upcoming events scheduled.
              </div>
            )}
          </div>
        </div>

        {/* Engagement Quick Links */}
        <div className="bg-surface border border-border-base rounded-2xl p-5">
          <h3 className="font-bold text-text-primary mb-4">Quick Links</h3>
          <div className="grid grid-cols-1 gap-2">
            <QuickLink
              icon={Users}
              label="Alumni Directory"
              sub="Search & filter alumni"
              onClick={() => navigate(ROUTES.ALUMNI_DIRECTORY)}
            />
            <QuickLink
              icon={Calendar}
              label="Alumni Events"
              sub="Plan and manage events"
              onClick={() => navigate(ROUTES.ALUMNI_EVENTS)}
            />
            <QuickLink
              icon={Heart}
              label="Mentors & Volunteers"
              sub="View volunteer list"
              onClick={() => navigate(ROUTES.ALUMNI_DIRECTORY + '?is_mentor=true')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const QuickLink = ({ icon: Icon, label, sub, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-surface-raised border border-transparent hover:border-border-base transition-all group text-left"
  >
    <div className="h-9 w-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-sm font-bold text-text-primary group-hover:text-brand transition-colors">{label}</p>
      <p className="text-[11px] text-text-secondary">{sub}</p>
    </div>
    <ArrowRight size={14} className="ml-auto text-text-muted group-hover:translate-x-1 transition-transform" />
  </button>
)

export default AlumniDashboard
