import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, AlertCircle, Copy, KeyRound, Mail, ShieldCheck, UserRound,
  Info, Shield, Briefcase, Calendar, Phone, MapPin, User
} from 'lucide-react'
import * as api from '@/api/userManagementApi'
import { ROUTES } from '@/constants/app'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import PermissionSelector from '@/components/admin/PermissionSelector'
import { getDefaultPermissionsForRole } from '@/utils/permissions'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { createUserSchema } from '@/utils/validations'

const ROLES = ['admin', 'teacher', 'accountant', 'student', 'librarian', 'staff', 'receptionist', 'parent']

const Field = ({ label, error, children, required, hint, icon: Icon }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
      {Icon && <Icon size={13} className="text-gray-400" />}
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-[11px] font-medium text-red-500 mt-0.5">
        <AlertCircle size={11} />
        {error}
      </p>
    )}
    {hint && !error && <p className="text-[11px] text-gray-400 font-medium italic">{hint}</p>}
  </div>
)

const FormSection = ({ title, icon: Icon, children, description }) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-3">
      {Icon && <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600"><Icon size={18} /></div>}
      <div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{title}</h3>
        {description && <p className="text-[11px] text-gray-500">{description}</p>}
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
)

const inputClassName = (error) => `w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all bg-gray-50/50 text-gray-900 placeholder:text-gray-400/60 ${error ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-100 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50'}`

const CredentialRow = ({ icon: Icon, label, value, onCopy }) => (
  <div className="flex items-center justify-between gap-3 rounded-2xl px-5 py-4 bg-gray-50 border border-gray-100">
    <div className="flex items-center gap-4 min-w-0">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm text-indigo-600 border border-indigo-50">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-0.5">{label}</p>
        <p className="truncate text-sm font-bold text-gray-900">{value || '--'}</p>
      </div>
    </div>
    <button 
      type="button"
      onClick={() => onCopy(value)}
      className="p-2.5 rounded-xl bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
    >
      <Copy size={16} />
    </button>
  </div>
)

const buildDefaultValues = (role) => ({
  name: '',
  email: '',
  phone: '',
  role,
  employee_id: '',
  department: '',
  designation: '',
  joining_date: '',
  date_of_birth: '',
  gender: '',
  address: '',
  auto_password: true,
  force_password_change: true,
  password: '',
  internal_notes: '',
})

