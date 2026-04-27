import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

const SORTS = [
  { key: 'newest',  en: 'Newest',           bg: 'Най-нови' },
  { key: 'az',      en: 'A → Z',            bg: 'А → Я' },
  { key: 'spots',   en: 'Most spots',        bg: 'Повече места' },
  { key: 'start',   en: 'Start date',        bg: 'Начална дата' },
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

export default function Projects() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [projects, setProjects] = useState([])
  const [search,   setSearch]   = useState('')
  const [sort,     setSort]     = useState('newest')
  const [filterCity, setFilterCity] = useState('')
  const [filterOrg,  setFilterOrg]  = useState('')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, title, title_bg, description, description_bg, goals, goals_bg, deliverables, deliverables_bg, cover_url, city, city_bg, address, address_bg, start_date, end_date, volunteers_needed, volunteers_enrolled, status, created_at, organizations(name, name_bg, slug, logo_url)')
      .eq('status', 'published')
      .then(({ data }) => { setProjects(data || []); setLoading(false) })
  }, [])

  const sorted = useMemo(() => {
    let list = projects.filter(p => {
      if (filterCity && (p.city || '') !== filterCity) return false
      if (filterOrg && (p.organizations?.id || '') !== filterOrg) return false
      const q = search.toLowerCase()
      return (p.title || '').toLowerCase().includes(q) ||
             (p.title_bg || '').toLowerCase().includes(q) ||
             (p.city || '').toLowerCase().includes(q) ||
             (p.organizations?.name || '').toLowerCase().includes(q)
    })
    if (sort === 'az')     return [...list].sort((a,b) => (a.title||'').localeCompare(b.title||''))
    if (sort === 'spots')  return [...list].sort((a,b) => ((b.volunteers_needed||0)-(b.volunteers_enrolled||0)) - ((a.volunteers_needed||0)-(a.volunteers_enrolled||0)))
    if (sort === 'start')  return [...list].sort((a,b) => (a.start_date||'').localeCompare(b.start_date||''))
    return [...list].sort((a,b) => (b.created_at||'').localeCompare(a.created_at||''))
  }, [projects, search, sort, filterCity, filterOrg])

  const L = {
    title:    lang === 'bg' ? 'Проекти'            : 'Projects',
    search:   lang === 'bg' ? 'Търси проекти...'   : 'Search projects...',
    none:     lang === 'bg' ? 'Няма намерени проекти' : 'No projects found',
    projects: lang === 'bg' ? (sorted.length === 1 ? 'проект' : 'проекта') : (sorted.length === 1 ? 'project' : 'projects'),
    spots:    lang === 'bg' ? 'свободни места'     : 'spots left',
    goals_label: lang === 'bg' ? 'Цели'              : 'Goals',
    deliv_label: lang === 'bg' ? 'Резултати'         : 'Deliverables',
    org:      lang === 'bg' ? 'Организация'        : 'Organization',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-medium" style={{ color: 'var(--text)' }}>{L.title}</h1>
      </div>
      <div className="mb-5 flex flex-col gap-3">
        <input type="search" className="input" placeholder={L.search}
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <FilterBar
              options={[...new Set(projects.filter(p=>p.city).map(p=>p.city))].sort().map(c=>({value:c,label:c}))}
              value={filterCity} onChange={setFilterCity}
              label={lang==='bg'?'Град':'City'} lang={lang} />
            <FilterBar
              options={[...new Map(projects.filter(p=>p.organizations?.id).map(p=>[p.organizations.id,{value:p.organizations.id,label:lang==='bg'?(p.organizations.name_bg||p.organizations.name):p.organizations.name}])).values()].sort((a,b)=>a.label.localeCompare(b.label))}
              value={filterOrg} onChange={setFilterOrg}
              label={lang==='bg'?'Организация':'Organization'} lang={lang} />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <SortBar sorts={SORTS} sort={sort} setSort={setSort} lang={lang} />
          </div>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sorted.length} {L.projects}</p>
      </div>

      {loading && <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>}
      {!loading && sorted.length === 0 && <p className="text-sm py-8 text-center" style={{ color: 'var(--text-faint)' }}>{L.none}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sorted.map(p => {
          const title       = (lang === 'bg' && p.title_bg)         ? p.title_bg         : p.title
          const desc        = (lang === 'bg' && p.description_bg)  ? p.description_bg  : p.description
          const goals       = (lang === 'bg' && p.goals_bg)        ? p.goals_bg        : p.goals
          const deliverables= (lang === 'bg' && p.deliverables_bg) ? p.deliverables_bg : p.deliverables
          const spots       = Math.max(0, (p.volunteers_needed || 0) - (p.volunteers_enrolled || 0))
          const org         = p.organizations
          return (
            <Link key={p.id} to={`/projects/${p.id}`}
              className="card hover:shadow-sm transition-all flex flex-col gap-3">
              {p.cover_url && (
                <div className="w-full h-36 rounded-lg overflow-hidden -mx-5 -mt-5 mb-0" style={{ width: 'calc(100% + 2.5rem)', marginTop: '-1.25rem', marginLeft: '-1.25rem' }}>
                  <img src={p.cover_url} alt={title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center gap-2">
                {org?.logo_url && <img src={org.logo_url} alt={org.name} className="w-5 h-5 rounded object-cover shrink-0" />}
                {org?.name && <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>{lang === 'bg' ? (org.name_bg || org.name) : org.name}</p>}
              </div>
              <p className="font-semibold text-sm leading-tight" style={{ color: 'var(--text)' }}>{title}</p>
              {desc && <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>{desc}</p>}
              {goals && (
                <div className="flex gap-1.5 items-start">
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-faint)' }}>🎯</span>
                  <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{goals}</p>
                </div>
              )}
              {deliverables && (
                <div className="flex gap-1.5 items-start">
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-faint)' }}>📦</span>
                  <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{deliverables}</p>
                </div>
              )}
              <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{(lang === 'bg' ? (p.city_bg || p.city) : p.city) || ''}</span>
                {p.volunteers_needed > 0 && (
                  <span className="text-xs font-medium text-brand-400">{spots} {L.spots}</span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
