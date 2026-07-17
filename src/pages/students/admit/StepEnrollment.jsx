import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Loader2 } from 'lucide-react'
import { getClasses, getClassOptions, getSections, getSubjects, createClass } from '@/api/classApi'
import { getStreams, createStream } from '@/api/streamApi'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { SectionHeading } from './StepIdentity'
import ClassForm from '@/components/classes/ClassForm'

const schema = z.object({
  session_id: z.string().min(1, 'Session is required'),
  class_id: z.string().min(1, 'Class is required'),
  section_id: z.string().min(1, 'Section is required'),
  stream: z.string().max(50).optional().or(z.literal('')),
  joining_type: z.enum(['fresh', 'promoted', 'transfer_in', 'rejoined'], { required_error: 'Joining type required' }),
  joined_date: z
    .string()
    .min(1, 'Joining date is required')
    .refine(val => {
      const date = new Date(val)
      const maxDate = new Date()
      maxDate.setFullYear(maxDate.getFullYear() + 1) // allow up to 1 year in future
      return date <= maxDate
    }, 'Joining date cannot be more than 1 year in the future'),
  roll_number: z.string().optional(),
  subject_ids: z.array(z.string()).optional(),
  medium: z.enum(['English', 'Assamese']).optional().or(z.literal('')),
  is_hostel: z.boolean().optional(),
  distance_km: z.preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().nonnegative().optional()),
  prev_attendance_days: z.preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().int().nonnegative().optional()),
})

const JOINING_TYPES = [
  { value: 'fresh', label: 'Fresh Admission' },
  { value: 'promoted', label: 'Promoted from another school' },
  { value: 'transfer_in', label: 'Transfer In' },
  { value: 'rejoined', label: 'Re-Admitted' },
]

