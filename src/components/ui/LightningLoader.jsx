import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const LightningLoader = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Check if we should show lightning (from a recent hard reload click)
    const shouldShow = sessionStorage.getItem('show_lightning') === 'true'
    if (shouldShow) {
      setVisible(true)
      sessionStorage.removeItem('show_lightning')
      
      // Auto-hide after animation finishes
      const timer = setTimeout(() => {
        setVisible(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  // Public method to trigger manually (for the button click)
  useEffect(() => {
    let timer
    window.triggerLightning = () => {
      setVisible(true)
      sessionStorage.setItem('show_lightning', 'true')
      timer = setTimeout(() => {
        window.location.reload()
      }, 800)
    }
    return () => {
      if (timer) clearTimeout(timer)
      try {
        delete window.triggerLightning
      } catch (e) {
        window.triggerLightning = undefined
      }
    }
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
          {/* Top glowing bar */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ 
              scaleX: [0, 1.2, 1], 
              opacity: [0, 1, 1, 0],
              x: ['-100%', '100%']
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute top-0 left-0 right-0 h-1 bg-brand shadow-[0_0_15px_rgba(37,99,235,0.8)] origin-left"
          />
          
          {/* Lightning flash effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.2, 0] }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-white"
          />

          {/* Secondary rapid pulse line */}
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: '100%', opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, delay: 0.2, ease: "linear" }}
            className="absolute top-0 left-0 right-0 h-[2px] bg-brand-light brightness-150"
          />
        </div>
      )}
    </AnimatePresence>
  )
}

export default LightningLoader
