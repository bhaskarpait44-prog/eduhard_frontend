import { useEffect, useState } from 'react'
import { ArrowLeft, BellPlus } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  const { loadingBase, saving, assignedSections, saveNotice } = useTeacherNotices()

  const [form, setForm] = useState({
    title: '',
    body: '',
    audience: 'class',
    target_key: '', // classId:sectionId
    priority: 'normal',
    expires_at: '',
  })

  useEffect(() => {
    if (editingNotice) {
      setForm({
        title: editingNotice.title,
        body: editingNotice.body,
        audience: editingNotice.audience,
        target_key: `${editingNotice.target_class_id}:${editingNotice.target_section_id || ''}`,
        priority: editingNotice.priority,
        expires_at: editingNotice.expires_at ? format(new Date(editingNotice.expires_at), 'yyyy-MM-dd') : '',
      })
    } else if (assignedSections.length > 0) {
      setForm(prev => ({
        ...prev,
        target_key: assignedSections[0].value
      }))
    }
  }, [editingNotice, assignedSections])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const [classId, sectionId] = form.target_key.split(':')
    const payload = {
      title: form.title,
      body: form.body,
      audience: form.audience,
      target_class_id: parseInt(classId),
      target_section_id: sectionId ? parseInt(sectionId) : null,
      priority: form.priority,
      expires_at: form.expires_at || null
    }

    try {
      await saveNotice(payload, editingNotice?.id)
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
              onChange={e => setForm(p => ({ ...p, audience: e.target.value }))}
              options={[
                { value: 'class', label: 'Whole Class' },
                { value: 'section', label: 'Specific Section' },
              ]}
              disabled={isEditing}
              required
            />
            <Select
              label="Target Class/Section"
              value={form.target_key}
              onChange={e => setForm(p => ({ ...p, target_key: e.target.value }))}
              options={assignedSections}
              disabled={isEditing}
              required
            />
          </div>

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
