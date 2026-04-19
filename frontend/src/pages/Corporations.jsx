import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

const SORTS = [
  { key: 'az',        en: 'A → Z',          bg: 'А → Я' },
  { key: 'za',        en: 'Z → A',          bg: 'Я → А' },
  { key: 'city',      en: 'By city',         bg: 'По град' },
  { key: 'size',      en: 'By size',         bg: 'По размер' },
]

const SIZE_ORDER = { micro:1, small:2, medium:3, large:4, enterprise:5, global_enterprise:6 }
const SIZE_LABEL = { micro:'Micro', small:'Small', medium:'Medium', large:'Large', enterprise:'Enterprise', global_enterprise:'Global Enterprise' }

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

export default function Corporations() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [corps,   setCorps]   = useState([])
  const [search,  setSearch]  = useState('')
  const [sort,    setSort]    = useState('az')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('corporations')
      .select('id, name, slug, description, description_bg, tagline, tagline_bg, logo_url, city, industry, size, is_verified, status')
      .eq('is_active', true).eq('status', 'approved')
      .then(({ data }) => { setCorps(data || []); setLoading(false) })
  }, [])

  const sorted = useMemo(() => {
    let list = corps.filter(c => {
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) ||
             (c.city || '').toLowerCase().includes(q) ||
             (c.industry || '').toLowerCase().includes(q)
    })
    if (sort === 'za')   return [...list].sort((a,b) => b.name.localeCompare(a.name))
    if (sort === 'city') return [...list].sort((a,b) => (a.city||'').localeCompare(b.city||''))
    if (sort === 'size') return [...list].sort((a,b) => (SIZE_ORDER[b.size]||0) - (SIZE_ORDER[a.size]||0))
    return [...list].sort((a,b) => a.name.localeCompare(b.name))
  }, [corps, search, sort])

  const L = {
    title:  lang === 'bg' ? 'Корпорации'  : 'Corporations',
    search: lang === 'bg' ? 'Търси...'    : 'Search...',
    count:  lang === 'bg' ? 'корпорации'  : 'corporations',
    none:   lang === 'bg' ? 'Няма намерени корпорации' : 'No corporations found',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-medium" style={{ color: 'var(--text)' }}>{L.title}</h1>
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
        {sorted.map(corp => {
          const desc = (lang === 'bg' && corp.description_bg) ? corp.description_bg : corp.description
          const tag  = (lang === 'bg' && corp.tagline_bg)     ? corp.tagline_bg     : corp.tagline
          return (
            <Link key={corp.id} to={`/corporations/${corp.slug}`}
              className="card hover:shadow-sm transition-all flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-semibold text-lg overflow-hidden shrink-0">
                  {corp.logo_url ? <img src={corp.logo_url} alt={corp.name} className="w-full h-full object-cover" /> : corp.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{corp.name}</p>
                  {corp.city && <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{corp.city}</p>}
                </div>
              </div>
              {tag && <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>{tag}</p>}
              {desc && <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>{desc}</p>}
              <div className="flex gap-1.5 flex-wrap mt-auto">
                {corp.industry && <span className="badge bg-amber-50 text-amber-700 text-xs">{corp.industry}</span>}
                {corp.size     && <span className="badge bg-gray-50 text-gray-600 border border-gray-200 text-xs">{SIZE_LABEL[corp.size] || corp.size}</span>}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
