import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'

const HomeworkSubmitForm = ({ homework, loading, onSubmit }) => {
  const [submissionContent, setSubmissionContent] = useState('')
  const [attachmentPath, setAttachmentPath] = useState('')

  useEffect(() => {
    setSubmissionContent(homework?.submission_content || '')
    setAttachmentPath(homework?.submission_attachment_path || '')
  }, [homework?.id, homework?.submission_content, homework?.submission_attachment_path])

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onSubmit?.({
      submission_content: submissionContent.trim() || null,
      attachment_path: attachmentPath.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* ── Answer Field ── */}
      <div className="hsf-field">
        <label className="hsf-label" htmlFor="hsf-content">
          Your Answer
        </label>
        <textarea
          id="hsf-content"
          value={submissionContent}
          onChange={(e) => setSubmissionContent(e.target.value)}
          rows={5}
          className="hsf-textarea"
          placeholder="Write your answer, solution, or a note to your teacher…"
        />
      </div>

      {/* ── Attachment Field ── */}
      <div className="hsf-field" style={{ borderTop: '1px solid var(--color-border)' }}>
        <label className="hsf-label" htmlFor="hsf-attachment">
          Attachment Reference <span className="hsf-optional">(optional)</span>
        </label>
        <input
          id="hsf-attachment"
          type="text"
          value={attachmentPath}
          onChange={(e) => setAttachmentPath(e.target.value)}
          className="hsf-input"
          placeholder="Paste a file path or shared link"
        />
      </div>

      {/* ── Note ── */}
      <div className="hsf-note">
        <span className="hsf-note__icon">ℹ️</span>
        <p className="hsf-note__text">
          Review before submitting. If already graded, the grade stays visible after a resubmission.
        </p>
      </div>

      {/* ── Submit ── */}
      <div className="hsf-footer">
        <Button type="submit" loading={loading} fullWidth>
          Submit Homework
        </Button>
      </div>

      <style>{`
        .hsf-field {
          padding: 13px 16px;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .hsf-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .hsf-optional {
          font-weight: 500;
          text-transform: none;
          letter-spacing: 0;
          font-size: 10px;
          color: var(--color-text-muted);
        }

        .hsf-textarea {
          width: 100%;
          border: 1.5px solid var(--color-border);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          font-family: inherit;
          color: var(--color-text-primary);
          background-color: var(--color-surface);
          resize: vertical;
          outline: none;
          transition: border-color 0.15s ease;
          line-height: 1.5;
          box-sizing: border-box;
        }

        .hsf-textarea:focus {
          border-color: var(--student-accent);
        }

        .hsf-input {
          width: 100%;
          border: 1.5px solid var(--color-border);
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 13px;
          font-family: inherit;
          color: var(--color-text-primary);
          background-color: var(--color-surface);
          outline: none;
          transition: border-color 0.15s ease;
          box-sizing: border-box;
        }

        .hsf-input:focus {
          border-color: var(--student-accent);
        }

        .hsf-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 11px 16px;
          border-top: 1px solid var(--color-border);
          background-color: var(--color-surface-raised);
        }

        .hsf-note__icon {
          font-size: 13px;
          flex-shrink: 0;
          line-height: 1.5;
        }

        .hsf-note__text {
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        .hsf-footer {
          padding: 13px 16px;
          border-top: 1px solid var(--color-border);
        }
      `}</style>
    </form>
  )
}

export default HomeworkSubmitForm
