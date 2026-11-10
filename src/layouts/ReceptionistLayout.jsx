import { useEffect } from 'react'
import AppLayout from '@/layouts/AppLayout'
import useUiStore from '@/store/uiStore'

const RECEPTIONIST_THEME_LIGHT = {
  '--color-brand': '#0284c7', // Sky-600
  '--color-brand-light': '#0ea5e9', // Sky-500
  '--color-brand-dark': '#0369a1', // Sky-700
  '--color-sidebar-bg': '#f0f9ff', // Sky-50
  '--color-sidebar-active': '#0284c7',
  '--color-sidebar-hover': '#e0f2fe', // Sky-100
  '--color-sidebar-border': '#bae6fd', // Sky-200
  '--color-sidebar-text': '#334155',
  '--color-sidebar-muted': '#64748b',
  '--color-sidebar-card': '#ffffff',
}

const RECEPTIONIST_THEME_DARK = {
  '--color-brand': '#0284c7',
  '--color-brand-light': '#0ea5e9',
  '--color-brand-dark': '#0369a1',
  '--color-sidebar-bg': '#0f172a',
  '--color-sidebar-active': '#0284c7',
  '--color-sidebar-hover': 'rgba(2, 132, 199, 0.12)',
  '--color-sidebar-border': '#1e293b',
  '--color-sidebar-text': '#cbd5e1',
  '--color-sidebar-muted': '#94a3b8',
  '--color-sidebar-card': '#1e293b',
}

const ReceptionistLayout = () => {
  const theme = useUiStore((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement
    const isDark = root.classList.contains('dark')
    const activeTheme = isDark ? RECEPTIONIST_THEME_DARK : RECEPTIONIST_THEME_LIGHT

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

export default ReceptionistLayout
