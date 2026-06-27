import { useEffect, useMemo, useState } from 'react'
import { BookOpenText, RefreshCw, CalendarDays, ChevronDown, SlidersHorizontal, User2, CalendarClock, Tag, Paperclip, FileText, CheckCircle2, Clock, Star, MessageSquare, Upload, AlertCircle, Send } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import HomeworkCard from '@/components/shared/HomeworkCard'
import HomeworkSubmitForm from '@/components/student/HomeworkSubmitForm'
import Modal from '@/components/ui/Modal'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentHomework from '@/hooks/useStudentHomework'
import useToast from '@/hooks/useToast'
import { formatDate } from '@/utils/helpers'

const statusTabs = ['all', 'due_today', 'pending', 'submitted', 'overdue', 'graded']

const HomeworkList = () => {
  usePageTitle('Homework')

  const { toastError, toastInfo, toastSuccess } = useToast()
  const {
    homework,
    selectedHomework,
    loading,
    refreshing,
    detailLoading,
    submitting,
    error,
    refresh,
    openHomework,
    closeHomework,
    submitHomework,
    subjects,
  } = useStudentHomework()

  const [statusFilter, setStatusFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [sortBy, setSortBy] = useState('due_date')

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const filteredHomework = useMemo(() => {
    const rows = homework
      .filter((item) => statusFilter === 'all' || item.student_status === statusFilter)
      .filter((item) => subjectFilter === 'all' || item.subject_name === subjectFilter)

    return [...rows].sort((a, b) => {
      if (sortBy === 'subject') return String(a.subject_name).localeCompare(String(b.subject_name))
      if (sortBy === 'status') return String(a.student_status).localeCompare(String(b.student_status))
      return String(a.due_date).localeCompare(String(b.due_date))
    })
  }, [homework, sortBy, statusFilter, subjectFilter])

  const calendarDays = useMemo(() => {
    const map = new Map()
    homework.forEach((item) => {
      const key = String(item.due_date)
      const tone = item.student_status === 'submitted' || item.student_status === 'graded'
        ? 'green'
        : item.student_status === 'overdue'
          ? 'amber'
          : 'red'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push({ title: item.title, tone })
    })
    return [...map.entries()].slice(0, 12)
  }, [homework])

  const handleRefresh = async () => {
    toastInfo('Refreshing homework')
    try {
      await refresh()
    } catch {}
  }

  const handleOpen = async (item) => {
    try {
      await openHomework(item.id)
    } catch (err) {
      toastError(err?.message || 'Unable to open homework.')
    }
  }

  const handleSubmit = async (payload) => {
    if (!selectedHomework) return
    try {
      await submitHomework(selectedHomework.id, payload)
      toastSuccess('Homework submitted successfully.')
    } catch (err) {
      toastError(err?.message || 'Unable to submit homework.')
    }
  }

  return (
    <div className="hw-page">

      {/* ── Compact Action Bar ── */}
      <div className="hw-action-bar">
        <div className="hw-action-bar__left">
          <div className="hw-page-icon">
            <BookOpenText size={18} />
          </div>
          <div>
            <p className="hw-page-label">Academics</p>
            <h1 className="hw-page-title">Homework</h1>
          </div>
        </div>
        <Button variant="secondary" onClick={handleRefresh} loading={refreshing} icon={RefreshCw} size="sm">
          Refresh
        </Button>
      </div>

      {/* ── Filters Toolbar ── */}
      <div className="hw-toolbar">
        {/* Status Tabs */}
        <div className="hw-toolbar__top">
          <div className="hw-toolbar__label">
            <SlidersHorizontal size={13} />
            Filter by status
          </div>
          <div className="hw-status-tabs">
            {statusTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`hw-status-tab ${statusFilter === tab ? 'hw-status-tab--active' : ''}`}
              >
                {tab.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdowns */}
        <div className="hw-toolbar__bottom">
          <div className="hw-select-wrap">
            <label className="hw-select-label" htmlFor="hw-subject-filter">Subject</label>
            <div className="hw-select-field-wrap">
              <select
                id="hw-subject-filter"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="hw-select-field"
              >
                <option value="all">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              <div className="hw-select-icon"><ChevronDown size={14} /></div>
            </div>
          </div>

          <div className="hw-select-wrap">
            <label className="hw-select-label" htmlFor="hw-sort-by">Sort by</label>
            <div className="hw-select-field-wrap">
              <select
                id="hw-sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="hw-select-field"
              >
                <option value="due_date">Due date</option>
                <option value="subject">Subject</option>
                <option value="status">Status</option>
              </select>
              <div className="hw-select-icon"><ChevronDown size={14} /></div>
            </div>
          </div>

          {!loading && (
            <div className="hw-count-chip">
              {filteredHomework.length} item{filteredHomework.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* ── Homework List ── */}
      {loading ? (
        <div className="hw-list-card hw-skeleton-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="hw-skeleton-row" />
          ))}
        </div>
      ) : filteredHomework.length ? (
        <div className="hw-list-card">
          {/* List header */}
          <div className="hw-list-header">
            <span className="hw-list-header__col" style={{ minWidth: '90px', maxWidth: '110px' }}>Subject</span>
            <span className="hw-list-header__col" style={{ flex: 1 }}>Assignment</span>
            <span className="hw-list-header__col hw-list-header__col--right">Teacher · Due · Type</span>
          </div>
          {/* Rows */}
          <div className="hw-rows">
            {filteredHomework.map((item) => (
              <HomeworkCard key={item.id} item={item} onOpen={handleOpen} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={BookOpenText}
          title="No homework in this view"
          description="Try another status or subject filter to find your assignments."
        />
      )}


      {/* ── Homework Detail Modal ── */}
      <Modal
        open={Boolean(selectedHomework) || detailLoading}
        onClose={closeHomework}
        title={selectedHomework ? selectedHomework.title : 'Homework Detail'}
        size="lg"
      >
        {detailLoading && !selectedHomework ? (
          <div className="hw-modal-skeleton">
            <div className="hw-modal-skeleton__block" style={{ height: '80px' }} />
            <div className="hw-modal-skeleton__block" style={{ height: '48px', width: '60%' }} />
            <div className="hw-modal-skeleton__block" style={{ height: '120px' }} />
            <div className="hw-modal-skeleton__block" style={{ height: '160px' }} />
          </div>
        ) : selectedHomework && (
          <div className="hwm-body">

            {/* ── Status Hero Banner ── */}
            <div className="hwm-hero" style={heroStyle(selectedHomework.student_status)}>
              <div className="hwm-hero__left">
                <span className="hwm-hero__badge" style={badgeStyle(selectedHomework.student_status)}>
                  {statusIcon(selectedHomework.student_status)}
                  {selectedHomework.student_status.replace(/_/g, ' ')}
                </span>
                <p className="hwm-hero__subject">{selectedHomework.subject_name}</p>
              </div>
              <div className="hwm-hero__due" style={dueTone(selectedHomework.student_status)}>
                <CalendarClock size={14} />
                <span>Due {formatDate(selectedHomework.due_date, 'long')}</span>
              </div>
            </div>

            {/* ── Description ── */}
            {selectedHomework.description && (
              <div className="hwm-desc-block">
                <div className="hwm-desc-block__icon"><FileText size={14} /></div>
                <div>
                  <p className="hwm-row-label">Description</p>
                  <p className="hwm-desc-text">{selectedHomework.description}</p>
                </div>
              </div>
            )}

            {/* ── Details Grid ── */}
            <div className="hwm-details-grid">
              <HwmRow icon={<User2 size={14} />}     label="Assigned By"     value={selectedHomework.teacher_name} />
              <HwmRow icon={<Tag size={14} />}        label="Submission Type"  value={selectedHomework.submission_type} capitalize />
              <HwmRow icon={<Paperclip size={14} />}  label="Attachment"       value={selectedHomework.attachment_path || 'None provided'} muted={!selectedHomework.attachment_path} />
            </div>

            {/* ── Submission Result (if already submitted/graded) ── */}
            {selectedHomework.submission_id && (
              <div className="hwm-result-card" style={resultCardStyle(selectedHomework.submission_status)}>
                <div className="hwm-result-card__header">
                  <div className="hwm-result-card__icon" style={resultIconStyle(selectedHomework.submission_status)}>
                    {selectedHomework.submission_status === 'graded' ? <Star size={15} /> : <CheckCircle2 size={15} />}
                  </div>
                  <div>
                    <p className="hwm-result-card__title">
                      {selectedHomework.submission_status === 'graded' ? 'Graded by Teacher' : 'Submitted Successfully'}
                    </p>
                    <p className="hwm-result-card__sub">
                      {selectedHomework.submitted_at ? formatDate(selectedHomework.submitted_at, 'long') : 'Submission date unavailable'}
                    </p>
                  </div>
                  {selectedHomework.submission_status === 'graded' && selectedHomework.marks_obtained != null && (
                    <div className="hwm-marks-badge">
                      <span className="hwm-marks-badge__value">{selectedHomework.marks_obtained}</span>
                      <span className="hwm-marks-badge__label">marks</span>
                    </div>
                  )}
                </div>
                {selectedHomework.teacher_comment && (
                  <div className="hwm-teacher-comment">
                    <MessageSquare size={13} />
                    <p>{selectedHomework.teacher_comment}</p>
                  </div>
                )}
                {!selectedHomework.teacher_comment && selectedHomework.submission_status !== 'graded' && (
                  <p className="hwm-result-card__pending">Awaiting teacher review…</p>
                )}
              </div>
            )}

            {/* ── Submit Section ── */}
            {['online', 'both'].includes(selectedHomework.submission_type) ? (
              <div className="hwm-submit-section">
                <div className="hwm-submit-section__header">
                  <div className="hwm-submit-section__icon"><Upload size={14} /></div>
                  <p className="hwm-submit-section__title">
                    {selectedHomework.submission_id ? 'Update Submission' : 'Submit Homework'}
                  </p>
                </div>
                <HomeworkSubmitForm homework={selectedHomework} loading={submitting} onSubmit={handleSubmit} />
              </div>
            ) : (
              <div className="hwm-physical-note">
                <AlertCircle size={15} />
                <p>This homework requires a <strong>physical submission</strong> to your teacher. No online submission needed.</p>
              </div>
            )}

          </div>
        )}
      </Modal>

      <style>{`
        /* ── Page ── */
        .hw-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ── Action Bar ── */
        .hw-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .hw-action-bar__left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hw-page-icon {
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

        .hw-page-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1;
        }

        .hw-page-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 2px 0 0 0;
          line-height: 1.2;
        }

        /* ── Toolbar ── */
        .hw-toolbar {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .hw-toolbar__top {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .hw-toolbar__label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .hw-status-tabs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: thin;
        }

        .hw-status-tab {
          flex-shrink: 0;
          padding: 5px 13px;
          border-radius: 99px;
          border: 1.5px solid var(--color-border);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.10em;
          text-transform: capitalize;
          cursor: pointer;
          background-color: var(--color-surface-raised);
          color: var(--color-text-secondary);
          transition: all 0.15s ease;
          outline: none;
          white-space: nowrap;
        }

        .hw-status-tab:hover {
          border-color: var(--student-accent);
          color: var(--student-accent);
        }

        .hw-status-tab--active {
          background-color: var(--student-accent) !important;
          border-color: var(--student-accent) !important;
          color: #fff !important;
        }

        .hw-toolbar__bottom {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 10px;
        }

        /* ── Custom Select ── */
        .hw-select-wrap {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 160px;
          flex: 1;
        }

        .hw-select-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .hw-select-field-wrap {
          position: relative;
        }

        .hw-select-field {
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          background-color: var(--color-surface-raised);
          border: 1.5px solid var(--color-border);
          border-radius: 11px;
          padding: 9px 36px 9px 13px;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .hw-select-field:focus {
          border-color: var(--student-accent);
        }

        .hw-select-icon {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          pointer-events: none;
          display: flex;
          align-items: center;
        }

        .hw-count-chip {
          display: inline-flex;
          align-items: center;
          padding: 7px 14px;
          border-radius: 10px;
          background-color: rgba(124, 58, 237, 0.08);
          color: var(--student-accent);
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          align-self: flex-end;
        }

        /* ── List Container ── */
        .hw-list-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 18px;
          overflow: hidden;
        }

        .hw-list-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 14px 8px 20px;
          background-color: var(--color-surface-raised);
          border-bottom: 1px solid var(--color-border);
        }

        .hw-list-header__col {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .hw-list-header__col--right {
          flex-shrink: 0;
          text-align: right;
          min-width: 180px;
        }

        .hw-rows {
          display: flex;
          flex-direction: column;
        }

        .hw-rows > * {
          border-radius: 0 !important;
          border-left: none !important;
          border-right: none !important;
          border-top: none !important;
          border-bottom: 1px solid var(--color-border) !important;
        }

        .hw-rows > *:last-child {
          border-bottom: none !important;
        }

        /* ── Skeleton ── */
        .hw-skeleton-list {
          animation: hwPulse 1.6s ease-in-out infinite;
        }

        .hw-skeleton-row {
          height: 58px;
          background-color: var(--color-surface-raised);
          border-bottom: 1px solid var(--color-border);
        }

        .hw-skeleton-row:last-child {
          border-bottom: none;
        }

        /* ── Calendar ── */
        .hw-calendar-section {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 18px 20px;
        }

        .hw-calendar-section__header {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 16px;
        }

        .hw-calendar-icon {
          display: flex;
          height: 32px;
          width: 32px;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background-color: rgba(124, 58, 237, 0.09);
          color: var(--student-accent);
          flex-shrink: 0;
        }

        .hw-calendar-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
        }

        .hw-calendar-desc {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin: 2px 0 0;
        }

        .hw-calendar-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        @media (min-width: 640px) {
          .hw-calendar-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (min-width: 1024px) {
          .hw-calendar-grid { grid-template-columns: repeat(3, 1fr); }
        }

        .hw-calendar-day {
          background-color: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          padding: 12px 14px;
        }

        .hw-calendar-day__date {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 8px;
        }

        .hw-calendar-day__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .hw-calendar-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 500;
        }

        .hw-calendar-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .hw-calendar-empty {
          background-color: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          padding: 20px 16px;
          font-size: 13px;
          color: var(--color-text-secondary);
          grid-column: 1 / -1;
        }

        /* ── Modal ── */
        .hw-modal-skeleton {
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: hwPulse 1.6s ease-in-out infinite;
        }

        .hw-modal-skeleton__block {
          border-radius: 16px;
          background-color: var(--color-surface-raised);
        }

        .hw-modal-skeleton__block--sm { height: 80px; }
        .hw-modal-skeleton__block--lg { height: 192px; }

        .hw-modal-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .hw-modal-info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .hw-modal-info-grid--2col {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (min-width: 640px) {
          .hw-modal-info-grid { grid-template-columns: repeat(2, 1fr); }
        }

        /* ── NEW MODAL STYLES ── */

        .hw-modal-skeleton {
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: hwPulse 1.6s ease-in-out infinite;
        }

        .hw-modal-skeleton__block {
          border-radius: 14px;
          background-color: var(--color-surface-raised);
        }

        /* Modal body */
        .hwm-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Status Hero */
        .hwm-hero {
          border-radius: 16px;
          border: 1px solid;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .hwm-hero__left {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .hwm-hero__badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          width: fit-content;
        }

        .hwm-hero__subject {
          font-size: 15px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
        }

        .hwm-hero__due {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 99px;
          background-color: rgba(0,0,0,0.05);
          white-space: nowrap;
        }

        /* Description */
        .hwm-desc-block {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background-color: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          padding: 13px 15px;
        }

        .hwm-desc-block__icon {
          display: flex;
          height: 28px;
          width: 28px;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background-color: rgba(124,58,237,0.10);
          color: var(--student-accent);
          flex-shrink: 0;
          margin-top: 1px;
        }

        .hwm-row-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0 0 4px;
        }

        .hwm-desc-text {
          font-size: 13px;
          color: var(--color-text-primary);
          line-height: 1.6;
          margin: 0;
        }

        /* Details grid (icon rows) */
        .hwm-details-grid {
          display: flex;
          flex-direction: column;
          gap: 2px;
          border: 1px solid var(--color-border);
          border-radius: 14px;
          overflow: hidden;
          background-color: var(--color-surface);
        }

        .hwm-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 15px;
          border-bottom: 1px solid var(--color-border);
        }

        .hwm-row:last-child {
          border-bottom: none;
        }

        .hwm-row__icon {
          display: flex;
          height: 28px;
          width: 28px;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background-color: var(--color-surface-raised);
          color: var(--color-text-muted);
          flex-shrink: 0;
        }

        .hwm-row__label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          min-width: 110px;
          flex-shrink: 0;
        }

        .hwm-row__value {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-primary);
          flex: 1;
        }

        .hwm-row__value--muted {
          color: var(--color-text-muted);
          font-style: italic;
        }

        .hwm-row__value--capitalize {
          text-transform: capitalize;
        }

        /* Result card */
        .hwm-result-card {
          border-radius: 14px;
          border: 1px solid;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .hwm-result-card__header {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .hwm-result-card__icon {
          display: flex;
          height: 34px;
          width: 34px;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          flex-shrink: 0;
        }

        .hwm-result-card__title {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 2px;
        }

        .hwm-result-card__sub {
          font-size: 11px;
          color: var(--color-text-secondary);
          margin: 0;
        }

        .hwm-result-card__pending {
          font-size: 12px;
          color: var(--color-text-muted);
          font-style: italic;
          margin: 0;
          padding-left: 44px;
        }

        .hwm-marks-badge {
          margin-left: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: rgba(124,58,237,0.10);
          border-radius: 12px;
          padding: 8px 14px;
          flex-shrink: 0;
        }

        .hwm-marks-badge__value {
          font-size: 22px;
          font-weight: 800;
          color: var(--student-accent);
          line-height: 1;
        }

        .hwm-marks-badge__label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        .hwm-teacher-comment {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background-color: rgba(0,0,0,0.04);
          border-radius: 10px;
          padding: 10px 12px;
          color: var(--color-text-secondary);
          font-size: 13px;
          line-height: 1.5;
        }

        .hwm-teacher-comment p {
          margin: 0;
          flex: 1;
        }

        .hwm-teacher-comment svg {
          flex-shrink: 0;
          margin-top: 2px;
          color: var(--color-text-muted);
        }

        /* Submit section */
        .hwm-submit-section {
          border: 1px solid var(--color-border);
          border-radius: 14px;
          overflow: hidden;
        }

        .hwm-submit-section__header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 15px;
          background-color: var(--color-surface-raised);
          border-bottom: 1px solid var(--color-border);
        }

        .hwm-submit-section__icon {
          display: flex;
          height: 26px;
          width: 26px;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background-color: rgba(124,58,237,0.12);
          color: var(--student-accent);
        }

        .hwm-submit-section__title {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-text-primary);
          margin: 0;
        }

        /* Physical note */
        .hwm-physical-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background-color: rgba(245,158,11,0.07);
          border: 1px solid rgba(245,158,11,0.28);
          border-radius: 14px;
          padding: 12px 15px;
          font-size: 13px;
          color: #a16207;
          line-height: 1.5;
        }

        .hwm-physical-note svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .hwm-physical-note p {
          margin: 0;
          flex: 1;
        }

        /* ── Info Card ── */
        .hw-info-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          padding: 12px 14px;
        }

        .hw-info-card__label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0 0 5px;
        }

        .hw-info-card__value {
          font-size: 13px;
          color: var(--color-text-primary);
          margin: 0;
          line-height: 1.4;
        }
      `}</style>
    </div>
  )
}


const HwmRow = ({ icon, label, value, capitalize, muted }) => (
  <div className="hwm-row">
    <div className="hwm-row__icon">{icon}</div>
    <span className="hwm-row__label">{label}</span>
    <span className={`hwm-row__value${muted ? ' hwm-row__value--muted' : ''}${capitalize ? ' hwm-row__value--capitalize' : ''}`}>
      {value || '--'}
    </span>
  </div>
)

function calendarDotStyle(tone) {
  if (tone === 'green') return { backgroundColor: 'rgba(22,163,74,0.10)', color: '#15803d' }
  if (tone === 'amber') return { backgroundColor: 'rgba(245,158,11,0.10)', color: '#b45309' }
  return { backgroundColor: 'rgba(239,68,68,0.10)', color: '#dc2626' }
}

/* ── Modal helpers ── */

function heroStyle(status) {
  if (status === 'overdue')   return { backgroundColor: 'rgba(239,68,68,0.06)',   borderColor: '#fca5a5' }
  if (status === 'due_today') return { backgroundColor: 'rgba(245,158,11,0.07)',  borderColor: '#fcd34d' }
  if (status === 'submitted' || status === 'graded') return { backgroundColor: 'rgba(22,163,74,0.06)', borderColor: '#86efac' }
  return { backgroundColor: 'rgba(124,58,237,0.06)', borderColor: 'rgba(124,58,237,0.25)' }
}

function badgeStyle(status) {
  if (status === 'overdue')   return { backgroundColor: 'rgba(239,68,68,0.12)',  color: '#dc2626' }
  if (status === 'due_today') return { backgroundColor: 'rgba(245,158,11,0.12)', color: '#b45309' }
  if (status === 'submitted' || status === 'graded') return { backgroundColor: 'rgba(22,163,74,0.12)', color: '#15803d' }
  return { backgroundColor: 'rgba(124,58,237,0.12)', color: '#6d28d9' }
}

function dueTone(status) {
  if (status === 'overdue')   return { color: '#dc2626' }
  if (status === 'due_today') return { color: '#b45309' }
  return { color: 'var(--color-text-secondary)' }
}

function resultCardStyle(submissionStatus) {
  if (submissionStatus === 'graded') return { backgroundColor: 'rgba(124,58,237,0.05)', borderColor: 'rgba(124,58,237,0.25)' }
  return { backgroundColor: 'rgba(22,163,74,0.05)', borderColor: '#86efac' }
}

function resultIconStyle(submissionStatus) {
  if (submissionStatus === 'graded') return { backgroundColor: 'rgba(124,58,237,0.12)', color: '#6d28d9' }
  return { backgroundColor: 'rgba(22,163,74,0.12)', color: '#15803d' }
}

function statusIcon(status) {
  if (status === 'overdue')   return '⚠️'
  if (status === 'due_today') return '⏰'
  if (status === 'graded')    return '⭐'
  if (status === 'submitted') return '✅'
  return '📚'
}

export default HomeworkList
