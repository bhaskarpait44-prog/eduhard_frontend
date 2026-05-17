import { useEffect, useMemo, useState } from 'react'
import { BellRing, Send, Eye, Paperclip, FileText, X } from 'lucide-react'
import * as accountantApi from '@/api/accountantApi'
import { getClasses, getClassList } from '@/api/classApi'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { getFileUrl } from '@/utils/helpers'

const initialForm = {
  audience: 'school_wide',
  class_id: '',
  student_id: '',
  title: '',
  content: '',
  expiry_date: '',
}

const AccountantNotices = () => {
  usePageTitle('Fee Notices')
  const { toastSuccess, toastError } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [notices, setNotices] = useState([])
  const [form, setForm] = useState({ ...initialForm, attachment: null })
  const [selectedNotice, setSelectedNotice] = useState(null)

  const classOptions = useMemo(() => classes.map((row) => ({ value: String(row.id), label: row.name })), [classes])
  const studentOptions = useMemo(() => students.map((row) => ({
    value: String(row.id || row.student_id),
    label: `${row.student_name || `${row.first_name || ''} ${row.last_name || ''}`.trim()} | ${row.class_name || row.class || ''} ${row.section_name || row.section || ''}`,
  })), [students])

  const load = async () => {
    setLoading(true)
    try {
      const [classesRes, studentsRes, noticesRes] = await Promise.all([
        getClasses(),
        accountantApi.getStudentFeesList({ sort: 'name' }),
        accountantApi.getAccountantNotices(),
      ])
      setClasses(getClassList(classesRes))
      setStudents(studentsRes?.data?.students || studentsRes?.data?.data || [])
      setNotices(noticesRes?.data?.notices || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch(() => toastError('Failed to load fee notices.'))
  }, [])

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
      setForm(p => ({ ...p, attachment: file }))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('audience', form.audience)
      formData.append('target_class_id', form.audience === 'class' ? Number(form.class_id) : '')
      formData.append('target_student_id', form.audience === 'student' ? Number(form.student_id) : '')
      formData.append('title', form.title.trim())
      formData.append('body', form.content.trim())
      formData.append('expires_at', form.expiry_date || '')
      formData.append('priority', 'info')
      if (form.attachment) {
        formData.append('attachment', form.attachment)
      }

      await accountantApi.createAccountantNotice(formData)
      toastSuccess('Fee notice created.')
      setForm({ ...initialForm, attachment: null })
      await load()
    } catch (err) {
      toastError(err?.response?.data?.message || err?.message || 'Unable to create fee notice.')
    } finally {
      setSaving(false)
    }
  }

  const handleViewDetail = async (notice) => {
    setSelectedNotice(notice)
    if (!notice.is_read) {
      try {
        await accountantApi.markAccountantPortalNoticeRead(notice.id)
        // Update local state to show it's read
        setNotices(prev => prev.map(n => n.id === notice.id ? { ...n, is_read: true } : n))
      } catch (err) {
        console.error('Failed to mark notice as read', err)
      }
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Fee Notices</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Create fee-only notices or view announcements from administration. These appear in the student portal notice board or your dashboard.
          </p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-[24px] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="mb-4 flex items-center gap-2">
            <Send size={16} style={{ color: 'var(--color-brand)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Create Notice</h2>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Select
              label="Audience"
              value={form.audience}
              onChange={(event) => setForm((prev) => ({ ...prev, audience: event.target.value, class_id: '', student_id: '' }))}
              options={[
                { value: 'school_wide', label: 'School Wide' },
                { value: 'class', label: 'Class (Students & Parents)' },
                { value: 'student', label: 'Student & Parent' },
              ]}
              required
            />
            {form.audience === 'class' ? (
              <Select label="Class" value={form.class_id} onChange={(event) => setForm((prev) => ({ ...prev, class_id: event.target.value }))} options={classOptions} required />
            ) : null}
            {form.audience === 'student' ? (
              <Select label="Student" value={form.student_id} onChange={(event) => setForm((prev) => ({ ...prev, student_id: event.target.value }))} options={studentOptions} placeholder="Select student" required />
            ) : null}
            <Input label="Title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Fee payment reminder" required />
            <label className="block">
              <span className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Message*</span>
              <textarea
                value={form.content}
                onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                className="min-h-32 w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ backgroundColor: 'var(--color-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                placeholder="Write the fee notice message."
                required
              />
            </label>
            <Input type="date" label="Expiry Date" value={form.expiry_date} onChange={(event) => setForm((prev) => ({ ...prev, expiry_date: event.target.value }))} />
            
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500">Attachment (PDF, Max 5MB)</span>
              <div className="flex items-center gap-3">
                <label className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand transition-colors cursor-pointer group bg-slate-50 dark:bg-slate-900/50">
                  <Paperclip size={16} className="text-slate-400 group-hover:text-brand" />
                  <span className="text-xs text-slate-500 group-hover:text-brand">
                    {form.attachment ? form.attachment.name : 'Upload PDF'}
                  </span>
                  <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                </label>
                {form.attachment && (
                  <button 
                    type="button" 
                    onClick={() => setForm(p => ({ ...p, attachment: null }))}
                    className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <Button type="submit" variant="primary" loading={saving} className="w-full">Send Fee Notice</Button>
          </form>
        </section>

        <section className="rounded-[24px] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="mb-4 flex items-center gap-2">
            <BellRing size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Recent Fee Notices</h2>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />)}
            </div>
          ) : notices.length === 0 ? (
            <EmptyState icon={BellRing} title="No fee notices" description="Fee notices created by you or received from admin will appear here." />
          ) : (
            <div className="space-y-3">
              {notices.map((notice) => (
                <article key={notice.id} className="rounded-[22px] border p-4 hover:shadow-sm transition-all" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)', opacity: notice.is_read ? 0.8 : 1 }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="yellow">Fee</Badge>
                    <Badge variant="blue" className="capitalize">{notice.audience.replace('_', ' ')}</Badge>
                    {notice.class_name && <Badge variant="teal">{notice.class_name}</Badge>}
                    {!notice.is_read && <Badge variant="red">New</Badge>}
                  </div>
                  <h3 className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{notice.title}</h3>
                  <div className="mt-1">
                    <p className="line-clamp-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{notice.body}</p>
                    <button
                      onClick={() => handleViewDetail(notice)}
                      className="mt-2 flex items-center gap-1.5 text-[10px] font-bold transition-all hover:opacity-70"
                      style={{ color: 'var(--color-brand)' }}
                    >
                      <Eye size={12} strokeWidth={2.5} />
                      <span className="underline decoration-1 underline-offset-2">View Detail</span>
                    </button>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    <span className="flex items-center gap-1">
                      <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>Posted:</span> {new Date(notice.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>By:</span> {notice.posted_by_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-bold text-brand">{notice.read_count || 0}</span> Views
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={!!selectedNotice}
        onClose={() => setSelectedNotice(null)}
        title="Fee Notice Details"
        size="lg"
      >
        {selectedNotice && (
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="yellow">Fee Notice</Badge>
                <Badge variant="blue" className="capitalize">{selectedNotice.audience.replace('_', ' ')}</Badge>
                {selectedNotice.class_name && <Badge variant="teal">{selectedNotice.class_name}</Badge>}
              </div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{selectedNotice.title}</h3>
              <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Posted on {new Date(selectedNotice.created_at).toLocaleString()}
              </p>
            </div>
            
            <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                {selectedNotice.body}
              </p>
            </div>

            {selectedNotice.attachment_path && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-brand/5 border border-brand/10">
                <div className="p-2 rounded-lg bg-brand text-white">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">Attachment Document</div>
                  <div className="text-[9px] text-slate-500">PDF File</div>
                </div>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="shadow-sm"
                  onClick={() => window.open(getFileUrl(selectedNotice.attachment_path), '_blank')}
                >
                  View PDF
                </Button>

              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <span>Total Views: <strong>{selectedNotice.read_count || 0}</strong></span>
                {selectedNotice.expires_at && (
                   <span>Expires: <strong>{new Date(selectedNotice.expires_at).toLocaleDateString()}</strong></span>
                )}
              </div>
              <Button variant="secondary" onClick={() => setSelectedNotice(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AccountantNotices
