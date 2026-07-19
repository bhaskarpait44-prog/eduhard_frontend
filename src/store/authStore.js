// src/store/authStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/constants/app'
import * as authApi from '@/api/auth'
import { getDefaultPermissionsForRole } from '@/utils/permissions'

const normalizeUser = (user) => {
  if (!user) return null

  return {
    ...user,
    role: user.role === 'super_admin' ? 'admin' : user.role,
    permissions: Array.isArray(user.permissions) && user.permissions.length > 0
      ? user.permissions
      : getDefaultPermissionsForRole(user.role === 'super_admin' ? 'admin' : user.role),
  }
}

const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── State ─────────────────────────────────────────────────────────
      token: null,
      refreshToken: null,
      user: null,
      isLoading: false,
      error: null,
      isHydrated: false,  // Track if persist has finished loading

      // ── Actions ───────────────────────────────────────────────────────

      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const res = await authApi.login(credentials)

          // support both formats:
          // 1) { data: { token, refresh_token, user } }
          // 2) { token, refresh_token, user }
          const { data, message } = res
          const payload = data || res

          const { token, refresh_token, user } = payload || {}

          if (!token || !user) {
            throw new Error(message || 'Login failed - invalid response')
          }

          set({
            token,
            refreshToken: refresh_token || null,
            user: normalizeUser(user),
            isLoading: false,
            error: null,
          })

          return { success: true, user }

        } catch (err) {
          set({ isLoading: false, error: err.message || 'Login failed' })
          return { success: false, message: err.message }
        }
      },

      loginStudent: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const res = await authApi.studentLogin(credentials)
          const { data, message } = res
          const payload = data || res
          const { token, refresh_token, user } = payload || {}

          if (!token || !user) {
            throw new Error(message || 'Student login failed - invalid response')
          }

          set({
            token,
            refreshToken: refresh_token || null,
            user: normalizeUser(user),
            isLoading: false,
            error: null,
          })

          return { success: true, user }
        } catch (err) {
          set({ isLoading: false, error: err.message || 'Student login failed' })
          return { success: false, message: err.message }
        }
      },


      logout: () => {
        set({ token: null, refreshToken: null, user: null, error: null })
      },

      clearError: () => set({ error: null }),

      loginWithQr: (payload) => {
        const { token, refresh_token, user } = payload || {}
        set({
          token,
          refreshToken: refresh_token || null,
          user: normalizeUser(user),
          isLoading: false,
          error: null,
        })
      },

      // Called by Axios interceptor after a successful silent refresh
      updateToken: (token, refreshToken) => {
        set({ token, refreshToken: refreshToken || get().refreshToken })
      },


      // Mark as hydrated after persist loads
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'educore_auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
)

// Subscribe to rehydration completion
if (useAuthStore.persist) {
  useAuthStore.persist.onFinishHydration(() => {
    const state = useAuthStore.getState()
    if (state.user) {
      useAuthStore.setState({ user: normalizeUser(state.user) })
    }
    useAuthStore.getState().setHydrated()
  })
}

// Fallback: mark as hydrated after a short timeout in case persist doesn't trigger
setTimeout(() => {
  const state = useAuthStore.getState()
  if (state.user) {
    useAuthStore.setState({ user: normalizeUser(state.user) })
  }
  if (!state.isHydrated) {
    state.setHydrated()
  }
}, 100)

export default useAuthStore
