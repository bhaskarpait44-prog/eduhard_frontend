// src/components/classes/ClassForm.jsx
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Loader2 } from 'lucide-react'
import { getStreams, createStream } from '@/api/streamApi'

const Field = ({ label, error, children, required, hint }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
        <AlertCircle size={11}/>{error}
      </p>
    )}
    {hint && !error && (
      <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
    )}
  </div>
)

const inputCls = (hasError) => `
  w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-all
  bg-white dark:bg-gray-800
  text-gray-900 dark:text-gray-100
  placeholder:text-gray-400 dark:placeholder:text-gray-500
  ${hasError
    ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/30'
    : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20'
  }
`

const ClassForm = ({
  defaultValues = {},
  onSubmit,
  onCancel,
  isSaving = false,
  isEdit   = false,
}) => {
  const [streams, setStreams] = useState([])
  const [isLoadingStreams, setIsLoadingStreams] = useState(false)
  const [isAddingStreamInline, setIsAddingStreamInline] = useState(false)
  const [newInlineStreamName, setNewInlineStreamName] = useState('')
  const [isSavingInlineStream, setIsSavingInlineStream] = useState(false)

  useEffect(() => {
    setIsLoadingStreams(true)
    getStreams()
      .then((res) => {
        if (res && Array.isArray(res.data)) {
          setStreams(res.data)
        }
      })
      .catch((err) => console.error('Failed to fetch streams:', err))
      .finally(() => setIsLoadingStreams(false))
  }, [])

  const streamOptions = streams.length > 0
    ? streams.map(s => ({ value: s.name, label: s.name.charAt(0).toUpperCase() + s.name.slice(1) }))
    : [
        { value: 'regular', label: 'Regular' },
        { value: 'arts', label: 'Arts' },
        { value: 'commerce', label: 'Commerce' },
        { value: 'science', label: 'Science' },
      ]

  const schema = z
    .object({
      name         : z.string().min(1, 'Class name is required').max(100),
      display_name : z.string().max(100).optional().nullable().or(z.literal('')),
      order_number : z.coerce.number().int().min(1, 'Order number required'),
      stream       : z.string().max(50).optional().or(z.literal('')),
      min_age      : z.coerce.number().int().min(1).max(25).optional().nullable().or(z.literal('')),
      max_age      : z.coerce.number().int().min(1).max(30).optional().nullable().or(z.literal('')),
      description  : z.string().max(1000).optional().nullable(),
      reason       : isEdit
        ? z.string().min(10, 'Reason must be at least 10 characters').max(500)
        : z.string().optional(),
    })
    .refine(d => {
      if (d.min_age && d.max_age) return parseInt(d.max_age) > parseInt(d.min_age)
      return true
    }, { message: 'Max age must be greater than min age', path: ['max_age'] })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver     : zodResolver(schema),
    defaultValues: {
      name        : '',
      order_number: '',
      min_age     : '',
      max_age     : '',
      description : '',
      reason      : '',
      ...defaultValues,
      stream      : defaultValues.stream || 'regular',
    },
  })

  const handleAddNewStreamInline = () => {
    setNewInlineStreamName('')
    setIsAddingStreamInline(true)
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
      setIsAddingStreamInline(false)
      setNewInlineStreamName('')
    } catch (err) {
      alert(err.message || 'Failed to create stream.')
    } finally {
      setIsSavingInlineStream(false)
    }
  }

  const handleFormSubmit = (data) => {
    // Normalize empty optional fields before sending to the API.
    const clean = {
      ...data,
      stream      : data.stream || 'regular',
      min_age     : data.min_age || null,
      max_age     : data.max_age || null,
      description : data.description || null,
    }
    onSubmit(clean)
  }

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
 
        <Field
          label="Class Name"
          error={errors.name?.message}
          hint="Use names like LKG, UKG, Class 1, Class 2 ... Class 12"
          required
        >
          <input
            {...register('name')}
            placeholder="Class 1"
            className={inputCls(!!errors.name)}
          />
        </Field>
 
        {/* Display Name */}
        <Field
          label="Display Name"
          error={errors.display_name?.message}
          hint="Optional custom label (e.g. 'Class 1 - A' or 'Primary 1')"
        >
          <input
            {...register('display_name')}
            placeholder="e.g. Primary 1"
            className={inputCls(!!errors.display_name)}
          />
        </Field>
 
        {/* Order Number */}
        <Field
          label="Order Number"
          error={errors.order_number?.message}
          hint="Determines promotion sequence — Grade 1 = 1, Grade 2 = 2"
          required
        >
          <input
            {...register('order_number')}
            type="number"
            min="1"
            placeholder="6"
            className={inputCls(!!errors.order_number)}
          />
        </Field>
 
        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Field
                label="Stream"
                error={errors.stream?.message}
                hint="Default is Regular; select a stream or click Add New to create one"
                required
              >
                <select
                  {...register('stream')}
                  className={inputCls(!!errors.stream)}
                >
                  {streamOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <button
              type="button"
              onClick={handleAddNewStreamInline}
              className="px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-semibold shrink-0 transition-colors"
              style={{ height: '42px', display: 'flex', alignItems: 'center' }}
            >
              + Add New
            </button>
          </div>

          {isAddingStreamInline && (
            <div 
              className="p-3.5 rounded-xl border border-dashed animate-in fade-in slide-in-from-top-1 duration-200"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                borderColor: 'var(--color-border)',
              }}
            >
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                New Stream Name
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  autoFocus
                  value={newInlineStreamName}
                  onChange={(e) => setNewInlineStreamName(e.target.value)}
                  placeholder="e.g. Vocational"
                  maxLength={50}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none transition-all focus:ring-2 focus:ring-indigo-500/20"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <button
                  type="button"
                  disabled={isSavingInlineStream || !newInlineStreamName.trim()}
                  onClick={handleCreateStreamInline}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-755 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {isSavingInlineStream && (
                    <Loader2 className="animate-spin" size={10} />
                  )}
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingStreamInline(false)
                    setNewInlineStreamName('')
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
 
        {/* Age Range */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Min Age (years)" error={errors.min_age?.message}>
            <input
              {...register('min_age')}
              type="number"
              min="1"
              max="25"
              placeholder="10"
              className={inputCls(!!errors.min_age)}
            />
          </Field>
          <Field label="Max Age (years)" error={errors.max_age?.message}>
            <input
              {...register('max_age')}
              type="number"
              min="1"
              max="30"
              placeholder="13"
              className={inputCls(!!errors.max_age)}
            />
          </Field>
        </div>
 
        {/* Description */}
        <Field label="Description" error={errors.description?.message}>
          <textarea
            {...register('description')}
            placeholder="Optional notes about this class"
            rows={2}
            className={inputCls(!!errors.description) + ' resize-none'}
          />
        </Field>
 
        {/* Reason — only for edits */}
        {isEdit && (
          <Field label="Reason for Change" error={errors.reason?.message} required>
            <input
              {...register('reason')}
              placeholder="Brief reason for this update"
              className={inputCls(!!errors.reason)}
            />
          </Field>
        )}
 
        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {isSaving && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            )}
            {isSaving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Class'}
          </button>
        </div>
      </form>


    </>
  )
}

export default ClassForm
