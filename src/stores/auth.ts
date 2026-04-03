import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'
import type { AdminUser } from '@/types'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const token = ref<string | null>(null)
    const user = ref<AdminUser | null>(null)

    const isLoggedIn = computed(() => !!token.value && !!user.value)

    async function login(email: string, password: string) {
      const result = await authApi.login(email, password)
      token.value = result.token
      user.value = result.user
    }

    function logout() {
      token.value = null
      user.value = null
    }

    return { token, user, isLoggedIn, login, logout }
  },
  {
    persist: {
      key: 'pulseread_admin_auth',
      storage: localStorage,
    },
  },
)
