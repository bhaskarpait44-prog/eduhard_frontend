import { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Input as AntInput,
  ConfigProvider,
  Tag,
  Avatar,
  Statistic,
  theme as antdTheme
} from 'antd'
import {
  UserOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  TransactionOutlined,
  CalendarOutlined,
  UnlockOutlined,
  IdcardOutlined
} from '@ant-design/icons'
import usePageTitle from '@/hooks/usePageTitle'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency, formatDate } from '@/utils/helpers'
import useUiStore from '@/store/uiStore'
import useToast from '@/hooks/useToast'

const AccountantProfile = () => {
  usePageTitle('My Profile')
  const { toastSuccess, toastError } = useToast()
  const { theme: storeTheme } = useUiStore()

  const [profile, setProfile] = useState(null)
  const [activity, setActivity] = useState(null)
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' })
  const [updating, setUpdating] = useState(false)

  const isDark = storeTheme === 'dark' || (storeTheme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)

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
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#4361ee',
          borderRadius: 12,
          fontFamily: "'Roboto', system-ui, sans-serif",
        },
      }}
    >
      <div className="space-y-6">
        {/* Profile Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center gap-5 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm bg-white dark:bg-[#1e293b] relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

          <div className="z-10 relative flex flex-col md:flex-row md:items-center gap-5 w-full">
            <Avatar
              size={72}
              icon={<UserOutlined />}
              className="bg-indigo-500 text-white shadow-md border-2 border-white/50 dark:border-slate-700/50"
            />
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  {profile?.name || 'Loading profile...'}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                  Accountant
                </span>
              </div>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 font-bold leading-relaxed flex flex-wrap items-center gap-x-2 gap-y-1">
                <IdcardOutlined /> {profile?.designation || '--'}
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                <span>{profile?.department || '--'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                <CalendarOutlined /> Joined {profile?.joining_date ? formatDate(profile.joining_date) : '--'}
              </p>
            </div>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          {/* Permissions Section */}
          <Col xs={24} md={12}>
            <Card
              className="rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm h-full bg-white dark:bg-[#1e293b]"
              title={
                <div className="flex items-center gap-2">
                  <SafetyCertificateOutlined className="text-orange-500" />
                  <span className="text-sm font-black text-gray-900 dark:text-white">Authorized Permissions</span>
                </div>
              }
            >
              <div className="flex flex-wrap gap-2 py-1">
                {(profile?.permissions || []).map((permission) => (
                  <Tag key={permission} color="green" className="rounded-full font-black text-[10px] uppercase border-0 px-3 py-1 m-0">
                    {permission.replace(/_/g, ' ')}
                  </Tag>
                ))}
                {(!profile?.permissions || profile.permissions.length === 0) && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 italic">No special permissions assigned.</span>
                )}
              </div>
            </Card>
          </Col>

          {/* Activity Section */}
          <Col xs={24} md={12}>
            <Card
              className="rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm h-full bg-white dark:bg-[#1e293b]"
              title={
                <div className="flex items-center gap-2">
                  <TransactionOutlined className="text-orange-500" />
                  <span className="text-sm font-black text-gray-900 dark:text-white">Financial Activity Summary</span>
                </div>
              }
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title={<span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Today's Transactions</span>}
                    value={activity?.today?.transactions || 0}
                    valueStyle={{ fontSize: '1.2rem', fontWeight: 900 }}
                  />
                  <div className="mt-2 text-[11px] font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(activity?.today?.amount || 0)} collected
                  </div>
                </Col>
                <Col span={12}>
                  <Statistic
                    title={<span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Monthly Transactions</span>}
                    value={activity?.month?.transactions || 0}
                    valueStyle={{ fontSize: '1.2rem', fontWeight: 900 }}
                  />
                  <div className="mt-2 text-[11px] font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(activity?.month?.amount || 0)} collected
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Change Password Block */}
        <Card
          className="rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#1e293b]"
          title={
            <div className="flex items-center gap-2">
              <KeyOutlined className="text-indigo-500" />
              <span className="text-sm font-black text-gray-900 dark:text-white">Update Account Password</span>
            </div>
          }
        >
          <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-xl py-1">
            <Row gutter={16}>
              <Col span={12}>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Current Password</label>
                <AntInput.Password
                  value={passwords.current_password}
                  onChange={(e) => setPasswords((curr) => ({ ...curr, current_password: e.target.value }))}
                  placeholder="Enter current password"
                  prefix={<UnlockOutlined className="text-gray-400" />}
                  required
                  className="rounded-xl font-semibold text-xs h-[38px]"
                />
              </Col>
              <Col span={12}>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">New Password</label>
                <AntInput.Password
                  value={passwords.new_password}
                  onChange={(e) => setPasswords((curr) => ({ ...curr, new_password: e.target.value }))}
                  placeholder="Enter new password"
                  prefix={<KeyOutlined className="text-gray-400" />}
                  required
                  className="rounded-xl font-semibold text-xs h-[38px]"
                />
              </Col>
            </Row>

            <div className="pt-2">
              <Button
                type="primary"
                htmlType="submit"
                loading={updating}
                className="rounded-xl font-bold h-10 px-6 border-0 shadow-sm transition-all"
                style={{ background: 'linear-gradient(90deg, #4361ee 0%, #1d4ed8 100%)' }}
              >
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </ConfigProvider>
  )
}

export default AccountantProfile
