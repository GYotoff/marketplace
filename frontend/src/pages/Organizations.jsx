import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

const SORTS = [
  { key: 'az',        en: 'A → Z',          bg: 'А → Я' },
  { key: 'za',        en: 'Z → A',          bg: 'Я → А' },
  { key: 'city',      en: 'By city',         bg: 'По град' },
  { key: 'verified',  en: 'Verified first',  bg: 'Верифицирани' },
]

function SortBar({ sorts, sort, setSort, lang }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--text-faint)' }}>
        {lang === 'bg' ? 'Сортирай:' : 'Sort by:'}
      </label>
      <select
        value={sort}
        onChange={e => setSort(e.target.value)}
        className="text-xs rounded-lg border px-2.5 py-1.5 pr-7 appearance-none cursor-pointer transition-colors"
        style={{
          borderColor: 'var(--border-mid)',
          background:  'var(--bg-card)',
          color:       'var(--text)',
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
        }}
      >
        {sorts.map(s => (
          <option key={s.key} value={s.key}>{lang === 'bg' ? s.bg : s.en}</option>
        ))}
      </select>
    </div>
  )
}

export default function Organizations() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [orgs,    setOrgs]    = useState([])
  const [search,  setSearch]  = useState('')
  const [sort,    setSort]    = useState('az')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('organizations')
      .select('id,name,slug,description,description_bg,tagline,tagline_bg,logo_url,city,website,type,is_verified,created_at,projects(count),events(count)')
      .eq('is_active', true)
      .then(({ data }) => {
        const normalized = (data || []).map(o => ({
          ...o,
          project_count: o.projects?.[0]?.count ?? 0,
          event_count:   o.events?.[0]?.count   ?? 0,
        }))
        setOrgs(normalized)
        setLoading(false)
      })
  }, [])

  const sorted = useMemo(() => {
    let list = orgs.filter(o => {
      const q = search.toLowerCase()
      return o.name.toLowerCase().includes(q) || (o.city || '').toLowerCase().includes(q)
    })
    if (sort === 'za')       return [...list].sort((a,b) => b.name.localeCompare(a.name))
    if (sort === 'city')     return [...list].sort((a,b) => (a.city||'').localeCompare(b.city||''))
    if (sort === 'verified') return [...list].sort((a,b) => (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0))
    return [...list].sort((a,b) => a.name.localeCompare(b.name))
  }, [orgs, search, sort])

  const L = {
    title:  lang === 'bg' ? 'Организации' : 'Organizations',
    search: lang === 'bg' ? 'Търси...'    : 'Search...',
    count:  lang === 'bg' ? 'организации' : 'organizations',
    none:   lang === 'bg' ? 'Няма намерени организации' : 'No organizations found',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-medium" style={{ color: 'var(--text)' }}>{L.title}</h1>
        </div>
        <input type="text" className="input sm:w-72" placeholder={L.search}
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="flex items-center justify-between mb-5">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{sorted.length} {L.count}</p>
        <SortBar sorts={SORTS} sort={sort} setSort={setSort} lang={lang} />
      </div>

      {loading && <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>}
      {!loading && sorted.length === 0 && <p className="text-sm py-8 text-center" style={{ color: 'var(--text-faint)' }}>{L.none}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sorted.map(org => {
          const desc = (lang === 'bg' && org.description_bg) ? org.description_bg : org.description
          return (
            <Link key={org.id} to={`/organizations/${org.slug}`}
              className="card hover:shadow-sm transition-all flex flex-col gap-3">
              {/* Header: logo + name + city + website */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-lg overflow-hidden shrink-0">
                  {org.logo_url ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" /> : org.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{org.name}</p>
                    {org.is_verified && <span title="Verified" className="text-brand-400 text-xs">✓</span>}
                  </div>
                  {org.city && <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{org.city}</p>}
                  {org.website && (
                    <a href={org.website} target="_blank" rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-xs text-brand-400 hover:text-brand-600 truncate block" style={{ maxWidth: 160 }}>
                      {org.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </div>
              {/* Tagline */}
              {(() => { const tag = lang === 'bg' ? (org.tagline_bg || org.tagline) : org.tagline; return tag ? <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>{tag}</p> : null })()}
              {/* Description */}
              {desc && <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>{desc}</p>}
              {/* Type + counters */}
              <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                {org.type
                  ? <span className="badge bg-blue-50 text-blue-700 text-xs">{org.type}</span>
                  : <span />}
                <div className="flex gap-2 text-xs" style={{ color: 'var(--text-faint)' }}>
                  {(org.project_count > 0) && <span>📋 {org.project_count}</span>}
                  {(org.event_count > 0)   && <span>📅 {org.event_count}</span>}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
