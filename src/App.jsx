// src/App.jsx — ensure theme is initialized and session is fetched
import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import router from '@/router'
import useUiStore from '@/store/uiStore'
import ToastContainer from '@/components/ui/ToastContainer'
import LightningLoader from '@/components/ui/LightningLoader'
import { Agentation } from 'agentation'

const App = () => {
  const initTheme = useUiStore((state) => state.initTheme)

  useEffect(() => {
    const cleanup = initTheme()
    return () => {
      if (typeof cleanup === 'function') cleanup()
    }
  }, [initTheme])

  return (
    <>
      <LightningLoader />
      <RouterProvider router={router} />
      <ToastContainer />
      {import.meta.env.DEV && <Agentation />}
    </>
  )
}

export default App
