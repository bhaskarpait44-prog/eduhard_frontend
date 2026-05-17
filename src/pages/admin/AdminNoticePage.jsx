import { useEffect, useMemo, useState, useCallback } from 'react'
import { Bell, Send, Filter, Eye, Trash2, Edit3, User, Users, GraduationCap, School, ShieldCheck, BookOpen, Wallet, Phone, Paperclip, FileText, X } from 'lucide-react'
import { noticesApi } from '@/api'
import { getClasses, getSections, getClassOptions } from '@/api/classApi'
import { getStudents } from '@/api/studentsApi'
import { getTeacherControlTeachers } from '@/api/adminTeacherControlApi'
import { getSubjects } from '@/api/subjectApi'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import { format } from 'date-fns'
import { getFileUrl } from '@/utils/helpers'

const AUDIENCE_OPTIONS = [
  { value: 'school_wide', label: 'Whole School (Students, Parents & Staff)', icon: School },
  { value: 'teachers', label: 'All Teachers', icon: Users },
  { value: 'parents', label: 'All Parents', icon: Users },
  { value: 'accountants', label: 'All Accountants', icon: Wallet },
  { value: 'receptionists', label: 'All Receptionists', icon: Phone },
  { value: 'class', label: 'Specific Class (Students & Parents)', icon: GraduationCap },
  { value: 'section', label: 'Specific Section (Students & Parents)', icon: Users },
  { value: 'student', label: 'Individual Student & Parent', icon: User },
  { value: 'specific_teacher', label: 'Specific Teacher', icon: User },
]

