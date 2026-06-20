import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Mail, Phone, ShieldCheck, KeyRound, ScrollText, UserRound,
  CheckCircle2, AlertCircle, Copy, Save, Sparkles, Loader2, Shield
} from 'lucide-react'
import * as api from '@/api/userManagementApi'
import { ROUTES } from '@/constants/app'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { formatDate } from '@/utils/helpers'
import PermissionSelector from '@/components/admin/PermissionSelector'
import Input from '@/components/ui/Input'

const ROLE_STYLES = {
  admin       : { label: 'Admin', color: 'var(--color-brand)', bg: 'color-mix(in srgb, var(--color-brand) 12%, var(--color-surface-raised))' },
  teacher     : { label: 'Teacher', color: 'var(--color-success)', bg: 'color-mix(in srgb, var(--color-success) 12%, var(--color-surface-raised))' },
  accountant  : { label: 'Accountant', color: 'var(--color-warning)', bg: 'color-mix(in srgb, var(--color-warning) 12%, var(--color-surface-raised))' },
  student     : { label: 'Student', color: 'var(--color-info)', bg: 'color-mix(in srgb, var(--color-info) 12%, var(--color-surface-raised))' },
  parent      : { label: 'Parent', color: '#b45309', bg: 'color-mix(in srgb, #b45309 12%, var(--color-surface-raised))' },
  librarian   : { label: 'Librarian', color: '#7c3aed', bg: 'color-mix(in srgb, #7c3aed 12%, var(--color-surface-raised))' },
  receptionist: { label: 'Receptionist', color: '#be185d', bg: 'color-mix(in srgb, #be185d 12%, var(--color-surface-raised))' },
  staff       : { label: 'Staff', color: '#0369a1', bg: 'color-mix(in srgb, #0369a1 12%, var(--color-surface-raised))' },
}

const CredentialRow = ({ icon: Icon, label, value, onCopy }) => (
  <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100 dark:bg-slate-800 dark:border-slate-700">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
        <Icon size={14} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-none mb-1">{label}</p>
        <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
    <button
      type="button"
      onClick={() => onCopy(value)}
      className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm text-gray-400 hover:text-indigo-600 transition-all"
    >
      <Copy size={14} />
    </button>
  </div>
)

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      {label}
    </label>
    {children}
  </div>
)

const inputClassName = 'w-full px-4 py-3 rounded-xl text-sm border outline-none bg-transparent transition-all'
const baseInputStyle = {
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
}

const UserDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toastSuccess, toastError } = useToast()

  const [activeTab, setActiveTab] = useState('profile')
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Profile Tab form state
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    employee_id: '',
    department: '',
    designation: '',
    joining_date: '',
    date_of_birth: '',
    gender: '',
    address: '',
    internal_notes: '',
    force_password_change: false,
  })

  // Permissions Tab state
  const [permissionDraft, setPermissionDraft] = useState([])

  // Security Tab state
  const [tempPassword, setTempPassword] = useState('')
  const [forcePasswordChange, setForcePasswordChange] = useState(true)
  const [resetResult, setResetResult] = useState(null)

  // Audit Tab state
  const [auditLogs, setAuditLogs] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)

  usePageTitle(user ? `Manage ${user.name}` : 'User Details')

  const fetchUser = async () => {
    setIsLoading(true)
    try {
      const response = await api.getUser(id)
      const u = response.data
      setUser(u)
      setEditForm({
        name: u.name || '',
        phone: u.phone || '',
        employee_id: u.employee_id || '',
        department: u.department || '',
        designation: u.designation || '',
        joining_date: u.joining_date ? u.joining_date.slice(0, 10) : '',
        date_of_birth: u.date_of_birth ? u.date_of_birth.slice(0, 10) : '',
        gender: u.gender || '',
        address: u.address || '',
        internal_notes: u.internal_notes || '',
        force_password_change: !!u.force_password_change,
      })
      setPermissionDraft(u.permission_names || [])
    } catch (e) {
      toastError(e.message || 'Failed to fetch user details')
      navigate(ROUTES.USERS)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAuditLogs = async () => {
    setAuditLoading(true)
    try {
      const response = await api.getUserAudit(id)
      setAuditLogs(response.data?.logs || [])
    } catch (e) {
      toastError(e.message || 'Failed to load audit logs')
    } finally {
      setAuditLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [id])

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs()
    }
  }, [activeTab])

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await api.updateUser(id, editForm)
      toastSuccess('Profile updated successfully')
      fetchUser()
    } catch (e) {
      toastError(e.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePermissionsSave = async () => {
    setIsSaving(true)
    try {
      await api.updateUserPermissions(id, { permission_names: permissionDraft })
      toastSuccess('Permissions updated successfully')
      fetchUser()
    } catch (e) {
      toastError(e.message || 'Failed to update permissions')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const response = await api.resetUserPassword(id, {
        new_password: tempPassword.trim() || undefined,
        force_change: forcePasswordChange,
      })
      const generatedPassword = response.data?.generated_password
      if (generatedPassword) {
        setResetResult(response.data)
        toastSuccess('Temporary password generated')
      } else {
        toastSuccess('Password updated successfully')
        setTempPassword('')
      }
    } catch (e) {
      toastError(e.message || 'Failed to reset password')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    toastSuccess('Copied to clipboard')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-sm text-gray-500 font-medium">Loading user account details...</p>
      </div>
    )
  }

  const rStyle = ROLE_STYLES[user.role] || { label: user.role, color: 'var(--color-text-secondary)', bg: 'var(--color-surface-raised)' }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header and Back navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(ROUTES.USER_MANAGE + (user.role ? `?role=${user.role}` : ''))}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              {user.name}
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: rStyle.bg, color: rStyle.color }}
              >
                {rStyle.label}
              </span>
            </h1>
            <p className="text-sm text-gray-500 font-medium">{user.email || user.employee_id}</p>
          </div>
        </div>

        {/* Online/Active indicators */}
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: user.is_active
                ? 'color-mix(in srgb, var(--color-success) 12%, var(--color-surface-raised))'
                : 'color-mix(in srgb, var(--color-text-secondary) 12%, var(--color-surface-raised))',
              color: user.is_active ? 'var(--color-success)' : 'var(--color-text-secondary)',
            }}
          >
            <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
            {user.is_active ? 'Active Account' : 'Inactive Account'}
          </span>
          {user.is_online && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-brand) 12%, var(--color-surface-raised))',
                color: 'var(--color-brand)',
                border: '1px solid color-mix(in srgb, var(--color-brand) 25%, var(--color-border))',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Online
            </span>
          )}
        </div>
      </div>

      {/* Main card with side tabs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 bg-white rounded-3xl border border-gray-100 shadow-sm p-4 space-y-1 dark:bg-slate-800 dark:border-slate-700">
          {[
            { id: 'profile', label: 'Profile', icon: UserRound },
            { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
            { id: 'security', label: 'Security', icon: KeyRound },
            { id: 'audit', label: 'Audit Log', icon: ScrollText },
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setResetResult(null)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-slate-700/50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Contents */}
        <div className="md:col-span-3">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-700/50 bg-gray-50/35 dark:bg-slate-700/20 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Personal Profile Details</h3>
                  <p className="text-[11px] text-gray-500">Edit general personal and employment parameters</p>
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                  Save Profile
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name">
                    <input
                      className={inputClassName}
                      style={baseInputStyle}
                      value={editForm.name}
                      onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </Field>
                  <Field label="Phone">
                    <input
                      className={inputClassName}
                      style={baseInputStyle}
                      value={editForm.phone}
                      onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Employee / Admission ID">
                    <input
                      className={inputClassName}
                      style={baseInputStyle}
                      value={editForm.employee_id}
                      onChange={e => setEditForm(prev => ({ ...prev, employee_id: e.target.value }))}
                    />
                  </Field>
                  <Field label="Department">
                    <input
                      className={inputClassName}
                      style={baseInputStyle}
                      value={editForm.department}
                      onChange={e => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Designation">
                    <input
                      className={inputClassName}
                      style={baseInputStyle}
                      value={editForm.designation}
                      onChange={e => setEditForm(prev => ({ ...prev, designation: e.target.value }))}
                    />
                  </Field>
                  <Field label="Gender">
                    <select
                      className={inputClassName}
                      style={baseInputStyle}
                      value={editForm.gender}
                      onChange={e => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Joining Date">
                    <Input
                      type="date"
                      className={inputClassName}
                      style={baseInputStyle}
                      value={editForm.joining_date}
                      onChange={e => setEditForm(prev => ({ ...prev, joining_date: e.target.value }))}
                    />
                  </Field>
                  <Field label="Date of Birth">
                    <Input
                      type="date"
                      className={inputClassName}
                      style={baseInputStyle}
                      value={editForm.date_of_birth}
                      onChange={e => setEditForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    />
                  </Field>
                </div>
                <Field label="Address">
                  <textarea
                    className={`${inputClassName} min-h-20 resize-none`}
                    style={baseInputStyle}
                    value={editForm.address}
                    onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  />
                </Field>
                <Field label="Internal Notes">
                  <textarea
                    className={`${inputClassName} min-h-20 resize-none`}
                    style={baseInputStyle}
                    value={editForm.internal_notes}
                    onChange={e => setEditForm(prev => ({ ...prev, internal_notes: e.target.value }))}
                  />
                </Field>
                <label className="flex items-center gap-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={editForm.force_password_change}
                    onChange={e => setEditForm(prev => ({ ...prev, force_password_change: e.target.checked }))}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Force password change on next login
                </label>
              </div>
            </form>
          )}

          {activeTab === 'permissions' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-700/50 bg-gray-50/35 dark:bg-slate-700/20 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Access Permissions</h3>
                  <p className="text-[11px] text-gray-500">Fine-tune individual feature access rules</p>
                </div>
                {user.role === 'admin' ? (
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-xl border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400">
                    Admin Role Has Full Bypass
                  </span>
                ) : (
                  <button
                    onClick={handlePermissionsSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                    Save Permissions
                  </button>
                )}
              </div>
              <div className="p-6">
                {user.role === 'admin' ? (
                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-sm text-indigo-800 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-300">
                    This user holds the **Admin** role. Admins automatically possess all permissions implicitly, so manual overrides are disabled.
                  </div>
                ) : (
                  <PermissionSelector selected={permissionDraft} onChange={setPermissionDraft} />
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-700/50 bg-gray-50/35 dark:bg-slate-700/20">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Security Dashboard</h3>
                <p className="text-[11px] text-gray-500">Manage user credentials and login policies</p>
              </div>
              <div className="p-6 space-y-6">
                {!resetResult ? (
                  <form onSubmit={handlePasswordReset} className="space-y-4 max-w-md">
                    <p className="text-sm text-gray-500">
                      Specify a custom password below, or leave it blank to auto-generate a secure random temporary password.
                    </p>
                    <Field label="New Password">
                      <input
                        type="password"
                        className={inputClassName}
                        style={baseInputStyle}
                        value={tempPassword}
                        onChange={e => setTempPassword(e.target.value)}
                        placeholder="Leave blank for auto-generated password"
                      />
                    </Field>
                    <label className="flex items-center gap-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={forcePasswordChange}
                        onChange={e => setForcePasswordChange(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      Force password change on next login
                    </label>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Processing...' : 'Reset User Password'}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4 max-w-md">
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900">
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <Sparkles size={14} />
                        New credentials generated successfully! Copy and share these with the user securely.
                      </p>
                    </div>
                    <div className="grid gap-3">
                      {resetResult.email && (
                        <CredentialRow
                          icon={Mail}
                          label="Login Email"
                          value={resetResult.email}
                          onCopy={handleCopy}
                        />
                      )}
                      <CredentialRow
                        icon={KeyRound}
                        label="Temporary Password"
                        value={resetResult.generated_password}
                        onCopy={handleCopy}
                      />
                    </div>
                    <button
                      onClick={() => setResetResult(null)}
                      className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      Go Back
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-700/50 bg-gray-50/35 dark:bg-slate-700/20">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Account Audit Logs</h3>
                <p className="text-[11px] text-gray-500">Chronological history of edits made to this account profile</p>
              </div>
              <div className="p-6">
                {auditLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="animate-spin text-indigo-600 mx-auto mb-2" size={24} />
                    <p className="text-xs text-gray-400 font-medium">Fetching history log...</p>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8 font-medium">No audit entries found for this user.</p>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {auditLogs.map(log => (
                      <div
                        key={log.id}
                        className="p-4 rounded-2xl bg-gray-50 border border-gray-100 dark:bg-slate-800/40 dark:border-slate-700"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                            Field: <span className="text-indigo-600 dark:text-indigo-400">{log.field_name}</span>
                          </p>
                          <p className="text-[11px] text-gray-400 font-medium">
                            {formatDate(log.created_at, 'long')}
                          </p>
                        </div>
                        <p className="text-sm mt-2 text-gray-600 dark:text-gray-300 font-mono">
                          {`${log.old_value || 'Empty'} → ${log.new_value || 'Empty'}`}
                        </p>
                        <p className="text-[10px] mt-2 text-gray-400 font-semibold uppercase tracking-wider">
                          Modified by: {log.changed_by_name || 'System / Admin'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserDetailPage
