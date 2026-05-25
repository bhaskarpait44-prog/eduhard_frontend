import { useEffect } from 'react'
import AppLayout from '@/layouts/AppLayout'
import useUiStore from '@/store/uiStore'

const ACCOUNTANT_THEME_LIGHT = {
  '--color-brand': '#d97706',
  '--color-brand-light': '#f59e0b',
  '--color-brand-dark': '#b45309',
  '--color-sidebar-bg': '#fffaf0',
  '--color-sidebar-active': '#d97706',
  '--color-sidebar-hover': '#ffedd5',
  '--color-sidebar-border': '#fed7aa',
}

const ACCOUNTANT_THEME_DARK = {
  '--color-brand': '#fbbf24',
  '--color-brand-light': '#fcd34d',
  '--color-brand-dark': '#d97706',
  '--color-sidebar-bg': '#0f172a',
  '--color-sidebar-active': '#fbbf24',
  '--color-sidebar-hover': '#1e293b',
  '--color-sidebar-border': '#451a03',
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

  return <AppLayout />
}

export default AccountantLayout
