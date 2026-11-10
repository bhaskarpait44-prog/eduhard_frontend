import { useEffect } from 'react'
import AppLayout from '@/layouts/AppLayout'
import useUiStore from '@/store/uiStore'

const LIBRARY_THEME_LIGHT = {
  '--color-brand': '#8b5cf6',
  '--color-brand-light': '#a78bfa',
  '--color-brand-dark': '#7c3aed',
  '--color-sidebar-bg': '#f5f3ff',
  '--color-sidebar-active': '#8b5cf6',
  '--color-sidebar-hover': '#ede9fe',
  '--color-sidebar-border': '#ddd6fe',
  '--color-sidebar-text': '#334155',
  '--color-sidebar-muted': '#64748b',
  '--color-sidebar-card': '#ffffff',
}

const LIBRARY_THEME_DARK = {
  '--color-brand': '#8b5cf6',
  '--color-brand-light': '#a78bfa',
  '--color-brand-dark': '#7c3aed',
  '--color-sidebar-bg': '#0f172a',
  '--color-sidebar-active': '#8b5cf6',
  '--color-sidebar-hover': 'rgba(139, 92, 246, 0.12)',
  '--color-sidebar-border': '#1e293b',
  '--color-sidebar-text': '#cbd5e1',
  '--color-sidebar-muted': '#94a3b8',
  '--color-sidebar-card': '#1e293b',
}

const LibraryLayout = () => {
  const theme = useUiStore((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement
    const isDark = root.classList.contains('dark')
    const activeTheme = isDark ? LIBRARY_THEME_DARK : LIBRARY_THEME_LIGHT

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

export default LibraryLayout
