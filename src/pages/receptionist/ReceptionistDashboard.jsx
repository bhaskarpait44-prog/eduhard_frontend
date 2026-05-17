import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, UserCheck, UserMinus, Plus, Bell, ArrowRight } from 'lucide-react'
import { getTodayStats, listVisitors, logVisitor } from '@/api/visitorApi'
import { getReceptionistNotices } from '@/api/noticesApi'
import StatCard from '@/components/ui/StatCard'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { cn } from '@/utils/helpers'
import useToast from '@/hooks/useToast'
import { ROUTES } from '@/constants/app'

const ReceptionistDashboard = () => {
  const [stats, setStats] = useState({ total_today: 0, checked_out: 0, still_inside: 0 })
  const [recentVisitors, setRecentVisitors] = useState([])
  const [unreadNotices, setUnreadNotices] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    visitor_name: '',
    visitor_phone: '',
    purpose: '',
    whom_to_meet: ''
  })

  const { toast } = useToast()

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsRes, visitorsRes, noticesRes] = await Promise.all([
        getTodayStats(),
        listVisitors({ limit: 5 }),
        getReceptionistNotices()
      ])
      setStats(statsRes.data)
      setRecentVisitors(visitorsRes.data.visitors.slice(0, 5))
      setUnreadNotices(noticesRes.data.unread_count)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleLogVisitor = async (e) => {
    e.preventDefault()
    if (!formData.visitor_name) return toast.error('Visitor name is required')

    try {
      setIsSubmitting(true)
      await logVisitor(formData)
      toast.success('Visitor logged successfully')
      setIsModalOpen(false)
      setFormData({ visitor_name: '', visitor_phone: '', purpose: '', whom_to_meet: '' })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log visitor')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Receptionist Dashboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <Button 
          variant="brand" 
          icon={Plus} 
          onClick={() => setIsModalOpen(true)}
        >
          Log New Visitor
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Visitors"
          value={stats.total_today}
          icon={Users}
          color="var(--color-brand)"
        />
        <StatCard
          label="Still Inside"
          value={stats.still_inside}
          icon={UserCheck}
          color="#10b981" // Green
        />
        <StatCard
          label="Checked Out"
          value={stats.checked_out}
          icon={UserMinus}
          color="#64748b" // Slate
        />
        <Link to={ROUTES.RECEPTIONIST_NOTICES} className="block group">
          <StatCard
            label="Unread Notices"
            value={unreadNotices}
            icon={Bell}
            color={unreadNotices > 0 ? '#3b82f6' : '#64748b'}
            className={cn(
              "group-hover:translate-y-[-2px] transition-all cursor-pointer",
              unreadNotices > 0 && "ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10"
            )}
            sub={unreadNotices > 0 ? "New updates available" : "No new updates"}
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Visitors Table */}
        <div className="lg:col-span-2 rounded-2xl p-5" 
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Recent Visitors</h3>
            <Link to={ROUTES.RECEPTIONIST_VISITORS} className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--color-brand)' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <th className="pb-3 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Visitor</th>
                  <th className="pb-3 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Purpose</th>
                  <th className="pb-3 font-semibold" style={{ color: 'var(--color-text-muted)' }}>To Meet</th>
                  <th className="pb-3 font-semibold text-right" style={{ color: 'var(--color-text-muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {recentVisitors.length > 0 ? (
                  recentVisitors.map((v) => (
                    <tr key={v.id} className="group">
                      <td className="py-4">
                        <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{v.visitor_name}</div>
                        <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{v.visitor_phone || 'No phone'}</div>
                      </td>
                      <td className="py-4" style={{ color: 'var(--color-text-secondary)' }}>{v.purpose}</td>
                      <td className="py-4" style={{ color: 'var(--color-text-secondary)' }}>{v.whom_to_meet}</td>
                      <td className="py-4 text-right">
                        <Badge variant={v.check_out_time ? 'neutral' : 'success'}>
                          {v.check_out_time ? 'Left' : 'Inside'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                      {loading ? 'Loading recent visitors...' : 'No visitors logged today yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links / Tips */}
        <div className="space-y-4">
           <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
             <h3 className="font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>Quick Student Lookup</h3>
             <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
               Need to find a student or their parent's contact?
             </p>
             <Link to={ROUTES.RECEPTIONIST_STUDENTS}>
               <Button variant="ghost" className="w-full justify-start gap-2" icon={ArrowRight}>
                 Search Students
               </Button>
             </Link>
           </div>

           <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
             <h3 className="font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>Daily Checklist</h3>
             <ul className="text-xs space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
               <li className="flex gap-2">
                 <input type="checkbox" className="mt-0.5" />
                 <span>Verify all guests have checked out before EOD</span>
               </li>
               <li className="flex gap-2">
                 <input type="checkbox" className="mt-0.5" />
                 <span>Check new school-wide notices</span>
               </li>
               <li className="flex gap-2">
                 <input type="checkbox" className="mt-0.5" />
                 <span>Keep front desk area clean & organized</span>
               </li>
             </ul>
           </div>
        </div>
      </div>

      {/* Log Visitor Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log New Visitor"
        footer={(
          <div className="flex gap-2 justify-end w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="brand" onClick={handleLogVisitor} loading={isSubmitting}>Log Visitor</Button>
          </div>
        )}
      >
        <form onSubmit={handleLogVisitor} className="space-y-4">
          <Input 
            label="Visitor Name*" 
            placeholder="Full Name"
            value={formData.visitor_name}
            onChange={(e) => setFormData({...formData, visitor_name: e.target.value})}
            required
          />
          <Input 
            label="Phone Number" 
            placeholder="Mobile number"
            value={formData.visitor_phone}
            onChange={(e) => setFormData({...formData, visitor_phone: e.target.value})}
          />
          <Input 
            label="Purpose of Visit" 
            placeholder="e.g. Admission inquiry"
            value={formData.purpose}
            onChange={(e) => setFormData({...formData, purpose: e.target.value})}
          />
          <Input 
            label="Whom to Meet" 
            placeholder="e.g. Principal / Accountant"
            value={formData.whom_to_meet}
            onChange={(e) => setFormData({...formData, whom_to_meet: e.target.value})}
          />
        </form>
      </Modal>
    </div>
  )
}

export default ReceptionistDashboard
