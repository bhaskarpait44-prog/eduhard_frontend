import { useEffect, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import axios from '@/api/axios'
import { formatDate } from '@/utils/helpers'
import useToast from '@/hooks/useToast'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const LibrarianProfile = () => {
  usePageTitle('Librarian Profile')
  const { toastSuccess, toastError } = useToast()
  const [profile, setProfile] = useState(null)
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get('/admin/users/me')
      setProfile(data)
    } catch (err) {
      console.error('Failed to fetch profile', err)
    } finally {
      setLoading(false)
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (passwords.new_password.length < 8) {
      return toastError('New password must be at least 8 characters long')
    }

    if (passwords.new_password !== passwords.confirm_password) {
      return toastError('Passwords do not match')
    }

    if (passwords.new_password === passwords.current_password) {
      return toastError('New password must be different from the current password')
    }

    setSaving(true)
    try {
      await axios.patch('/admin/users/change-password', passwords)
      toastSuccess('Password changed successfully')
      setPasswords({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  };

  if (loading) return <div className="p-8 text-center">Loading profile...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-surface border border-border rounded-[28px] p-6">
        <h1 className="text-2xl font-bold text-text-primary">{profile?.name}</h1>
        <p className="text-text-muted capitalize">{profile?.role} • {profile?.email}</p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-text-muted">Employee ID</p>
            <p className="font-medium">{profile?.employee_id || '--'}</p>
          </div>
          <div>
            <p className="text-text-muted">Department</p>
            <p className="font-medium">{profile?.department || '--'}</p>
          </div>
          <div>
            <p className="text-text-muted">Designation</p>
            <p className="font-medium">{profile?.designation || '--'}</p>
          </div>
          <div>
            <p className="text-text-muted">Joined</p>
            <p className="font-medium">{profile?.joining_date ? formatDate(profile.joining_date) : '--'}</p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-[28px] p-6">
        <h2 className="text-lg font-bold mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            type="password"
            value={passwords.current_password}
            onChange={(e) => setPasswords(p => ({ ...p, current_password: e.target.value }))}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={passwords.new_password}
            onChange={(e) => setPasswords(p => ({ ...p, new_password: e.target.value }))}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={passwords.confirm_password}
            onChange={(e) => setPasswords(p => ({ ...p, confirm_password: e.target.value }))}
            required
          />
          <Button type="submit" variant="primary" loading={saving}>Change Password</Button>
        </form>
      </div>
    </div>
  )
}

export default LibrarianProfile
