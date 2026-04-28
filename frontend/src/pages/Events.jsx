import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

function EventCard({ ev, lang, type }) {
  const title = (lang === 'bg' && ev.title_bg) ? ev.title_bg : ev.title
  const desc  = (lang === 'bg' && ev.description_bg) ? ev.description_bg : ev.description
  const city  = (lang === 'bg' && ev.city_bg) ? ev.city_bg : ev.city
  const orgName    = lang==='bg' ? (ev.org_name_bg||ev.org_name||ev.organizations?.name_bg||ev.organizations?.name) : (ev.org_name||ev.organizations?.name)
  const orgLogoUrl = ev.org_logo_url || ev.organizations?.logo_url
  const dt    = new Date(ev.event_date)
  const isOnline = ev.is_online || ev.event_type === 'online' || ev.event_type === 'hybrid'

  const upcoming = type === 'upcoming'
  const spots = upcoming ? Math.max(0, (ev.volunteers_needed || 0) - (ev.volunteers_enrolled || 0)) : null

  const L = {
    online:     lang === 'bg' ? 'Онлайн'          : 'Online',
    spots:      lang === 'bg' ? 'свободни места'  : 'spots left',
    completed:  lang === 'bg' ? 'Завършено'        : 'Completed',
    volunteers: lang === 'bg' ? 'доброволци'       : 'volunteers',
    hours:      lang === 'bg' ? 'ч.'               : 'h',
    view:       lang === 'bg' ? 'Виж детайли'      : 'View details',
    register:   lang === 'bg' ? 'Регистрирай се'   : 'Register',
  }

  return (
    <Link to={`/events/${ev.id}`}
      className="card flex gap-4 hover:border-gray-200 hover:shadow-sm transition-all">

      {/* Date box */}
      <div className={'min-w-14 text-center rounded-xl py-3 shrink-0 ' + (upcoming ? 'bg-brand-50' : 'bg-gray-50')}>
        <p className={'text-2xl font-semibold leading-none ' + (upcoming ? 'text-brand-400' : 'text-gray-500')}>
          {dt.getDate()}
        </p>
        <p className={'text-xs uppercase mt-0.5 ' + (upcoming ? 'text-brand-600' : 'text-gray-400')}>
          {dt.toLocaleString(lang === 'bg' ? 'bg-BG' : 'en', { month: 'short' })}
        </p>
        <p className={'text-xs mt-0.5 ' + (upcoming ? 'text-brand-500' : 'text-gray-400')}>
          {dt.getFullYear()}
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-gray-900 line-clamp-1">{title}</h3>
            {!upcoming && (
              <span className="badge text-xs bg-gray-100 text-gray-500 shrink-0">{L.completed}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {orgLogoUrl && (
              <img src={orgLogoUrl} alt={orgName} className="w-4 h-4 rounded object-cover shrink-0" />
            )}
            <p className="text-sm text-gray-500 truncate">
              {orgName}{(orgName && (isOnline ? L.online : city)) ? ' · ' : ''}{isOnline ? L.online : city}
            </p>
          </div>
          {desc && <p className="text-sm text-gray-400 mt-1 line-clamp-1">{desc}</p>}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          {upcoming ? (
            <>
              {ev.volunteers_needed > 0 && (
                <span className="text-xs text-gray-500">{spots} {L.spots}</span>
              )}
              <span className={'btn-primary text-xs px-3 py-1.5 ' + (ev.volunteers_needed > 0 ? '' : 'ml-auto')}>
                {L.register}
              </span>
            </>
          ) : (
            <>
              <div className="flex gap-3 text-xs text-gray-500">
                {ev.volunteers_enrolled > 0 && (
                  <span>👥 {ev.volunteers_enrolled} {L.volunteers}</span>
                )}
                {ev.total_hours > 0 && (
                  <span className="text-brand-600 font-medium">⏱ {ev.total_hours}{L.hours}</span>
                )}
                {Number(ev.avg_rating) > 0 && (
                  <span className="text-amber-500">
                    {'★'.repeat(Math.round(ev.avg_rating))}
                    <span className="text-gray-400 ml-0.5">{Number(ev.avg_rating).toFixed(1)}</span>
                  </span>
                )}
              </div>
              <span className="text-xs text-brand-500">{L.view} →</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}

const EVT_SORTS = [
  { key: 'date',   en: 'By date',       bg: 'По дата' },
  { key: 'spots',  en: 'Most spots',    bg: 'Повече места' },
  { key: 'az',     en: 'A → Z',         bg: 'А → Я' },
  { key: 'city',   en: 'By city',       bg: 'По град' },
  { key: 'type',   en: 'By type',       bg: 'По тип' },
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

export default function Events() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'

  const [upcoming,     setUpcoming]    = useState([])
  const [past,         setPast]        = useState([])
  const [loading,      setLoading]     = useState(true)
  const [loadingPast,  setLoadingPast] = useState(true)
  const [search,       setSearch]      = useState('')
  const [sort,         setSort]        = useState('date')
  const [filterCity, setFilterCity] = useState('')
  const [filterType, setFilterType] = useState('')

  useEffect(() => {
   /* supabase.from('events')
      .select('id,title,title_bg,description,description_bg,city,city_bg,event_date,volunteers_needed,volunteers_enrolled,is_online,event_type,organizations(name,name_bg,slug,logo_url)')
      .eq('status', 'published')
      .eq('show_in_public', true)
      .gte('event_date', new Date().toISOString())
      .order('event_date')*/
    
      supabase.rpc('get_upcoming_public_events', { p_limit: 50 })
      .then(({ data }) => { setUpcoming(data || []); setLoading(false) })

    supabase.rpc('get_past_public_events', { p_limit: 50 })
      .then(({ data }) => { setPast(data || []); setLoadingPast(false) })
  }, [])

  const filterFn = (ev) => {
    if (filterCity && (ev.city || '') !== filterCity) return false
    if (filterType && (ev.event_type || '') !== filterType) return false
    if (!search) return true
    const s = search.toLowerCase()
    const title = (lang === 'bg' && ev.title_bg) ? ev.title_bg : ev.title
    const city  = (lang === 'bg' && ev.city_bg)  ? ev.city_bg  : ev.city
    const org   = ev.org_name || ev.organizations?.name || ''
    return title?.toLowerCase().includes(s) || city?.toLowerCase().includes(s) || org.toLowerCase().includes(s)
  }

  const applySortFn = (list) => {
    if (sort === 'spots') return [...list].sort((a,b) => ((b.volunteers_needed||0)-(b.volunteers_enrolled||0)) - ((a.volunteers_needed||0)-(a.volunteers_enrolled||0)))
    if (sort === 'az')    return [...list].sort((a,b) => (a.title||'').localeCompare(b.title||''))
    if (sort === 'city')  return [...list].sort((a,b) => (a.city||'').localeCompare(b.city||''))
    if (sort === 'type')  return [...list].sort((a,b) => (a.event_type||'').localeCompare(b.event_type||''))
    return [...list].sort((a,b) => (a.event_date||'').localeCompare(b.event_date||''))
  }
  const filteredUpcoming = applySortFn(upcoming.filter(filterFn))
  const filteredPast     = applySortFn(past.filter(filterFn))

  const L = {
    title:       lang === 'bg' ? 'Събития'             : 'Events',
    upcoming:    lang === 'bg' ? 'Предстоящи'           : 'Upcoming',
    past:        lang === 'bg' ? 'Минали'               : 'Past',
    search:      lang === 'bg' ? 'Търсене...'           : 'Search events...',
    no_upcoming: lang === 'bg' ? 'Няма предстоящи събития.' : 'No upcoming events.',
    no_past:     lang === 'bg' ? 'Няма минали събития.' : 'No past events yet.',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* Page header + single search */}
      <div className="mb-6 flex flex-col gap-3">
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
            <div className="flex items-center gap-2 flex-wrap">
              <FilterBar options={[...new Set([...upcoming,...past].filter(e=>e.city).map(e=>e.city))].sort().map(c=>({value:c,label:c}))} value={filterCity} onChange={setFilterCity} label={lang==='bg'?'Град':'City'} lang={lang} />
              <FilterBar options={[...new Set([...upcoming,...past].filter(e=>e.event_type).map(e=>e.event_type))].sort().map(t=>({value:t,label:t}))} value={filterType} onChange={setFilterType} label={lang==='bg'?'Тип':'Type'} lang={lang} />
            </div>
            <div className="flex items-center gap-2 ml-auto">
            </div>
              <SortBar sorts={EVT_SORTS} sort={sort} setSort={setSort} lang={lang} />
        </div>
      </div>

      <section className="mb-10">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold" style={{color:'var(--text)'}}>{L.upcoming}</h2>
            <span className="badge bg-brand-50 text-brand-600 border border-brand-100 text-xs px-2 py-0.5">
              {filteredUpcoming.length}
            </span>
          </div>
        </div>
        {loading && <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>}
        {!loading && filteredUpcoming.length === 0 && (
          <p className="text-sm py-8 text-center" style={{color:'var(--text-faint)'}}>
            {search ? (lang==='bg'?'Няма намерени предстоящи събития.':'No upcoming events match your search.') : (lang==='bg'?'Няма предстоящи събития.':'No upcoming events.')}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUpcoming.map(ev => {
            const title = (lang==='bg' && ev.title_bg) ? ev.title_bg : ev.title
            const city  = (lang==='bg' && ev.city_bg)  ? ev.city_bg  : ev.city
            const org   = ev.org_name || ev.organizations?.name
            return (
              <Link key={ev.id} to={'/events/'+ev.id}
                className="card flex flex-col gap-3 hover:shadow-md hover:border-brand-200 transition-all">
                {ev.invitation_image_url && (
                  <img src={ev.invitation_image_url} alt={title}
                    className="w-full h-36 object-cover rounded-lg" />
                )}
                <div className="flex flex-col gap-1.5 flex-1">
                  <p className="font-medium text-sm leading-snug" style={{color:'var(--text)'}}>{title}</p>
                  {org && <p className="text-xs text-brand-500 truncate">{org}</p>}
                  {city && <p className="text-xs truncate" style={{color:'var(--text-muted)'}}>📍 {city}</p>}
                  {ev.event_date && (
                    <p className="text-xs mt-auto" style={{color:'var(--text-faint)'}}>
                      📅 {new Date(ev.event_date).toLocaleDateString(lang==='bg'?'bg-BG':'en-GB',{day:'numeric',month:'short',year:'numeric'})}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-800">{L.past}</h2>
            <span className="badge bg-gray-100 text-gray-600 border border-gray-200 text-xs px-2 py-0.5">
              {filteredPast.length}
            </span>
          </div>
        </div>

        {loadingPast && <p className="text-gray-400 text-sm">{t('common.loading')}</p>}
        {!loadingPast && filteredPast.length === 0 && (
          <p className="text-gray-400 text-sm py-6 text-center">{L.no_past}</p>
        )}

        <div className="flex flex-col gap-3">
          {filteredPast.map(ev => (
            <EventCard key={ev.id} ev={ev} lang={lang} type="past" />
          ))}
        </div>
      </section>

    </div>
  )
}
