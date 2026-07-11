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

  // Sidebar — clean design aligned with admin defaults
  '--color-sidebar-bg':     '#f8fbff',
  '--color-sidebar-active': '#00bc7d',
  '--color-sidebar-hover':  'rgba(0,188,125,0.08)',
  '--color-sidebar-border': '#dbe7f5',
  '--color-sidebar-text':   '#334155',
  '--color-sidebar-muted':  '#64748b',
  '--color-sidebar-card':   '#ffffff',

  // Content area — clean slate defaults matching Admin UI
  '--color-bg':            '#f8fafc',
  '--color-surface':       '#ffffff',
  '--color-surface-raised':'#f1f5f9',
  '--color-border':        '#f3f4f6',
  '--color-text-primary':  '#0f172a',
  '--color-text-secondary':'#475569',
  '--color-text-muted':    '#94a3b8',
}

const TEACHER_THEME_DARK = {
  // Brand
  '--color-brand':       '#00bc7d',
  '--color-brand-light': '#05d68f',
  '--color-brand-dark':  '#009e68',

  // Sidebar — clean dark design matching admin defaults
  '--color-sidebar-bg':     '#0f172a',
  '--color-sidebar-active': '#00bc7d',
  '--color-sidebar-hover':  'rgba(0,188,125,0.12)',
  '--color-sidebar-border': '#1e293b',
  '--color-sidebar-text':   '#cbd5e1',
  '--color-sidebar-muted':  '#94a3b8',
  '--color-sidebar-card':   '#1e293b',

  // Content area — clean dark slate defaults matching Admin UI
  '--color-bg':            '#0f172a',
  '--color-surface':       '#1e293b',
  '--color-surface-raised':'#334155',
  '--color-border':        '#1e293b',
  '--color-text-primary':  '#f1f5f9',
  '--color-text-secondary':'#94a3b8',
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
