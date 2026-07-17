import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  User,
  Shield,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  CalendarRange,
  ArrowUpRight,
  Mail,
  Phone,
  MapPin,
  Bell,
  MonitorCog,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  ShieldCheck,
  AlertCircle,
  IndianRupee,
  QrCode,
  ClipboardList
} from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useAuthStore from '@/store/authStore'
import useUiStore from '@/store/uiStore'
import useSessionStore from '@/store/sessionStore'
import { APP_NAME, APP_VERSION, ROUTES } from '@/constants/app'
import api from '@/api/axios'

const SETTINGS_STORAGE_KEY = 'educore_settings:v1'

const DEFAULT_SETTINGS = {
  schoolName: 'EduCore Academy',
  schoolEmail: 'admin@school.edu.in',
  schoolPhone: '+91 98765 43210',
  schoolAddress: '12 Knowledge Avenue, Bengaluru',
  upi_id: '',
  upi_name: '',
  upi_enabled: true,
  online_admission_open: false,
  timezone: 'Asia/Kolkata',
  attendanceReminder: true,
  feeReminder: true,
}

// ── Password strength calculation ─────────────────────────────────────────
const getStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8)               score++
  if (password.length >= 12)              score++
  if (/[A-Z]/.test(password))            score++
  if (/[0-9]/.test(password))            score++
  if (/[^A-Za-z0-9]/.test(password))    score++
  const levels = [
    { label: '',          color: '' },
    { label: 'Very weak', color: '#dc2626' },
    { label: 'Weak',      color: '#f97316' },
    { label: 'Fair',      color: '#eab308' },
    { label: 'Strong',    color: '#22c55e' },
    { label: 'Very strong', color: '#16a34a' },
  ]
  return { score, ...levels[score] }
}

