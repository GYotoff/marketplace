import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await get().fetchProfile(session.user)
    }
    set({ loading: false, initialized: true })

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await get().fetchProfile(session.user)
      } else {
        set({ user: null, profile: null })
      }
    })
  },

  fetchProfile: async (user) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !data) {
      // Profile missing — create it (fallback if trigger didn't fire)
      const meta = user.user_metadata || {}
      const { data: created } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: meta.full_name || '',
          role: meta.role || 'volunteer',
        }, { onConflict: 'id' })
        .select()
        .single()
      set({ user, profile: created })
    } else {
      set({ user, profile: data })
    }
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  register: async (email, password, fullName, role) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role }
      }
    })
    if (error) throw error
    return data
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    set({ profile: data })
    return data
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },
}))
