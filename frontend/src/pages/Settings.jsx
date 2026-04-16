import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useThemeStore } from '@/store/themeStore'

const THEMES = [
  {
    key: 'light',
    icon: '☀️',
    label: { en: 'Light',  bg: 'Светла' },
    desc:  { en: 'Default — white background', bg: 'По подразбиране — бял фон' },
  },
  {
    key: 'dark',
    icon: '🌙',
    label: { en: 'Dark',   bg: 'Тъмна' },
    desc:  { en: 'Easy on the eyes at night', bg: 'Приятна за очите нощем' },
  },
  {
    key: 'system',
    icon: '💻',
    label: { en: 'System', bg: 'Системна' },
    desc:  { en: 'Follows your device setting', bg: 'Следва настройката на устройството' },
  },
]

const LANGUAGES = [
  { key: 'en', label: 'English' },
  { key: 'bg', label: 'Български' },
]

export default function Settings() {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const { theme, setTheme } = useThemeStore()

  const L = {
    title:      lang === 'bg' ? 'Настройки'           : 'Settings',
    appearance: lang === 'bg' ? 'Изглед'               : 'Appearance',
    language:   lang === 'bg' ? 'Език'                 : 'Language',
    back:       lang === 'bg' ? '← Назад'              : '← Back',
    saved:      lang === 'bg' ? 'Запазено автоматично' : 'Saved automatically',
  }

  const changeLanguage = (key) => {
    i18n.changeLanguage(key)
    localStorage.setItem('i18nextLng', key)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>
          {L.back}
        </Link>
        <h1 className="text-2xl font-medium mt-2" style={{ color: 'var(--text)' }}>{L.title}</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{L.saved}</p>
      </div>

      {/* Appearance */}
      <section className="card mb-5">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>{L.appearance}</h2>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(t => {
            const active = theme === t.key
            return (
              <button key={t.key} type="button" onClick={() => setTheme(t.key)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
                style={{
                  borderColor: active ? 'var(--brand-400, #1D9E75)' : 'var(--border-mid)',
                  background: active ? 'rgba(29,158,117,0.08)' : 'var(--bg-subtle)',
                }}>
                <span className="text-2xl">{t.icon}</span>
                <span className="text-xs font-semibold" style={{ color: active ? '#1D9E75' : 'var(--text)' }}>
                  {t.label[lang]}
                </span>
                <span className="text-xs text-center leading-tight" style={{ color: 'var(--text-faint)' }}>
                  {t.desc[lang]}
                </span>
                {active && (
                  <span className="w-2 h-2 rounded-full bg-brand-400 mt-0.5" />
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Language */}
      <section className="card">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>{L.language}</h2>
        <div className="flex gap-3">
          {LANGUAGES.map(l => {
            const active = (i18n.language === l.key) || (i18n.language.startsWith(l.key))
            return (
              <button key={l.key} type="button" onClick={() => changeLanguage(l.key)}
                className="flex-1 flex items-center justify-center gap-2.5 p-3 rounded-xl border-2 transition-all"
                style={{
                  borderColor: active ? 'var(--brand-400, #1D9E75)' : 'var(--border-mid)',
                  background: active ? 'rgba(29,158,117,0.08)' : 'var(--bg-subtle)',
                }}>
                <span className="text-sm font-medium" style={{ color: active ? '#1D9E75' : 'var(--text)' }}>
                  {l.label}
                </span>
                {active && <span className="w-2 h-2 rounded-full bg-brand-400" />}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
