import { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Input as AntInput,
  Tag,
  Avatar,
} from 'antd'
import {
  UserOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  TransactionOutlined,
  CalendarOutlined,
  UnlockOutlined,
  IdcardOutlined,
} from '@ant-design/icons'
import usePageTitle from '@/hooks/usePageTitle'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency, formatDate } from '@/utils/helpers'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import UICard from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

const AccountantProfile = () => {
  usePageTitle('My Profile')
  const { toastSuccess, toastError } = useToast()

  const [profile, setProfile] = useState(null)
  const [activity, setActivity] = useState(null)
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    accountantApi.getAccountantProfile().then((response) => setProfile(response.data)).catch(() => {})
    accountantApi.getAccountantActivity().then((response) => setActivity(response.data)).catch(() => {})
  }, [])

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (!passwords.current_password || !passwords.new_password) {
      toastError('Please fill out all fields')
      return
    }
    setUpdating(true)
    try {
      await accountantApi.changeAccountantPassword(passwords)
      toastSuccess('Password updated successfully')
      setPasswords({ current_password: '', new_password: '' })
    } catch (err) {
      toastError(err.message || 'Failed to update password')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Profile"
        subtitle="Account details, permissions, and security settings"
      />

      {/* Profile Identity Card */}
      <UICard>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar
            size={64}
            icon={<UserOutlined />}
            style={{ backgroundColor: 'var(--color-brand)', flexShrink: 0 }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {profile?.name || 'Loading profile…'}
              </h1>
              <Badge variant="blue">Accountant</Badge>
            </div>
            <p className="mt-1.5 text-xs flex flex-wrap items-center gap-x-3 gap-y-1" style={{ color: 'var(--color-text-muted)' }}>
              <span className="flex items-center gap-1"><IdcardOutlined /> {profile?.designation || '—'}</span>
              <span>·</span>
              <span>{profile?.department || '—'}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><CalendarOutlined /> Joined {profile?.joining_date ? formatDate(profile.joining_date) : '—'}</span>
            </p>
          </div>
        </div>
      </UICard>

      <Row gutter={[16, 16]}>
        {/* Activity Stats */}
        <Col xs={24} sm={12} md={6}>
          <StatCard
            label="Today's Transactions"
            value={activity?.today?.transactions || 0}
            sub={`${formatCurrency(activity?.today?.amount || 0)} collected`}
            color="var(--color-brand)"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            label="Monthly Transactions"
            value={activity?.month?.transactions || 0}
            sub={`${formatCurrency(activity?.month?.amount || 0)} collected`}
            color="var(--color-success)"
          />
        </Col>

        {/* Permissions */}
        <Col xs={24} md={12}>
          <UICard
            title={
              <div className="flex items-center gap-2">
                <SafetyCertificateOutlined style={{ color: 'var(--color-brand)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Authorized Permissions</span>
              </div>
            }
          >
            <div className="flex flex-wrap gap-2 py-1">
              {(profile?.permissions || []).map((permission) => (
                <Tag key={permission} color="green" className="rounded-full text-[10px] uppercase border-0 px-3 py-0.5 m-0">
                  {permission.replace(/_/g, ' ')}
                </Tag>
              ))}
              {(!profile?.permissions || profile.permissions.length === 0) && (
                <span className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>No special permissions assigned.</span>
              )}
            </div>
          </UICard>
        </Col>
      </Row>

      {/* Change Password */}
      <UICard
        title={
          <div className="flex items-center gap-2">
            <KeyOutlined style={{ color: 'var(--color-brand)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Update Account Password</span>
          </div>
        }
      >
        <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-xl py-1">
          <Row gutter={16}>
            <Col span={12}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Current Password</label>
              <AntInput.Password
                value={passwords.current_password}
                onChange={(e) => setPasswords((curr) => ({ ...curr, current_password: e.target.value }))}
                placeholder="Enter current password"
                prefix={<UnlockOutlined style={{ color: 'var(--color-text-muted)' }} />}
                required
                style={{ borderRadius: 10, height: 38 }}
              />
            </Col>
            <Col span={12}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>New Password</label>
              <AntInput.Password
                value={passwords.new_password}
                onChange={(e) => setPasswords((curr) => ({ ...curr, new_password: e.target.value }))}
                placeholder="Enter new password"
                prefix={<KeyOutlined style={{ color: 'var(--color-text-muted)' }} />}
                required
                style={{ borderRadius: 10, height: 38 }}
              />
            </Col>
          </Row>
          <div className="pt-1">
            <Button
              type="primary"
              htmlType="submit"
              loading={updating}
              style={{ borderRadius: 10, height: 38, paddingInline: 24 }}
            >
              Update Password
            </Button>
          </div>
        </form>
      </UICard>
    </div>
  )
}

export default AccountantProfile
