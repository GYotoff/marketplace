import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const EDGE_FN = 'https://yxqqxjyuqjoraxjjwcdp.supabase.co/functions/v1/event-registration-notify'

export default function EventPage() {
  const { id } = useParams()
  const { i18n } = useTranslation()
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'

  const [event, setEvent] = useState(null)
  const [registration, setRegistration] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [unregistering, setUnregistering] = useState(false)
  const [acting, setActing] = useState(null)
  const [hoursInput, setHoursInput] = useState('')
  const [showHoursForm, setShowHoursForm] = useState(false)
  const [feedback, setFeedback] = useState(null)       // existing feedback row
  const [fbRating, setFbRating] = useState(0)
  const [fbText, setFbText] = useState('')
  const [fbSaving, setFbSaving] = useState(false)
  const [showFbForm, setShowFbForm] = useState(false)
  const [toast, setToast] = useState(null)

  const flash = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  useEffect(() => { load() }, [id, user])

  const load = async () => {
    setLoading(true)

    // Use RPC to bypass RLS — returns event if public, registered, or org admin
    const { data: rows, error } = await supabase
      .rpc('get_event_for_viewer', { p_event_id: id })
    const ev = rows?.[0]
    if (error || !ev) { setNotFound(true); setLoading(false); return }

    // Fetch related org + project data
    const [{ data: org }, { data: project }] = await Promise.all([
      supabase.from('organizations').select('id, name, slug, logo_url').eq('id', ev.organization_id).single(),
      ev.project_id
        ? supabase.from('projects').select('id, title').eq('id', ev.project_id).single()
        : Promise.resolve({ data: null }),
    ])
    setEvent({ ...ev, organizations: org, projects: project })

    if (user) {
      const { data: reg } = await supabase
        .from('event_registrations')
        .select('id, status, registered_at')
        .eq('event_id', id)
        .eq('profile_id', user.id)
        .maybeSingle()
      setRegistration(reg)

      if (reg?.id) {
        const { data: fb } = await supabase
          .from('event_feedback')
          .select('id, rating, feedback_text')
          .eq('registration_id', reg.id)
          .maybeSingle()
        if (fb) { setFeedback(fb); setFbRating(fb.rating); setFbText(fb.feedback_text || '') }
      }
    }
    setLoading(false)
  }

  const register = async () => {
    if (!user) { navigate('/register'); return }
    setRegistering(true)
    const { error } = await supabase.from('event_registrations').insert({
      event_id: id, profile_id: user.id, status: 'approved',
    })
    if (error) { flash(error.message, 'error'); setRegistering(false); return }
    try {
      await fetch(EDGE_FN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'register', event_id: id, volunteer_id: user.id }),
      })
    } catch (e) { console.error('notify error', e) }
    flash(lang === 'bg' ? 'Регистрирахте се успешно!' : 'Successfully registered!')
    load()
    setRegistering(false)
  }

  const unregister = async () => {
    const title = event?.title || 'this event'
    const confirmed = window.confirm(
      lang === 'bg'
        ? `Сигурни ли сте, че искате да се отпишете от "${title}"?`
        : `Cancel your registration for "${title}"?`
    )
    if (!confirmed) return
    setUnregistering(true)
    const { error } = await supabase.from('event_registrations').delete().eq('id', registration.id)
    if (error) { flash(error.message, 'error'); setUnregistering(false); return }
    try {
      await fetch(EDGE_FN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'unregister', event_id: id, volunteer_id: user.id }),
      })
    } catch (e) { console.error('notify error', e) }
    flash(lang === 'bg' ? 'Отписахте се от събитието' : 'Registration cancelled')
    load()
    setUnregistering(false)
  }

  const markAttended = async () => {
    setActing('attend')
    const hours = hoursInput ? parseFloat(hoursInput) : 0
    const { error } = await supabase
      .from('event_registrations')
      .update({ status: 'attended', hours_logged: hours, updated_at: new Date().toISOString() })
      .eq('id', registration.id)
    if (error) flash(error.message, 'error')
    else { flash(lang === 'bg' ? 'Отбелязахте участие!' : 'Attendance marked!'); setShowHoursForm(false) }
    await load()
    setActing(null)
  }

  const saveFeedback = async () => {
    if (!registration?.id) return
    setFbSaving(true)
    const payload = {
      event_id: id,
      profile_id: user.id,
      registration_id: registration.id,
      rating: fbRating,
      feedback_text: fbText.trim() || null,
      updated_at: new Date().toISOString(),
    }
    const { error } = feedback?.id
      ? await supabase.from('event_feedback').update(payload).eq('id', feedback.id)
      : await supabase.from('event_feedback').insert(payload)
    if (error) flash(error.message, 'error')
    else { flash(lang === 'bg' ? 'Благодарим за обратната връзка!' : 'Thank you for your feedback!'); setShowFbForm(false); load() }
    setFbSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-4xl mb-4">📅</p>
      <h1 className="text-xl font-medium text-gray-900 mb-2">{lang === 'bg' ? 'Събитието не е намерено' : 'Event not found'}</h1>
      <p className="text-gray-500 text-sm mb-6">{lang === 'bg' ? 'Това събитие не съществува или не е публично.' : "This event doesn't exist or isn't publicly visible."}</p>
      <Link to="/events" className="btn-primary">{lang === 'bg' ? 'Разгледай събития' : 'Browse events'}</Link>
    </div>
  )

  const title = (lang === 'bg' && event.title_bg) ? event.title_bg : event.title
  const desc  = (lang === 'bg' && event.description_bg) ? event.description_bg : event.description
  const spotsLeft = Math.max(0, (event.volunteers_needed || 0) - (event.volunteers_enrolled || 0))
  const isFull = event.volunteers_needed > 0 && spotsLeft === 0
  const isFuture = event.event_date && new Date(event.event_date) > new Date()

  const eventDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null

  const endDate = event.end_date
    ? new Date(event.end_date).toLocaleTimeString(lang === 'bg' ? 'bg-BG' : 'en-GB', { hour: '2-digit', minute: '2-digit' })
    : null

  const STATUS_CONFIG = {
    approved:  { label: "You're registered",         labelBg: 'Регистриран',              badge: 'bg-brand-50 text-brand-700 border border-brand-200' },
    attended:  { label: 'Awaiting confirmation',      labelBg: 'Изчаква потвърждение',      badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
    confirmed: { label: 'Attendance confirmed',       labelBg: 'Участието е потвърдено',    badge: 'bg-green-50 text-green-700 border border-green-200' },
    rejected:  { label: 'Attendance not confirmed',   labelBg: 'Участието не е потвърдено', badge: 'bg-red-50 text-red-600 border border-red-200' },
  }

  const RegisterBtn = () => {
    if (!user) return (
      <Link to="/register" className="btn-primary w-full text-center">
        {lang === 'bg' ? 'Регистрирай се за участие' : 'Sign up to register'}
      </Link>
    )
    if (profile?.role !== 'volunteer') return null

    // Registered — show status + context-appropriate actions
    if (registration) {
      const cfg = STATUS_CONFIG[registration.status]
      const label = lang === 'bg' ? (cfg?.labelBg || registration.status) : (cfg?.label || registration.status)
      return (
        <div className="flex flex-col gap-2">
          {/* Status badge */}
          <span className={'block text-center text-sm font-medium rounded-xl py-2.5 px-4 ' + (cfg?.badge || 'bg-gray-100 text-gray-600')}>
            {(registration.status === 'approved' || registration.status === 'confirmed') ? '✓ ' : ''}
            {label}
          </span>

          {/* Past event, approved → hours form + mark attended */}
          {!isFuture && registration.status === 'approved' && (
            !showHoursForm ? (
              <button
                onClick={() => setShowHoursForm(true)}
                className="w-full flex items-center justify-center gap-2 text-sm border border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl py-2.5 transition-colors"
              >
                ✓ {lang === 'bg' ? 'Потвърди участие' : 'I attended this event'}
              </button>
            ) : (
              <div className="flex flex-col gap-2 bg-brand-50 border border-brand-200 rounded-xl p-3">
                <p className="text-xs font-medium text-brand-700">{lang === 'bg' ? 'Колко часа участвахте?' : 'How many hours did you volunteer?'}</p>
                <div className="flex gap-2">
                  <input
                    type="number" min="0" max="24" step="0.5"
                    className="input flex-1 py-1.5 text-sm"
                    placeholder={lang === 'bg' ? 'напр. 3' : 'e.g. 3'}
                    value={hoursInput}
                    onChange={e => setHoursInput(e.target.value)}
                  />
                  <button
                    onClick={markAttended}
                    disabled={acting === 'attend'}
                    className="btn-primary text-sm px-4 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {acting === 'attend' && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {lang === 'bg' ? 'Потвърди' : 'Confirm'}
                  </button>
                  <button onClick={() => setShowHoursForm(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2">✕</button>
                </div>
                <p className="text-xs text-brand-600">{lang === 'bg' ? 'Часовете ще бъдат потвърдени от организатора.' : 'Hours will be confirmed by the organizer.'}</p>
              </div>
            )
          )}

          {/* Past event, attended → awaiting org confirmation */}
          {!isFuture && registration.status === 'attended' && (
            <p className="text-xs text-center text-amber-600 bg-amber-50 border border-amber-200 rounded-xl py-2.5 px-4">
              ⏳ {lang === 'bg' ? 'Изчаква потвърждение от организатора' : 'Awaiting confirmation from organizer'}
            </p>
          )}

          {/* Confirmed → feedback + share */}
          {registration.status === 'confirmed' && (() => {
            const eventUrl = window.location.href
            const shareText = lang === 'bg'
              ? `Участвах в "${event.title}" — доброволчество с GiveForward!`
              : `I volunteered at "${event.title}" with GiveForward!`
            const shareLinks = [
              { name: 'Facebook', icon: '📘', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}` },
              { name: 'LinkedIn', icon: '💼', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}` },
              { name: 'X', icon: '✖', url: `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(eventUrl)}` },
            ]
            const StarRow = () => (
              <div className="flex gap-1 justify-center">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setFbRating(n)}
                    className={'text-2xl transition-transform hover:scale-110 ' + (n <= fbRating ? 'text-amber-400' : 'text-gray-200')}>
                    ★
                  </button>
                ))}
              </div>
            )
            return (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-center text-green-700 bg-green-50 border border-green-200 rounded-xl py-2 px-4">
                  ✓ {lang === 'bg' ? 'Участието ви е потвърдено' : 'Your attendance has been confirmed'}
                  {registration.hours_logged > 0 && <span className="ml-1 text-brand-600">· ⏱ {registration.hours_logged}h</span>}
                </p>

                {/* Feedback */}
                {!showFbForm && !feedback?.id && (
                  <button onClick={() => setShowFbForm(true)}
                    className="w-full text-sm border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl py-2.5 transition-colors">
                    ⭐ {lang === 'bg' ? 'Дайте обратна връзка' : 'Leave feedback'}
                  </button>
                )}
                {feedback?.id && !showFbForm && (
                  <div className="text-center">
                    <div className="flex gap-0.5 justify-center mb-0.5">
                      {[1,2,3,4,5].map(n => (
                        <span key={n} className={'text-lg ' + (n <= feedback.rating ? 'text-amber-400' : 'text-gray-200')}>★</span>
                      ))}
                    </div>
                    {feedback.feedback_text && <p className="text-xs text-gray-500 italic">"{feedback.feedback_text}"</p>}
                    <button onClick={() => setShowFbForm(true)} className="text-xs text-brand-500 hover:underline mt-1">
                      {lang === 'bg' ? 'Редактирай' : 'Edit feedback'}
                    </button>
                  </div>
                )}
                {showFbForm && (
                  <div className="flex flex-col gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs font-medium text-amber-800">{lang === 'bg' ? 'Вашата оценка' : 'Your rating'}</p>
                    <StarRow />
                    <textarea
                      rows={3} className="input resize-none text-sm"
                      placeholder={lang === 'bg' ? 'Споделете преживяването си...' : 'Share your experience...'}
                      value={fbText} onChange={e => setFbText(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={saveFeedback} disabled={fbSaving || fbRating === 0}
                        className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5 disabled:opacity-50">
                        {fbSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {lang === 'bg' ? 'Изпрати' : 'Submit'}
                      </button>
                      <button onClick={() => setShowFbForm(false)} className="btn-secondary text-sm px-3">✕</button>
                    </div>
                    {fbRating === 0 && <p className="text-xs text-amber-600">{lang === 'bg' ? 'Моля изберете оценка.' : 'Please select a rating.'}</p>}
                  </div>
                )}

                {/* Share */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-center text-gray-400">{lang === 'bg' ? 'Сподели преживяването' : 'Share your experience'}</p>
                  <div className="flex gap-2 justify-center">
                    {shareLinks.map(s => (
                      <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg px-3 py-1.5 transition-colors">
                        {s.icon} {s.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Rejected */}
          {registration.status === 'rejected' && (
            <p className="text-xs text-center text-red-600 bg-red-50 border border-red-200 rounded-xl py-2 px-4">
              {lang === 'bg' ? 'Участието не беше потвърдено' : 'Attendance was not confirmed'}
            </p>
          )}

          {/* Cancel — only for future events with approved status */}
          {isFuture && registration.status === 'approved' && (
            <button onClick={unregister} disabled={unregistering} className="text-xs text-center text-red-500 hover:text-red-700 mt-1">
              {unregistering ? '...' : (lang === 'bg' ? 'Отпиши се' : 'Cancel registration')}
            </button>
          )}
        </div>
      )
    }

    // Not registered
    if (!isFuture || event.status === 'completed') return (
      <span className="block text-center text-sm text-gray-400 py-2">
        {lang === 'bg' ? 'Събитието е приключило' : 'This event has passed'}
      </span>
    )
    if (isFull) return (
      <span className="block text-center text-sm text-gray-500 bg-gray-100 rounded-xl py-2.5 px-4">
        {lang === 'bg' ? 'Събитието е пълно' : 'Event is full'}
      </span>
    )
    return (
      <button onClick={register} disabled={registering} className="btn-primary w-full flex items-center justify-center gap-2">
        {registering && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {registering ? '...' : (lang === 'bg' ? 'Регистрирай се' : 'Register for this event')}
      </button>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {toast && (
        <div className={'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ' + (toast.type === 'error' ? 'bg-red-500' : 'bg-brand-400')}>
          {toast.msg}
        </div>
      )}

      <Link to="/events" className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">
        ← {lang === 'bg' ? 'Всички събития' : 'All events'}
      </Link>

      {event.cover_url && (
        <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden mb-6 bg-gray-100">
          <img src={event.cover_url} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {event.is_online && <span className="badge bg-blue-50 text-blue-700 text-xs px-2 py-0.5">{lang === 'bg' ? 'Онлайн' : 'Online'}</span>}
              <span className="badge bg-brand-50 text-brand-700 border border-brand-200 text-xs px-2 py-0.5 capitalize">{event.status}</span>
            </div>
            <h1 className="text-2xl font-medium text-gray-900 mb-2">{title}</h1>
            {event.organizations && (
              <Link to={'/organizations/' + event.organizations.slug} className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600 mb-4">
                {event.organizations.logo_url && <img src={event.organizations.logo_url} alt="" className="w-5 h-5 rounded object-cover" />}
                {event.organizations.name}
              </Link>
            )}
            {event.projects && (
              <Link to={'/projects/' + event.projects.id} className="text-xs text-gray-400 hover:text-gray-600 mb-4 block">
                📋 {lang === 'bg' ? 'Проект' : 'Project'}: {event.projects.title}
              </Link>
            )}
            {desc && <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{desc}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card flex flex-col gap-4">
            {event.volunteers_needed > 0 && (
              <div className="text-center py-2">
                <p className="text-3xl font-semibold text-brand-400">{spotsLeft}</p>
                <p className="text-xs text-gray-400 mt-0.5">{lang === 'bg' ? 'свободни места' : 'spots remaining'}</p>
              </div>
            )}
            <RegisterBtn />
          </div>

          <div className="card flex flex-col gap-3">
            <h2 className="text-sm font-medium text-gray-700">{lang === 'bg' ? 'Детайли' : 'Details'}</h2>
            {eventDate && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span>{eventDate}{endDate ? ` – ${endDate}` : ''}</span>
              </div>
            )}
            {event.is_online ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                {event.online_url
                  ? <a href={event.online_url} target="_blank" rel="noreferrer" className="text-brand-500 hover:underline truncate">{event.online_url}</a>
                  : <span>{lang === 'bg' ? 'Онлайн' : 'Online'}</span>}
              </div>
            ) : event.city && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {event.city}{event.address ? ', ' + event.address : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
