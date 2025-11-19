import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authHelpers } from '@/utils/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)

  async function initialize() {
    loading.value = true
    const { user: currentUser } = await authHelpers.getUser()
    user.value = currentUser
    loading.value = false

    // Слушаем изменения auth состояния
    authHelpers.onAuthStateChange((event, session) => {
      user.value = session?.user || null
    })
  }

  async function signIn(email, password) {
    const { data, error } = await authHelpers.signIn(email, password)
    if (!error) {
      user.value = data.user
    }
    return { data, error }
  }

  async function signUp(email, password) {
    const { data, error } = await authHelpers.signUp(email, password)
    return { data, error }
  }

  async function signOut() {
    const { error } = await authHelpers.signOut()
    if (!error) {
      user.value = null
    }
    return { error }
  }

  return {
    user,
    loading,
    isAuthenticated,
    initialize,
    signIn,
    signUp,
    signOut,
  }
})
