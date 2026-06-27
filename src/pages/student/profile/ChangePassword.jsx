import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import Button from '@/components/ui/Button'
import useAuthStore from '@/store/authStore'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentProfile from '@/hooks/useStudentProfile'
import useToast from '@/hooks/useToast'
import { ROUTES } from '@/constants/app'

const ChangePassword = () => {
  usePageTitle('Change Password')

  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const { toastError, toastSuccess } = useToast()
  const { saving, submitPasswordChange } = useStudentProfile()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const strength = useMemo(() => getStrength(newPassword), [newPassword])

  useEffect(() => {
    if (localError) toastError(localError)
  }, [localError, toastError])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLocalError('')

    if (newPassword.length < 8) {
      setLocalError('New password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setLocalError('New password and confirm password do not match.')
      return
    }

    try {
      await submitPasswordChange({
        current_password: currentPassword,
        new_password: newPassword,
      })
      toastSuccess('Password changed successfully. Please log in again.')
      logout()
      navigate(ROUTES.LOGIN, { replace: true })
    } catch (err) {
      toastError(err?.message || 'Unable to change password.')
    }
  }

  return (
    <div className="cp-page">
      {/* ── Action Bar ── */}
      <div className="cp-action-bar">
        <div className="cp-action-icon">
          <KeyRound size={18} />
        </div>
        <span className="cp-action-label">Profile / Change Password</span>
      </div>

      {/* ── Form Card ── */}
      <div className="cp-card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Current Password */}
          <div className="cp-field">
            <label className="cp-label" htmlFor="cp-current">
              Current Password
            </label>
            <PasswordField
              id="cp-current"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Enter your current password"
            />
          </div>

          {/* New Password */}
          <div className="cp-field" style={{ borderTop: '1px solid var(--color-border)' }}>
            <label className="cp-label" htmlFor="cp-new">
              New Password
            </label>
            <PasswordField
              id="cp-new"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Choose a strong new password"
            />
          </div>

          {/* Strength Meter */}
          <div className="cp-strength" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="cp-strength-header">
              <span className="cp-label" style={{ margin: 0 }}>Password Strength</span>
              <span className="cp-strength-label" style={{ color: strength.color }}>{strength.label}</span>
            </div>
            <div className="cp-strength-track">
              <div
                className="cp-strength-fill"
                style={{ width: `${strength.percent}%`, backgroundColor: strength.color }}
              />
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="cp-field" style={{ borderTop: '1px solid var(--color-border)' }}>
            <label className="cp-label" htmlFor="cp-confirm">
              Confirm New Password
            </label>
            <PasswordField
              id="cp-confirm"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter your new password"
            />
          </div>

          {/* Info note */}
          <div className="cp-note" style={{ borderTop: '1px solid var(--color-border)' }}>
            <span className="cp-note__icon">🔒</span>
            <p className="cp-note__text">
              After saving, you will be logged out and redirected to the login page.
            </p>
          </div>

          {/* Footer */}
          <div className="cp-footer">
            <Button type="submit" loading={saving}>
              Save Password
            </Button>
          </div>
        </form>
      </div>

      <style>{`
        .cp-page {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* ── Action Bar ── */
        .cp-action-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0 14px 0;
        }

        .cp-action-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(239,68,68,0.10);
          color: #dc2626;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cp-action-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-secondary);
          letter-spacing: 0.01em;
        }

        /* ── Card ── */
        .cp-card {
          border: 1px solid var(--color-border);
          border-radius: 18px;
          overflow: hidden;
          background: var(--color-surface);
        }

        /* ── Field sections ── */
        .cp-field {
          padding: 13px 16px;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .cp-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          display: block;
          margin-bottom: 2px;
        }

        /* ── Password Input ── */
        .cp-input {
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

        .cp-input:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.13);
        }

        /* ── Strength Meter ── */
        .cp-strength {
          padding: 11px 16px 13px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: var(--color-surface-raised);
        }

        .cp-strength-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .cp-strength-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          transition: color 0.2s;
        }

        .cp-strength-track {
          height: 6px;
          border-radius: 999px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          overflow: hidden;
        }

        .cp-strength-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.3s ease, background-color 0.3s ease;
        }

        /* ── Note ── */
        .cp-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 11px 16px;
          background: var(--color-surface-raised);
        }

        .cp-note__icon {
          font-size: 13px;
          flex-shrink: 0;
          line-height: 1.5;
        }

        .cp-note__text {
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        /* ── Footer ── */
        .cp-footer {
          padding: 13px 16px;
          border-top: 1px solid var(--color-border);
          background: var(--color-surface);
        }
      `}</style>
    </div>
  )
}

const PasswordField = ({ id, value, onChange, placeholder }) => (
  <input
    id={id}
    type="password"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="cp-input"
    placeholder={placeholder}
    required
  />
)

function getStrength(password) {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 1) return { label: 'Weak', percent: 25, color: '#dc2626' }
  if (score === 2) return { label: 'Fair', percent: 50, color: '#d97706' }
  if (score === 3) return { label: 'Good', percent: 75, color: '#2563eb' }
  return { label: 'Strong', percent: 100, color: '#16a34a' }
}

export default ChangePassword
