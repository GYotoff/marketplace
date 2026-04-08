import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

export default function Events() {
  const { t, i18n } = useTranslation()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('events')
      .select('id,title,title_bg,description,description_bg,city,event_date,volunteers_needed,volunteers_enrolled,is_online,organizations(name,slug)')
      .eq('status', 'published')
      .gte('event_date', new Date().toISOString())
      .order('event_date')
      .then(({ data }) => { setEvents(data || []); setLoading(false) })
  }, [])

  const filtered = events.filter(ev => {
    const title = (i18n.language === 'bg' && ev.title_bg) ? ev.title_bg : ev.title
    return title.toLowerCase().includes(search.toLowerCase()) || (ev.city || '').toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-medium">{t('events.title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} events</p>
        </div>
        <input type="search" placeholder={t('common.search')} className="input sm:w-64" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading && <p className="text-gray-400">{t('common.loading')}</p>}
      {!loading && filtered.length === 0 && <p className="text-gray-400">{t('events.no_events')}</p>}

      <div className="flex flex-col gap-4">
        {filtered.map(ev => {
          const title = (i18n.language === 'bg' && ev.title_bg) ? ev.title_bg : ev.title
          const dt = new Date(ev.event_date)
          const spots = Math.max(0, ev.volunteers_needed - ev.volunteers_enrolled)
          return (
            <Link key={ev.id} to={`/events/${ev.id}`} className="card flex gap-5 hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="min-w-14 text-center bg-brand-50 rounded-xl py-3">
                <p className="text-2xl font-semibold text-brand-400 leading-none">{dt.getDate()}</p>
                <p className="text-xs text-brand-600 uppercase mt-0.5">{dt.toLocaleString('en', { month: 'short' })}</p>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {ev.organizations?.name} · {ev.is_online ? t('events.online') : ev.city}
                </p>
                <p className="text-sm text-gray-400 mt-1 line-clamp-1">{(i18n.language === 'bg' && ev.description_bg) ? ev.description_bg : ev.description}</p>
              </div>
              <div className="flex flex-col items-end justify-between shrink-0">
                <span className="text-sm font-medium text-brand-400">{t('events.spots_left', { count: spots })}</span>
                <span className="btn-primary text-xs px-3 py-1.5 mt-2">{t('events.register')}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