const CreateUserPage = () => {
  usePageTitle('Create User')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toastSuccess, toastError, toastInfo } = useToast()
  
  const requestedRole = searchParams.get('role')
  const initialRole = ROLES.includes(requestedRole) ? requestedRole : ''
  
  const [permissions, setPermissions] = useState(getDefaultPermissionsForRole(initialRole))
  const [isSaving, setIsSaving] = useState(false)
  const [createdAccount, setCreatedAccount] = useState(null)

  const {
    register, handleSubmit, watch, setValue, reset, formState: { errors },
  } = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: buildDefaultValues(initialRole),
  })

  const role = watch('role')
  const autoPassword = watch('auto_password')
  const email = watch('email')
  const roleDefaults = useMemo(() => getDefaultPermissionsForRole(role), [role])

  const handleRoleChange = (nextRole) => {
    setValue('role', nextRole)
    setPermissions(getDefaultPermissionsForRole(nextRole))
  }

  const handleCopy = async (value) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      toastInfo('Copied to clipboard')
    } catch {
      toastError('Unable to copy to clipboard')
    }
  }

  const onSubmit = async (data) => {
    setIsSaving(true)
    try {
      const payload = {
        ...data,
        permission_names: permissions,
      }

      const result = await api.createUser(payload)
      const response = result.data || {}

      setCreatedAccount({
        name: response.user?.name || data.name,
        email: response.user?.email || data.email,
        login_id: response.user?.email || data.email,
        generated_password: response.generated_password || '',
        role,
      })

      toastSuccess('User created successfully')
      reset(buildDefaultValues(role))
      setPermissions(getDefaultPermissionsForRole(role))
    } catch (e) {
      toastError(e.message || 'Failed to create user')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(initialRole ? `${ROUTES.USER_MANAGE}?role=${initialRole}` : ROUTES.USERS)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Create New User</h1>
            <p className="text-sm text-gray-500 font-medium">Add a new member to the school portal</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <FormSection 
              title="Personal Details" 
              icon={UserRound} 
              description="Basic information about the user"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Full Name" error={errors.name?.message} icon={User} required>
                  <input {...register('name')} placeholder="e.g. Rahul Verma" className={inputClassName(!!errors.name)} autoFocus />
                </Field>
                <Field label="Email Address" error={errors.email?.message} icon={Mail} required>
                  <input {...register('email')} type="email" placeholder="rahul@school.com" className={inputClassName(!!errors.email)} />
                </Field>
                <Field label="Phone Number" error={errors.phone?.message} icon={Phone}>
                  <input {...register('phone')} placeholder="+91 98765 43210" className={inputClassName(!!errors.phone)} />
                </Field>
                <Field label="Assign Role" required error={errors.role?.message} icon={Shield}>
                  <select 
                    {...register('role')} 
                    className={inputClassName(!!errors.role)} 
                    onChange={e => handleRoleChange(e.target.value)}
                  >
                    <option value="">Select a role</option>
                    {ROLES.map(item => (
                      <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </FormSection>

            <FormSection 
              title="Professional Info" 
              icon={Briefcase} 
              description="Employment and departmental data"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Employee / Staff ID" icon={Info}>
                  <input {...register('employee_id')} placeholder="EMP-2024-001" className={inputClassName(false)} />
                </Field>
                <Field label="Joining Date" icon={Calendar}>
                  <Input
                    {...register('joining_date')}
                    type="date"
                    className="border border-gray-100 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 !bg-gray-50/50"
                  />
                </Field>
                <Field label="Department" icon={Briefcase}>
                  <input {...register('department')} placeholder="e.g. Administration" className={inputClassName(false)} />
                </Field>
                <Field label="Designation" icon={User}>
                  <input {...register('designation')} placeholder="e.g. Senior Manager" className={inputClassName(false)} />
                </Field>
              </div>
            </FormSection>

            {role !== 'admin' && (
              <FormSection 
                title="Security & Permissions" 
                icon={ShieldCheck} 
                description={`Manage access for ${role} role`}
              >
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                    <PermissionSelector selected={permissions} onChange={setPermissions} />
                    <div className="mt-4 pt-4 border-t border-indigo-100/30 flex items-center justify-between">
                      <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                        {permissions.length} Permissions active
                      </p>
                      <button 
                        type="button"
                        onClick={() => setPermissions(roleDefaults)}
                        className="text-[11px] font-bold text-indigo-600 hover:underline uppercase tracking-wider"
                      >
                        Reset to defaults ({roleDefaults.length})
                      </button>
                    </div>
                  </div>
                </div>
              </FormSection>
            )}
          </div>

          <div className="space-y-6">
            <FormSection title="Account Setup" icon={KeyRound}>
              <div className="space-y-5">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer group hover:bg-white hover:border-indigo-200 transition-all">
                  <div className="mt-0.5">
                    <input id="auto_pwd" type="checkbox" {...register('auto_password')} className="w-5 h-5 accent-indigo-600 cursor-pointer rounded-lg" />
                  </div>
                  <label htmlFor="auto_pwd" className="text-sm font-semibold text-gray-700 cursor-pointer group-hover:text-indigo-600 transition-colors">
                    Auto-generate password
                    <span className="block text-[11px] font-medium text-gray-400 mt-1 leading-relaxed">
                      System will create a secure password and show it after creation
                    </span>
                  </label>
                </div>

                {!autoPassword && (
                  <Field label="Set Password" hint="Minimum 8 characters" icon={KeyRound}>
                    <input {...register('password')} type="password" placeholder="••••••••" className={inputClassName(false)} />
                  </Field>
                )}

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer group hover:bg-white hover:border-indigo-200 transition-all">
                  <div className="mt-0.5">
                    <input id="force_pwd" type="checkbox" {...register('force_password_change')} defaultChecked className="w-5 h-5 accent-indigo-600 cursor-pointer rounded-lg" />
                  </div>
                  <label htmlFor="force_pwd" className="text-sm font-semibold text-gray-700 cursor-pointer group-hover:text-indigo-600 transition-colors">
                    Require password change
                    <span className="block text-[11px] font-medium text-gray-400 mt-1 leading-relaxed">
                      User must change password on their first login
                    </span>
                  </label>
                </div>
              </div>
            </FormSection>

            <FormSection title="Internal Notes" icon={Info}>
              <textarea 
                {...register('internal_notes')} 
                rows={4} 
                placeholder="Admin-only reference notes..." 
                className={`${inputClassName(false)} resize-none`} 
              />
            </FormSection>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(initialRole ? `${ROUTES.USER_MANAGE}?role=${initialRole}` : ROUTES.USERS)}
              disabled={isSaving}
              className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-3 px-10 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all uppercase tracking-widest"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Processing...
                </>
              ) : 'Finalize Account'}
            </button>
          </div>
        </div>
      </form>

      <Modal
        open={!!createdAccount}
        onClose={() => setCreatedAccount(null)}
        title="Account Created Successfully"
        footer={(
          <div className="flex gap-3 w-full">
            <Button variant="secondary" className="flex-1" onClick={() => setCreatedAccount(null)}>
              Add Another
            </Button>
            <Button className="flex-1" onClick={() => navigate(initialRole ? `${ROUTES.USER_MANAGE}?role=${initialRole}` : ROUTES.USERS)}>
              View All Users
            </Button>
          </div>
        )}
      >
        <div className="space-y-6">
          <div className="rounded-[32px] p-6 bg-emerald-50 border border-emerald-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">Success!</p>
              <p className="mt-1 text-xs font-medium text-emerald-700 leading-relaxed">
                The account is now active. Please share these credentials securely with {createdAccount?.name}.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <CredentialRow icon={UserRound} label="Full Name" value={createdAccount?.name} onCopy={handleCopy} />
            <CredentialRow icon={Mail} label="Login Email" value={createdAccount?.email} onCopy={handleCopy} />
            {createdAccount?.generated_password && (
              <CredentialRow icon={KeyRound} label="Temporary Password" value={createdAccount?.generated_password} onCopy={handleCopy} />
            )}
            <CredentialRow icon={Shield} label="Access Level" value={createdAccount?.role?.toUpperCase()} onCopy={handleCopy} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CreateUserPage
