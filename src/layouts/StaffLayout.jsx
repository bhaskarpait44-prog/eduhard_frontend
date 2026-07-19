import { useEffect } from 'react'
import AppLayout from '@/layouts/AppLayout'

const STAFF_THEME = {
  '--color-brand':          '#7c3aed', // Violet-600
  '--color-brand-light':    '#8b5cf6', // Violet-500
  '--color-brand-dark':     '#6d28d9', // Violet-700
  '--color-sidebar-bg':     '#f5f3ff', // Violet-50
  '--color-sidebar-active': '#7c3aed',
  '--color-sidebar-hover':  '#ede9fe', // Violet-100
  '--color-sidebar-border': '#ddd6fe', // Violet-200
}

const StaffLayout = () => {
  useEffect(() => {
    const root = document.documentElement
    const previous = {}

    Object.entries(STAFF_THEME).forEach(([key, value]) => {
      previous[key] = root.style.getPropertyValue(key)
      root.style.setProperty(key, value)
    })

    return () => {
      Object.entries(previous).forEach(([key, value]) => {
        if (value) root.style.setProperty(key, value)
        else root.style.removeProperty(key)
      })
    }
  }, [])

  return <AppLayout />
}

export default StaffLayout
