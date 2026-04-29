import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from 'react-i18next'

const STATUS_BADGE = {
  draft:     'bg-gray-100 text-gray-600',
  published: 'bg-brand-50 text-brand-700 border border-brand-200',
  cancelled: 'bg-red-50 text-red-600 border border-red-200',
  completed: 'bg-green-50 text-green-700 border border-green-200',
}

const REG_STATUS_BADGE = {
  approved:  'bg-brand-50 text-brand-700 border border-brand-200',
  rejected:  'bg-red-50 text-red-600',
  confirmed: 'bg-green-50 text-green-700 border border-green-200',
}

export default function OrgProjectEvents() {
  const { projectId } = useParams()
  const { user } = useAuthStore()
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [project, setProject] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  // expandedId → null means collapsed, eventId means expanded
  const [expandedId, setExpandedId] = useState(null)
  const [confirm, setConfirm] = useState(null)
  // registrations cache: { [eventId]: [] }
  const [registrations, setRegistrations] = useState({})
  const [regLoading, setRegLoading] = useState(null)

  const flash = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => { load() }, [user?.id, projectId])

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data: p } = await supabase
      .from('projects')
      .select('id, title, status, organization_id')
      .eq('id', projectId)
      .single()
    if (!p) { setLoading(false); return }
    setProject(p)
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('project_id', projectId)
      .order('event_date', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  const loadRegistrations = async (eventId) => {
    if (registrations[eventId]) return // already cached
    setRegLoading(eventId)
    const { data } = await supabase
      .from('event_registrations')
      .select('id, status, registered_at, hours_logged, profiles!event_registrations_profile_id_fkey(id, full_name, email, avatar_url, city, phone)')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: true })
    setRegistrations(prev => ({ ...prev, [eventId]: data || [] }))
    setRegLoading(null)
  }

  const toggleExpand = async (eventId) => {
    if (expandedId === eventId) {
      setExpandedId(null)
    } else {
      setExpandedId(eventId)
      await loadRegistrations(eventId)
    }
  }

  const confirmAttendance = async (regId, eventId) => {
    setConfirm({ title: 'Confirm attendance?', confirmLabel: 'Confirm', variant: 'default',
      onConfirm: () => _doConfirmAttendance(regId, eventId) })
  }
  const _doConfirmAttendance = async (regId, eventId) => {
    const { error } = await supabase
      .from('event_registrations')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', regId)
    if (error) flash(error.message, 'error')
    else {
      flash('Attendance confirmed')
      // Refresh registrations cache for this event
      setRegistrations(prev => ({ ...prev, [eventId]: undefined }))
      await loadRegistrations(eventId)
    }
  }

  const rejectAttendance = async (regId, eventId) => {
    setConfirm({ title: 'Reject attendance?', confirmLabel: 'Reject', variant: 'danger',
      onConfirm: () => _doRejectAttendance(regId, eventId) })
  }
  const _doRejectAttendance = async (regId, eventId) => {
    const { error } = await supabase
      .from('event_registrations')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', regId)
    if (error) flash(error.message, 'error')
    else {
      flash('Attendance rejected')
      setRegistrations(prev => ({ ...prev, [eventId]: undefined }))
      await loadRegistrations(eventId)
    }
  }

  const togglePublic = async (ev) => {
    setConfirm({
      title: ev.show_in_public ? 'Hide event from public?' : 'Make event publicly visible?',
      message: ev.title,
      confirmLabel: ev.show_in_public ? 'Hide' : 'Make visible',
      variant: ev.show_in_public ? 'warning' : 'default',
      onConfirm: () => _doTogglePublic(ev),
    })
  }
  const _doTogglePublic = async (ev) => {
    const { error } = await supabase
      .from('events')
      .update({ show_in_public: !ev.show_in_public, updated_at: new Date().toISOString() })
      .eq('id', ev.id)
    if (!error) { flash('Updated'); await load() } else flash(error.message, 'error')
  }

  const setStatus = async (ev, status) => {
    const labels = {
      published: { title: 'Publish event?', confirm: 'Publish', variant: 'default' },
      completed: { title: 'Mark event as completed?', confirm: 'Complete', variant: 'warning' },
    }
    const l = labels[status] || { title: `Set status to ${status}?`, confirm: 'Confirm', variant: 'default' }
    setConfirm({ title: l.title, message: ev.title, confirmLabel: l.confirm, variant: l.variant,
      onConfirm: () => _doSetStatus(ev, status) })
  }
  const _doSetStatus = async (ev, status) => {
    const { error } = await supabase
      .from('events')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ev.id)
    if (!error) { flash('Status updated'); await load() } else flash(error.message, 'error')
  }

  const deleteEvent = async (ev) => {
    setConfirm({ title: 'Delete event?', message: ev.title, confirmLabel: 'Delete', variant: 'danger',
      onConfirm: () => _doDeleteEvent(ev) })
  }
  const _doDeleteEvent = async (ev) => {
    const { error } = await supabase.from('events').delete().eq('id', ev.id)
    if (!error) { flash('Event deleted'); await load() } else flash(error.message, 'error')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!project) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-gray-500">Project not found.</p>
    </div>
  )

  const canAddEvent = project.status === 'published'

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <ConfirmDialog config={confirm} onClose={() => setConfirm(null)} />
      {toast && (
        <div className={'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ' + (toast.type === 'error' ? 'bg-red-500' : 'bg-brand-400')}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/org/projects" className="text-xs text-gray-400 hover:text-gray-600 mb-1 block">← All projects</Link>
          <h1 className="text-xl font-medium text-gray-900">{lang==='bg'?'Събития':'Events'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{project.title}</p>
        </div>
        {canAddEvent
          ? <Link to={'/org/projects/' + projectId + '/events/new'} className="btn-primary">{lang==='bg'?'+ Ново събитие':'+ New event'}</Link>
          : <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Publish project first to add events</span>
        }
      </div>

      {events.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-sm mb-4">No events yet for this project.</p>
          {canAddEvent && <Link to={'/org/projects/' + projectId + '/events/new'} className="btn-primary">Add first event</Link>}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map(ev => {
            const isExpanded = expandedId === ev.id
            const regs = registrations[ev.id] || []
            const isLoadingRegs = regLoading === ev.id

            return (
              <div key={ev.id} className="card flex flex-col gap-0">
                {/* ── Event row ── */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-medium text-gray-900">{ev.title}</h3>
                      <span className={'badge text-xs px-2 py-0.5 capitalize ' + (STATUS_BADGE[ev.status] || 'bg-gray-100 text-gray-600')}>
                        {ev.status}
                      </span>
                      {ev.show_in_public && (ev.status === 'published' || ev.status === 'completed') && (
                        <span className="badge bg-green-50 text-green-700 border border-green-200 text-xs px-2 py-0.5">Public</span>
                      )}
                    </div>
                    {ev.city && (
                      <p className="text-xs text-gray-400">{ev.city}{ev.is_online ? ' · Online' : ''}</p>
                    )}
                    {ev.event_date && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(ev.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' '}
                        {new Date(ev.event_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ev.volunteers_lang==='bg'?'записани':'enrolled' || 0} / {ev.volunteers_needed || 0} volunteers
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0 flex-wrap items-center">
                    {/* Registrations toggle */}
                    <button
                      onClick={() => toggleExpand(ev.id)}
                      className={'text-xs border rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 transition-colors ' + (isExpanded ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      {ev.volunteers_lang==='bg'?'записани':'enrolled' || 0} registered
                    </button>

                    <Link to={'/org/projects/' + projectId + '/events/' + ev.id + '/edit'} className="btn-secondary text-xs py-1.5">{lang==='bg'?'Редактиране':'Edit'}</Link>

                    {ev.status === 'draft' && (
                      <button onClick={() => setStatus(ev, 'published')} className="btn-primary text-xs py-1.5">Publish</button>
                    )}
                    {(ev.status === 'published' || ev.status === 'completed') && (
                      <button
                        onClick={() => togglePublic(ev)}
                        className={'text-xs border rounded-lg px-2.5 py-1.5 ' + (ev.show_in_public ? 'border-green-200 text-green-700 hover:bg-green-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50')}
                      >
                        {ev.show_in_public ? 'Visible' : 'Hidden'}
                      </button>
                    )}
                    {ev.status === 'published' && (
                      <button onClick={() => setStatus(ev, 'completed')} className="text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg px-2.5 py-1.5">Complete</button>
                    )}
                    {ev.status === 'draft' && (
                      <button onClick={() => deleteEvent(ev)} className="text-xs border border-red-200 text-red-500 hover:bg-red-50 rounded-lg px-2.5 py-1.5">{lang==='bg'?'Изтриване':'Delete'}</button>
                    )}
                  </div>
                </div>

                {/* ── Registrations panel ── */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                      Registered volunteers
                    </p>

                    {isLoadingRegs ? (
                      <div className="flex items-center gap-2 py-4">
                        <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-400">Loading...</span>
                      </div>
                    ) : regs.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4 text-center">No volunteers registered yet.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {regs.map(reg => {
                          const p = reg.profiles
                          const initials = (p?.full_name || '?').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase()
                          return (
                            <div key={reg.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                              {/* Avatar */}
                              <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-sm font-medium text-brand-600 shrink-0 overflow-hidden">
                                {p?.avatar_url
                                  ? <img src={p.avatar_url} alt={p.full_name} className="w-full h-full object-cover" />
                                  : initials}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{p?.full_name || '—'}</p>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <p className="text-xs text-gray-400 truncate">{p?.email}</p>
                                  {p?.city && <p className="text-xs text-gray-400">📍 {p.city}</p>}
                                  {p?.phone && <p className="text-xs text-gray-400">📞 {p.phone}</p>}
                                </div>
                              </div>

                              {/* Registration meta */}
                              <div className="shrink-0 text-right">
                                <div className="flex flex-col items-end gap-1.5">
                                  <span className={'badge text-xs px-2 py-0.5 capitalize ' + (REG_STATUS_BADGE[reg.status] || 'bg-gray-100 text-gray-600')}>
                                    {{ approved: 'Registered', attended: 'Attended', confirmed: 'Confirmed', rejected: 'Rejected', pending: 'Registered' }[reg.status] || reg.status}
                                  </span>
                                  {reg.status === 'attended' && (
                                    <div className="flex flex-col items-end gap-1.5">
                                      {/* Hours logged — shown prominently so admin sees before confirming */}
                                      <div className={'text-xs px-2.5 py-1 rounded-lg font-medium ' + (reg.hours_logged > 0 ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-gray-100 text-gray-500')}>
                                        ⏱ {reg.hours_logged > 0 ? `${reg.hours_logged}h logged` : 'No hours logged'}
                                      </div>
                                      <div className="flex gap-1.5">
                                        <button
                                          onClick={() => confirmAttendance(reg.id, ev.id)}
                                          className="text-xs bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 rounded-lg px-2 py-1 transition-colors"
                                        >
                                          Confirm
                                        </button>
                                        <button
                                          onClick={() => rejectAttendance(reg.id, ev.id)}
                                          className="text-xs bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-lg px-2 py-1 transition-colors"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                  {reg.status === 'confirmed' && reg.hours_logged > 0 && (
                                    <p className="text-xs text-brand-600">⏱ {reg.hours_logged}h</p>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(reg.registered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
