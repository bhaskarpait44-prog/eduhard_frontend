import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Plus, Loader2, AlertCircle } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { streamApi } from '@/api'

const StreamManagementPage = () => {
  usePageTitle('Stream Management')
  const navigate = useNavigate()
  const { toastSuccess, toastError } = useToast()

  const [streams, setStreams] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [newStreamName, setNewStreamName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchStreams = async () => {
    try {
      const res = await streamApi.getStreams()
      if (res && Array.isArray(res.data)) {
        setStreams(res.data)
      }
    } catch (err) {
      toastError(err.message || 'Failed to load streams.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStreams()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    const trimmed = newStreamName.trim()
    if (!trimmed) return

    setIsSaving(true)
    try {
      await streamApi.createStream({ name: trimmed })
      toastSuccess(`Stream "${trimmed}" created successfully.`)
      setNewStreamName('')
      fetchStreams()
    } catch (err) {
      toastError(err.message || 'Failed to create stream.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the stream "${name}"? This cannot be undone.`)) {
      return
    }
    setDeletingId(id)
    try {
      await streamApi.deleteStream(id)
      toastSuccess(`Stream "${name}" deleted successfully.`)
      fetchStreams()
    } catch (err) {
      toastError(err.message || 'Failed to delete stream.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          style={{ color: 'var(--color-text-secondary)' }}
          title="Go Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Stream Management
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Create and manage academic streams for class assignments and student promotions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6 items-start">
        {/* Left Side: Streams List */}
        <div
          className="rounded-2xl border p-6 space-y-4 shadow-sm"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Registered Streams
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
          ) : streams.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              <AlertCircle size={24} className="text-gray-400 dark:text-gray-500 mb-2" />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                No custom streams configured.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[240px]">
                Standard streams like Regular, Arts, Science, and Commerce will apply by default.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {streams.map((stream) => {
                const isDefault = ['regular', 'arts', 'commerce', 'science'].includes(stream.name.toLowerCase())
                return (
                  <div
                    key={stream.id}
                    className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 group"
                  >
                    <div>
                      <p className="text-sm font-semibold capitalize" style={{ color: 'var(--color-text-primary)' }}>
                        {stream.name}
                      </p>
                      {isDefault && (
                        <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                          System Default
                        </span>
                      )}
                    </div>

                    {!isDefault && (
                      <button
                        onClick={() => handleDelete(stream.id, stream.name)}
                        disabled={deletingId === stream.id}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-55/50 dark:hover:bg-red-950/20 hover:text-red-600 disabled:opacity-40 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title={`Delete ${stream.name}`}
                      >
                        {deletingId === stream.id ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Side: Add New Stream Form */}
        <div
          className="rounded-2xl border p-6 space-y-4 shadow-sm"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Add New Stream
          </h2>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Create custom academic streams (e.g., "Vocational", "Humanities") tailored to your school.
          </p>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Stream Name
              </label>
              <input
                type="text"
                required
                disabled={isSaving}
                value={newStreamName}
                onChange={(e) => setNewStreamName(e.target.value)}
                placeholder="e.g. Vocational"
                maxLength={50}
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/20"
                style={{
                  backgroundColor: 'var(--color-surface-raised)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSaving || !newStreamName.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Saving Stream...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create Stream
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default StreamManagementPage
