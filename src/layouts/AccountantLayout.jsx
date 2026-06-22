import { useEffect } from 'react'
import AppLayout from '@/layouts/AppLayout'
import useUiStore from '@/store/uiStore'

// -- Lizant design tokens -----------------------------------------------------
const ACCOUNTANT_THEME_LIGHT = {
  // Brand
  '--color-brand': '#4361ee',
  '--color-brand-light': '#5a73f0',
  '--color-brand-dark': '#1d4ed8',

  // Sidebar -- light mode follows the page theme
  '--color-sidebar-bg': '#ffffff',
  '--color-sidebar-active': '#4361ee',
  '--color-sidebar-hover': '#eef2ff',
  '--color-sidebar-border': '#e9ebf0',
  '--color-sidebar-text': '#2b2d42',
  '--color-sidebar-muted': '#74788d',
  '--color-sidebar-card': '#ffffff',

  // Content area -- Lizant light
  '--color-bg': '#f3f4f9',
  '--color-surface': '#ffffff',
  '--color-surface-raised': '#f1f5f9',
  '--color-border': '#e9ebf0',
  '--color-text-primary': '#2b2d42',
  '--color-text-secondary': '#74788d',
  '--color-text-muted': '#adb5bd',
}

const ACCOUNTANT_THEME_DARK = {
  // Brand
  '--color-brand': '#4361ee',
  '--color-brand-light': '#5a73f0',
  '--color-brand-dark': '#1d4ed8',

  // Sidebar -- slightly deeper navy in dark mode
  '--color-sidebar-bg': '#12141f',
  '--color-sidebar-active': '#4361ee',
  '--color-sidebar-hover': 'rgba(255,255,255,0.06)',
  '--color-sidebar-border': 'rgba(255,255,255,0.05)',
  '--color-sidebar-text': '#e2e8f0',
  '--color-sidebar-muted': '#94a3b8',
  '--color-sidebar-card': '#1e293b',

  // Content area -- keep existing dark surface tokens
  '--color-bg': '#0f172a',
  '--color-surface': '#1e293b',
  '--color-surface-raised': '#334155',
  '--color-border': '#1e293b',
  '--color-text-primary': '#f1f5f9',
  '--color-text-secondary': '#94a3b8',
  '--color-text-muted': '#475569',
}

const AccountantLayout = () => {
  const theme = useUiStore((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement
    const isDark = root.classList.contains('dark')
    const activeTheme = isDark ? ACCOUNTANT_THEME_DARK : ACCOUNTANT_THEME_LIGHT

    const previous = {}
    Object.entries(activeTheme).forEach(([key, value]) => {
      previous[key] = root.style.getPropertyValue(key)
      root.style.setProperty(key, value)
    })

    return () => {
      Object.entries(previous).forEach(([key, value]) => {
        if (value) root.style.setProperty(key, value)
        else root.style.removeProperty(key)
      })
    }
  }, [theme])

  // Roboto font scoped to accountant portal wrapper
  return (
    <div style={{ fontFamily: "'Roboto', system-ui, sans-serif" }}>
      <AppLayout />
    </div>
  )
}

export default AccountantLayout
