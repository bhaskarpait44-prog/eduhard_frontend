import { useEffect, useState } from 'react'
import { ArrowLeft, BellPlus, Paperclip, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as teacherApi from '@/api/teacherApi'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useTeacherNotices from '@/hooks/useTeacherNotices'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { ROUTES } from '@/constants/app'
import { format } from 'date-fns'

const NoticeForm = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const editingNotice = location.state?.notice || null
  const isEditing = Boolean(editingNotice)

  usePageTitle(isEditing ? 'Edit Notice' : 'Post Notice')

  const { toastSuccess, toastError } = useToast()
  const { loadingBase, saving, assignedSections, assignedSubjects, saveNotice } = useTeacherNotices()
  const [students, setStudents] = useState([])

  const [form, setForm] = useState({
    title: '',
    body: '',
    audience: 'class',
    target_key: '', // classId:sectionId
    target_subject_id: '',
    target_student_id: '',
    priority: 'normal',
    expires_at: '',
    attachment: null,
  })

  useEffect(() => {
    if (editingNotice) {
      setForm({
        title: editingNotice.title,
        body: editingNotice.body,
        audience: editingNotice.audience,
        target_key: `${editingNotice.target_class_id}:${editingNotice.target_section_id || ''}`,
        target_subject_id: editingNotice.target_subject_id || '',
        target_student_id: editingNotice.target_student_id || '',
        priority: editingNotice.priority,
        expires_at: editingNotice.expires_at ? format(new Date(editingNotice.expires_at), 'yyyy-MM-dd') : '',
      })
    } else if (assignedSections.length > 0) {
      setForm(prev => ({ ...prev, target_key: assignedSections[0].value }))
    }
  }, [editingNotice, assignedSections])

  useEffect(() => {
    if (form.audience === 'student' && form.target_key) {
      const [classId, sectionId] = form.target_key.split(':')
      teacherApi.getTeacherStudents({ 
        class_id: classId, 
        section_id: sectionId || undefined 
      }).then(res => {
        const data = res.data?.students || res.data || []
        setStudents(data.map(s => ({ value: String(s.id), label: `${s.first_name} ${s.last_name} (${s.admission_no})` })))
      }).catch(console.error)
    }
  }, [form.audience, form.target_key])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const [classId, sectionId] = form.target_key.split(':')
    const formData = new FormData()
    formData.append('title', form.title)
    formData.append('body', form.body)
    formData.append('audience', form.audience)
    formData.append('target_class_id', classId || '')
    // Bug 6 Fix: Clear section_id for class-level notices
    formData.append('target_section_id', form.audience === 'class' ? '' : (sectionId || ''))
    formData.append('target_subject_id', form.target_subject_id || '')
    formData.append('target_student_id', form.target_student_id || '')
    formData.append('priority', form.priority)
    formData.append('expires_at', form.expires_at || '')
    if (form.attachment) {
      formData.append('attachment', form.attachment)
    }

    try {
      await saveNotice(formData, editingNotice?.id)
      toastSuccess(isEditing ? 'Notice updated.' : 'Notice posted.')
      navigate(ROUTES.TEACHER_NOTICES)
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save notice.')
    }
  }

  if (!loadingBase && assignedSections.length === 0 && !isEditing) {
    return (
      <EmptyState 
        icon={BellPlus} 
        title="No assigned classes" 
        description="You can only post notices to classes or sections you are assigned to."
        action={<Button variant="secondary" onClick={() => navigate(ROUTES.TEACHER_NOTICES)}>Back</Button>}
      />
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(ROUTES.TEACHER_NOTICES)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Notice' : 'Post New Notice'}</h1>
      </div>

      <div className="max-w-2xl mx-auto w-full rounded-[24px] border p-6 shadow-md" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Notice Title" 
            value={form.title} 
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Science Lab Tomorrow"
            required 
          />
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Target Audience"
              value={form.audience}
              onChange={e => setForm(p => ({ ...p, audience: e.target.value, target_key: assignedSections[0]?.value || '', target_subject_id: '', target_student_id: '' }))}
              options={[
                { value: 'class', label: 'Whole Class' },
                { value: 'section', label: 'Specific Section' },
                { value: 'subject_wise', label: 'By Subject' },
                { value: 'student', label: 'Specific Student' },
              ]}
              disabled={isEditing}
              required
            />
            
            {form.audience === 'subject_wise' ? (
              <Select
                label="Target Subject"
                value={form.target_subject_id}
                onChange={e => setForm(p => ({ ...p, target_subject_id: e.target.value }))}
                options={assignedSubjects}
                disabled={isEditing}
                required
              />
            ) : (
              <Select
                label="Target Class/Section"
                value={form.target_key}
                onChange={e => setForm(p => ({ ...p, target_key: e.target.value, target_student_id: '' }))}
                options={assignedSections}
                disabled={isEditing}
                required
              />
            )}
          </div>

          {form.audience === 'student' && (
            <Select
              label="Select Student"
              value={form.target_student_id}
              onChange={e => setForm(p => ({ ...p, target_student_id: e.target.value }))}
              options={students}
              disabled={!form.target_key || isEditing}
              required
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Priority"
              value={form.priority}
              onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'info', label: 'Info' },
              ]}
              required
            />
            <Input 
              type="date"
              label="Expiry Date (Optional)"
              value={form.expires_at}
              onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Notice Message</span>
            <textarea
              className="w-full min-h-[150px] rounded-2xl border p-4 text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}
              placeholder="Write your notice here..."
              value={form.body}
              onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
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
                  onClick={() => setForm(p => ({ ...p, attachment: null }))}
                  className="p-3 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" loading={saving} className="flex-1">
              {isEditing ? 'Save Changes' : 'Post Notice'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.TEACHER_NOTICES)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NoticeForm
