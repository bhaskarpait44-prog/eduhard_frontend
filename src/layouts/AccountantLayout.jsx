import { useEffect } from 'react'
import AppLayout from '@/layouts/AppLayout'
import useUiStore from '@/store/uiStore'

const ACCOUNTANT_THEME_LIGHT = {
  '--color-brand': '#4CC0D4',
  '--color-brand-light': '#67d3e5',
  '--color-brand-dark': '#0891b2',
  '--color-sidebar-bg': '#f0fdfa',
  '--color-sidebar-active': '#4CC0D4',
  '--color-sidebar-hover': '#ccfbf1',
  '--color-sidebar-border': '#99f6e4',
}

const ACCOUNTANT_THEME_DARK = {
  '--color-brand': '#4CC0D4',
  '--color-brand-light': '#67d3e5',
  '--color-brand-dark': '#0891b2',
  '--color-sidebar-bg': '#0f172a',
  '--color-sidebar-active': '#4CC0D4',
  '--color-sidebar-hover': '#1e293b',
  '--color-sidebar-border': '#115e59',
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
