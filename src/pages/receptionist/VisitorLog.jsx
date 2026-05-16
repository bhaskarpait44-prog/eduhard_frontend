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
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    visitor_name: '',
    visitor_phone: '',
    purpose: '',
    whom_to_meet: ''
  })

  const { toast } = useToast()

  const fetchVisitors = async () => {
    try {
      setLoading(true)
      const res = await listVisitors({ date, search })
      setVisitors(res.data.visitors)
    } catch (err) {
      toast.error('Failed to load visitors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVisitors()
  }, [date, search])

  const handleLogVisitor = async (e) => {
    e.preventDefault()
    if (!formData.visitor_name) return toast.error('Visitor name is required')

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

      {/* Visitors Table */}
      <div className="rounded-2xl overflow-hidden" 
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}>
                <th className="px-6 py-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>Visitor</th>
                <th className="px-6 py-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>Purpose</th>
                <th className="px-6 py-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>To Meet</th>
                <th className="px-6 py-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>Check-in</th>
                <th className="px-6 py-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>Check-out</th>
                <th className="px-6 py-4 font-semibold text-center" style={{ color: 'var(--color-text-primary)' }}>Status</th>
                <th className="px-6 py-4 font-semibold text-right" style={{ color: 'var(--color-text-primary)' }}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {visitors.length > 0 ? (
                visitors.map((v) => (
                  <tr key={v.id} className="hover:bg-black/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{v.visitor_name}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{v.visitor_phone}</div>
                    </td>
                    <td className="px-6 py-4" style={{ color: 'var(--color-text-secondary)' }}>{v.purpose}</td>
                    <td className="px-6 py-4" style={{ color: 'var(--color-text-secondary)' }}>{v.whom_to_meet}</td>
                    <td className="px-6 py-4" style={{ color: 'var(--color-text-secondary)' }}>
                      {v.check_in_time ? format(new Date(v.check_in_time), 'hh:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4" style={{ color: 'var(--color-text-secondary)' }}>
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
                  <td colSpan="7" className="px-6 py-12 text-center" style={{ color: 'var(--color-text-muted)' }}>
                    {loading ? 'Loading visitors...' : 'No visitors found for the selected date.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
