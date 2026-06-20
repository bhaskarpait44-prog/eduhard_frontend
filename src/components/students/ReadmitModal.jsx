import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import useToast from '@/hooks/useToast'
import { readmitStudent } from '@/api/studentLeavingApi'
import { getClasses, getSections, getClassList } from '@/api/classApi'
import { getSessions } from '@/api/sessionsApi'
import { ArrowRightLeft } from 'lucide-react'

export default function ReadmitModal({ open, student, onClose, onSuccess }) {
  const { toastError, toastSuccess } = useToast()
  const [loading, setLoading] = useState(false)
  const [meta, setMeta] = useState({ classes: [], sessions: [], sections: [] })
  const [form, setForm] = useState({
    session_id: '',
    class_id: '',
    section_id: '',
    joined_date: new Date().toISOString().split('T')[0],
    roll_number: ''
  })

  useEffect(() => {
    if (open) {
      Promise.all([getClasses(), getSessions()])
        .then(([clsRes, sessRes]) => {
          const classes = getClassList(clsRes)
          const sessions = sessRes.data?.sessions || sessRes.data || []
          
          setMeta(prev => ({
            ...prev,
            classes: classes.map(c => ({ value: String(c.id), label: c.name })),
            sessions: sessions.map(s => ({ value: String(s.id), label: s.name }))
          }))
        })
        .catch(() => toastError('Failed to load classes or sessions.'))
    }
  }, [open])

  useEffect(() => {
    if (form.class_id) {
      getSections(form.class_id)
        .then(res => {
          const sections = res.data?.sections || res.data || []
          setMeta(prev => ({
            ...prev,
            sections: sections.map(s => ({ value: String(s.id), label: `Section ${s.name}` }))
          }))
        })
        .catch(() => toastError('Failed to load sections.'))
    } else {
      setMeta(prev => ({ ...prev, sections: [] }))
    }
  }, [form.class_id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.session_id || !form.class_id || !form.section_id) return toastError('Please fill all required fields.')

    setLoading(true)
    try {
      await readmitStudent(student.id, form)
      toastSuccess(`${student.first_name} re-admitted successfully.`)
      onSuccess()
    } catch (err) {
      toastError(err.message || 'Failed to re-admit student.')
    } finally { setLoading(false) }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Re-admit Student"
      size="sm"
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" icon={ArrowRightLeft} onClick={handleSubmit} loading={loading} className="flex-1">Confirm Re-admission</Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Student</label>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {student?.first_name} {student?.last_name} ({student?.admission_no})
          </p>
        </div>

        <Select
          label="Session"
          options={meta.sessions}
          value={form.session_id}
          onChange={e => setForm({ ...form, session_id: e.target.value })}
          required
          placeholder="Select session"
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Class"
            options={meta.classes}
            value={form.class_id}
            onChange={e => setForm({ ...form, class_id: e.target.value, section_id: '' })}
            required
            placeholder="Select class"
          />
          <Select
            label="Section"
            options={meta.sections}
            value={form.section_id}
            onChange={e => setForm({ ...form, section_id: e.target.value })}
            required
            placeholder="Select section"
            disabled={!form.class_id}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            label="Joined Date"
            value={form.joined_date}
            onChange={e => setForm({ ...form, joined_date: e.target.value })}
            required
            containerClassName="flex-1"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Roll Number (Opt)</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-xl border outline-none text-sm transition-all focus:ring-2 focus:ring-indigo-500/20"
              style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              value={form.roll_number}
              onChange={e => setForm({ ...form, roll_number: e.target.value })}
              placeholder="Assign roll..."
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
