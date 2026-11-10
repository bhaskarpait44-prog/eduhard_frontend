import { useEffect } from 'react'
import AppLayout from '@/layouts/AppLayout'
import useUiStore from '@/store/uiStore'

const STAFF_THEME_LIGHT = {
  '--color-brand':          '#7c3aed', // Violet-600
  '--color-brand-light':    '#8b5cf6', // Violet-500
  '--color-brand-dark':     '#6d28d9', // Violet-700
  '--color-sidebar-bg':     '#f5f3ff', // Violet-50
  '--color-sidebar-active': '#7c3aed',
  '--color-sidebar-hover':  '#ede9fe', // Violet-100
  '--color-sidebar-border': '#ddd6fe', // Violet-200
  '--color-sidebar-text':   '#334155',
  '--color-sidebar-muted':  '#64748b',
  '--color-sidebar-card':   '#ffffff',
}

const STAFF_THEME_DARK = {
  '--color-brand':          '#7c3aed',
  '--color-brand-light':    '#8b5cf6',
  '--color-brand-dark':     '#6d28d9',
  '--color-sidebar-bg':     '#0f172a',
  '--color-sidebar-active': '#7c3aed',
  '--color-sidebar-hover':  'rgba(124, 58, 237, 0.12)',
  '--color-sidebar-border': '#1e293b',
  '--color-sidebar-text':   '#cbd5e1',
  '--color-sidebar-muted':  '#94a3b8',
  '--color-sidebar-card':   '#1e293b',
}

const StaffLayout = () => {
  const theme = useUiStore((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement
    const isDark = root.classList.contains('dark')
    const activeTheme = isDark ? STAFF_THEME_DARK : STAFF_THEME_LIGHT

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

export default StaffLayout
