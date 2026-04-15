import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

const StarRating = ({ rating, count }) => (
  <span className="flex items-center gap-1">
    <span className="text-amber-400 text-sm">{'★'.repeat(Math.round(rating || 0))}{'☆'.repeat(5 - Math.round(rating || 0))}</span>
    <span className="text-xs text-gray-400">{rating ? Number(rating).toFixed(1) : '—'}{count > 0 ? ` (${count})` : ''}</span>
  </span>
)

export default function Events() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'

  const [events,     setEvents]     = useState([])
  const [past,       setPast]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [loadingPast,setLoadingPast]= useState(true)
  const [search,     setSearch]     = useState('')
  const [searchPast, setSearchPast] = useState('')

  useEffect(() => {
    // Upcoming published events
    supabase.from('events')
      .select('id,title,title_bg,description,description_bg,city,event_date,volunteers_needed,volunteers_enrolled,is_online,organizations(name,slug)')
      .eq('status', 'published')
      .eq('show_in_public', true)
      .gte('event_date', new Date().toISOString())
      .order('event_date')
      .then(({ data }) => { setEvents(data || []); setLoading(false) })

    // Past completed events with stats via RPC
    supabase.rpc('get_past_public_events', { p_limit: 20 })
      .then(({ data }) => { setPast(data || []); setLoadingPast(false) })
  }, [])

  const filtered = events.filter(ev => {
    const title = (lang === 'bg' && ev.title_bg) ? ev.title_bg : ev.title
    return title.toLowerCase().includes(search.toLowerCase()) || (ev.city || '').toLowerCase().includes(search.toLowerCase())
  })

  const filteredPast = past.filter(ev => {
    const title = (lang === 'bg' && ev.title_bg) ? ev.title_bg : ev.title
    return title.toLowerCase().includes(searchPast.toLowerCase()) || (ev.city || '').toLowerCase().includes(searchPast.toLowerCase())
  })

  const L = {
    upcoming:     lang === 'bg' ? 'Предстоящи събития'  : 'Upcoming events',
    past:         lang === 'bg' ? 'Минали събития'       : 'Past events',
    past_sub:     lang === 'bg' ? 'Завършени доброволчески инициативи' : 'Completed volunteering initiatives',
    spots_left:   lang === 'bg' ? 'свободни места'       : 'spots left',
    register:     lang === 'bg' ? 'Регистрирай се'       : 'Register',
    view:         lang === 'bg' ? 'Виж детайли'          : 'View details',
    online:       lang === 'bg' ? 'Онлайн'               : 'Online',
    hours:        lang === 'bg' ? 'ч. доброволчество'    : 'volunteer hours',
    volunteers:   lang === 'bg' ? 'доброволци'           : 'volunteers',
    no_upcoming:  lang === 'bg' ? 'Няма предстоящи събития.' : 'No upcoming events.',
    no_past:      lang === 'bg' ? 'Няма минали събития.' : 'No past events yet.',
    search_ph:    lang === 'bg' ? 'Търсене...'            : 'Search...',
  }

  const fmtDate = (ts) => new Date(ts).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* ── Upcoming events ── */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-medium">{L.upcoming}</h1>
            <p className="text-gray-500 text-sm mt-1">{filtered.length} {lang === 'bg' ? 'события' : 'events'}</p>
          </div>
          <input type="search" placeholder={L.search_ph} className="input sm:w-64"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading && <p className="text-gray-400">{t('common.loading')}</p>}
        {!loading && filtered.length === 0 && <p className="text-gray-400">{L.no_upcoming}</p>}

        <div className="flex flex-col gap-4">
          {filtered.map(ev => {
            const title = (lang === 'bg' && ev.title_bg) ? ev.title_bg : ev.title
            const dt    = new Date(ev.event_date)
            const spots = Math.max(0, (ev.volunteers_needed || 0) - (ev.volunteers_enrolled || 0))
            return (
              <Link key={ev.id} to={`/events/${ev.id}`} className="card flex gap-5 hover:border-gray-200 hover:shadow-sm transition-all">
                {/* Date box */}
                <div className="min-w-14 text-center bg-brand-50 rounded-xl py-3 shrink-0">
                  <p className="text-2xl font-semibold text-brand-400 leading-none">{dt.getDate()}</p>
                  <p className="text-xs text-brand-600 uppercase mt-0.5">{dt.toLocaleString('en', { month: 'short' })}</p>
                  <p className="text-xs text-brand-500 mt-0.5">{dt.getFullYear()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {ev.organizations?.name} · {ev.is_online ? L.online : ev.city}
                  </p>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                    {(lang === 'bg' && ev.description_bg) ? ev.description_bg : ev.description}
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between shrink-0">
                  <span className="text-sm font-medium text-brand-400">{spots} {L.spots_left}</span>
                  <span className="btn-primary text-xs px-3 py-1.5 mt-2">{L.register}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Past events ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-medium text-gray-700">{L.past}</h2>
            <p className="text-gray-400 text-sm mt-0.5">{L.past_sub}</p>
          </div>
          <input type="search" placeholder={L.search_ph} className="input sm:w-64"
            value={searchPast} onChange={e => setSearchPast(e.target.value)} />
        </div>

        {loadingPast && <p className="text-gray-400">{t('common.loading')}</p>}
        {!loadingPast && filteredPast.length === 0 && <p className="text-gray-400">{L.no_past}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPast.map(ev => {
            const title = (lang === 'bg' && ev.title_bg) ? ev.title_bg : ev.title
            const desc  = (lang === 'bg' && ev.description_bg) ? ev.description_bg : ev.description
            return (
              <Link key={ev.id} to={`/events/${ev.id}`}
                className="card flex flex-col gap-3 hover:border-gray-200 hover:shadow-sm transition-all opacity-90 hover:opacity-100">

                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="min-w-12 text-center bg-gray-50 rounded-xl py-2.5 shrink-0">
                    <p className="text-xl font-semibold text-gray-500 leading-none">{new Date(ev.event_date).getDate()}</p>
                    <p className="text-xs text-gray-400 uppercase mt-0.5">{new Date(ev.event_date).toLocaleString('en', { month: 'short' })}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(ev.event_date).getFullYear()}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 line-clamp-1">{title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ev.org_name} · {ev.is_online ? L.online : ev.city}
                    </p>
                  </div>
                  <span className="badge text-xs bg-gray-100 text-gray-500 shrink-0">
                    {lang === 'bg' ? 'Завършено' : 'Completed'}
                  </span>
                </div>

                {/* Description */}
                {desc && <p className="text-xs text-gray-500 line-clamp-2">{desc}</p>}

                {/* Stats row */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex gap-3">
                    {ev.volunteers_enrolled > 0 && (
                      <span className="text-xs text-gray-500">
                        👥 {ev.volunteers_enrolled} {L.volunteers}
                      </span>
                    )}
                    {ev.total_hours > 0 && (
                      <span className="text-xs text-brand-600 font-medium">
                        ⏱ {ev.total_hours}h {L.hours}
                      </span>
                    )}
                  </div>
                  {ev.review_count > 0 && (
                    <StarRating rating={ev.avg_rating} count={Number(ev.review_count)} />
                  )}
                </div>

                <span className="text-xs text-brand-500 hover:underline self-start">{L.view} →</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
