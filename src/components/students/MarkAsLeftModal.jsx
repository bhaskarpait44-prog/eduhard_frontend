import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import useToast from '@/hooks/useToast'
import { markAsLeft } from '@/api/studentLeavingApi'
import { LogOut, AlertTriangle } from 'lucide-react'

const REASON_OPTIONS = [
  { value: 'transfer', label: 'Transfer' },
  { value: 'family_relocation', label: 'Family Relocation' },
  { value: 'fee_default', label: 'Fee Default' },
  { value: 'result_failure', label: 'Result Failure' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
]

export default function MarkAsLeftModal({ open, student, onClose, onSuccess }) {
  const { toastError, toastSuccess } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    left_date: new Date().toISOString().split('T')[0],
    leaving_reason: '',
    leaving_remarks: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.leaving_reason) return toastError('Please select a leaving reason.')

    setLoading(true)
    try {
      await markAsLeft(student.id, form)
      toastSuccess(`${student.first_name} marked as left.`)
      onSuccess()
    } catch (err) {
      toastError(err.message || 'Failed to mark student as left.')
    } finally { setLoading(false) }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mark Student as Left"
      size="sm"
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="danger" icon={LogOut} onClick={handleSubmit} loading={loading} className="flex-1">Confirm Left</Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex gap-3 text-red-700">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed font-medium">
            This action will close the active enrollment and mark the student record as <strong>LEFT</strong>. They will no longer appear in active class lists.
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
          label="Left Date"
          value={form.left_date}
          onChange={e => setForm({ ...form, left_date: e.target.value })}
          required
        />

        <Select
          label="Leaving Reason"
          options={REASON_OPTIONS}
          value={form.leaving_reason}
          onChange={e => setForm({ ...form, leaving_reason: e.target.value })}
          required
          placeholder="Select reason"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Remarks (Optional)</label>
          <textarea
            className="w-full px-4 py-2 rounded-xl border outline-none text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 min-h-[80px]"
            style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            value={form.leaving_remarks}
            onChange={e => setForm({ ...form, leaving_remarks: e.target.value })}
            placeholder="Additional details..."
          />
        </div>
      </form>
    </Modal>
  )
}
