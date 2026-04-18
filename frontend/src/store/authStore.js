import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

// Apply saved language + theme from the user's profile
function applyUserPreferences(profile) {
  if (!profile) return

  // Language
  const lang = profile.ui_language || 'en'
  localStorage.setItem('i18nextLng', lang)
  // i18next may not be loaded yet — dispatch a custom event that i18n/index.js can listen to
  window.dispatchEvent(new CustomEvent('gf:lang', { detail: lang }))

  // Theme
  const theme = profile.ui_theme || 'light'
  localStorage.setItem('gf_theme', theme)
  const resolved = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme
  document.documentElement.setAttribute('data-theme', resolved)
}

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
        // Start realtime subscription to keep profile in sync
        // (DB triggers update ranking_id, achievements, pending_notifications)
        get().subscribeToProfile(session.user.id)
      } else {
        get().unsubscribeFromProfile()
        set({ user: null, profile: null })
        localStorage.setItem('i18nextLng', 'en')
        localStorage.setItem('gf_theme', 'light')
        document.documentElement.setAttribute('data-theme', 'light')
      }
    })
  },

  _profileChannel: null,

  subscribeToProfile(userId) {
    // Avoid duplicate subscriptions
    const existing = get()._profileChannel
    if (existing) supabase.removeChannel(existing)

    const channel = supabase
      .channel(`authstore-profile-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          // Merge updated fields into local profile state
          const current = get().profile
          if (current) {
            set({ profile: { ...current, ...payload.new } })
          }
        }
      )
      .subscribe()

    set({ _profileChannel: channel })
  },

  unsubscribeFromProfile() {
    const ch = get()._profileChannel
    if (ch) { supabase.removeChannel(ch); set({ _profileChannel: null }) }
  },

  fetchProfile: async (user) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !data) {
      const meta = user.user_metadata || {}
      const { data: created } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: meta.full_name || '',
          role: meta.role || 'volunteer',
          ui_language: 'en',
          ui_theme: 'light',
        }, { onConflict: 'id' })
        .select()
        .single()
      set({ user, profile: created })
      applyUserPreferences(created)
    } else {
      set({ user, profile: data })
      applyUserPreferences(data)
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
      options: { data: { full_name: fullName, role } }
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
    get().unsubscribeFromProfile()
    await supabase.auth.signOut()
    set({ user: null, profile: null })
    localStorage.setItem('i18nextLng', 'en')
    localStorage.setItem('gf_theme', 'light')
    document.documentElement.setAttribute('data-theme', 'light')
  },
}))
