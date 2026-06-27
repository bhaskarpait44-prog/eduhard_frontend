// src/layouts/TeacherLayout.jsx
import { useEffect } from 'react'
import AppLayout from '@/layouts/AppLayout'
import useUiStore from '@/store/uiStore'

// ── Teacher Design Tokens ────────────────────────────────────────────────────

const TEACHER_THEME_LIGHT = {
  // Brand
  '--color-brand':       '#00bc7d',
  '--color-brand-light': '#05d68f',
  '--color-brand-dark':  '#009e68',

  // Sidebar
  '--color-sidebar-bg':     '#f5fdf9',
  '--color-sidebar-active': '#00bc7d',
  '--color-sidebar-hover':  'rgba(0,188,125,0.09)',
  '--color-sidebar-border': '#d6f0e5',
  '--color-sidebar-text':   '#1a3329',
  '--color-sidebar-muted':  '#5a7a6b',
  '--color-sidebar-card':   '#ffffff',

  // Content area
  '--color-bg':            '#f0faf6',
  '--color-surface':       '#ffffff',
  '--color-surface-raised':'#e6f7ef',
  '--color-border':        '#e2f2ea',
  '--color-text-primary':  '#0f2d1e',
  '--color-text-secondary':'#3a6651',
  '--color-text-muted':    '#8aad9b',
}

const TEACHER_THEME_DARK = {
  // Brand
  '--color-brand':       '#00bc7d',
  '--color-brand-light': '#05d68f',
  '--color-brand-dark':  '#009e68',

  // Sidebar — deep forest navy
  '--color-sidebar-bg':     '#0a1f15',
  '--color-sidebar-active': '#00bc7d',
  '--color-sidebar-hover':  'rgba(0,188,125,0.10)',
  '--color-sidebar-border': 'rgba(0,188,125,0.12)',
  '--color-sidebar-text':   '#ccf0e0',
  '--color-sidebar-muted':  '#7bb89a',
  '--color-sidebar-card':   '#102a1c',

  // Content area — keep existing global dark tokens
  '--color-bg':            '#0f172a',
  '--color-surface':       '#1e293b',
  '--color-surface-raised':'#334155',
  '--color-border':        '#1e293b',
  '--color-text-primary':  '#f0fdf9',
  '--color-text-secondary':'#6ee7b7',
  '--color-text-muted':    '#475569',
}

// ── Component ────────────────────────────────────────────────────────────────

const TeacherLayout = () => {
  const theme = useUiStore((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement
    const isDark = root.classList.contains('dark')
    const activeTheme = isDark ? TEACHER_THEME_DARK : TEACHER_THEME_LIGHT

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

export default TeacherLayout
