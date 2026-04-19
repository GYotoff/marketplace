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

function SortBar({ sort, setSort, lang, total, label }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{total} {label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {SORTS.map(s => (
          <button key={s.key} type="button" onClick={() => setSort(s.key)}
            className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
            style={{
              borderColor: sort === s.key ? '#1D9E75' : 'var(--border-mid)',
              background:  sort === s.key ? 'rgba(29,158,117,0.1)' : 'transparent',
              color:       sort === s.key ? '#1D9E75' : 'var(--text-muted)',
              fontWeight:  sort === s.key ? 600 : 400,
            }}>
            {lang === 'bg' ? s.bg : s.en}
          </button>
        ))}
      </div>
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
      .select('id,name,slug,description,description_bg,logo_url,city,type,is_verified,created_at')
      .eq('is_active', true)
      .then(({ data }) => { setOrgs(data || []); setLoading(false) })
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

      <SortBar sort={sort} setSort={setSort} lang={lang} total={sorted.length} label={L.count} />

      {loading && <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>}
      {!loading && sorted.length === 0 && <p className="text-sm py-8 text-center" style={{ color: 'var(--text-faint)' }}>{L.none}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sorted.map(org => {
          const desc = (lang === 'bg' && org.description_bg) ? org.description_bg : org.description
          return (
            <Link key={org.id} to={`/organizations/${org.slug}`}
              className="card hover:shadow-sm transition-all flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-lg overflow-hidden shrink-0">
                  {org.logo_url ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" /> : org.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{org.name}</p>
                    {org.is_verified && <span title="Verified">✓</span>}
                  </div>
                  {org.city && <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{org.city}</p>}
                </div>
              </div>
              {desc && <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>{desc}</p>}
              {org.type && (
                <span className="badge bg-blue-50 text-blue-700 self-start text-xs">{org.type}</span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
