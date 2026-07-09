// src/pages/exams/OverrideResultModal.jsx
import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Badge from '@/components/ui/Badge'
import useExamStore from '@/store/examStore'
import useToast from '@/hooks/useToast'

const RESULT_OPTIONS = [
  { value: 'pass',        label: 'Pass'        },
  { value: 'fail',        label: 'Fail'        },
  { value: 'compartment', label: 'Compartment' },
  { value: 'detained',    label: 'Detained'    },
]

const RESULT_CFG = {
  pass        : 'green',
  fail        : 'red',
  compartment : 'yellow',
  detained    : 'dark',
}

const schema = z.object({
  new_result           : z.enum(['pass','fail','compartment','detained'], { required_error: 'Select a result' }),
  reason               : z.string().min(10, 'Reason must be at least 10 characters'),
  compartment_subjects : z.array(z.number()).optional(),
}).refine(
  (d) => d.new_result !== 'compartment' || (d.compartment_subjects?.length ?? 0) > 0,
  {
    message : 'Select at least one compartment subject',
    path    : ['compartment_subjects'],
  }
)

/**
 * Props:
 *  - open: boolean
 *  - student: row object from classResults (includes compartment_subjects, enrollment_id, etc.)
 *  - subjects: array of { id, name } for the exam's subjects (used for compartment picker)
 *  - onClose: fn
 *  - onSuccess: fn
 */
const OverrideResultModal = ({ open, student, subjects = [], onClose, onSuccess }) => {
  const { toastSuccess, toastError } = useToast()
  const { overrideResult, isSaving } = useExamStore()

  const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm({
    resolver     : zodResolver(schema),
    defaultValues: { new_result: '', reason: '', compartment_subjects: [] },
  })

  const selectedResult = watch('new_result')

  useEffect(() => {
    if (open) {
      // Pre-populate compartment_subjects from the student's current compartment data if available
      const preselected = Array.isArray(student?.compartment_subjects)
        ? student.compartment_subjects.map(Number).filter(Boolean)
        : []
      reset({ new_result: student?.result || '', reason: '', compartment_subjects: preselected })
    }
  }, [open, student])

  const onSubmit = async (data) => {
    const payload = {
      enrollment_id       : student.enrollment_id,
      new_result          : data.new_result,
      reason              : data.reason,
    }
    if (data.new_result === 'compartment') {
      payload.compartment_subjects = data.compartment_subjects
    }

    const result = await overrideResult(payload)
    if (result.success) {
      toastSuccess(`Result overridden for ${student.student_name || student.name}`)
      onSuccess?.()
    } else {
      toastError(result.message || 'Failed to override result')
    }
  }

  if (!student) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Override Result"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSaving}>Save Override</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Audit warning */}
        <div
          className="flex items-start gap-3 p-3 rounded-xl text-sm"
          style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}
        >
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          This override will be permanently recorded in the audit trail.
        </div>

        {/* Student info */}
        <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {student.student_name || student.name}
          </p>
          <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {student.admission_no}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Current result:</span>
            {student.result
              ? <Badge variant={RESULT_CFG[student.result] || 'grey'}>{student.result}</Badge>
              : <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Not calculated</span>
            }
          </div>
        </div>

        <Select
          label="New Result"
          required
          options={RESULT_OPTIONS}
          error={errors.new_result?.message}
          {...register('new_result')}
        />

        {/* Compartment subjects picker — only visible when 'compartment' is selected */}
        {selectedResult === 'compartment' && (
          <div>
            <p
              className="text-sm font-semibold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Compartment Subjects <span style={{ color: '#ef4444' }}>*</span>
            </p>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Select the subjects the student must re-sit (required by the backend).
            </p>
            {subjects.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                No subjects available. Ensure the exam has subjects configured.
              </p>
            ) : (
              <Controller
                name="compartment_subjects"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {subjects.map((sub) => {
                      const checked = (field.value || []).includes(sub.id)
                      return (
                        <label
                          key={sub.id}
                          className="flex items-center gap-2 cursor-pointer text-sm"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...(field.value || []), sub.id]
                                : (field.value || []).filter((id) => id !== sub.id)
                              field.onChange(next)
                            }}
                            className="rounded"
                          />
                          {sub.name}
                        </label>
                      )
                    })}
                  </div>
                )}
              />
            )}
            {errors.compartment_subjects && (
              <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                {errors.compartment_subjects.message}
              </p>
            )}
          </div>
        )}

        <Textarea
          label="Reason for override"
          placeholder="e.g. Student detained due to disciplinary action approved by principal"
          hint="Min 10 characters — stored permanently"
          rows={3}
          required
          error={errors.reason?.message}
          {...register('reason')}
        />
      </div>
    </Modal>
  )
}

export default OverrideResultModal