import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, GraduationCap, AlertCircle, Loader2, QrCode, RefreshCw } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useShallow } from 'zustand/react/shallow'
import useAuthStore from '@/store/authStore'
import useToast from '@/hooks/useToast'
import usePageTitle from '@/hooks/usePageTitle'
import { ROUTES, APP_NAME, ROLES } from '@/constants/app'
import { cn } from '@/utils/helpers'
import { loginSchema } from '@/utils/validations'
import { initQrLogin, checkQrStatus } from '@/api/auth'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
function getFallbackRouteForRole(role) {
  if (role === ROLES.STUDENT) return ROUTES.STUDENT_DASHBOARD
  if (role === ROLES.PARENT) return ROUTES.PARENT_DASHBOARD
  return ROUTES.DASHBOARD
}

function getPostLoginTarget(role, from) {
  const fallbackRoute = getFallbackRouteForRole(role)

  if (!from || from === ROUTES.LOGIN) {
    return fallbackRoute
  }

  return from
}

const LoginPage = () => {
  usePageTitle('Login')

  const [showPassword, setShowPassword] = useState(false)
  const [loginMode, setLoginMode] = useState('password') // 'password' or 'qr'
  const [qrToken, setQrToken] = useState(null)
  const [qrStatus, setQrStatus] = useState('idle') // idle, loading, pending, authorized, expired
  const [qrExpiry, setQrExpiry] = useState(120) // countdown in seconds

  const auth = useAuthStore(useShallow((state) => ({
    login       : state.login,
    loginStudent: state.loginStudent,
    loginWithQr : state.loginWithQr,
    isLoading   : state.isLoading,
    error       : state.error,
    clearError  : state.clearError,
    token       : state.token,
    user        : state.user,
    isHydrated  : state.isHydrated,
  })))
  const {
    login,
    loginStudent,
    loginWithQr,
    isLoading,
    error,
    clearError,
    token,
    user,
    isHydrated,
  } = auth
  const { toastSuccess, toastError } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectedRef = useRef(false)


  const from = location.state?.from

  useEffect(() => {
    if (!isHydrated || !token || !user || redirectedRef.current) return

    const target = getPostLoginTarget(user.role, from)
    redirectedRef.current = true
    navigate(target, { replace: true })
  }, [from, isHydrated, navigate, token, user?.role])

  // Initialize QR session
  const handleStartQrLogin = async () => {
    setLoginMode('qr')
    setQrStatus('loading')
    setQrToken(null)
    try {
      const res = await initQrLogin()
      if (res.success && res.data?.token) {
        setQrToken(res.data.token)
        setQrStatus('pending')
        setQrExpiry(120)
      } else {
        toastError('Failed to initialize QR session')
        setQrStatus('idle')
        setLoginMode('password')
      }
    } catch (err) {
      toastError(err.message || 'Failed to initialize QR session')
      setQrStatus('idle')
      setLoginMode('password')
    }
  }

  // Polling for QR status
  useEffect(() => {
    if (loginMode !== 'qr' || !qrToken || qrStatus !== 'pending') return

    const interval = setInterval(async () => {
      try {
        const res = await checkQrStatus(qrToken)
        if (res.success) {
          const { status, token: tokenVal, refresh_token, user: userVal, permissions } = res.data
          if (status === 'authorized') {
            clearInterval(interval)
            setQrStatus('authorized')
            loginWithQr({ token: tokenVal, refresh_token, user: userVal, permissions })
            toastSuccess(`Welcome back, ${userVal.name.split(' ')[0]}`)
          } else if (status === 'expired') {
            clearInterval(interval)
            setQrStatus('expired')
          }
        }
      } catch (err) {
        console.error('QR status check error:', err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [loginMode, qrToken, qrStatus])

  // Countdown timer for QR expiration
  useEffect(() => {
    if (loginMode !== 'qr' || qrStatus !== 'pending' || qrExpiry <= 0) {
      if (qrExpiry === 0 && qrStatus === 'pending') {
        setQrStatus('expired')
      }
      return
    }

    const timer = setTimeout(() => {
      setQrExpiry((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [loginMode, qrStatus, qrExpiry])

  const {

    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', remember: false },
  })

  const onSubmit = async (data) => {
    clearError()

    const identifier = data.identifier.trim()
    const password = data.password
    const looksLikeEmail = emailPattern.test(identifier)

    let result

    if (looksLikeEmail) {
      result = await login({ email: identifier, password })
      if (!result.success) {
        result = await loginStudent({ identifier, password })
      }
    } else {
      result = await loginStudent({ identifier, password })
    }

    if (result.success) {
      toastSuccess(`Welcome back, ${result.user?.name?.split(' ')[0] || 'there'}`)
      return
    }

    toastError(result.message || 'Login failed')
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: 'var(--color-brand)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                              radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div
          className="absolute top-20 right-16 w-64 h-64 rounded-full opacity-10"
          style={{ backgroundColor: 'white', filter: 'blur(40px)' }}
        />
        <div
          className="absolute bottom-32 left-8 w-48 h-48 rounded-full opacity-10"
          style={{ backgroundColor: 'white', filter: 'blur(30px)' }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap size={22} color="white" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">{APP_NAME}</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage your school
            <br />
            smarter, not harder.
          </h1>
          <p className="text-blue-100 text-base leading-relaxed max-w-xs">
            Everything from admissions to results - in one clean, powerful platform.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: '10k+', label: 'Students' },
            { value: '99.9%', label: 'Uptime' },
            { value: '50+', label: 'Schools' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-blue-200 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-brand)' }}
            >
              <GraduationCap size={18} color="white" />
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {APP_NAME}
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Welcome back
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Sign in with your email or admission number
            </p>
          </div>

          {error && (
            <div
              className="flex items-start gap-3 p-4 rounded-xl mb-6 text-sm"
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
              }}
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loginMode === 'qr' ? (
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-inner">
              <div className="w-48 h-48 bg-white p-3 rounded-xl shadow-sm flex items-center justify-center relative overflow-hidden">
                {qrStatus === 'loading' && (
                  <Loader2 size={36} className="animate-spin text-blue-600" />
                )}
                {qrStatus === 'pending' && qrToken && (
                  <QRCodeCanvas
                    value={qrToken}
                    size={168}
                    level="H"
                    includeMargin={false}
                  />
                )}
                {qrStatus === 'expired' && (
                  <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-4 text-center">
                    <p className="text-sm font-semibold text-gray-900 mb-2">QR Code Expired</p>
                    <button
                      onClick={handleStartQrLogin}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <RefreshCw size={12} />
                      Refresh QR
                    </button>
                  </div>
                )}
              </div>
              
              {qrStatus === 'pending' && (
                <p className="mt-3 text-xs text-gray-500 font-medium">
                  Expires in {Math.floor(qrExpiry / 60)}:{(qrExpiry % 60).toString().padStart(2, '0')}
                </p>
              )}

              <div className="mt-6 text-center space-y-2">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Log in with Teacher App
                </h3>
                <p className="text-xs max-w-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  1. Open the EduCore Teacher mobile app.<br />
                  2. Tap the QR scanner icon <span className="inline-block px-1 bg-gray-200 dark:bg-gray-700 rounded"><QrCode size={11} className="inline align-text-bottom" /></span> in the header.<br />
                  3. Point your camera at this QR code to log in instantly.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Email or Admission No
                </label>
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  placeholder="admin@school.edu.in or ADM-2026-1001"
                  {...register('identifier')}
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all',
                    'placeholder:opacity-40',
                  )}
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: `1.5px solid ${errors.identifier ? '#dc2626' : 'var(--color-border)'}`,
                    color: 'var(--color-text-primary)',
                    boxShadow: errors.identifier ? '0 0 0 3px #fecaca40' : 'none',
                  }}
                />
                {errors.identifier && (
                  <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#dc2626' }}>
                    <AlertCircle size={11} /> {errors.identifier.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Password
                  </label>
                  <Link
                    to={ROUTES.FORGOT_PASSWORD}
                    className="text-xs font-medium transition-opacity hover:opacity-70"
                    style={{ color: 'var(--color-brand)' }}
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                    className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm outline-none transition-all placeholder:opacity-40"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: `1.5px solid ${errors.password ? '#dc2626' : 'var(--color-border)'}`,
                      color: 'var(--color-text-primary)',
                      boxShadow: errors.password ? '0 0 0 3px #fecaca40' : 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-opacity hover:opacity-70"
                    style={{ color: 'var(--color-text-muted)' }}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#dc2626' }}>
                    <AlertCircle size={11} /> {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <input
                  id="remember"
                  type="checkbox"
                  {...register('remember')}
                  className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                />
                <label
                  htmlFor="remember"
                  className="text-sm cursor-pointer select-none"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Remember me for 30 days
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-2',
                  'py-2.5 px-4 rounded-xl text-sm font-semibold text-white',
                  'transition-all duration-150',
                  isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 active:scale-[0.99]',
                )}
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#f8fafc] dark:bg-[#0f172a] px-2 text-gray-400 dark:text-gray-500">Or</span>
            </div>
          </div>

          {loginMode === 'password' ? (
            <button
              type="button"
              onClick={handleStartQrLogin}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-150 cursor-pointer"
              style={{ color: 'var(--color-text-primary)' }}
            >
              <QrCode size={18} />
              Sign in with QR Code
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setLoginMode('password')
                setQrStatus('idle')
                setQrToken(null)
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-150 cursor-pointer"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Sign in with Password
            </button>
          )}


          <p className="mt-8 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Students can use registered email or admission number. Staff can use email.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
