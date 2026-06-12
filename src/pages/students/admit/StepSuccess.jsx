// src/pages/students/admit/StepSuccess.jsx
import { CheckCircle2, Copy, Eye, Plus, FileDown } from 'lucide-react'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import * as studentApi from '@/api/studentsApi'

const CredentialRow = ({ label, value, onCopy }) => (
  <div
    className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
    style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
  >
    <div className="min-w-0 text-left">
      <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      <p className="text-sm font-semibold break-all" style={{ color: 'var(--color-text-primary)' }}>{value || '--'}</p>
    </div>
    {value && (
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-colors"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
        title={`Copy ${label}`}
      >
        <Copy size={15} />
      </button>
    )}
  </div>
)

const StepSuccess = ({ student, onViewStudent, onAdmitAnother }) => {
  const [copiedField, setCopiedField] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const credentials = student?.login_credentials || {}

  const handleCopy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(label)
      window.setTimeout(() => setCopiedField(''), 1800)
    } catch {
      setCopiedField('')
    }
  }

  const downloadPDF = async () => {
    if (!student?.id) return
    setIsDownloading(true)
    try {
      const blob = await studentApi.downloadAdmissionForm(student.id)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `AdmissionForm_${student.admission_no || 'Student'}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed', err)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div
      className="rounded-2xl p-6 sm:p-10 text-center"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ backgroundColor: '#f0fdf4' }}
      >
        <CheckCircle2 size={32} style={{ color: '#16a34a' }} />
      </div>

      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
        Student Admitted!
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
        {student?.first_name} {student?.last_name} has been successfully admitted.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
        {/* Student Credentials */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-left mb-2 px-1" style={{ color: 'var(--color-text-secondary)' }}>
            Student Credentials
          </h3>
          {student?.admission_no && (
            <CredentialRow
              label="Admission Number"
              value={student.admission_no}
              onCopy={(value) => handleCopy(value, 'admission')}
            />
          )}
          <CredentialRow
            label="Email Login"
            value={credentials.student?.email}
            onCopy={(value) => handleCopy(value, 'student email')}
          />
          <CredentialRow
            label="Auto-Generated Password"
            value={credentials.student?.password}
            onCopy={(value) => handleCopy(value, 'student password')}
          />
        </div>

        {/* Parent Credentials */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-left mb-2 px-1" style={{ color: 'var(--color-text-secondary)' }}>
            Parent Portal Access
          </h3>
          <CredentialRow
            label="Parent Email Login"
            value={credentials.parent?.email}
            onCopy={(value) => handleCopy(value, 'parent email')}
          />
          <CredentialRow
            label="Parent Portal Password"
            value={credentials.parent?.password}
            onCopy={(value) => handleCopy(value, 'parent password')}
          />
          <div className="px-1 text-left">
            <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-md ${credentials.parent?.is_new_account ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
              {credentials.parent?.is_new_account ? 'New Account Created' : 'Linked to Existing Account'}
            </span>
          </div>
        </div>
      </div>

      <div
        className="mx-auto mb-8 max-w-4xl rounded-xl px-4 py-3 text-left flex items-start gap-3"
        style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.24)' }}
      >
        <div className="mt-0.5 text-indigo-600"><Plus size={16} /></div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Share these credentials with the family now.
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Passwords are only shown here once. Both student and parent can log in to their respective portals immediately.
            {copiedField ? ` ${copiedField} copied.` : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button icon={Eye} onClick={onViewStudent}>View Profile</Button>
        <Button variant="secondary" icon={FileDown} onClick={downloadPDF} loading={isDownloading}>
          Download Form (PDF)
        </Button>
        <Button variant="secondary" icon={Plus} onClick={onAdmitAnother}>Admit Another</Button>
      </div>
    </div>
  )
}

export default StepSuccess
