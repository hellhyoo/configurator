// Инициализация
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)

// Вспомогательные функции для auth
export const authHelpers = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    return { user, error }
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
