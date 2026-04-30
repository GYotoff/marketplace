import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import RankingBadge from '@/components/ui/RankingBadge'

const AVAILABILITY_LABEL = {
  weekdays: { en: 'Weekdays',  bg: 'Делнични' },
  weekends: { en: 'Weekends',  bg: 'Уикенди' },
  mornings: { en: 'Mornings',  bg: 'Сутрини' },
  evenings: { en: 'Evenings',  bg: 'Вечери' },
}

const RANK_COLOR = {
  Standard: '#6b7280',
  Bronze:   '#cd7f32',
  Silver:   '#708090',
  Gold:     '#c9a200',
  Platinum: '#4a90a4',
}

const VOL_SORTS = [
  { key: 'az',    en: 'A → Z',          bg: 'А → Я' },
  { key: 'za',    en: 'Z → A',          bg: 'Я → А' },
  { key: 'hours', en: 'Most hours',      bg: 'Повече часове' },
  { key: 'rank',  en: 'By rank',         bg: 'По ранг' },
  { key: 'city',  en: 'By city',         bg: 'По град' },
]


function FilterBar({ options, value, onChange, label, lang }) {
  const selectStyle = {
    borderColor: 'var(--border-mid)',
    background:  'var(--bg-card)',
    color:       'var(--text)',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
  }
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--text-faint)' }}>
        {label}:
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="text-xs rounded-lg border px-2.5 py-1.5 pr-7 appearance-none cursor-pointer transition-colors"
        style={selectStyle}>
        <option value="">{lang === 'bg' ? 'Всички' : 'All'}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export default function Volunteers() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [volunteers, setVolunteers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sort,    setSort]    = useState('az')
  const [filterCity, setFilterCity] = useState('')
  const [filterAvail, setFilterAvail] = useState('')

  useEffect(() => {
    supabase.rpc('get_public_volunteers')
      .then(({ data, error }) => {
        if (error) console.error('Volunteers query error:', error)
        setVolunteers(data || [])
        setLoading(false)
      })
  }, [])

  const sorted = useMemo(() => {
    const RANK_ORDER = { Standard:0, Bronze:1, Silver:2, Gold:3, Platinum:4 }
    let list = volunteers.filter(v => {
      if (filterCity && (v.city || '') !== filterCity) return false
      if (filterAvail && !(v.availability || []).includes(filterAvail)) return false
    if (!search) return true
    const s = search.toLowerCase()
    return (
      (v.full_name || '').toLowerCase().includes(s) ||
      (v.full_name_bg || '').toLowerCase().includes(s) ||
      (v.city || '').toLowerCase().includes(s) ||
      (v.city_bg || '').toLowerCase().includes(s) ||
      (v.skills || '').toLowerCase().includes(s) ||
      (v.skills_bg || '').toLowerCase().includes(s)
    )
  })
    if (sort === 'za')    return [...list].sort((a,b) => (b.full_name||'').localeCompare(a.full_name||''))
    if (sort === 'hours') return [...list].sort((a,b) => (b.confirmed_hours||0) - (a.confirmed_hours||0))
    if (sort === 'rank')  return [...list].sort((a,b) => (RANK_ORDER[b.ranking_type]||0) - (RANK_ORDER[a.ranking_type]||0))
    if (sort === 'city')  return [...list].sort((a,b) => (a.city||'').localeCompare(b.city||''))
    return [...list].sort((a,b) => (a.full_name||'').localeCompare(b.full_name||''))
  }, [volunteers, search, sort, filterCity, filterAvail])

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-6 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-medium" style={{ color: 'var(--text)' }}>{lang === 'bg' ? 'Доброволци' : 'Volunteers'}</h1>
        </div>
      </div>
          {/* Row 1: Search */}
          <input
            type="search"
            placeholder={lang==='bg'?'Търси...':'Search...'}
            className="input"
            value={search}
            onChange={e=>setSearch(e.target.value)}
          />
          {/* Row 2: Filters left, Sort right */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <FilterBar
                options={[...new Set(volunteers.filter(v=>v.city).map(v=>v.city))].sort().map(c=>({value:c,label:c}))}
                value={filterCity} onChange={setFilterCity}
                label={lang==='bg'?'Град':'City'} lang={lang} />
              <FilterBar
                options={Object.entries(AVAILABILITY_LABEL).map(([k,v])=>({value:k,label:v[lang]}))}
                value={filterAvail} onChange={setFilterAvail}
                label={lang==='bg'?'Достъпност':'Availability'} lang={lang} />
            </div>
            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-xs font-medium whitespace-nowrap" style={{color:'var(--text-faint)'}}>
                {lang==='bg'?'Сортирай:':'Sort by:'}
              </label>
              <select value={sort} onChange={e=>setSort(e.target.value)}
                className="text-xs rounded-lg border px-2.5 py-1.5 pr-7 appearance-none cursor-pointer transition-colors"
                style={{borderColor:'var(--border-mid)',background:'var(--bg-card)',color:'var(--text)',backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",backgroundRepeat:'no-repeat',backgroundPosition:'right 8px center'}}>
                {VOL_SORTS.map(s=>(<option key={s.key} value={s.key}>{lang==='bg'?s.bg:s.en}</option>))}
              </select>
            </div>
          </div>
        </div>

      {loading && <p className="text-gray-400">{t('common.loading')}</p>}

      {!loading && sorted.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm mb-4">
            {search
              ? (lang === 'bg' ? 'Няма намерени доброволци.' : 'No volunteers match your search.')
              : (lang === 'bg' ? 'Все още няма доброволци.' : 'No volunteers yet.')}
          </p>
          {!search && <Link to="/register" className="btn-primary">{lang === 'bg' ? 'Бъди първи' : 'Be the first volunteer'}</Link>}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sorted.map(v => {
          const name = (lang === 'bg' ? (v.full_name_bg || v.full_name) : v.full_name) || (lang === 'bg' ? 'Доброволец' : 'Volunteer')
          const city = (lang === 'bg' ? (v.city_bg || v.city) : v.city)
          const country = (lang === 'bg' ? (v.country_bg || v.country) : v.country) || 'Bulgaria'
          const bio = (lang === 'bg' ? (v.bio_bg || v.bio) : v.bio)
          const skills = (lang === 'bg' ? (v.skills_bg || v.skills) : v.skills)
          const initials = (v.full_name || '?').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase()
          const badges = v.badges || []
          const achievements = v.achievements || []

          return (
            <div key={v.id} className="card flex flex-col gap-3">
              {/* Header: avatar + name + location + ranking */}
              <div className="flex items-center gap-3">
                <div className="relative shrink-0" style={{ width: 52, height: 52 }}>
                  <div className="w-12 h-12 rounded-tl-lg bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-lg overflow-hidden">
                    {v.avatar_url
                      ? <img src={v.avatar_url} alt={name} className="w-full h-full object-cover" />
                      : initials}
                  </div>
                  {v.ranking_type && (
                    <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
                      <img src={v.ranking_icon_url || `/badges/${v.ranking_type.toLowerCase()}.png`}
                        alt={v.ranking_type} title={lang === 'bg' ? v.ranking_type_bg : v.ranking_type}
                        style={{ width: 28, height: 28, objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 truncate">{name}</h3>
                  {(city || country) && (
                    <p className="text-xs text-gray-400 truncate">{[city, country].filter(Boolean).join(', ')}</p>
                  )}
                  {v.ranking_type && (
                    <span className="text-xs font-semibold" style={{ color: RANK_COLOR[v.ranking_type] || '#6b7280' }}>
                      {lang === 'bg' ? v.ranking_type_bg : v.ranking_type}
                    </span>
                  )}
                </div>
              </div>

              {/* Corporation membership */}
              {v.corp_name && (
                <Link to={`/corporations/${v.corp_slug}`}
                  className="flex items-center gap-2 text-xs text-brand-600 hover:text-brand-700 bg-brand-50 rounded-lg px-2.5 py-1.5">
                  {v.corp_logo_url && <img src={v.corp_logo_url} alt="" className="w-4 h-4 rounded object-cover" />}
                  <span className="font-medium truncate">{v.corp_name}</span>
                </Link>
              )}

              {/* Stats: events + hours */}
              {(v.event_count > 0 || v.confirmed_hours > 0) && (
                <div className="flex gap-3 text-xs text-gray-500">
                  {v.event_count > 0 && (
                    <span className="flex items-center gap-1">
                      📅 <strong className="text-gray-700">{v.event_count}</strong>
                      {lang === 'bg' ? ' събит.' : ' events'}
                    </span>
                  )}
                  {v.confirmed_hours > 0 && (
                    <span className="flex items-center gap-1">
                      ⏱ <strong className="text-gray-700">{v.confirmed_hours}</strong>
                      {lang === 'bg' ? ' часа' : ' hours'}
                    </span>
                  )}
                </div>
              )}

              {/* Bio */}
              {bio && (
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{bio}</p>
              )}

              {/* Skills */}
              {skills && (
                <div className="flex flex-wrap gap-1">
                  {skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4).map((s, i) => (
                    <span key={i} className="badge bg-gray-50 text-gray-600 border border-gray-200 text-xs px-2 py-0.5">{s}</span>
                  ))}
                </div>
              )}

              {/* Availability */}
              {v.availability?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {v.availability.map(a => (
                    <span key={a} className="badge bg-brand-50 text-brand-700 border border-brand-100 text-xs px-2 py-0.5">
                      {AVAILABILITY_LABEL[a]?.[lang] || a}
                    </span>
                  ))}
                </div>
              )}

              {/* Badges */}
              {badges.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {badges.slice(0, 5).map((b, i) => (
                    <span key={i} title={lang === 'bg' ? (b.label_bg || b.label) : b.label}
                      className="w-8 h-8 rounded-full bg-brand-50 border-2 border-brand-200 flex items-center justify-center text-base">
                      {b.icon || '🏅'}
                    </span>
                  ))}
                  {badges.length > 5 && (
                    <span className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                      +{badges.length - 5}
                    </span>
                  )}
                </div>
              )}

              {/* Achievements — icon badges only */}
              {achievements.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {achievements.slice(0, 6).map((a, i) => (
                    <span key={i} title={lang === 'bg' ? (a.name_bg || a.name) : a.name}
                      className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                      style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-mid)' }}>
                      {a.badge_url
                        ? <img src={a.badge_url} alt="" className="w-full h-full object-contain p-0.5" />
                        : <span className="text-xs">🎖️</span>}
                    </span>
                  ))}
                  {achievements.length > 6 && (
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                      style={{ background: 'var(--bg-subtle)', color: 'var(--text-faint)', border: '1px solid var(--border-mid)' }}>
                      +{achievements.length - 6}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