const AdminNoticePage = () => {
  usePageTitle('Admin Notices')
  const { toastSuccess, toastError } = useToast()

  const [activeTab, setActiveTab] = useState('list')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [notices, setNotices] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  
  const [filters, setFilters] = useState({ audience: '', priority: '', page: 1, perPage: 10 })

  const [form, setNoticeForm] = useState({
    title: '',
    body: '',
    audience: 'school_wide',
    target_class_id: '',
    target_section_id: '',
    target_student_id: '',
    target_teacher_id: '',
    target_subject_id: '',
    priority: 'normal',
    expires_at: '',
    attachment: null,
  })

  const [editingNotice, setEditingNotice] = useState(null)
  const [viewingNotice, setViewingNotice] = useState(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(null)

  const loadNotices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await noticesApi.adminListNotices(filters)
      setNotices(res.data.notices)
      setPagination(res.data.pagination)
    } catch (err) {
      toastError('Failed to load notices.')
    } finally {
      setLoading(false)
    }
  }, [filters, toastError])

  useEffect(() => { loadNotices() }, [loadNotices])

  useEffect(() => {
    getClasses().then(res => setClasses(getClassOptions(res))).catch(console.error)
    getTeacherControlTeachers().then(res => {
      const data = res.data?.teachers || res.data || []
      setTeachers(data.map(t => ({ value: String(t.id), label: `${t.first_name} ${t.last_name}` })))
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (form.target_class_id) {
      getSections(form.target_class_id).then(res => {
        const data = res.data?.sections || res.data || []
        setSections(data.map(s => ({ value: String(s.id), label: s.name })))
      }).catch(console.error)
      
      getSubjects(form.target_class_id).then(res => {
        const data = res.data?.subjects || res.data || []
        setSubjects(data.map(s => ({ value: String(s.id), label: s.name })))
      }).catch(console.error)
    } else {
      setSections([])
      setSubjects([])
    }
  }, [form.target_class_id])

  useEffect(() => {
    if (form.audience === 'student' && (form.target_class_id || form.target_section_id)) {
      getStudents({ 
        class_id: form.target_class_id || undefined, 
        section_id: form.target_section_id || undefined,
        perPage: 100 
      }).then(res => {
        const data = res.data?.students || res.data?.data || []
        setStudents(data.map(s => ({ 
          value: String(s.id), 
          label: `${s.first_name} ${s.last_name} (${s.admission_no})` 
        })))
      }).catch(console.error)
    } else {
      setStudents([])
    }
  }, [form.audience, form.target_class_id, form.target_section_id])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        toastError('Only PDF files are allowed.')
        e.target.value = ''
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toastError('File size must be less than 5MB.')
        e.target.value = ''
        return
      }
      setNoticeForm(p => ({ ...p, attachment: file }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()
      Object.keys(form).forEach(key => {
        if (form[key] !== null && form[key] !== '') {
          formData.append(key, form[key])
        }
      })

      if (editingNotice) {
        await noticesApi.adminUpdateNotice(editingNotice.id, formData)
        toastSuccess('Notice updated successfully.')
      } else {
        await noticesApi.adminCreateNotice(formData)
        toastSuccess('Notice posted successfully.')
      }
      resetForm()
      setActiveTab('list')
      loadNotices()
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save notice.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await noticesApi.adminDeleteNotice(isDeleteConfirmOpen)
      toastSuccess('Notice deleted.')
      setIsDeleteConfirmOpen(null)
      loadNotices()
    } catch (err) {
      toastError('Failed to delete notice.')
    }
  }

  const resetForm = () => {
    setNoticeForm({
      title: '',
      body: '',
      audience: 'school_wide',
      target_class_id: '',
      target_section_id: '',
      target_student_id: '',
      target_teacher_id: '',
      target_subject_id: '',
      priority: 'normal',
      expires_at: '',
      attachment: null,
    })
    setEditingNotice(null)
  }

  const startEdit = (notice) => {
    setEditingNotice(notice)
    setNoticeForm({
      title: notice.title,
      body: notice.body,
      audience: notice.audience,
      target_class_id: notice.target_class_id || '',
      target_section_id: notice.target_section_id || '',
      target_student_id: notice.target_student_id || '',
      target_teacher_id: notice.target_teacher_id || '',
      target_subject_id: notice.target_subject_id || '',
      priority: notice.priority,
      expires_at: notice.expires_at ? format(new Date(notice.expires_at), 'yyyy-MM-dd') : '',
    })
    setActiveTab('create')
  }

  const getAudienceLabel = (notice) => {
    const opt = AUDIENCE_OPTIONS.find(o => o.value === notice.audience)
    return opt ? opt.label : notice.audience
  }

  const getAudienceIcon = (audience) => {
    const opt = AUDIENCE_OPTIONS.find(o => o.value === audience)
    const Icon = opt ? opt.icon : Bell
    return <Icon size={14} />
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent': return <Badge variant="red">Urgent</Badge>
      case 'info': return <Badge variant="blue">Info</Badge>
      default: return <Badge variant="green">Normal</Badge>
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Notice Board Management</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Manage all school announcements and targeted notifications.</p>
        </div>
        <div className="flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => { setActiveTab('list'); resetForm(); }}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            All Notices
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${activeTab === 'create' ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {editingNotice ? 'Edit Notice' : 'Post Notice'}
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-4">
          {/* Filters */}
          <div className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-400" />
                <span className="text-sm font-semibold">Filters:</span>
              </div>
              <select
                value={filters.audience}
                onChange={e => setFilters(p => ({ ...p, audience: e.target.value, page: 1 }))}
                className="rounded-lg border bg-transparent px-3 py-1.5 text-sm outline-none"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <option value="">All Audiences</option>
                <option value="school_wide">School Wide</option>
                <option value="class">Class Wise</option>
                <option value="section">Section Wise</option>
                <option value="student">Student Wise</option>
              </select>
              <select
                value={filters.priority}
                onChange={e => setFilters(p => ({ ...p, priority: e.target.value, page: 1 }))}
                className="rounded-lg border bg-transparent px-3 py-1.5 text-sm outline-none"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <option value="">All Priorities</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="info">Info</option>
              </select>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setFilters({ audience: '', priority: '', page: 1, perPage: 10 })}
              >
                Reset
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Audience</th>
                    <th className="px-4 py-3 font-semibold">Priority</th>
                    <th className="px-4 py-3 font-semibold">Posted By</th>
                    <th className="px-4 py-3 font-semibold text-center">Reads</th>
                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-4 py-8"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div></td>
                      </tr>
                    ))
                  ) : notices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12">
                        <EmptyState icon={Bell} title="No notices found" description="Try adjusting your filters or post a new notice." />
                      </td>
                    </tr>
                  ) : (
                    notices.map(notice => (
                      <tr key={notice.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{notice.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{format(new Date(notice.created_at), 'dd MMM yyyy, hh:mm a')}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">{getAudienceIcon(notice.audience)}</span>
                            <span className="capitalize">{getAudienceLabel(notice)}</span>
                          </div>
                          {notice.audience === 'class' && <div className="text-[10px] font-bold text-brand mt-0.5">{notice.class_name}</div>}
                          {notice.audience === 'section' && <div className="text-[10px] font-bold text-brand mt-0.5">{notice.class_name} - {notice.section_name}</div>}
                          {notice.audience === 'student' && <div className="text-[10px] font-bold text-brand mt-0.5">{notice.student_name}</div>}
                        </td>
                        <td className="px-4 py-3">{getPriorityBadge(notice.priority)}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{notice.posted_by_name}</div>
                          <div className="text-[10px] uppercase text-slate-400">{notice.posted_by_role}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="blue">{notice.read_count}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setViewingNotice(notice)} className="p-1.5 text-slate-400 hover:text-brand transition-colors"><Eye size={16} /></button>
                            <button onClick={() => startEdit(notice)} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"><Edit3 size={16} /></button>
                            <button onClick={() => setIsDeleteConfirmOpen(notice.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t p-4" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs text-slate-500">Page {pagination.page} of {pagination.totalPages}</span>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    disabled={pagination.page === 1}
                    onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Create / Edit Form */
        <div className="max-w-2xl mx-auto w-full rounded-[24px] border p-6 shadow-md" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-brand/10 text-brand">
              <Send size={20} />
            </div>
            <h2 className="text-xl font-bold">{editingNotice ? 'Edit Notice' : 'Post New Notice'}</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label="Notice Title" 
              placeholder="e.g. Annual Sports Meet 2024"
              value={form.title} 
              onChange={e => setNoticeForm(p => ({ ...p, title: e.target.value }))}
              required 
            />
            
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Target Audience"
                value={form.audience}
                onChange={e => setNoticeForm(p => ({ ...p, audience: e.target.value, target_class_id: '', target_section_id: '', target_student_id: '', target_teacher_id: '', target_subject_id: '' }))}
                options={AUDIENCE_OPTIONS}
                required
              />
              <Select
                label="Priority"
                value={form.priority}
                onChange={e => setNoticeForm(p => ({ ...p, priority: e.target.value }))}
                options={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'urgent', label: 'Urgent (Red Alert)' },
                  { value: 'info', label: 'Info (Blue)' },
                ]}
                required
              />
            </div>

            {['class', 'section', 'student', 'subject_wise'].includes(form.audience) && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Select Class"
                  value={form.target_class_id}
                  onChange={e => setNoticeForm(p => ({ ...p, target_class_id: e.target.value, target_section_id: '', target_student_id: '' }))}
                  options={classes}
                  required
                />
                {['section', 'student'].includes(form.audience) && (
                  <Select
                    label="Select Section"
                    value={form.target_section_id}
                    onChange={e => setNoticeForm(p => ({ ...p, target_section_id: e.target.value, target_student_id: '' }))}
                    options={sections}
                    disabled={!form.target_class_id}
                    required={form.audience === 'section'}
                  />
                )}
              </div>
            )}

            {form.audience === 'student' && (
              <Select
                label="Search Student"
                value={form.target_student_id}
                onChange={e => setNoticeForm(p => ({ ...p, target_student_id: e.target.value }))}
                options={students}
                disabled={!form.target_class_id}
                required
              />
            )}

            {form.audience === 'specific_teacher' && (
              <Select
                label="Select Teacher"
                value={form.target_teacher_id}
                onChange={e => setNoticeForm(p => ({ ...p, target_teacher_id: e.target.value }))}
                options={teachers}
                required
              />
            )}

            {form.audience === 'subject_wise' && (
              <Select
                label="Select Subject"
                value={form.target_subject_id}
                onChange={e => setNoticeForm(p => ({ ...p, target_subject_id: e.target.value }))}
                options={subjects}
                required
              />
            )}


            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Notice Body</span>
              <textarea
                className="w-full min-h-[150px] rounded-2xl border p-4 text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}
                placeholder="Write your announcement here..."
                value={form.body}
                onChange={e => setNoticeForm(p => ({ ...p, body: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500">Attachment (PDF, Max 5MB)</span>
              <div className="flex items-center gap-3">
                <label className="flex flex-1 items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand transition-colors cursor-pointer group">
                  <Paperclip size={18} className="text-slate-400 group-hover:text-brand" />
                  <span className="text-sm text-slate-500 group-hover:text-brand">
                    {form.attachment ? form.attachment.name : 'Upload PDF Document'}
                  </span>
                  <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                </label>
                {form.attachment && (
                  <button 
                    type="button" 
                    onClick={() => setNoticeForm(p => ({ ...p, attachment: null }))}
                    className="p-3 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            <Input 
              type="date"
              label="Expiration Date (Optional)"
              value={form.expires_at}
              onChange={e => setNoticeForm(p => ({ ...p, expires_at: e.target.value }))}
            />

            <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <Button type="submit" variant="primary" loading={saving} className="flex-1">
                {editingNotice ? 'Update Notice' : 'Broadcast Notice'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setActiveTab('list'); resetForm(); }}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation */}
      <Modal open={!!isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(null)} title="Delete Notice" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Are you sure you want to delete this notice? This action cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
            <Button variant="secondary" onClick={() => setIsDeleteConfirmOpen(null)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* View Notice */}
      <Modal open={!!viewingNotice} onClose={() => setViewingNotice(null)} title="Notice Detail" size="lg">
        {viewingNotice && (
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {getPriorityBadge(viewingNotice.priority)}
                <Badge variant="blue" className="capitalize">{viewingNotice.audience.replace('_', ' ')}</Badge>
              </div>
              <h2 className="text-2xl font-bold">{viewingNotice.title}</h2>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><User size={12} /> Posted by: {viewingNotice.posted_by_name} ({viewingNotice.posted_by_role})</span>
                <span>Date: {format(new Date(viewingNotice.created_at), 'dd MMM yyyy, hh:mm a')}</span>
              </div>
            </div>
            
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">{viewingNotice.body}</p>
            </div>

            {viewingNotice.attachment_path && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-brand/5 border border-brand/10">
                <div className="p-2 rounded-xl bg-brand text-white">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">Attachment Document</div>
                  <div className="text-[10px] text-slate-500">PDF Document</div>
                </div>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="shadow-sm"
                  onClick={() => window.open(getFileUrl(viewingNotice.attachment_path), '_blank')}
                >
                  View PDF
                </Button>

              </div>
            )}

            {viewingNotice.expires_at && (
              <div className="text-xs text-red-500 font-medium">Expires on: {format(new Date(viewingNotice.expires_at), 'dd MMM yyyy')}</div>
            )}
            
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setViewingNotice(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminNoticePage
