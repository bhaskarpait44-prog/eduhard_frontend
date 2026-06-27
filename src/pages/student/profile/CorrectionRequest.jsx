import { useEffect, useMemo, useState } from 'react'
import { FilePen } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentProfile from '@/hooks/useStudentProfile'
import useToast from '@/hooks/useToast'
import { formatDate } from '@/utils/helpers'

const fieldOptions = [
  'Name spelling',
  'Date of birth',
  'Gender',
  'Phone number',
  'Address',
  'Parent details',
  'Photo',
  'Other',
]

const CorrectionRequest = () => {
  usePageTitle('Request Correction')

  const { toastError, toastSuccess } = useToast()
  const { profile, correctionRequests, loading, saving, error, submitCorrectionRequest } = useStudentProfile()

  const [fieldName, setFieldName] = useState(fieldOptions[0])
  const [requestedValue, setRequestedValue] = useState('')
  const [reason, setReason] = useState('')
  const [supportingDocumentPath, setSupportingDocumentPath] = useState('')

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const currentValue = useMemo(() => {
    if (!profile) return ''
    const mapping = {
      'Name spelling': profile.full_name,
      'Date of birth': formatDate(profile.date_of_birth, 'long'),
      Gender: profile.gender,
      'Phone number': profile.phone,
      Address: profile.address,
      'Parent details': [profile.father_name, profile.mother_name].filter(Boolean).join(' / '),
      Photo: profile.photo_path || 'Photo on file',
      Other: '',
    }
    return mapping[fieldName] || ''
  }, [fieldName, profile])

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const res = await submitCorrectionRequest({
        field_name: fieldName,
        current_value: currentValue || null,
        requested_value: requestedValue,
        reason,
        supporting_document_path: supportingDocumentPath || null,
      })
      toastSuccess(`Your request has been submitted. Reference #${res?.request?.id || ''}`)
      setRequestedValue('')
      setReason('')
      setSupportingDocumentPath('')
    } catch (err) {
      toastError(err?.message || 'Unable to submit correction request.')
    }
  }

  return (
    <div className="cr-page">
      {/* ── Action Bar ── */}
      <div className="cr-action-bar">
        <div className="cr-action-icon">
          <FilePen size={18} />
        </div>
        <span className="cr-action-label">Profile / Request Correction</span>
      </div>

      {/* ── Form Card ── */}
      <div className="cr-card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Field selector section */}
          <div className="cr-section">
            <div className="cr-section-header">Field to Correct</div>
            <div className="cr-section-body">
              <div className="cr-select-wrapper">
                <select
                  value={fieldName}
                  onChange={(event) => setFieldName(event.target.value)}
                  className="cr-select"
                >
                  {fieldOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <span className="cr-select-arrow">▾</span>
              </div>
            </div>
          </div>

          {/* Current Value (read-only) */}
          <div className="cr-section" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="cr-section-header">Current Value on Record</div>
            <div className="cr-section-body">
              <input
                type="text"
                value={currentValue || 'No current value available'}
                readOnly
                className="cr-input cr-input--readonly"
              />
            </div>
          </div>

          {/* Correct Value */}
          <div className="cr-section" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="cr-section-header">Correct Value <span className="cr-required">*</span></div>
            <div className="cr-section-body">
              <input
                type="text"
                value={requestedValue}
                onChange={(e) => setRequestedValue(e.target.value)}
                className="cr-input"
                placeholder="Enter the correct value…"
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div className="cr-section" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="cr-section-header">Reason <span className="cr-required">*</span></div>
            <div className="cr-section-body">
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={4}
                className="cr-textarea"
                placeholder="Explain why this correction is needed…"
                required
              />
            </div>
          </div>

          {/* Supporting Document Path */}
          <div className="cr-section" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="cr-section-header">Supporting Document <span className="cr-optional">(optional)</span></div>
            <div className="cr-section-body">
              <input
                type="text"
                value={supportingDocumentPath}
                onChange={(e) => setSupportingDocumentPath(e.target.value)}
                className="cr-input"
                placeholder="Paste a file path or shared link"
              />
            </div>
          </div>

          {/* Footer / Submit */}
          <div className="cr-footer">
            <Button type="submit" loading={saving}>
              Submit Request
            </Button>
          </div>
        </form>
      </div>

      {/* ── Request Status ── */}
      <div className="cr-card" style={{ marginTop: 16 }}>
        <div className="cr-status-header">
          <span className="cr-status-title">Request Status</span>
          {correctionRequests.length > 0 && (
            <span className="cr-status-count">{correctionRequests.length}</span>
          )}
        </div>

        <div className="cr-status-list">
          {loading ? (
            <div className="cr-skeleton-list">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="cr-skeleton-row" />
              ))}
            </div>
          ) : correctionRequests.length ? (
            correctionRequests.map((request) => (
              <div key={request.id} className="cr-request-row">
                {/* Left: badge + field name + value */}
                <div className="cr-request-main">
                  <span className="cr-badge" style={statusStyle(request.status)}>
                    {request.status}
                  </span>
                  <div className="cr-request-info">
                    <span className="cr-request-field">{request.field_name}</span>
                    <span className="cr-request-value">→ {request.requested_value}</span>
                  </div>
                </div>
                {/* Right: date chip */}
                <span className="cr-date-chip">{formatDate(request.created_at, 'long')}</span>

                {/* Admin response bubble */}
                {request.admin_response && (
                  <div className="cr-admin-bubble">
                    <span className="cr-admin-label">Admin:</span> {request.admin_response}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="cr-empty-wrap">
              <EmptyState
                title="No correction requests yet"
                description="Your submitted correction requests will appear here."
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .cr-page {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* ── Action Bar ── */
        .cr-action-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0 14px 0;
        }

        .cr-action-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(245,158,11,0.10);
          color: #b45309;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cr-action-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-secondary);
          letter-spacing: 0.01em;
        }

        /* ── Card ── */
        .cr-card {
          border: 1px solid var(--color-border);
          border-radius: 18px;
          overflow: hidden;
          background: var(--color-surface);
        }

        /* ── Sections ── */
        .cr-section {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .cr-section-header {
          padding: 9px 16px 7px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          background: var(--color-surface-raised);
          border-bottom: 1px solid var(--color-border);
        }

        .cr-section-body {
          padding: 12px 16px;
        }

        .cr-required {
          color: #ef4444;
          font-weight: 700;
        }

        .cr-optional {
          font-weight: 500;
          text-transform: none;
          letter-spacing: 0;
          font-size: 9px;
          color: var(--color-text-muted);
        }

        /* ── Select ── */
        .cr-select-wrapper {
          position: relative;
        }

        .cr-select {
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          border: 1.5px solid var(--color-border);
          border-radius: 10px;
          padding: 9px 36px 9px 12px;
          font-size: 13px;
          font-family: inherit;
          color: var(--color-text-primary);
          background-color: var(--color-surface);
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          box-sizing: border-box;
        }

        .cr-select:focus {
          border-color: #b45309;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.15);
        }

        .cr-select-arrow {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          color: var(--color-text-muted);
          pointer-events: none;
          line-height: 1;
        }

        /* ── Inputs ── */
        .cr-input {
          width: 100%;
          border: 1.5px solid var(--color-border);
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 13px;
          font-family: inherit;
          color: var(--color-text-primary);
          background-color: var(--color-surface);
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          box-sizing: border-box;
        }

        .cr-input:focus {
          border-color: #b45309;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.15);
        }

        .cr-input--readonly {
          background-color: var(--color-surface-raised);
          color: var(--color-text-secondary);
          cursor: default;
        }

        .cr-textarea {
          width: 100%;
          border: 1.5px solid var(--color-border);
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 13px;
          font-family: inherit;
          color: var(--color-text-primary);
          background-color: var(--color-surface);
          outline: none;
          resize: vertical;
          line-height: 1.5;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          box-sizing: border-box;
        }

        .cr-textarea:focus {
          border-color: #b45309;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.15);
        }

        /* ── Footer ── */
        .cr-footer {
          padding: 13px 16px;
          border-top: 1px solid var(--color-border);
          background: var(--color-surface);
        }

        /* ── Status Section ── */
        .cr-status-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 16px 10px;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface-raised);
        }

        .cr-status-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .cr-status-count {
          font-size: 10px;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 999px;
          background: rgba(245,158,11,0.15);
          color: #b45309;
        }

        .cr-status-list {
          display: flex;
          flex-direction: column;
        }

        /* ── Request Rows ── */
        .cr-request-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          padding: 11px 16px;
          border-top: 1px solid var(--color-border);
          transition: background 0.12s;
        }

        .cr-request-row:first-child {
          border-top: none;
        }

        .cr-request-row:hover {
          background: var(--color-surface-raised);
        }

        .cr-request-main {
          display: flex;
          align-items: center;
          gap: 9px;
          flex: 1;
          min-width: 0;
        }

        .cr-badge {
          flex-shrink: 0;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .cr-request-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }

        .cr-request-field {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cr-request-value {
          font-size: 11px;
          color: var(--color-text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cr-date-chip {
          flex-shrink: 0;
          font-size: 10px;
          color: var(--color-text-muted);
          background: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          padding: 2px 7px;
          white-space: nowrap;
        }

        .cr-admin-bubble {
          width: 100%;
          margin-top: 2px;
          padding: 7px 10px;
          border-radius: 8px;
          background: rgba(245,158,11,0.07);
          border: 1px solid rgba(245,158,11,0.18);
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.5;
        }

        .cr-admin-label {
          font-weight: 700;
          color: #b45309;
        }

        /* ── Skeletons ── */
        .cr-skeleton-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 12px 16px;
          animation: pulse 1.4s ease-in-out infinite;
        }

        .cr-skeleton-row {
          height: 48px;
          border-radius: 10px;
          background: var(--color-surface-raised);
          margin-bottom: 10px;
        }

        .cr-empty-wrap {
          padding: 16px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

function statusStyle(status) {
  if (status === 'approved') return { backgroundColor: '#dcfce7', color: '#15803d' }
  if (status === 'rejected') return { backgroundColor: '#fee2e2', color: '#dc2626' }
  return { backgroundColor: '#fef3c7', color: '#b45309' }
}

export default CorrectionRequest
