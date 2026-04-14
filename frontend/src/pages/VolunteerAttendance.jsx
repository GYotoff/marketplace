import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const STATUS_CONFIG = {
  approved:  { label: 'Registered',  labelBg: 'Регистриран',  badge: 'bg-brand-50 text-brand-700 border border-brand-200' },
  attended:  { label: 'Attended',    labelBg: 'Присъствал',   badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
  confirmed: { label: 'Confirmed',   labelBg: 'Потвърден',    badge: 'bg-green-50 text-green-700 border border-green-200' },
  rejected:  { label: 'Not confirmed', labelBg: 'Непотвърден', badge: 'bg-red-50 text-red-600 border border-red-200' },
  pending:   { label: 'Pending',     labelBg: 'Изчакващ',     badge: 'bg-gray-100 text-gray-600' },
  completed: { label: 'Completed',   labelBg: 'Завършен',     badge: 'bg-green-50 text-green-700' },
}

export default function VolunteerAttendance() {
  const { user } = useAuthStore()
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const now = new Date()

  const [regs, setRegs] = useState([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(null)
  const [toast, setToast] = useState(null)

  const flash = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  useEffect(() => { if (user) load() }, [user])

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('event_registrations')
      .select('id, status, registered_at, updated_at, events(id, title, title_bg, event_date, end_date, city, address, is_online, organizations(name, slug), projects(id, title))')
      .eq('profile_id', user.id)
      .order('registered_at', { ascending: false })
    if (error) console.error(error)
    setRegs(data || [])
    setLoading(false)
  }

  const markAttended = async (regId) => {
    setMarking(regId)
    const { error } = await supabase
      .from('event_registrations')
      .update({ status: 'attended', updated_at: new Date().toISOString() })
      .eq('id', regId)
    if (error) flash(error.message, 'error')
    else flash(lang === 'bg' ? 'Отбелязахте участие!' : 'Attendance marked!')
    await load()
    setMarking(null)
  }

  const fmtDate = (ts) => new Date(ts).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  // Split into upcoming vs past
  const past     = regs.filter(r => r.events?.event_date && new Date(r.events.event_date) < now)
  const upcoming = regs.filter(r => r.events?.event_date && new Date(r.events.event_date) >= now)

  const L = {
    title:    lang === 'bg' ? 'Участие в събития' : 'Event Participation',
    subtitle: lang === 'bg' ? 'Минали събития, в които сте участвали или сте регистрирани.' : 'Past events you registered or attended.',
    past:     lang === 'bg' ? 'Минали' : 'Past events',
    upcoming: lang === 'bg' ? 'Предстоящи' : 'Upcoming',
    mark:     lang === 'bg' ? 'Потвърди участие' : 'I attended this event',
    marking:  lang === 'bg' ? 'Изпращане...' : 'Submitting...',
    noRegs:   lang === 'bg' ? 'Нямате регистрации за минали събития.' : 'No past event registrations yet.',
    browse:   lang === 'bg' ? 'Разгледай събития' : 'Browse events',
    org:      lang === 'bg' ? 'Организация' : 'Organization',
    project:  lang === 'bg' ? 'Проект' : 'Project',
    pending_confirm: lang === 'bg' ? 'Изчаква потвърждение от организатора' : 'Awaiting confirmation from the organizer',
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {toast && (
        <div className={'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ' + (toast.type === 'error' ? 'bg-red-500' : 'bg-brand-400')}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">{L.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{L.subtitle}</p>
        </div>
        <Link to="/dashboard/calendar" className="btn-secondary text-sm">
          ← {lang === 'bg' ? 'Календар' : 'Calendar'}
        </Link>
      </div>

      {/* ── Past events ── */}
      <div className="mb-8">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{L.past}</p>
        {past.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-gray-400 text-sm mb-4">{L.noRegs}</p>
            <Link to="/events" className="btn-primary">{L.browse}</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {past.map(reg => {
              const ev = reg.events
              const title = (lang === 'bg' && ev?.title_bg) ? ev.title_bg : ev?.title
              const cfg = STATUS_CONFIG[reg.status] || STATUS_CONFIG.approved
              const statusLabel = lang === 'bg' ? cfg.labelBg : cfg.label
              const canMarkAttended = reg.status === 'approved'
              const isAttended = reg.status === 'attended'

              return (
                <div key={reg.id} className={'card flex flex-col gap-3 ' + (reg.status === 'confirmed' ? 'border-green-200 bg-green-50/30' : reg.status === 'rejected' ? 'border-red-100 bg-red-50/20' : '')}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link to={'/events/' + ev?.id} className="font-medium text-gray-900 hover:text-brand-600 hover:underline">
                          {title}
                        </Link>
                        <span className={'badge text-xs px-2 py-0.5 ' + cfg.badge}>{statusLabel}</span>
                      </div>
                      {ev?.event_date && <p className="text-xs text-gray-400">{fmtDate(ev.event_date)}</p>}
                      {ev?.organizations && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {L.org}: <Link to={'/organizations/' + ev.organizations.slug} className="text-brand-500 hover:underline">{ev.organizations.name}</Link>
                        </p>
                      )}
                      {ev?.projects && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {L.project}: {ev.projects.title}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action / status messages */}
                  {canMarkAttended && (
                    <button
                      onClick={() => markAttended(reg.id)}
                      disabled={marking === reg.id}
                      className="w-full flex items-center justify-center gap-2 text-sm border border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl py-2.5 transition-colors disabled:opacity-50"
                    >
                      {marking === reg.id && <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />}
                      {marking === reg.id ? L.marking : '✓ ' + L.mark}
                    </button>
                  )}
                  {isAttended && (
                    <p className="text-xs text-center text-amber-600 bg-amber-50 border border-amber-200 rounded-xl py-2.5 px-4">
                      ⏳ {L.pending_confirm}
                    </p>
                  )}
                  {reg.status === 'confirmed' && (
                    <p className="text-xs text-center text-green-700 bg-green-50 border border-green-200 rounded-xl py-2.5 px-4">
                      ✓ {lang === 'bg' ? 'Участието ви е потвърдено от организатора' : 'Your attendance has been confirmed by the organizer'}
                    </p>
                  )}
                  {reg.status === 'rejected' && (
                    <p className="text-xs text-center text-red-600 bg-red-50 border border-red-200 rounded-xl py-2.5 px-4">
                      ✗ {lang === 'bg' ? 'Участието не беше потвърдено' : 'Your attendance was not confirmed'}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Upcoming (read-only summary) ── */}
      {upcoming.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{L.upcoming}</p>
          <div className="flex flex-col gap-3">
            {upcoming.map(reg => {
              const ev = reg.events
              const title = (lang === 'bg' && ev?.title_bg) ? ev.title_bg : ev?.title
              const cfg = STATUS_CONFIG[reg.status] || STATUS_CONFIG.approved
              return (
                <div key={reg.id} className="card flex items-center gap-3 opacity-75">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{title}</p>
                    {ev?.event_date && <p className="text-xs text-gray-400">{fmtDate(ev.event_date)}</p>}
                  </div>
                  <span className={'badge text-xs px-2 py-0.5 ' + cfg.badge}>
                    {lang === 'bg' ? cfg.labelBg : cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
