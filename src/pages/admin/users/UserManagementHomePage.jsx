import { 
  ArrowRight, ShieldCheck, GraduationCap, IndianRupee, 
  BookOpen, Users, Phone, Heart, UserPlus, FileText, Activity
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import * as api from '@/api/userManagementApi'
import { ROUTES } from '@/constants/app'
import usePageTitle from '@/hooks/usePageTitle'

const USER_GROUPS = [
  {
    role: 'admin',
    title: 'Administrators',
    description: 'System-wide access and management',
    accent: '#1d4ed8',
    icon: ShieldCheck,
  },
  {
    role: 'teacher',
    title: 'Teachers',
    description: 'Academic and classroom management',
    accent: '#15803d',
    icon: GraduationCap,
  },
  {
    role: 'accountant',
    title: 'Accountants',
    description: 'Financial records and fee management',
    accent: '#c2410c',
    icon: IndianRupee,
  },
  {
    role: 'librarian',
    title: 'Librarians',
    description: 'Library and resource management',
    accent: '#7c3aed',
    icon: BookOpen,
  },
  {
    role: 'staff',
    title: 'Support Staff',
    description: 'Administrative and operational tasks',
    accent: '#0369a1',
    icon: Users,
  },
  {
    role: 'receptionist',
    title: 'Receptionists',
    description: 'Front desk and inquiry handling',
    accent: '#be185d',
    icon: Phone,
  },
  {
    role: 'parent',
    title: 'Parents',
    description: 'Parental access for ward tracking',
    accent: '#b45309',
    icon: Heart,
  },
]

const StatCard = ({ label, value, icon: Icon, color, onClick }) => (
  <div 
    onClick={onClick}
    className={`p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center gap-4 transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5' : ''}`}
  >
    <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}10`, color }}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
)

const UserManagementHomePage = () => {
  usePageTitle('User Management')
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: 0, active: 0, admin: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.getUsers({ perPage: 1 })
        if (response.data) {
          const { total } = response.data.pagination || { total: 0 }
          const { admin = 0 } = response.data.roleCounts || {}
          const { active = 0 } = response.data.statusCounts || {}
          
          setStats({
            total,
            admin,
            active,
          })
        }
      } catch (e) {
        console.error('Failed to fetch user stats', e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  const openRoleManager = (role) => {
    navigate(`${ROUTES.USER_MANAGE}?role=${role}`)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Configure system access and manage user roles across the organization.</p>
        </div>
        <button
          onClick={() => navigate(ROUTES.USER_NEW)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <UserPlus size={18} />
          Create New User
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Users" 
          value={isLoading ? '...' : stats.total} 
          icon={Users} 
          color="#4f46e5" 
          onClick={() => navigate(ROUTES.USER_MANAGE)}
        />
        <StatCard 
          label="Active Accounts" 
          value={isLoading ? '...' : stats.active} 
          icon={Activity} 
          color="#10b981" 
          onClick={() => navigate(`${ROUTES.USER_MANAGE}?status=active`)}
        />
        <StatCard 
          label="Administrators" 
          value={isLoading ? '...' : stats.admin} 
          icon={ShieldCheck} 
          color="#3b82f6" 
          onClick={() => navigate(`${ROUTES.USER_MANAGE}?role=admin`)}
        />
        <StatCard label="Roles" value={USER_GROUPS.length} icon={FileText} color="#f59e0b" />
      </div>

      {/* User Roles Management Section */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <h2 className="font-bold text-gray-900">Access Groups</h2>
          <span className="text-xs font-medium px-2.5 py-1 bg-white rounded-full text-gray-500 border border-gray-100">
            {USER_GROUPS.length} Roles Defined
          </span>
        </div>
        
        <div className="divide-y divide-gray-50">
          {USER_GROUPS.map((group) => {
            const Icon = group.icon
            return (
              <div 
                key={group.role}
                onClick={() => openRoleManager(group.role)}
                className="group flex items-center justify-between p-5 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${group.accent}10`, color: group.accent }}
                  >
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{group.title}</h3>
                    <p className="text-sm text-gray-500">{group.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Status</span>
                    <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Active
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-[24px] bg-indigo-50 border border-indigo-100">
          <h3 className="font-bold text-indigo-900 mb-2">Bulk Import</h3>
          <p className="text-sm text-indigo-700/80 mb-4">Onboard multiple users at once using our Excel template. Perfect for beginning a new session.</p>
          <button 
            onClick={() => navigate(ROUTES.USER_IMPORT)}
            className="text-sm font-bold text-indigo-700 flex items-center gap-1.5 hover:gap-2 transition-all"
          >
            Import Tool <ArrowRight size={16} />
          </button>
        </div>
        <div className="p-6 rounded-[24px] bg-emerald-50 border border-emerald-100">
          <h3 className="font-bold text-emerald-900 mb-2">Permissions & Security</h3>
          <p className="text-sm text-emerald-700/80 mb-4">Audit user activities, reset passwords, and manage global permission templates.</p>
          <button 
            onClick={() => navigate(ROUTES.USER_PERMISSION_TEMPLATES)}
            className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 hover:gap-2 transition-all"
          >
            Permission Templates <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserManagementHomePage
