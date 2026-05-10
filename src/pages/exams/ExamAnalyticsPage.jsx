// src/pages/exams/ExamAnalyticsPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { ArrowLeft, TrendingUp, Users, Award, BookOpen, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import useToast from '@/hooks/useToast'
import api from '@/api/axios' // Directly use axios for simplicity if store doesn't have it

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899']

const ExamAnalyticsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toastError } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get(`/analytics/exams/${id}`)
        setData(res.data.data)
      } catch (err) {
        toastError('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [id])

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-brand)] border-t-transparent" />
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">Analyzing exam data...</p>
      </div>
    )
  }

  if (!data || !data.exam) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <EmptyState
          icon={AlertCircle}
          title="Analytics Unavailable"
          description="We couldn't find the analytics for this exam. It might have been deleted or doesn't exist."
          action={<Button onClick={() => navigate(-1)}>Go Back</Button>}
        />
      </div>
    )
  }

  const { exam, subject_stats = [], grade_distribution = [], top_performers = [] } = data

  const passFailData = subject_stats.map(s => ({
    name: s.subject_name,
    Pass: Number(s.pass_count || 0),
    Fail: Number(s.fail_count || 0),
    Absent: Number(s.absent_count || 0)
  }))

  const marksData = subject_stats.map(s => ({
    name: s.subject_name,
    Average: parseFloat(s.average_marks || 0),
    Highest: parseFloat(s.highest_marks || 0),
    Lowest: parseFloat(s.lowest_marks || 0)
  }))

  const pieData = grade_distribution.map(g => ({
    name: `Grade ${g.grade}`,
    value: parseInt(g.count)
  }))

  const totalStudents = subject_stats.length > 0 ? Number(subject_stats[0].total_entries || 0) : 0
  const overallAvg = marksData.length > 0 
    ? (marksData.reduce((acc, curr) => acc + curr.Average, 0) / marksData.length).toFixed(1) 
    : '0.0'
  
  const totalPass = passFailData.reduce((acc, curr) => acc + curr.Pass, 0)
  const totalAttempted = passFailData.reduce((acc, curr) => acc + curr.Pass + curr.Fail, 0)
  const passPercentage = totalAttempted > 0 ? ((totalPass / totalAttempted) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)} />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{exam.name} Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{exam.class_name} • Academic Performance Insights</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={totalStudents} color="blue" />
        <StatCard icon={TrendingUp} label="Class Average" value={`${overallAvg}%`} color="green" />
        <StatCard icon={Award} label="Top Performer" value={top_performers[0]?.student_name || 'N/A'} color="purple" subValue={top_performers[0] ? `${top_performers[0].percentage}%` : ''} />
        <StatCard icon={AlertCircle} label="Pass Rate" value={`${passPercentage}%`} color="yellow" />
      </div>

      {subject_stats.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Marks Data Yet"
          description="Analytics will become available once subject teachers start entering marks for this exam."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pass/Fail Distribution */}
          <Card title="Subject-wise Result Distribution">
            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={passFailData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" fontSize={11} fontWeight={600} tick={{ fill: 'var(--color-text-secondary)' }} axisLine={{ stroke: 'var(--color-border)' }} />
                  <YAxis fontSize={11} fontWeight={600} tick={{ fill: 'var(--color-text-secondary)' }} axisLine={{ stroke: 'var(--color-border)' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: 'var(--color-surface)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                  <Bar dataKey="Pass" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="Fail" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="Absent" fill="#94a3b8" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Grade Distribution */}
          <Card title="Grade Distribution Overview">
            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: 'var(--color-surface)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Subject Performance Analysis */}
          <Card title="Subject Performance Range" className="lg:col-span-2">
            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={marksData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" fontSize={11} fontWeight={600} tick={{ fill: 'var(--color-text-secondary)' }} axisLine={{ stroke: 'var(--color-border)' }} />
                  <YAxis domain={[0, 100]} fontSize={11} fontWeight={600} tick={{ fill: 'var(--color-text-secondary)' }} axisLine={{ stroke: 'var(--color-border)' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: 'var(--color-surface)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="Highest" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Average" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Lowest" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Top Performers Table */}
          <Card title="Top Performing Students" className="lg:col-span-2">
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-extrabold text-[var(--color-text-muted)] uppercase tracking-wider border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <th className="px-4 py-4">Rank</th>
                    <th className="px-4 py-4">Student</th>
                    <th className="px-4 py-4">Roll No</th>
                    <th className="px-4 py-4 text-right">Score</th>
                    <th className="px-4 py-4 text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {top_performers.map((p, i) => (
                    <tr key={i} className="border-b transition-colors hover:bg-[var(--color-surface-raised)]" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="px-4 py-4">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)] font-bold text-xs">
                          #{i + 1}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-bold text-[var(--color-text-primary)]">{p.student_name}</td>
                      <td className="px-4 py-4 text-xs font-mono text-[var(--color-text-secondary)]">{p.roll_number}</td>
                      <td className="px-4 py-4 text-right font-medium text-[var(--color-text-primary)] text-sm">
                        {p.total_obtained} <span className="text-[var(--color-text-muted)] font-normal">/ {p.total_max}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-lg font-bold text-xs">
                          {p.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

const StatCard = ({ icon: Icon, label, value, color, subValue }) => {
  const colorMap = {
    blue:   { bg: 'rgba(59,130,246,0.1)',  text: 'text-blue-600',   border: 'border-blue-100' },
    green:  { bg: 'rgba(16,185,129,0.1)',  text: 'text-emerald-600', border: 'border-emerald-100' },
    purple: { bg: 'rgba(139,92,246,0.1)', text: 'text-purple-600', border: 'border-purple-100' },
    yellow: { bg: 'rgba(245,158,11,0.1)', text: 'text-amber-600',  border: 'border-amber-100' },
  }
  const styles = colorMap[color] || colorMap.blue

  return (
    <div className={`p-5 rounded-[24px] border ${styles.border} shadow-sm flex items-center gap-4`} style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className={`w-12 h-12 rounded-2xl ${styles.bg} ${styles.text} flex items-center justify-center flex-shrink-0`}>
        <Icon size={24} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold text-[var(--color-text-muted)] uppercase tracking-widest">{label}</p>
        <p className="text-xl font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
        {subValue && <p className="text-[10px] font-bold text-[var(--color-brand)] truncate">{subValue}</p>}
      </div>
    </div>
  )
}

export default ExamAnalyticsPage
