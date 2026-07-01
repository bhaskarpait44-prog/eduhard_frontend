import { KeyRound, Mail, UserSquare2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { SectionHeading } from './StepIdentity'

const InfoCard = ({ icon: Icon, label, value, hint }) => (
  <div
    className="rounded-2xl p-4"
    style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
  >
    <div className="flex items-start gap-3">
      <div
        className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--color-brand)' }}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="mt-1 break-all text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {value || '--'}
        </p>
        {hint ? <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{hint}</p> : null}
      </div>
    </div>
  </div>
)

const StepAccess = ({ defaultValues, onBack, onNext }) => (
  <div className="space-y-4">
    <div
      className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 space-y-6 shadow-xl shadow-indigo-500/5"
    >
      <SectionHeading
        title="Access Details"
        subtitle="Review the student login details before completing admission"
      />

      <div
        className="rounded-2xl p-4"
        style={{ backgroundColor: 'rgba(99, 102, 241, 0.10)', border: '1px solid rgba(99, 102, 241, 0.22)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          The password is auto-generated after admission is completed.
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          You can review the registered email here, then the actual password will appear on the next screen.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <InfoCard
          icon={Mail}
          label="Registered Email"
          value={defaultValues.email}
          hint="Student can sign in using this email."
        />
        <InfoCard
          icon={UserSquare2}
          label="Admission Number"
          value={defaultValues.admission_no}
          hint="Student can also sign in using admission number."
        />
        <InfoCard
          icon={KeyRound}
          label="Password"
          value="Generated automatically after admission"
          hint="Shown once on the completion screen."
        />
      </div>
    </div>

    <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mt-6">
      <Button variant="secondary" type="button" onClick={onBack}>← Back</Button>
      <Button type="button" onClick={() => onNext(defaultValues)} className="shadow-lg shadow-indigo-500/20">
        Review Details →
      </Button>
    </div>
  </div>
)

export default StepAccess
