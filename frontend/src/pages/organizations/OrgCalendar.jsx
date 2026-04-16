import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const MONTH_NAMES = {
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  bg: ['Януари','Февруари','Март','Април','Май','Юни','Юли','Август','Септември','Октомври','Ноември','Декември'],
}
const DAY_NAMES = {
  en: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  bg: ['Пон','Вт','Ср','Чет','Пет','Съб','Нед'],
}

const STATUS_DOT = {
  draft:     'bg-gray-400',
  published: 'bg-brand-400',
  cancelled: 'bg-red-400',
  completed: 'bg-green-400',
}

export default function OrgCalendar() {
  const { user } = useAuthStore()
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'

  const today = new Date()
  const [org, setOrg] = useState(null)
  const [events, setEvents] = useState([])
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) load() }, [user?.id])

  const load = async () => {
    setLoading(true)
    const { data: om } = await supabase
      .from('organization_members')
      .select('organization_id, organizations(id, name)')
      .eq('profile_id', user.id)
      .eq('role', 'admin')
      .eq('request_status', 'approved')
      .single()
    if (!om) { setLoading(false); return }
    setOrg(om.organizations)

    // Load ALL events for this org (all statuses, all time)
    const { data } = await supabase
      .from('events')
      .select('*, projects(id, title)')
      .eq('organization_id', om.organizations.id)
      .order('event_date', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  // ── Calendar logic ────────────────────────────────────────────────────────

  const eventsByDay = {}
  events.forEach(ev => {
    if (!ev.event_date) return
    const d = new Date(ev.event_date)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    if (!eventsByDay[key]) eventsByDay[key] = []
    eventsByDay[key].push(ev)
  })

  const firstDay = new Date(year, month, 1)
  let startDow = firstDay.getDay() - 1; if (startDow < 0) startDow = 6
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const dayKey = (d) => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1); setSelected(null) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1) } else setMonth(m => m+1); setSelected(null) }

  // Sidebar: upcoming events for this org
  const upcoming = events
    .filter(ev => ev.event_date && new Date(ev.event_date) >= today && ev.status !== 'cancelled')
    .slice(0, 8)

  const past = events
    .filter(ev => ev.event_date && new Date(ev.event_date) < today)
    .slice(-5)
    .reverse()

  const selectedEvs = selected ? (eventsByDay[selected] || []) : []

  const fmtDate = (ts) => new Date(ts).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const fmtShort = (ts) => new Date(ts).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!org) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-gray-500">You are not an admin of any organization.</p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">
            {lang === 'bg' ? 'Календар на събития' : 'Events Calendar'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{org.name}</p>
        </div>
        <Link to="/org/projects" className="btn-secondary text-sm">
          {lang === 'bg' ? 'Проекти' : 'Projects'}
        </Link>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-5 text-xs text-gray-500">
        {[['draft','Draft / Чернова'],['published','Published / Публикувано'],['completed','Completed / Приключено'],['cancelled','Cancelled / Отменено']].map(([s,l]) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={'w-2 h-2 rounded-full ' + (STATUS_DOT[s] || 'bg-gray-300')} />
            {l}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Calendar grid ── */}
        <div className="lg:col-span-2">
          <div className="card">
            {/* Nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <span className="text-base font-medium text-gray-900">
                {MONTH_NAMES[lang][month]} {year}
              </span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_NAMES[lang].map(d => (
                <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((d, i) => {
                if (!d) return <div key={'p'+i} />
                const key = dayKey(d)
                const evs = eventsByDay[key] || []
                const isToday = key === todayKey
                const isSelected = key === selected
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(isSelected ? null : key)}
                    className={
                      'relative flex flex-col items-center rounded-lg py-1.5 px-1 text-sm transition-colors ' +
                      (isSelected ? 'bg-brand-400 text-white' :
                       isToday ? 'bg-brand-50 text-brand-700 font-medium' :
                       'hover:bg-gray-50 text-gray-700')
                    }
                  >
                    <span>{d}</span>
                    {evs.length > 0 && (
                      <span className="mt-0.5 flex gap-0.5 flex-wrap justify-center">
                        {evs.slice(0, 3).map((ev, j) => (
                          <span key={j} className={'inline-block w-1.5 h-1.5 rounded-full ' + (isSelected ? 'bg-white' : (STATUS_DOT[ev.status] || 'bg-gray-400'))} />
                        ))}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Selected day panel */}
            {selected && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">
                  {new Date(selected + 'T12:00:00').toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {selectedEvs.length === 0 ? (
                  <p className="text-sm text-gray-400">{lang === 'bg' ? 'Няма събития за тази дата' : 'No events on this day'}</p>
                ) : (
                  selectedEvs.map(ev => (
                    <button key={ev.id} onClick={() => setDetail(ev)}
                      className="w-full text-left px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors mb-1.5 flex items-center gap-2">
                      <span className={'w-2 h-2 rounded-full shrink-0 ' + (STATUS_DOT[ev.status] || 'bg-gray-300')} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{ev.title}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(ev.event_date).toLocaleTimeString(lang === 'bg' ? 'bg-BG' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}
                          {ev.city ? ' · ' + ev.city : ''}
                          {' · ' + (ev.volunteers_enrolled || 0) + '/' + (ev.volunteers_needed || 0)}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-5">
          {/* Summary stats */}
          <div className="card grid grid-cols-2 gap-3 text-center">
            {[
              { label: lang === 'bg' ? 'Общо' : 'Total', val: events.length },
              { label: lang === 'bg' ? 'Предстоящи' : 'Upcoming', val: upcoming.length },
              { label: lang === 'bg' ? 'Публикувани' : 'Published', val: events.filter(e => e.status === 'published').length },
              { label: lang === 'bg' ? 'Приключени' : 'Completed', val: events.filter(e => e.status === 'completed').length },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-semibold text-gray-900">{s.val}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Upcoming */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              {lang === 'bg' ? 'Предстоящи' : 'Upcoming'}
            </p>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-400 card py-4 text-center">
                {lang === 'bg' ? 'Няма предстоящи' : 'None scheduled'}
              </p>
            ) : (
              upcoming.map(ev => (
                <button key={ev.id} onClick={() => setDetail(ev)}
                  className="w-full text-left card mb-2 hover:border-gray-200 hover:shadow-sm transition-all flex items-start gap-2">
                  <span className={'w-2 h-2 rounded-full shrink-0 mt-1.5 ' + (STATUS_DOT[ev.status] || 'bg-gray-300')} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{ev.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{ev.event_date ? fmtShort(ev.event_date) : ''}</p>
                    <p className="text-xs text-gray-400">{ev.volunteers_enrolled || 0} / {ev.volunteers_needed || 0} volunteers</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                {lang === 'bg' ? 'Минали' : 'Past'}
              </p>
              {past.map(ev => (
                <button key={ev.id} onClick={() => setDetail(ev)}
                  className="w-full text-left card mb-2 opacity-60 hover:opacity-80 transition-opacity">
                  <p className="text-sm text-gray-600 truncate">{ev.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ev.event_date ? fmtShort(ev.event_date) : ''}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Detail modal ── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative rounded-2xl shadow-xl w-full max-w-md p-6 z-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={'w-2 h-2 rounded-full ' + (STATUS_DOT[detail.status] || 'bg-gray-300')} />
                  <span className="text-xs text-gray-500 capitalize">{detail.status}</span>
                </div>
                <h2 className="text-lg font-medium text-gray-900">{detail.title}</h2>
                {detail.projects?.title && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {lang === 'bg' ? 'Проект' : 'Project'}: {detail.projects.title}
                  </p>
                )}
              </div>
              <button onClick={() => setDetail(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-sm mb-5">
              {detail.event_date && (
                <div className="flex gap-2">
                  <span className="text-gray-400 shrink-0">📅</span>
                  <span className="text-gray-700">{fmtDate(detail.event_date)}</span>
                </div>
              )}
              {detail.is_online ? (
                <div className="flex gap-2">
                  <span className="text-gray-400 shrink-0">💻</span>
                  <span className="text-gray-700">
                    {lang === 'bg' ? 'Онлайн' : 'Online'}
                    {detail.online_url && (
                      <> · <a href={detail.online_url} target="_blank" rel="noreferrer" className="text-brand-500 hover:underline">{detail.online_url}</a></>
                    )}
                  </span>
                </div>
              ) : detail.city && (
                <div className="flex gap-2">
                  <span className="text-gray-400 shrink-0">📍</span>
                  <span className="text-gray-700">{detail.city}{detail.address ? ', ' + detail.address : ''}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="text-gray-400 shrink-0">👥</span>
                <span className="text-gray-700">
                  {detail.volunteers_enrolled || 0} / {detail.volunteers_needed || 0} {lang === 'bg' ? 'доброволци' : 'volunteers'}
                </span>
              </div>
              {detail.show_in_public && (
                <div className="flex gap-2">
                  <span className="text-gray-400 shrink-0">🌐</span>
                  <span className="text-brand-600 text-sm">{lang === 'bg' ? 'Видимо публично' : 'Visible publicly'}</span>
                </div>
              )}
            </div>

            {/* Action links */}
            {detail.projects?.id && (
              <div className="flex gap-2">
                <Link
                  to={'/org/projects/' + detail.projects.id + '/events/' + detail.id + '/edit'}
                  onClick={() => setDetail(null)}
                  className="btn-secondary flex-1 text-center text-sm"
                >
                  {lang === 'bg' ? 'Редактирай' : 'Edit event'}
                </Link>
                <Link
                  to={'/org/projects/' + detail.projects.id + '/events'}
                  onClick={() => setDetail(null)}
                  className="btn-secondary flex-1 text-center text-sm"
                >
                  {lang === 'bg' ? 'Всички събития' : 'All events'}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