const StepEnrollment = ({ defaultValues, currentSession, onSubmit, onBack, isPartialSuccess }) => {
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [subjects, setSubjects] = useState([])
  const [streams, setStreams] = useState([])
  const [showAddStreamModal, setShowAddStreamModal] = useState(false)
  const [newInlineStreamName, setNewInlineStreamName] = useState('')
  const [isSavingInlineStream, setIsSavingInlineStream] = useState(false)
  const [showAddClassModal, setShowAddClassModal] = useState(false)
  const [isSavingClassInline, setIsSavingClassInline] = useState(false)
  const [loadingC, setLoadingC] = useState(false)
  const [loadingS, setLoadingS] = useState(false)
  const [loadingSubj, setLoadingSubj] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      ...defaultValues,
      session_id: defaultValues.session_id || String(currentSession?.id || ''),
      joined_date: defaultValues.joined_date || new Date().toISOString().split('T')[0],
      joining_type: defaultValues.joining_type || 'fresh',
      stream: defaultValues.stream || 'regular',
      subject_ids: defaultValues.subject_ids || [],
    },
  })

  const classId = watch('class_id')
  const subjectIds = watch('subject_ids')
  const selectedClass = classes.find((cls) => String(cls.value) === String(classId))

  useEffect(() => {
    getStreams()
      .then((res) => {
        if (res && Array.isArray(res.data)) {
          setStreams(res.data)
        }
      })
      .catch((err) => console.error('Failed to load streams:', err))
  }, [])

  const streamOptions = streams.length > 0
    ? streams.map(s => ({ value: s.name, label: s.name.charAt(0).toUpperCase() + s.name.slice(1) }))
    : [
        { value: 'regular', label: 'Regular' },
        { value: 'arts', label: 'Arts' },
        { value: 'commerce', label: 'Commerce' },
        { value: 'science', label: 'Science' },
      ]

  const handleAddNewStreamInline = () => {
    setNewInlineStreamName('')
    setShowAddStreamModal(true)
  }

  const handleCreateStreamInline = async () => {
    const trimmed = newInlineStreamName.trim()
    if (!trimmed) return
    setIsSavingInlineStream(true)
    try {
      await createStream({ name: trimmed })
      const freshStreams = await getStreams()
      if (freshStreams && Array.isArray(freshStreams.data)) {
        setStreams(freshStreams.data)
      }
      setValue('stream', trimmed.toLowerCase())
      setShowAddStreamModal(false)
      setNewInlineStreamName('')
    } catch (err) {
      alert(err.message || 'Failed to create stream.')
    } finally {
      setIsSavingInlineStream(false)
    }
  }

  const handleCreateClassInlineSubmit = async (classData) => {
    setIsSavingClassInline(true)
    try {
      const res = await createClass(classData)
      const freshClassesRes = await getClasses()
      const options = getClassOptions(freshClassesRes)
      setClasses(options)
      
      const createdClass = res?.data?.data || res?.data
      if (createdClass && createdClass.id) {
        setValue('class_id', String(createdClass.id))
      }
      setShowAddClassModal(false)
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Failed to create class.')
    } finally {
      setIsSavingClassInline(false)
    }
  }

  // Sync session_id if currentSession loads after mount
  useEffect(() => {
    if (currentSession?.id && !watch('session_id')) {
      setValue('session_id', String(currentSession.id))
    }
  }, [currentSession?.id, setValue, watch])

  useEffect(() => {
    setLoadingC(true)
    getClasses()
      .then(r => setClasses(getClassOptions(r)))
      .catch(() => {})
      .finally(() => setLoadingC(false))
  }, [])

  useEffect(() => {
    if (!classId) {
      setSections([])
      setSubjects([])
      setValue('stream', 'regular')
      return
    }

    if (selectedClass?.stream) {
      setValue('stream', selectedClass.stream)
    } else {
      setValue('stream', 'regular')
    }

    setLoadingS(true)
    getSections(classId)
      .then(r => setSections((r.data || []).map(s => ({ value: String(s.id), label: `Section ${s.name}` }))))
      .catch(() => {})
      .finally(() => setLoadingS(false))

    // Fetch subjects for this class
    setLoadingSubj(true)
    getSubjects(classId)
      .then(r => {
        const subjList = r.data || []
        setSubjects(subjList)
        // Only auto-select core subjects if the user hasn't already made a selection
        // for this exact class (prevents wiping electives when navigating back to this step)
        const existingIds = watch('subject_ids') ?? []
        if (existingIds.length === 0) {
          const coreSubjectIds = subjList.filter(s => s.is_core).map(s => String(s.id))
          setValue('subject_ids', coreSubjectIds)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSubj(false))
  }, [classId, selectedClass?.stream, setValue])

  const toggleSubject = (subjectId) => {
    const current = subjectIds || []
    const updated = current.includes(subjectId)
      ? current.filter(id => id !== subjectId)
      : [...current, subjectId]
    setValue('subject_ids', updated)
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div
          className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 space-y-6 shadow-xl shadow-indigo-500/5"
        >
          <SectionHeading title="Enrollment" subtitle="Assign class, section and subjects" />

          {/* Hidden field for session_id validation */}
          <input type="hidden" {...register('session_id')} />

          {isPartialSuccess && (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-sm text-indigo-700 flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                <strong>Student record is already saved.</strong> You can now adjust enrollment details to fix the previous failure. 
                Navigation back to Identity or Profile is disabled.
              </p>
            </div>
          )}

          {!currentSession && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700 font-medium">
              ⚠️ No active session found. Please set up a current session before admitting students.
            </div>
          )}

          {currentSession && (
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2563eb' }} />
              <p className="text-sm text-blue-700">
                Enrolling in current session: <strong>{currentSession.name}</strong>
              </p>
            </div>
          )}

          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${!currentSession ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select
                  label="Class"
                  required
                  error={errors.class_id?.message}
                  options={classes}
                  placeholder={loadingC ? 'Loading…' : 'Select class'}
                  disabled={loadingC || !currentSession}
                  {...register('class_id')}
                />
              </div>
              <button
                type="button"
                disabled={!currentSession}
                onClick={handleAddNewClassInline}
                className="px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-semibold shrink-0 transition-colors disabled:opacity-50"
                style={{ height: '42px', display: 'flex', alignItems: 'center' }}
              >
                + Add New
              </button>
            </div>
            <Select
              label="Section"
              required
              error={errors.section_id?.message}
              options={sections}
              placeholder={!classId ? 'Select class first' : loadingS ? 'Loading…' : 'Select section'}
              disabled={!classId || loadingS || !currentSession}
              {...register('section_id')}
            />
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select
                  label="Stream (Optional)"
                  error={errors.stream?.message}
                  options={streamOptions}
                  placeholder={selectedClass?.stream ? 'Stream from selected class' : 'Select stream'}
                  disabled={Boolean(selectedClass?.stream) || !currentSession}
                  {...register('stream')}
                />
              </div>
              <button
                type="button"
                disabled={Boolean(selectedClass?.stream) || !currentSession}
                onClick={handleAddNewStreamInline}
                className="px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-semibold shrink-0 transition-colors disabled:opacity-50"
                style={{ height: '42px', display: 'flex', alignItems: 'center' }}
              >
                + Add New
              </button>
            </div>
            <Select
              label="Medium (Optional)"
              options={[
                { value: 'English', label: 'English' },
                { value: 'Assamese', label: 'Assamese' },
              ]}
              disabled={!currentSession}
              {...register('medium')}
            />
            <Select
              label="Joining Type"
              required
              error={errors.joining_type?.message}
              options={JOINING_TYPES}
              disabled={!currentSession}
              {...register('joining_type')}
            />
            <Input
              label="Joining Date"
              type="date"
              required
              error={errors.joined_date?.message}
              disabled={!currentSession}
              {...register('joined_date')}
            />
            <Select
              label="Hostel Required (Optional)"
              options={[
                { value: 'false', label: 'No' },
                { value: 'true', label: 'Yes' },
              ]}
              disabled={!currentSession}
              {...register('is_hostel', { setValueAs: v => v === 'true' })}
            />
            <Input
              label="Distance from School (km) (Optional)"
              type="number"
              step="0.1"
              placeholder="0.0"
              disabled={!currentSession}
              {...register('distance_km')}
            />
            <Input
              label="Prev. Year Attendance (Days) (Optional)"
              type="number"
              placeholder="0"
              disabled={!currentSession}
              {...register('prev_attendance_days')}
            />
            <Input
              label="Roll Number (Optional)"
              placeholder="Leave blank for auto-assign"
              hint="Auto-assigned sequentially if left blank"
              disabled={!currentSession}
              {...register('roll_number')}
            />
          </div>

          {/* Subject Selection */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Subjects
              <span className="ml-2 text-xs font-normal" style={{ color: 'var(--color-text-secondary)' }}>
                (Core subjects are pre-selected)
              </span>
            </h3>

            {!classId ? (
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Select a class first to see available subjects
              </p>
            ) : loadingSubj ? (
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading subjects…</p>
            ) : subjects.length === 0 ? (
              <p className="text-sm text-amber-600">No subjects configured for this class yet.</p>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${!currentSession ? 'opacity-50 pointer-events-none' : ''}`}>
                {subjects.map((subject) => {
                  const isSelected = subjectIds?.includes(String(subject.id))
                  return (
                    <label
                      key={subject.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                        ${isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        checked={isSelected}
                        disabled={!currentSession}
                        onChange={() => toggleSubject(String(subject.id))}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {subject.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {subject.code} • {subject.subject_type}
                        </p>
                      </div>
                      {subject.is_core && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400">
                          Core
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mt-6">
          <Button 
            variant="secondary" 
            type="button" 
            onClick={onBack}
            disabled={isPartialSuccess}
            className={isPartialSuccess ? 'opacity-30 cursor-not-allowed' : ''}
          >
            ← Back
          </Button>
          <Button type="submit" disabled={!currentSession} className="shadow-lg shadow-indigo-500/20">
            Continue to Documents →
          </Button>
        </div>
      </form>

      {/* Add Custom Stream Modal */}
      {showAddStreamModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="border shadow-2xl rounded-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Add Custom Stream
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Create a custom academic stream (e.g. Vocational, Humanities) to assign to students.
            </p>
            
            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Stream Name
              </label>
              <input
                type="text"
                autoFocus
                value={newInlineStreamName}
                onChange={(e) => setNewInlineStreamName(e.target.value)}
                placeholder="e.g. Vocational"
                maxLength={50}
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/20"
                style={{
                  backgroundColor: 'var(--color-surface-raised)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <button
                type="button"
                onClick={() => {
                  setShowAddStreamModal(false)
                  setNewInlineStreamName('')
                }}
                className="px-4 py-2 text-xs font-semibold bg-white dark:bg-gray-800 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingInlineStream || !newInlineStreamName.trim()}
                onClick={handleCreateStreamInline}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 dark:bg-indigo-500 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingInlineStream && (
                  <Loader2 className="animate-spin" size={12} />
                )}
                Create Stream
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="border shadow-2xl rounded-2xl p-6 max-w-xl w-full my-8 animate-in fade-in zoom-in-95 duration-200"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex justify-between items-center pb-3 border-b mb-4" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Add New Class
              </h3>
              <button
                type="button"
                onClick={() => setShowAddClassModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>
            
            <ClassForm
              onSubmit={handleCreateClassInlineSubmit}
              onCancel={() => setShowAddClassModal(false)}
              isSaving={isSavingClassInline}
            />
          </div>
        </div>
      )}
    </>
  )
}

export default StepEnrollment
