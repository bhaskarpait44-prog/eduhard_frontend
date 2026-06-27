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
  pdf:  { bg: 'rgba(220,38,38,0.10)',  color: '#dc2626' },
  doc:  { bg: 'rgba(37,99,235,0.10)',  color: '#2563eb' },
  docx: { bg: 'rgba(37,99,235,0.10)',  color: '#2563eb' },
  ppt:  { bg: 'rgba(217,119,6,0.10)',  color: '#d97706' },
  pptx: { bg: 'rgba(217,119,6,0.10)',  color: '#d97706' },
  xlsx: { bg: 'rgba(22,163,74,0.10)',  color: '#16a34a' },
  xls:  { bg: 'rgba(22,163,74,0.10)',  color: '#16a34a' },
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
    <div className="sm-page">

      {/* ── Compact Action Bar ── */}
      <div className="sm-action-bar">
        <div className="sm-action-bar__left">
          <div className="sm-page-icon">
            <BookOpenText size={18} />
          </div>
          <div>
            <p className="sm-page-label">Materials</p>
            <h1 className="sm-page-title">Study Materials</h1>
          </div>
        </div>
        <Button variant="secondary" onClick={handleRefresh} loading={refreshing} icon={RefreshCw} size="sm">
          Refresh
        </Button>
      </div>

      {/* ── Filter Toolbar Card ── */}
      <div className="sm-filter-card">
        <div className="sm-filter-row">
          <div className="sm-filter-field">
            <label htmlFor="sm-subject-select" className="sm-filter-label">
              <Search size={12} />
              Filter by Subject
            </label>
            <div className="sm-select-wrap">
              <select
                id="sm-subject-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="sm-select"
              >
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject === 'all' ? 'All subjects' : subject}
                  </option>
                ))}
              </select>
              <span className="sm-select-arrow" aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
          </div>

          <div className="sm-count-chip">
            <p className="sm-count-chip__label">Available</p>
            <p className="sm-count-chip__value">{filteredMaterials.length}</p>
          </div>
        </div>
      </div>

      {/* ── Materials Grid ── */}
      {loading ? (
        <div className="sm-skeleton">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="sm-skeleton__card" />
          ))}
        </div>
      ) : filteredMaterials.length > 0 ? (
        <div className="sm-grid">
          {filteredMaterials.map((item) => {
            const typeTone = getFileTypeTone(item.file_type)
            return (
              <article key={item.id} className="sm-card">
                {/* Left accent bar */}
                <div className="sm-card__accent" style={{ backgroundColor: typeTone.color }} />

                <div className="sm-card__body">
                  {/* Header row */}
                  <div className="sm-card__header">
                    <div className="sm-card__meta-tags">
                      <span className="sm-tag sm-tag--subject">{item.subject_name}</span>
                      <span className="sm-tag" style={{ backgroundColor: typeTone.bg, color: typeTone.color }}>
                        {prettyFileType(item.file_type)}
                      </span>
                    </div>
                    <div className="sm-card__file-icon" style={{ backgroundColor: typeTone.bg, color: typeTone.color }}>
                      <FileText size={18} />
                    </div>
                  </div>

                  {/* Title + description */}
                  <h2 className="sm-card__title">{item.title}</h2>
                  <p className="sm-card__desc">
                    {item.description || 'Study material shared by your teacher.'}
                  </p>

                  {/* Meta chips */}
                  <div className="sm-meta-row">
                    <MetaChip label="Teacher" value={item.teacher_name} isOnline={item.is_online} />
                    <MetaChip label="Added"   value={formatDate(item.created_at, 'short')} />
                    <MetaChip label="Size"    value={formatFileSize(item.file_size)} />
                    <MetaChip label="Viewed"  value={item.last_viewed_at ? formatDate(item.last_viewed_at, 'short') : 'Not yet'} />
                  </div>

                  {/* Actions */}
                  <div className="sm-card__actions">
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
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookOpenText}
          title="No study materials available"
          description="New teacher-uploaded notes and resources will appear here."
        />
      )}

      {/* ── Detail Modal ── */}
      <Modal
        open={Boolean(selectedMaterial) || detailLoading}
        onClose={() => setSelectedMaterial(null)}
        title={selectedMaterial?.title || 'Study Material'}
        size="lg"
      >
        {detailLoading && !selectedMaterial ? (
          <div className="sm-modal-skeleton">
            <div className="sm-modal-skeleton__block sm-modal-skeleton__block--short" />
            <div className="sm-modal-skeleton__block sm-modal-skeleton__block--tall" />
          </div>
        ) : selectedMaterial ? (
          <div className="sm-modal-body">
            <div className="sm-info-grid">
              <InfoCard label="Subject"     value={selectedMaterial.subject_name} />
              <InfoCard label="Teacher"     value={selectedMaterial.teacher_name} />
              <InfoCard label="Created"     value={formatDate(selectedMaterial.created_at, 'long')} />
              <InfoCard label="File Type"   value={prettyFileType(selectedMaterial.file_type)} />
              <InfoCard label="File Size"   value={formatFileSize(selectedMaterial.file_size)} />
              <InfoCard label="Description" value={selectedMaterial.description || 'No description provided.'} />
            </div>

            {selectedMaterial.file_path ? (
              <div className="sm-modal-footer">
                <Button
                  onClick={() => window.open(getFileUrl(selectedMaterial.file_path), '_blank', 'noopener,noreferrer')}
                  icon={Download}
                >
                  Open Material File
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <style>{`
        /* ── Page ── */
        .sm-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ── Action Bar ── */
        .sm-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .sm-action-bar__left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sm-page-icon {
          display: flex;
          height: 38px;
          width: 38px;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background-color: rgba(124, 58, 237, 0.10);
          color: var(--student-accent);
          flex-shrink: 0;
        }

        .sm-page-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1;
        }

        .sm-page-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 2px 0 0 0;
          line-height: 1.2;
        }

        /* ── Filter Toolbar Card ── */
        .sm-filter-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 18px;
          padding: 16px;
        }

        .sm-filter-row {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        @media (min-width: 540px) {
          .sm-filter-row {
            flex-direction: row;
            align-items: flex-end;
          }
        }

        .sm-filter-field {
          flex: 1;
          min-width: 0;
        }

        .sm-filter-label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin-bottom: 8px;
        }

        /* Custom select */
        .sm-select-wrap {
          position: relative;
        }

        .sm-select {
          display: block;
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          background-color: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 10px 36px 10px 14px;
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-primary);
          cursor: pointer;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          outline: none;
        }

        .sm-select:focus {
          border-color: var(--student-accent);
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
        }

        .sm-select-arrow {
          pointer-events: none;
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
        }

        /* Count chip */
        .sm-count-chip {
          background-color: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 10px 16px;
          flex-shrink: 0;
        }

        .sm-count-chip__label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1;
        }

        .sm-count-chip__value {
          font-size: 20px;
          font-weight: 800;
          color: var(--color-text-primary);
          margin: 3px 0 0 0;
          line-height: 1;
        }

        /* ── Skeleton ── */
        .sm-skeleton {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          animation: smPulse 1.6s ease-in-out infinite;
        }

        @media (min-width: 1024px) {
          .sm-skeleton { grid-template-columns: 1fr 1fr; }
        }

        .sm-skeleton__card {
          height: 200px;
          border-radius: 18px;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
        }

        @keyframes smPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }

        /* ── Materials Grid ── */
        .sm-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        @media (min-width: 1024px) {
          .sm-grid { grid-template-columns: 1fr 1fr; }
        }

        /* ── Material Card ── */
        .sm-card {
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid var(--color-border);
          background-color: var(--color-surface);
          display: flex;
          transition: border-color 0.18s ease, transform 0.18s ease;
        }

        .sm-card:hover {
          border-color: color-mix(in srgb, var(--color-border) 60%, var(--student-accent) 40%);
          transform: translateY(-2px);
        }

        /* Left accent bar */
        .sm-card__accent {
          width: 4px;
          flex-shrink: 0;
          border-radius: 18px 0 0 18px;
        }

        /* Card body */
        .sm-card__body {
          flex: 1;
          min-width: 0;
          padding: 16px 16px 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* Header */
        .sm-card__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .sm-card__meta-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }

        .sm-tag {
          display: inline-block;
          padding: 3px 9px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .sm-tag--subject {
          background-color: var(--student-accent-soft);
          color: var(--student-accent);
        }

        .sm-card__file-icon {
          display: flex;
          height: 40px;
          width: 40px;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .sm-card:hover .sm-card__file-icon {
          transform: scale(1.08);
        }

        /* Title & desc */
        .sm-card__title {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 10px 0 4px;
          line-height: 1.35;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sm-card__desc {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin: 0 0 12px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Meta row */
        .sm-meta-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }

        @media (min-width: 500px) {
          .sm-meta-row { grid-template-columns: repeat(4, 1fr); }
        }

        /* Meta chip */
        .sm-meta-chip {
          background-color: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          padding: 7px 10px;
        }

        .sm-meta-chip__label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1;
        }

        .sm-meta-chip__value {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 3px 0 0;
          line-height: 1.2;
        }

        .sm-meta-chip__online {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #6366f1;
          animation: smPulse 1.6s ease-in-out infinite;
          flex-shrink: 0;
        }

        /* Card actions */
        .sm-card__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        /* ── Modal body ── */
        .sm-modal-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sm-modal-skeleton {
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: smPulse 1.6s ease-in-out infinite;
        }

        .sm-modal-skeleton__block {
          border-radius: 14px;
          background-color: var(--color-surface-raised);
        }

        .sm-modal-skeleton__block--short { height: 80px; }
        .sm-modal-skeleton__block--tall  { height: 192px; }

        .sm-info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        @media (min-width: 540px) {
          .sm-info-grid { grid-template-columns: 1fr 1fr; }
        }

        .sm-info-card {
          background-color: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          padding: 12px 14px;
        }

        .sm-info-card__label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1;
        }

        .sm-info-card__value {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 5px 0 0;
          line-height: 1.4;
        }

        .sm-modal-footer {
          display: flex;
          justify-content: flex-end;
          padding-top: 4px;
        }
      `}</style>
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

const MetaChip = ({ label, value, isOnline }) => (
  <div className="sm-meta-chip">
    <p className="sm-meta-chip__label">{label}</p>
    <div className="sm-meta-chip__value">
      {value || '—'}
      {isOnline && <span className="sm-meta-chip__online" title="Online now" />}
    </div>
  </div>
)

const InfoCard = ({ label, value }) => (
  <div className="sm-info-card">
    <p className="sm-info-card__label">{label}</p>
    <p className="sm-info-card__value">{value || '—'}</p>
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
