import { useState, useEffect } from 'react'
import { Search, Plus, LogOut, Calendar } from 'lucide-react'
import { listVisitors, logVisitor, checkoutVisitor } from '@/api/visitorApi'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import useToast from '@/hooks/useToast'
import { format } from 'date-fns'

const VisitorLog = () => {
  const [visitors, setVisitors] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all') // 'all' or 'inside'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    visitor_name: '',
    visitor_phone: '',
    purpose: '',
    whom_to_meet: ''
  })

  const { toast } = useToast()

  const fetchVisitors = async (pageNum = 1) => {
    try {
      setLoading(true)
      const res = await listVisitors({ 
        start_date: date, 
        end_date: date, 
        search, 
        status: status === 'inside' ? 'inside' : 'all',
        page: pageNum,
        limit: 50
      })
      setVisitors(res.data.visitors)
      setPagination(res.data.pagination)
    } catch (err) {
      toast.error('Failed to load visitors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVisitors(1)
  }, [date, search, status])

  const handleLogVisitor = async (e) => {
    e.preventDefault()
    if (!formData.visitor_name) return toast.error('Visitor name is required')

    const phoneRegex = /^[6-9]\d{9}$/
    if (formData.visitor_phone && !phoneRegex.test(formData.visitor_phone)) {
      return toast.error('Enter a valid 10-digit mobile number')
    }

    try {
      setIsSubmitting(true)
      await logVisitor(formData)
      toast.success('Visitor logged successfully')
      setIsModalOpen(false)
      setFormData({ visitor_name: '', visitor_phone: '', purpose: '', whom_to_meet: '' })
      fetchVisitors()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log visitor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCheckout = async (id) => {
    try {
      await checkoutVisitor(id)
      toast.success('Visitor checked out')
      fetchVisitors()
    } catch (err) {
      toast.error('Failed to check out visitor')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Visitor Log
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Track and manage school visitors.
          </p>
        </div>
        <Button variant="brand" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Log New Visitor
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl" 
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none transition-all"
            style={{ 
              backgroundColor: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)'
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="pl-4 pr-10 py-2 rounded-xl text-sm outline-none transition-all appearance-none cursor-pointer"
            style={{ 
              backgroundColor: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)'
            }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All Visitors</option>
            <option value="inside">Currently Inside</option>
          </select>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="date"
              className="pl-10 pr-4 py-2 rounded-xl text-sm outline-none transition-all"
              style={{ 
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Visitors Content */}
      <div className="space-y-4">
        {/* Mobile View: Cards */}
        <div className="grid grid-cols-1 gap-4 sm:hidden">
          {visitors.length > 0 ? (
            visitors.map((v) => (
              <div 
                key={v.id} 
                className="p-4 rounded-2xl border border-border bg-surface shadow-sm flex flex-col gap-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-text-primary">{v.visitor_name}</h3>
                    <p className="text-xs text-text-muted">{v.visitor_phone || 'No phone'}</p>
                  </div>
                  <Badge variant={v.check_out_time ? 'neutral' : 'success'}>
                    {v.check_out_time ? 'Checked Out' : 'Inside'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 border-y border-border/50">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold block mb-1">Purpose</span>
                    <span className="text-xs text-text-secondary font-medium">{v.purpose}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold block mb-1">To Meet</span>
                    <span className="text-xs text-text-secondary font-medium">{v.whom_to_meet}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold block mb-1">Check-in</span>
                    <span className="text-xs text-text-secondary">
                      {v.check_in_time ? format(new Date(v.check_in_time), 'hh:mm a') : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold block mb-1">Check-out</span>
                    <span className="text-xs text-text-secondary">
                      {v.check_out_time ? format(new Date(v.check_out_time), 'hh:mm a') : '-'}
                    </span>
                  </div>
                </div>

                {!v.check_out_time && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    icon={LogOut} 
                    onClick={() => handleCheckout(v.id)}
                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    Check Out
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-surface">
              <p className="text-sm text-text-muted">
                {loading ? 'Loading visitors...' : 'No visitors found for the selected date.'}
              </p>
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block rounded-2xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-surface-raised border-border">
                  <th className="px-6 py-4 font-semibold text-text-primary">Visitor</th>
                  <th className="px-6 py-4 font-semibold text-text-primary">Purpose</th>
                  <th className="px-6 py-4 font-semibold text-text-primary">To Meet</th>
                  <th className="px-6 py-4 font-semibold text-text-primary">Check-in</th>
                  <th className="px-6 py-4 font-semibold text-text-primary">Check-out</th>
                  <th className="px-6 py-4 font-semibold text-center text-text-primary">Status</th>
                  <th className="px-6 py-4 font-semibold text-right text-text-primary">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visitors.length > 0 ? (
                  visitors.map((v) => (
                    <tr key={v.id} className="hover:bg-black/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-text-primary">{v.visitor_name}</div>
                        <div className="text-xs text-text-muted">{v.visitor_phone}</div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{v.purpose}</td>
                      <td className="px-6 py-4 text-text-secondary">{v.whom_to_meet}</td>
                      <td className="px-6 py-4 text-text-secondary">
                        {v.check_in_time ? format(new Date(v.check_in_time), 'hh:mm a') : '-'}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {v.check_out_time ? format(new Date(v.check_out_time), 'hh:mm a') : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={v.check_out_time ? 'neutral' : 'success'}>
                          {v.check_out_time ? 'Checked Out' : 'Inside'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!v.check_out_time && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon={LogOut} 
                            onClick={() => handleCheckout(v.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            Check Out
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-text-muted">
                      {loading ? 'Loading visitors...' : 'No visitors found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-surface-raised">
              <p className="text-xs text-text-muted">
                Showing {visitors.length} of {pagination.total} visitors
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  disabled={pagination.page <= 1}
                  onClick={() => fetchVisitors(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchVisitors(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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

export default VisitorLog