const SettingsPage = () => {
  usePageTitle('Settings')

  const navigate = useNavigate()
  const { toastSuccess, toastInfo, toastError } = useToast()
  const { user } = useAuthStore()
  const { theme, setTheme, sidebarCollapsed, setSidebarCollapsed } = useUiStore()
  const { currentSession, fetchCurrentSession } = useSessionStore()

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPayment, setIsSavingPayment] = useState(false)
  const [isSavingAdmission, setIsSavingAdmission] = useState(false)

  // Password state
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false })
  const [isChangingPwd, setIsChangingPwd] = useState(false)

  const strength = getStrength(pwdForm.newPassword)

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const completion = useMemo(() => {
    const fields = ['schoolName', 'schoolEmail', 'schoolPhone', 'schoolAddress', 'upi_id', 'upi_name']
    const filled = fields.filter((f) => settings[f]).length
    return Math.round((filled / fields.length) * 100)
  }, [settings])

  useEffect(() => {
    fetchCurrentSession()
    fetchSettings()
  }, [fetchCurrentSession])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/settings')
      if (res.success && res.data) {
        const data = res.data
        setSettings((prev) => {
          const updated = { 
            ...prev, 
            ...data,
            schoolName: data.school_name || prev.schoolName,
            schoolEmail: data.school_email || prev.schoolEmail,
            schoolPhone: data.school_phone || prev.schoolPhone,
            schoolAddress: data.school_address || prev.schoolAddress,
          }
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated))
          return updated
        })
      }
    } catch (err) {
      console.error('Failed to fetch settings from API, falling back to local storage', err)
      try {
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
        if (saved) {
          setSettings((prev) => ({ ...prev, ...JSON.parse(saved) }))
        }
      } catch {
        // Ignore malformed saved settings and fall back to defaults.
      }
    } finally {
      setIsLoading(false)
    }
  }

  const validateUpiId = (id) => {
    if (!id) return true // Allow empty
    const regex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/
    return regex.test(id)
  }

  const handleSaveProfile = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (settings.schoolEmail && !emailRegex.test(settings.schoolEmail)) {
      toastError('Enter a valid school email address')
      return
    }

    const phoneRegex = /^[6-9]\d{9}$/
    const sanitizedPhone = (settings.schoolPhone || '').replace(/\D/g, '').replace(/^91/, '')
    if (settings.schoolPhone && !phoneRegex.test(sanitizedPhone)) {
      toastError('Enter a valid 10-digit school mobile number')
      return
    }

    setIsSavingProfile(true)
    try {
      await api.put('/settings', { 
        school_name: settings.schoolName,
        school_email: settings.schoolEmail,
        school_phone: settings.schoolPhone,
        school_address: settings.schoolAddress,
        // Include other fields to satisfy backend body if needed, or backend should support partial
        upi_id: settings.upi_id,
        upi_name: settings.upi_name,
        upi_enabled: settings.upi_enabled,
        online_admission_open: settings.online_admission_open,
      })
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
      toastSuccess('School profile updated')
    } catch (err) {
      toastError(err.message || 'Failed to save profile')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSavePayment = async () => {
    if (!validateUpiId(settings.upi_id)) {
      toastError('Invalid UPI ID format')
      return
    }

    setIsSavingPayment(true)
    try {
      await api.put('/settings', { 
        upi_id: settings.upi_id,
        upi_name: settings.upi_name,
        upi_enabled: settings.upi_enabled,
        school_name: settings.schoolName,
        school_email: settings.schoolEmail,
        school_phone: settings.schoolPhone,
        school_address: settings.schoolAddress,
        online_admission_open: settings.online_admission_open,
      })
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
      toastSuccess('Payment settings updated')
    } catch (err) {
      toastError(err.message || 'Failed to save payments')
    } finally {
      setIsSavingPayment(false)
    }
  }

  const handleSaveAdmission = async () => {
    setIsSavingAdmission(true)
    try {
      await api.put('/settings', { 
        online_admission_open: settings.online_admission_open,
        school_name: settings.schoolName,
        school_email: settings.schoolEmail,
        school_phone: settings.schoolPhone,
        school_address: settings.schoolAddress,
        upi_id: settings.upi_id,
        upi_name: settings.upi_name,
        upi_enabled: settings.upi_enabled,
      })
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
      toastSuccess('Admission status updated')
    } catch (err) {
      toastError(err.message || 'Failed to update admission')
    } finally {
      setIsSavingAdmission(false)
    }
  }

  const handleSave = async () => {
    if (!validateUpiId(settings.upi_id)) {
      toastError('Invalid UPI ID format. Should be like schoolname@upi')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (settings.schoolEmail && !emailRegex.test(settings.schoolEmail)) {
      toastError('Enter a valid school email address')
      return
    }

    const phoneRegex = /^[6-9]\d{9}$/
    const sanitizedPhone = (settings.schoolPhone || '').replace(/\D/g, '').replace(/^91/, '')
    if (settings.schoolPhone && !phoneRegex.test(sanitizedPhone)) {
      toastError('Enter a valid 10-digit school mobile number')
      return
    }

    setIsLoading(true)
    try {
      await api.put('/settings', { 
        upi_id: settings.upi_id,
        upi_name: settings.upi_name,
        upi_enabled: settings.upi_enabled,
        school_name: settings.schoolName,
        school_email: settings.schoolEmail,
        school_phone: settings.schoolPhone,
        school_address: settings.schoolAddress,
        online_admission_open: settings.online_admission_open,
      })
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
      toastSuccess('Server settings saved successfully')
    } catch (err) {
      console.error('Failed to save settings to API', err)
      toastError(err.message || 'Failed to save settings to server')
    } finally {
      setIsLoading(false)
    }
  }

  const upiQrUrl = useMemo(() => {
    if (!settings.upi_id || !settings.upi_enabled) return null
    const displayName = settings.upi_name || settings.schoolName || 'School'
    const upiLink = `upi://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(displayName)}&cu=INR`
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}`
  }, [settings.upi_id, settings.upi_name, settings.schoolName, settings.upi_enabled])

  const handleLocalSave = () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    toastSuccess('Local preferences updated')
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toastError('New passwords do not match')
      return
    }
    if (strength.score < 3) {
      toastError('Please choose a stronger password')
      return
    }

    setIsChangingPwd(true)
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      })
      toastSuccess('Password updated successfully')
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toastError(err.message || 'Failed to update password')
    } finally {
      setIsChangingPwd(false)
    }
  }

  const handleThemeChange = (nextTheme) => {
    if (nextTheme !== theme) {
      setTheme(nextTheme)
      toastInfo(`Theme switched to ${nextTheme}`)
    }
  }

  const handleSidebarChange = (collapsed) => {
    setSidebarCollapsed(collapsed)
    toastInfo(collapsed ? 'Sidebar collapsed by default' : 'Sidebar expanded by default')
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
        <div className="space-y-6">
          <SettingsCard
            icon={Building2}
            title="School Profile"
            description="Basic identity and contact information (Saved to school database)."
            action={
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                <Save size={15} />
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="School name"
                value={settings.schoolName}
                onChange={(value) => handleChange('schoolName', value)}
                placeholder="Enter school name"
              />
              <Field
                label="Official email"
                value={settings.schoolEmail}
                onChange={(value) => handleChange('schoolEmail', value)}
                placeholder="admin@school.edu.in"
                icon={Mail}
              />
              <Field
                label="Phone number"
                value={settings.schoolPhone}
                onChange={(value) => handleChange('schoolPhone', value)}
                placeholder="+91 98765 43210"
                icon={Phone}
              />
            </div>
            <div className="mt-4">
              <Field
                label="Campus address"
                value={settings.schoolAddress}
                onChange={(value) => handleChange('schoolAddress', value)}
                placeholder="Full school address"
                icon={MapPin}
              />
            </div>
          </SettingsCard>

          <SettingsCard
            icon={IndianRupee}
            title="Payment Settings"
            description="Configure payment options (Saved to school database)."
            action={
              <button
                onClick={handleSavePayment}
                disabled={isSavingPayment}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                <Save size={15} />
                {isSavingPayment ? 'Saving...' : 'Save Payments'}
              </button>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Field
                  label="School UPI ID"
                  value={settings.upi_id}
                  onChange={(value) => handleChange('upi_id', value)}
                  placeholder="schoolname@upi"
                  icon={QrCode}
                />
                <Field
                  label="UPI Display Name"
                  value={settings.upi_name}
                  onChange={(value) => handleChange('upi_name', value)}
                  placeholder="e.g. EduCore Academy"
                  icon={User}
                />
                <ToggleRow
                  title="UPI Payments Enabled"
                  description="Toggle online UPI payments for all students (e.g., during bank maintenance)."
                  checked={settings.upi_enabled}
                  onToggle={() => handleChange('upi_enabled', !settings.upi_enabled)}
                />
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-brand/5 border border-brand/10">
                  <AlertCircle size={20} className="text-brand shrink-0" />
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    Students will use this UPI ID and name to pay fees. If "UPI Display Name" is empty, the school name will be used.
                  </p>
                </div>
              </div>

              {upiQrUrl && (
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-border shadow-sm w-fit mx-auto md:mr-0">
                  <p className="text-[10px] font-bold uppercase text-text-muted mb-3">Live Preview</p>
                  <img 
                    src={upiQrUrl} 
                    alt="UPI QR Code" 
                    className="w-32 h-32 rounded-lg"
                    onLoad={() => console.log('QR loaded')}
                  />
                  <p className="mt-3 text-[11px] font-medium text-brand">{settings.upi_id}</p>
                </div>
              )}
            </div>
          </SettingsCard>

          <SettingsCard
            icon={ClipboardList}
            title="Admission Settings"
            description="Control public admission portal status (Saved to school database)."
            action={
              <button
                onClick={handleSaveAdmission}
                disabled={isSavingAdmission}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                <Save size={15} />
                {isSavingAdmission ? 'Saving...' : 'Save Portal Status'}
              </button>
            }
          >
            <div className="space-y-4">
              <ToggleRow
                title="Online Admission Portal"
                description="When enabled, anyone can visit /admission and submit an admission application. When disabled, the page will show a 'Closed' message."
                checked={settings.online_admission_open}
                onToggle={() => handleChange('online_admission_open', !settings.online_admission_open)}
              />
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-brand/5 border border-brand/10">
                <AlertCircle size={20} className="text-brand shrink-0" />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  Current Public URL: <span className="font-mono text-brand font-bold">{window.location.origin}/admission</span>
                </p>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={MonitorCog}
            title="Workspace Preferences"
            description="Personalize how the admin panel feels when you open it each day."
            action={
              <button
                onClick={handleLocalSave}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                <Save size={15} />
                Save Preferences
              </button>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PreferenceBox
                label="Theme"
                hint="Choose the appearance you want across the dashboard."
              >
                <div className="grid grid-cols-3 gap-3">
                  <ChoiceButton
                    active={theme === 'light'}
                    label="Light"
                    icon={Sun}
                    onClick={() => handleThemeChange('light')}
                  />
                  <ChoiceButton
                    active={theme === 'dark'}
                    label="Dark"
                    icon={Moon}
                    onClick={() => handleThemeChange('dark')}
                  />
                  <ChoiceButton
                    active={theme === 'system'}
                    label="System"
                    icon={MonitorCog}
                    onClick={() => handleThemeChange('system')}
                  />
                </div>
              </PreferenceBox>

              <PreferenceBox
                label="Sidebar"
                hint="Set how navigation should appear when the app loads."
              >
                <div className="grid grid-cols-2 gap-3">
                  <ChoiceButton
                    active={!sidebarCollapsed}
                    label="Expanded"
                    icon={PanelLeftOpen}
                    onClick={() => handleSidebarChange(false)}
                  />
                  <ChoiceButton
                    active={sidebarCollapsed}
                    label="Collapsed"
                    icon={PanelLeftClose}
                    onClick={() => handleSidebarChange(true)}
                  />
                </div>
              </PreferenceBox>
            </div>

            <div className="mt-4 max-w-md">
              <Field
                label="Workspace Timezone"
                value={settings.timezone}
                onChange={(value) => handleChange('timezone', value)}
                placeholder="Asia/Kolkata"
              />
            </div>
          </SettingsCard>

          <SettingsCard
            icon={ShieldCheck}
            title="Account Security"
            description="Update your password periodically to keep your account secure."
          >
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <PasswordField
                  label="Current password"
                  value={pwdForm.currentPassword}
                  onChange={(v) => setPwdForm({ ...pwdForm, currentPassword: v })}
                  show={showPwd.current}
                  onToggle={() => setShowPwd({ ...showPwd, current: !showPwd.current })}
                />
                <div className="hidden md:block" />
                
                <div className="space-y-3">
                  <PasswordField
                    label="New password"
                    value={pwdForm.newPassword}
                    onChange={(v) => setPwdForm({ ...pwdForm, newPassword: v })}
                    show={showPwd.new}
                    onToggle={() => setShowPwd({ ...showPwd, new: !showPwd.new })}
                  />
                  {pwdForm.newPassword && (
                    <div className="px-1">
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ backgroundColor: i <= strength.score ? strength.color : 'var(--color-border)' }} />
                        ))}
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: strength.color || 'var(--color-text-muted)' }}>{strength.label || 'Strength'}</p>
                    </div>
                  )}
                </div>

                <PasswordField
                  label="Confirm new password"
                  value={pwdForm.confirmPassword}
                  onChange={(v) => setPwdForm({ ...pwdForm, confirmPassword: v })}
                  show={showPwd.confirm}
                  onToggle={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <Rule label="8+ chars" pass={pwdForm.newPassword.length >= 8} />
                  <Rule label="Uppercase" pass={/[A-Z]/.test(pwdForm.newPassword)} />
                  <Rule label="Number" pass={/[0-9]/.test(pwdForm.newPassword)} />
                  <Rule label="Special" pass={/[^A-Za-z0-9]/.test(pwdForm.newPassword)} />
                </div>
                <button
                  type="submit"
                  disabled={isChangingPwd || !pwdForm.currentPassword || !pwdForm.newPassword || pwdForm.newPassword !== pwdForm.confirmPassword}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:grayscale"
                  style={{ backgroundColor: 'var(--color-brand)' }}
                >
                  {isChangingPwd ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  Update Password
                </button>
              </div>
            </form>
          </SettingsCard>

          <SettingsCard
            icon={Bell}
            title="Admin Reminders"
            description="Keep a couple of useful nudges visible for the admin team."
            action={
              <button
                onClick={handleLocalSave}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                <Save size={15} />
                Save Preferences
              </button>
            }
          >
            <div className="space-y-3">
              <ToggleRow
                title="Attendance follow-up reminder"
                description="Show a reminder preference for attendance review workflows."
                checked={settings.attendanceReminder}
                onToggle={() => handleChange('attendanceReminder', !settings.attendanceReminder)}
              />
              <ToggleRow
                title="Fee reminder summary"
                description="Keep a reminder preference for pending dues and billing review."
                checked={settings.feeReminder}
                onToggle={() => handleChange('feeReminder', !settings.feeReminder)}
              />
            </div>
          </SettingsCard>
        </div>

        <div className="space-y-6">
          <SettingsCard
            icon={User}
            title="Administrator"
            description="Signed-in account details for the current session."
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                {(user?.name || 'A').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {user?.name || 'Administrator'}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {user?.email || 'No email available'}
                </p>
                <span
                  className="inline-flex mt-2 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-brand)' }}
                >
                  {user?.role || 'admin'}
                </span>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={CalendarRange}
            title="Academic Session"
            description="Quick visibility into the active session configuration."
            action={
              <button
                onClick={() => navigate(ROUTES.SESSIONS)}
                className="inline-flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-brand)' }}
              >
                Manage sessions
                <ArrowUpRight size={14} />
              </button>
            }
          >
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                Active session
              </p>
              <p className="text-lg font-semibold mt-1" style={{ color: 'var(--color-text-primary)' }}>
                {currentSession?.name || 'No active session found'}
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                {currentSession
                  ? 'This session is currently driving attendance, fees, and reports across the app.'
                  : 'Create or activate a session so school operations stay aligned.'}
              </p>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={ClipboardList}
            title="Academic Streams"
            description="Manage dynamic academic streams for class groups."
            action={
              <button
                onClick={() => navigate(ROUTES.STREAMS)}
                className="inline-flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-brand)' }}
              >
                Manage streams
                <ArrowUpRight size={14} />
              </button>
            }
          >
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                Custom Streams
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                Create additional academic streams (like Vocational, Humanities) to align class groupings and admissions.
              </p>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={Shield}
            title="System Overview"
            description="A quick read on environment details for this frontend."
          >
            <div className="space-y-3 text-sm">
              <OverviewRow label="App name" value={APP_NAME} />
              <OverviewRow label="Version" value={APP_VERSION} />
              <OverviewRow label="Active UPI" value={settings.upi_id || 'Not set'} />
              <OverviewRow label="Merchant Name" value={settings.upi_name || settings.schoolName || 'Not set'} />
              <OverviewRow label="Theme mode" value={theme} />
            </div>
          </SettingsCard>
        </div>
      </div>
    </div>
  )
}

const SettingsCard = ({ icon: Icon, title, description, action, children }) => (
  <section
    className="rounded-[24px] p-5 sm:p-6"
    style={{
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)',
    }}
  >
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-brand)' }}
        >
          {Icon && <Icon size={18} />}
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {description}
          </p>
        </div>
      </div>
      {action}
    </div>
    {children}
  </section>
)

const Field = ({ label, value, onChange, placeholder, icon: Icon }) => (
  <label className="block">
    <span className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
      {label}
    </span>
    <div className="relative">
      {Icon && (
        <Icon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--color-text-muted)' }}
        />
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
          paddingLeft: Icon ? '2.5rem' : '1rem',
        }}
      />
    </div>
  </label>
)

const PreferenceBox = ({ label, hint, children }) => (
  <div
    className="rounded-2xl p-4"
    style={{ backgroundColor: 'var(--color-surface-raised)' }}
  >
    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
      {label}
    </p>
    <p className="text-xs mt-1 mb-3" style={{ color: 'var(--color-text-secondary)' }}>
      {hint}
    </p>
    {children}
  </div>
)

const ChoiceButton = ({ active, label, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all"
    style={{
      backgroundColor: active ? 'var(--color-brand)' : 'var(--color-surface)',
      color: active ? '#ffffff' : 'var(--color-text-secondary)',
      border: active ? '1px solid var(--color-brand)' : '1px solid var(--color-border)',
      boxShadow: active ? '0 10px 24px rgba(37, 99, 235, 0.18)' : 'none',
    }}
  >
    {Icon && <Icon size={16} />}
    {label}
  </button>
)

const ToggleRow = ({ title, description, checked, onToggle }) => (
  <div
    className="flex items-center justify-between gap-4 rounded-2xl p-4"
    style={{ backgroundColor: 'var(--color-surface-raised)' }}
  >
    <div>
      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </p>
      <p className="text-xs mt-1 max-w-md" style={{ color: 'var(--color-text-secondary)' }}>
        {description}
      </p>
    </div>
    <button
      type="button"
      onClick={onToggle}
      className="relative w-14 h-8 rounded-full transition-colors shrink-0"
      style={{ backgroundColor: checked ? 'var(--color-success)' : '#cbd5e1' }}
      aria-pressed={checked}
    >
      <span
        className="absolute top-1 w-6 h-6 rounded-full bg-white transition-all"
        style={{ left: checked ? '1.7rem' : '0.25rem' }}
      />
    </button>
  </div>
)

const OverviewRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
    <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
  </div>
)

const PasswordField = ({ label, value, onChange, show, onToggle }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 pr-10"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        placeholder="••••••••"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  </div>
)

const Rule = ({ label, pass }) => (
  <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: pass ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
    {pass ? <Check size={12} /> : <X size={12} />}
    {label}
  </div>
)

export default SettingsPage
