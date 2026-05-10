import { useEffect } from 'react'
import AppLayout from '@/layouts/AppLayout'

const LIBRARY_THEME = {
  '--color-brand': '#8b5cf6', // Violet
  '--color-brand-light': '#a78bfa',
  '--color-brand-dark': '#7c3aed',
  '--color-sidebar-bg': '#f5f3ff',
  '--color-sidebar-active': '#8b5cf6',
  '--color-sidebar-hover': '#ede9fe',
  '--color-sidebar-border': '#ddd6fe',
}

const LibraryLayout = () => {
  useEffect(() => {
    const root = document.documentElement
    const previous = {}

    Object.entries(LIBRARY_THEME).forEach(([key, value]) => {
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

export default LibraryLayout
