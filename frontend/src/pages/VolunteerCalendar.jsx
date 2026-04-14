import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const EDGE_FN = 'https://yxqqxjyuqjoraxjjwcdp.supabase.co/functions/v1/event-registration-notify'

const MONTH_NAMES = {
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  bg: ['Януари','Февруари','Март','Април','Май','Юни','Юли','Август','Септември','Октомври','Ноември','Декември'],
}
const DAY_NAMES = {
  en: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  bg: ['Пон','Вт','Ср','Чет','Пет','Съб','Нед'],
}

export default function VolunteerCalendar() {
  const { user } = useAuthStore()
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-based
  const [registrations, setRegistrations] = useState([])
  const [selected, setSelected] = useState(null) // selected day date string YYYY-MM-DD
  const [detail, setDetail] = useState(null) // event clicked for full details
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(null)
  const [toast, setToast] = useState(null)

  const flash = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  useEffect(() => { if (user) load() }, [user])

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('event_registrations')
      .select('id, status, registered_at, events(id, title, title_bg, description, description_bg, event_date, end_date, city, address, is_online, online_url, volunteers_needed, volunteers_enrolled, organizations(name, slug), projects(title))')
      .eq('profile_id', user.id)
      .order('registered_at', { ascending: false })
    if (error) console.error(error)
    setRegistrations(data || [])
    setLoading(false)
  }

  const unregister = async (reg) => {
    const eventTitle = reg.events?.title || 'this event'
    const confirmed = window.confirm(
      lang === 'bg'
        ? `Сигурни ли сте, че искате да се отпишете от "${eventTitle}"? Регистрацията ви ще бъде изтрита.`
        : `Are you sure you want to cancel your registration for "${eventTitle}"? This will remove it from your calendar.`
    )
    if (!confirmed) return

    setRemoving(reg.id)
    const { error } = await supabase.from('event_registrations').delete().eq('id', reg.id)
    if (error) { flash(error.message, 'error'); setRemoving(null); return }

    // Send notification emails
    try {
      await fetch(EDGE_FN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'unregister', event_id: reg.events.id, volunteer_id: user.id }),
      })
    } catch (e) { console.error('notify error', e) }

    flash(lang === 'bg' ? 'Отписахте се от събитието' : 'Registration cancelled')
    setDetail(null)
    setRemoving(null)
    load()
  }

  // ── Calendar logic ────────────────────────────────────────────────────────

  const eventsByDay = {}
  registrations.forEach(reg => {
    if (!reg.events?.event_date) return
    const d = new Date(reg.events.event_date)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    if (!eventsByDay[key]) eventsByDay[key] = []
    eventsByDay[key].push(reg)
  })

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  // Monday-based: 0=Mon ... 6=Sun
  let startDow = firstDay.getDay() - 1; if (startDow < 0) startDow = 6
  const daysInMonth = lastDay.getDate()
  const cells = [] // null = empty padding
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const dayKey = (d) => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1); setSelected(null) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1) } else setMonth(m => m+1); setSelected(null) }

  const upcomingRegs = registrations
    .filter(r => r.events?.event_date && new Date(r.events.event_date) >= today)
    .sort((a, b) => new Date(a.events.event_date) - new Date(b.events.event_date))

  const pastRegs = registrations
    .filter(r => r.events?.event_date && new Date(r.events.event_date) < today)
    .sort((a, b) => new Date(b.events.event_date) - new Date(a.events.event_date))

  const selectedRegs = selected ? (eventsByDay[selected] || []) : []

  const fmtDate = (ts, opts = {}) => new Date(ts).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', ...opts })
  const fmtShort = (ts) => new Date(ts).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const L = {
    title: lang === 'bg' ? 'Моят календар' : 'My Calendar',
    upcoming: lang === 'bg' ? 'Предстоящи' : 'Upcoming',
    past: lang === 'bg' ? 'Минали' : 'Past',
    noUpcoming: lang === 'bg' ? 'Няма предстоящи събития.' : 'No upcoming events.',
    noPast: lang === 'bg' ? 'Няма минали събития.' : 'No past events.',
    cancel: lang === 'bg' ? 'Отпиши се' : 'Cancel registration',
    cancelling: lang === 'bg' ? 'Изтриване...' : 'Cancelling...',
    online: lang === 'bg' ? 'Онлайн' : 'Online',
    project: lang === 'bg' ? 'Проект' : 'Project',
    org: lang === 'bg' ? 'Организация' : 'Organization',
    registered: lang === 'bg' ? 'Регистриран' : 'Registered',
    close: lang === 'bg' ? 'Затвори' : 'Close',
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {toast && (
        <div className={'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ' + (toast.type === 'error' ? 'bg-red-500' : 'bg-brand-400')}>
          {toast.msg}
        </div>
      )}

      <h1 className="text-xl font-medium text-gray-900 mb-6">{L.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Calendar grid ── */}
        <div className="lg:col-span-2">
          <div className="card">
            {/* Nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              </button>
              <span className="text-base font-medium text-gray-900">
                {MONTH_NAMES[lang][month]} {year}
              </span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_NAMES[lang].map(d => (
                <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((d, i) => {
                if (!d) return <div key={'pad-' + i} />
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
                      <span className={'mt-0.5 flex gap-0.5 flex-wrap justify-center'}>
                        {evs.slice(0, 3).map((_, j) => (
                          <span key={j} className={'inline-block w-1.5 h-1.5 rounded-full ' + (isSelected ? 'bg-white' : 'bg-brand-400')} />
                        ))}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Selected day events */}
            {selected && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">
                  {new Date(selected + 'T12:00:00').toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {selectedRegs.length === 0
                  ? <p className="text-sm text-gray-400">{lang === 'bg' ? 'Няма събития за тази дата' : 'No events on this day'}</p>
                  : selectedRegs.map(reg => (
                    <button key={reg.id} onClick={() => setDetail(reg)}
                      className="w-full text-left px-3 py-2.5 rounded-lg bg-brand-50 hover:bg-brand-100 transition-colors mb-1.5">
                      <p className="text-sm font-medium text-brand-800">{reg.events?.title}</p>
                      {reg.events?.event_date && (
                        <p className="text-xs text-brand-600 mt-0.5">
                          {new Date(reg.events.event_date).toLocaleTimeString(lang === 'bg' ? 'bg-BG' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}
                          {reg.events.city ? ' · ' + reg.events.city : ''}
                        </p>
                      )}
                    </button>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar: upcoming + past ── */}
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{L.upcoming}</p>
            {upcomingRegs.length === 0
              ? <p className="text-sm text-gray-400 card py-4 text-center">{L.noUpcoming}</p>
              : upcomingRegs.map(reg => (
                <button key={reg.id} onClick={() => setDetail(reg)}
                  className="w-full text-left card mb-2 hover:border-brand-200 hover:shadow-sm transition-all">
                  <p className="text-sm font-medium text-gray-900 truncate">{reg.events?.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{reg.events?.event_date ? fmtShort(reg.events.event_date) : ''}</p>
                  {reg.events?.organizations?.name && (
                    <p className="text-xs text-brand-500 mt-0.5 truncate">{reg.events.organizations.name}</p>
                  )}
                </button>
              ))
            }
          </div>
          {pastRegs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{L.past}</p>
              {pastRegs.slice(0, 5).map(reg => (
                <div key={reg.id} className="card mb-2 opacity-60">
                  <p className="text-sm text-gray-600 truncate">{reg.events?.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{reg.events?.event_date ? fmtShort(reg.events.event_date) : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Event detail modal ── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900 pr-4">{detail.events?.title}</h2>
                {detail.events?.projects?.title && (
                  <p className="text-xs text-gray-400 mt-0.5">{L.project}: {detail.events.projects.title}</p>
                )}
              </div>
              <button onClick={() => setDetail(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex flex-col gap-3 text-sm mb-5">
              {detail.events?.event_date && (
                <div className="flex gap-2">
                  <span className="text-gray-400 shrink-0">📅</span>
                  <span className="text-gray-700">{fmtDate(detail.events.event_date)}</span>
                </div>
              )}
              {detail.events?.is_online ? (
                <div className="flex gap-2">
                  <span className="text-gray-400 shrink-0">💻</span>
                  <span className="text-gray-700">
                    {L.online}
                    {detail.events.online_url && (
                      <> · <a href={detail.events.online_url} target="_blank" rel="noreferrer" className="text-brand-500 hover:underline">{detail.events.online_url}</a></>
                    )}
                  </span>
                </div>
              ) : detail.events?.city && (
                <div className="flex gap-2">
                  <span className="text-gray-400 shrink-0">📍</span>
                  <span className="text-gray-700">{detail.events.city}{detail.events.address ? ', ' + detail.events.address : ''}</span>
                </div>
              )}
              {detail.events?.organizations && (
                <div className="flex gap-2">
                  <span className="text-gray-400 shrink-0">🏢</span>
                  <Link to={'/organizations/' + detail.events.organizations.slug} onClick={() => setDetail(null)} className="text-brand-500 hover:underline">
                    {detail.events.organizations.name}
                  </Link>
                </div>
              )}
              {detail.events?.description && (
                <p className="text-gray-600 leading-relaxed">{detail.events.description}</p>
              )}
            </div>

            {/* Only allow cancellation for future events */}
            {detail.events?.event_date && new Date(detail.events.event_date) > today && (
              <button
                onClick={() => unregister(detail)}
                disabled={removing === detail.id}
                className="w-full text-sm border border-red-200 text-red-600 hover:bg-red-50 rounded-xl py-2.5 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {removing === detail.id && <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />}
                {removing === detail.id ? L.cancelling : L.cancel}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
