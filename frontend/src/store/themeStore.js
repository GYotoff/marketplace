import { create } from 'zustand'

// 'light' | 'dark' | 'system'
const STORAGE_KEY = 'gf_theme'

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(pref) {
  const resolved = pref === 'system' ? getSystemTheme() : pref
  document.documentElement.setAttribute('data-theme', resolved)
}

export const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem(STORAGE_KEY) || 'light',

  init() {
    const t = localStorage.getItem(STORAGE_KEY) || 'light'
    set({ theme: t })
    applyTheme(t)
    // Watch system preference changes
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        if (get().theme === 'system') applyTheme('system')
      })
  },

  setTheme(pref) {
    localStorage.setItem(STORAGE_KEY, pref)
    set({ theme: pref })
    applyTheme(pref)
  },
}))
