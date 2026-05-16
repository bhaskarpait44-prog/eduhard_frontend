import { useEffect } from 'react'
import AppLayout from '@/layouts/AppLayout'

const RECEPTIONIST_THEME = {
  '--color-brand': '#0284c7', // Sky-600
  '--color-brand-light': '#0ea5e9', // Sky-500
  '--color-brand-dark': '#0369a1', // Sky-700
  '--color-sidebar-bg': '#f0f9ff', // Sky-50
  '--color-sidebar-active': '#0284c7',
  '--color-sidebar-hover': '#e0f2fe', // Sky-100
  '--color-sidebar-border': '#bae6fd', // Sky-200
}

const ReceptionistLayout = () => {
  useEffect(() => {
    const root = document.documentElement
    const previous = {}

    Object.entries(RECEPTIONIST_THEME).forEach(([key, value]) => {
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

export default ReceptionistLayout
