import { useEffect, useMemo, useState } from 'react'
import { BookOpenText, Download, Eye, FileText, RefreshCw, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import * as studentApi from '@/api/studentApi'
import { formatDate, getFileUrl } from '@/utils/helpers'
import { isStudentPortalSetupError } from '@/utils/studentPortal'

const FILE_TYPE_TONES = {
  pdf: { bg: 'rgba(220,38,38,0.10)', color: '#dc2626' },
  doc: { bg: 'rgba(37,99,235,0.10)', color: '#2563eb' },
  docx: { bg: 'rgba(37,99,235,0.10)', color: '#2563eb' },
  ppt: { bg: 'rgba(217,119,6,0.10)', color: '#d97706' },
  pptx: { bg: 'rgba(217,119,6,0.10)', color: '#d97706' },
  xlsx: { bg: 'rgba(22,163,74,0.10)', color: '#16a34a' },
  xls: { bg: 'rgba(22,163,74,0.10)', color: '#16a34a' },
  image: { bg: 'rgba(124,58,237,0.10)', color: '#7c3aed' },
  video: { bg: 'rgba(236,72,153,0.10)', color: '#ec4899' },
}

function getFileTypeTone(fileType) {
  const key = String(fileType || '').toLowerCase().replace(/[^a-z]/g, '')
  return FILE_TYPE_TONES[key] || { bg: 'rgba(124,58,237,0.10)', color: 'var(--student-accent)' }
}

const StudyMaterials = () => {
  usePageTitle('Study Materials')

  const { toastError, toastInfo } = useToast()
  const [materials, setMaterials] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState(null)

  const subjectOptions = useMemo(
    () => ['all', ...new Map(materials.map((item) => [item.subject_name, item.subject_name])).values()],
    [materials]
  )

  const filteredMaterials = useMemo(() => {
    if (selectedSubject === 'all') return materials
    return materials.filter((item) => item.subject_name === selectedSubject)
  }, [materials, selectedSubject])

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  useEffect(() => {
    loadMaterials().catch(() => {})
  }, [])

  const loadMaterials = async ({ silent = false } = {}) => {
    setError(null)
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await studentApi.getStudentMaterials()
      setMaterials(res?.data?.materials || [])
      setLoading(false)
      setRefreshing(false)
    } catch (err) {
      if (isStudentPortalSetupError(err)) {
        setMaterials([])
        setLoading(false)
        setRefreshing(false)
        return
      }

      setError(err?.message || 'Unable to load study materials.')
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    toastInfo('Refreshing study materials')
    await loadMaterials({ silent: true })
  }

  const handleOpenMaterial = async (materialId) => {
    setDetailLoading(true)
    try {
      const res = await studentApi.getStudentMaterialDetail(materialId)
      setSelectedMaterial(res?.data || null)
      setDetailLoading(false)
    } catch (err) {
      setDetailLoading(false)
      toastError(err?.message || 'Unable to open study material.')
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden rounded-3xl border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(109,40,217,0.18), rgba(34,197,94,0.07) 52%, var(--color-surface) 100%)',
          boxShadow: '0 4px 24px rgba(109,40,217,0.08)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #7c3aed, #16a34a)' }} />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm"
              style={{ backgroundColor: 'rgba(124,58,237,0.12)', color: 'var(--student-accent)' }}
            >
              <BookOpenText size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--student-accent)' }}>
                Materials
              </p>
              <h1 className="mt-1.5 text-2xl font-bold sm:text-3xl">Study Materials</h1>
              <p className="mt-1.5 max-w-2xl text-[13px] text-[var(--color-text-secondary)] sm:text-[15px]">
                Open notes, worksheets, and subject resources shared by your teachers for your class.
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={handleRefresh} loading={refreshing} icon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </section>

      {/* ── Filter bar ── */}
      <section
        className="rounded-3xl border p-4"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block">
              <span className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                <Search size={12} />
                Filter by Subject
              </span>
              <select
                value={selectedSubject}
                onChange={(event) => setSelectedSubject(event.target.value)}
                className="min-h-11 w-full rounded-2xl border px-4 py-2.5 text-sm font-medium transition focus:outline-none"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
              >
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject === 'all' ? 'All subjects' : subject}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div
            className="rounded-2xl border px-4 py-2.5 text-sm shrink-0"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Available</p>
            <p className="mt-0.5 text-lg font-black text-[var(--color-text-primary)]">{filteredMaterials.length}</p>
          </div>
        </div>
      </section>

      {/* ── Materials grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 animate-pulse">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-52 rounded-3xl bg-[var(--color-surface)]" />
          ))}
        </div>
      ) : filteredMaterials.length > 0 ? (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredMaterials.map((item) => {
            const typeTone = getFileTypeTone(item.file_type)
            return (
              <article
                key={item.id}
                className="group relative overflow-hidden rounded-3xl border p-5 transition-all duration-300 hover:-translate-y-1"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  boxShadow: '0 2px 12px rgba(76,29,149,0.05)',
                }}
              >
                {/* Left accent */}
                <div
                  className="absolute inset-y-0 left-0 w-1 rounded-full"
                  style={{ backgroundColor: typeTone.color }}
                />

                <div className="flex items-start justify-between gap-3 pl-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                        style={{ backgroundColor: 'var(--student-accent-soft)', color: 'var(--student-accent)' }}
                      >
                        {item.subject_name}
                      </span>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                        style={{ backgroundColor: typeTone.bg, color: typeTone.color }}
                      >
                        {prettyFileType(item.file_type)}
                      </span>
                    </div>

                    <h2 className="mt-2.5 text-[15px] font-bold text-[var(--color-text-primary)] line-clamp-1">
                      {item.title}
                    </h2>
                    <p className="mt-1.5 line-clamp-2 text-[13px] text-[var(--color-text-secondary)]">
                      {item.description || 'Study material shared by your teacher.'}
                    </p>
                  </div>

                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110"
                    style={{ backgroundColor: typeTone.bg, color: typeTone.color }}
                  >
                    <FileText size={20} />
                  </div>
                </div>

                {/* Meta info */}
                <div className="mt-4 grid grid-cols-2 gap-2 pl-2 sm:grid-cols-4">
                  <MetaChip label="Teacher" value={item.teacher_name} isOnline={item.is_online} />
                  <MetaChip label="Added" value={formatDate(item.created_at, 'short')} />
                  <MetaChip label="Size" value={formatFileSize(item.file_size)} />
                  <MetaChip label="Viewed" value={item.last_viewed_at ? formatDate(item.last_viewed_at, 'short') : 'Not yet'} />
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2 pl-2">
                  <Button size="sm" onClick={() => handleOpenMaterial(item.id)} icon={Eye}>
                    Open Detail
                  </Button>
                  {item.file_path ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(getFileUrl(item.file_path), '_blank', 'noopener,noreferrer')}
                      icon={Download}
                    >
                      Open File
                    </Button>
                  ) : null}
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <EmptyState
          icon={BookOpenText}
          title="No study materials available"
          description="New teacher-uploaded notes and resources will appear here."
        />
      )}

      {/* Detail modal */}
      <Modal
        open={Boolean(selectedMaterial) || detailLoading}
        onClose={() => setSelectedMaterial(null)}
        title={selectedMaterial?.title || 'Study Material'}
        size="lg"
      >
        {detailLoading && !selectedMaterial ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 rounded-2xl bg-[var(--color-surface-raised)]" />
            <div className="h-48 rounded-2xl bg-[var(--color-surface-raised)]" />
          </div>
        ) : selectedMaterial ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoCard label="Subject" value={selectedMaterial.subject_name} />
              <InfoCard label="Teacher" value={selectedMaterial.teacher_name} />
              <InfoCard label="Created" value={formatDate(selectedMaterial.created_at, 'long')} />
              <InfoCard label="File Type" value={prettyFileType(selectedMaterial.file_type)} />
              <InfoCard label="File Size" value={formatFileSize(selectedMaterial.file_size)} />
              <InfoCard label="Description" value={selectedMaterial.description || 'No description provided.'} />
            </div>

            {selectedMaterial.file_path ? (
              <div className="flex justify-end pt-2">
                <Button onClick={() => window.open(getFileUrl(selectedMaterial.file_path), '_blank', 'noopener,noreferrer')} icon={Download}>
                  Open Material File
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

const MetaChip = ({ label, value, isOnline }) => (
  <div
    className="rounded-xl border px-3 py-2"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
  >
    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p>
    <div className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-[var(--color-text-primary)]">
      {value || '—'}
      {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" title="Online now" />}
    </div>
  </div>
)

const InfoCard = ({ label, value }) => (
  <div className="rounded-2xl border px-4 py-3.5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-1.5 text-[13px] font-semibold text-[var(--color-text-primary)]">{value || '—'}</p>
  </div>
)

/* ─── Utility helpers ─────────────────────────────────────────────────────── */

function prettyFileType(value) {
  return String(value || 'file')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatFileSize(value) {
  const size = Number(value || 0)
  if (!size) return 'Unknown'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default StudyMaterials
