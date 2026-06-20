import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import useToast from '@/hooks/useToast'
import { markAsGraduated } from '@/api/studentLeavingApi'
import { GraduationCap, AlertTriangle } from 'lucide-react'

export default function MarkAsGraduatedModal({ open, student, onClose, onSuccess }) {
  const { toastError, toastSuccess } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    graduated_date: new Date().toISOString().split('T')[0],
    remarks: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await markAsGraduated(student.id, form)
      toastSuccess(`${student.first_name} marked as graduated.`)
      onSuccess()
    } catch (err) {
      toastError(err.message || 'Failed to mark student as graduated.')
    } finally { setLoading(false) }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mark Student as Graduated"
      size="sm"
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" icon={GraduationCap} onClick={handleSubmit} loading={loading} className="flex-1">Confirm Graduation</Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex gap-3 text-blue-700">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed font-medium">
            This action will mark the student as <strong>GRADUATED</strong>. Their active enrollment will be closed.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Student</label>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {student?.first_name} {student?.last_name} ({student?.admission_no})
          </p>
        </div>

        <Input
          type="date"
          label="Graduation Date"
          value={form.graduated_date}
          onChange={e => setForm({ ...form, graduated_date: e.target.value })}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Remarks (Optional)</label>
          <textarea
            className="w-full px-4 py-2 rounded-xl border outline-none text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 min-h-[80px]"
            style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            value={form.remarks}
            onChange={e => setForm({ ...form, remarks: e.target.value })}
            placeholder="Additional details..."
          />
        </div>
      </form>
    </Modal>
  )
}
