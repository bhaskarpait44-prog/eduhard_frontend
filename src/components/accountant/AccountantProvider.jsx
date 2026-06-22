// Shared Ant Design theme wrapper for the accountant portal.
// Drop-in replacement for the inline ConfigProvider blocks in every accountant page.
import { ConfigProvider, theme as antdTheme } from 'antd'
import useUiStore from '@/store/uiStore'

const LIZANT_PRIMARY = '#4361ee'
const LIZANT_FONT = 'Roboto, system-ui, sans-serif'
const LIZANT_RADIUS = 10

const AccountantProvider = ({ children }) => {
  const { theme } = useUiStore()
  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: LIZANT_PRIMARY,
          borderRadius: LIZANT_RADIUS,
          fontFamily: LIZANT_FONT,
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}

export default AccountantProvider
