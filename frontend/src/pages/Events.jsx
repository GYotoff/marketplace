import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

function EventCard({ ev, lang, type }) {
  const title = (lang === 'bg' && ev.title_bg) ? ev.title_bg : ev.title
  const desc  = (lang === 'bg' && ev.description_bg) ? ev.description_bg : ev.description
  const city  = (lang === 'bg' && ev.city_bg) ? ev.city_bg : ev.city
  const orgName = ev.org_name || ev.organizations?.name
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
          <p className="text-sm text-gray-500 mt-0.5 truncate">
            {orgName}{(orgName && (isOnline ? L.online : city)) ? ' · ' : ''}{isOnline ? L.online : city}
          </p>
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

export default function Events() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'

  const [upcoming,     setUpcoming]    = useState([])
  const [past,         setPast]        = useState([])
  const [loading,      setLoading]     = useState(true)
  const [loadingPast,  setLoadingPast] = useState(true)
  const [search,       setSearch]      = useState('')

  useEffect(() => {
    supabase.from('events')
      .select('id,title,title_bg,description,description_bg,city,city_bg,event_date,volunteers_needed,volunteers_enrolled,is_online,event_type,organizations(name,slug)')
      .eq('status', 'published')
      .eq('show_in_public', true)
      .gte('event_date', new Date().toISOString())
      .order('event_date')
      .then(({ data }) => { setUpcoming(data || []); setLoading(false) })

    supabase.rpc('get_past_public_events', { p_limit: 50 })
      .then(({ data }) => { setPast(data || []); setLoadingPast(false) })
  }, [])

  const filterFn = (ev) => {
    if (!search) return true
    const s = search.toLowerCase()
    const title = (lang === 'bg' && ev.title_bg) ? ev.title_bg : ev.title
    const city  = (lang === 'bg' && ev.city_bg)  ? ev.city_bg  : ev.city
    const org   = ev.org_name || ev.organizations?.name || ''
    return title?.toLowerCase().includes(s) || city?.toLowerCase().includes(s) || org.toLowerCase().includes(s)
  }

  const filteredUpcoming = upcoming.filter(filterFn)
  const filteredPast     = past.filter(filterFn)

  const L = {
    title:       lang === 'bg' ? 'Събития'             : 'Events',
    upcoming:    lang === 'bg' ? 'Предстоящи'           : 'Upcoming',
    past:        lang === 'bg' ? 'Минали'               : 'Past',
    search:      lang === 'bg' ? 'Търсене...'           : 'Search events...',
    no_upcoming: lang === 'bg' ? 'Няма предстоящи събития.' : 'No upcoming events.',
    no_past:     lang === 'bg' ? 'Няма минали събития.' : 'No past events yet.',
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* Page header + single search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-medium">{L.title}</h1>
        <input type="search" placeholder={L.search} className="input sm:w-64"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* ── Upcoming ── */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-gray-800">{L.upcoming}</h2>
          <span className="badge bg-brand-50 text-brand-700 border border-brand-100 text-xs px-2 py-0.5">
            {filteredUpcoming.length}
          </span>
        </div>

        {loading && <p className="text-gray-400 text-sm">{t('common.loading')}</p>}
        {!loading && filteredUpcoming.length === 0 && (
          <p className="text-gray-400 text-sm py-6 text-center">{L.no_upcoming}</p>
        )}

        <div className="flex flex-col gap-3">
          {filteredUpcoming.map(ev => (
            <EventCard key={ev.id} ev={ev} lang={lang} type="upcoming" />
          ))}
        </div>
      </section>

      {/* ── Past ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-gray-800">{L.past}</h2>
          <span className="badge bg-gray-100 text-gray-600 border border-gray-200 text-xs px-2 py-0.5">
            {filteredPast.length}
          </span>
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
