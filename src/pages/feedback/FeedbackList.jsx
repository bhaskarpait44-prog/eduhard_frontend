import { useEffect, useState, useMemo } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useFeedbackStore from '@/store/feedbackStore'
import useAuthStore from '@/store/authStore'
import { 
  MessageSquare, 
  Plus, 
  Search,
  CheckCircle2,
  Clock,
  Send,
  Trash2,
  MessageCircle,
  Filter
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import { formatDate } from '@/utils/helpers'

const STATUS_BADGE = {
  'open': 'blue',
  'in-progress': 'yellow',
  'resolved': 'green'
}

export default function FeedbackList() {
  usePageTitle('Feedback & Complaints')
  const { user } = useAuthStore()
  const { toastSuccess, toastError } = useToast()
  const { records, isLoading, fetchFeedback, submit, reply, remove } = useFeedbackStore()

  const isAdmin = user?.role === 'admin'
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')

  // Modals
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [submitForm, setSubmitForm] = useState({ type: 'feedback', subject: '', message: '' })

  const [replyModalOpen, setReplyModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [replyForm, setReplyForm] = useState({ admin_reply: '', status: 'resolved' })

  useEffect(() => {
    fetchFeedback({ status: filterStatus, type: filterType })
  }, [filterStatus, filterType, fetchFeedback])

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return records
    const q = searchQuery.toLowerCase()
    return records.filter(r => 
      r.subject.toLowerCase().includes(q) ||
      r.message.toLowerCase().includes(q) ||
      r.user_name?.toLowerCase().includes(q)
    )
  }, [records, searchQuery])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await submit(submitForm)
      toastSuccess('Your feedback has been submitted')
      setSubmitModalOpen(false)
      setSubmitForm({ type: 'feedback', subject: '', message: '' })
    } catch (err) { toastError('Submission failed') }
  }

  const handleReplySubmit = async (e) => {
    e.preventDefault()
    try {
      await reply(selectedRecord.id, replyForm)
      toastSuccess('Reply sent')
      setReplyModalOpen(false)
      setReplyForm({ admin_reply: '', status: 'resolved' })
    } catch (err) { toastError('Reply failed') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return
    try {
      await remove(id)
      toastSuccess('Deleted successfully')
    } catch (err) { toastError('Delete failed') }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl"><MessageSquare className="text-indigo-600 dark:text-indigo-400" size={24} /></div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Feedback & Complaints</h1>
            <p className="text-sm font-medium text-gray-500">{isAdmin ? 'Manage and respond to school feedback' : 'Submit your feedback or concerns'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-64" />
          </div>
          {!isAdmin && (
            <Button icon={Plus} onClick={() => setSubmitModalOpen(true)} className="rounded-2xl">
              Submit New
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-100 dark:border-gray-800">
          <Filter size={14} className="ml-2 text-gray-400" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-transparent border-none text-xs font-bold focus:ring-0">
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 mx-1" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-transparent border-none text-xs font-bold focus:ring-0">
            <option value="">All Types</option>
            <option value="feedback">Feedback</option>
            <option value="complaint">Complaint</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRecords.length > 0 ? filteredRecords.map(r => (
          <div key={r.id} className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-200 dark:border-gray-800 shadow-sm p-6 overflow-hidden relative">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-2xl ${r.type === 'complaint' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">{r.subject}</h3>
                  <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>{r.type}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                    <span>{formatDate(r.created_at, 'long')}</span>
                    {isAdmin && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                        <span className="text-indigo-600 dark:text-indigo-400">By {r.user_name} ({r.user_role})</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={STATUS_BADGE[r.status]} size="sm" className="uppercase tracking-widest text-[9px] rounded-md px-3">{r.status}</Badge>
                {isAdmin && r.status !== 'resolved' && (
                  <Button size="sm" variant="secondary" onClick={() => { setSelectedRecord(r); setReplyForm({admin_reply: r.admin_reply||'', status: 'resolved'}); setReplyModalOpen(true) }}>Reply</Button>
                )}
                {((isAdmin && r.status === 'resolved') || (!isAdmin && r.status === 'open')) && (
                  <button onClick={() => handleDelete(r.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
                )}
              </div>
            </div>

            <div className="pl-14 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{r.message}</p>
              
              {r.admin_reply && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> School Response
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white leading-relaxed">{r.admin_reply}</p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>Sent by {r.replier_name}</span>
                    <span>•</span>
                    <span>{formatDate(r.replied_at)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )) : <EmptyState title="No records found" description="No feedback or complaints matching your criteria." />}
      </div>

      {/* Submit Modal */}
      <Modal open={submitModalOpen} onClose={() => setSubmitModalOpen(false)} title="Submit Feedback or Complaint" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" value={submitForm.type} onChange={e => setSubmitForm({...submitForm, type: e.target.value})} options={[{value:'feedback',label:'Feedback'},{value:'complaint',label:'Complaint'}]} required />
            <Input label="Subject" value={submitForm.subject} onChange={e => setSubmitForm({...submitForm, subject: e.target.value})} required placeholder="Short summary..." />
          </div>
          <Textarea label="Your Message" rows={4} value={submitForm.message} onChange={e => setSubmitForm({...submitForm, message: e.target.value})} required placeholder="Provide details here..." />
          <div className="flex justify-end pt-2"><Button type="submit" loading={isLoading} icon={Send}>Submit</Button></div>
        </form>
      </Modal>

      {/* Reply Modal */}
      <Modal open={replyModalOpen} onClose={() => setReplyModalOpen(false)} title="Respond to Feedback" size="md">
        {selectedRecord && (
          <form onSubmit={handleReplySubmit} className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Subject</p>
              <p className="text-sm font-bold">{selectedRecord.subject}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{selectedRecord.message}</p>
            </div>
            <Textarea label="Response / Reply" rows={4} value={replyForm.admin_reply} onChange={e => setReplyForm({...replyForm, admin_reply: e.target.value})} required placeholder="Type your response..." />
            <Select label="Update Status" value={replyForm.status} onChange={e => setReplyForm({...replyForm, status: e.target.value})} options={[{value:'open',label:'Keep Open'},{value:'in-progress',label:'Mark In Progress'},{value:'resolved',label:'Mark Resolved'}]} />
            <div className="flex justify-end pt-2"><Button type="submit" loading={isLoading} icon={Send}>Send Response</Button></div>
          </form>
        )}
      </Modal>
    </div>
  )
}
