import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const EDGE_FN = 'https://yxqqxjyuqjoraxjjwcdp.supabase.co/functions/v1/event-registration-notify'

export default function ProjectPage() {
  const { id } = useParams()
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()

  const [project, setProject]       = useState(null)
  const [org, setOrg]               = useState(null)
  const [events, setEvents]         = useState([])
  const [application, setApplication] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [notFound, setNotFound]     = useState(false)
  const [applying, setApplying]     = useState(false)
  const [toast, setToast]           = useState(null)

  const flash = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => { load() }, [id, user])

  const load = async () => {
    setLoading(true)
    const { data: p, error } = await supabase
      .from('projects')
      .select('*, organizations(id, name, slug, logo_url, city), categories(name, name_bg, color)')
      .eq('id', id)
      .single()
    if (error || !p) { setNotFound(true); setLoading(false); return }
    setProject(p)
    setOrg(p.organizations)

    const { data: evs } = await supabase
      .from('events')
      .select('*')
      .eq('project_id', id)
      .eq('status', 'published')
      .eq('show_in_public', true)
      .order('event_date', { ascending: true })
    setEvents(evs || [])

    if (user) {
      const { data: app } = await supabase
        .from('project_applications')
        .select('id, status')
        .eq('project_id', id)
        .eq('profile_id', user.id)
        .maybeSingle()
      setApplication(app)
    }
    setLoading(false)
  }

  const apply = async () => {
    if (!user) { navigate('/register'); return }
    setApplying(true)
    const { error } = await supabase.from('project_applications').insert({
      project_id: id, profile_id: user.id, status: 'pending',
    })
    if (error) { flash(error.message, 'error'); setApplying(false); return }
    flash('Application submitted!')
    load()
    setApplying(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-4xl mb-4">📋</p>
      <h1 className="text-xl font-medium mb-2" style={{ color: 'var(--text)' }}>Project not found</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>This project doesn't exist or is not publicly visible.</p>
      <Link to="/projects" className="btn-primary">Browse projects</Link>
    </div>
  )

  const L = {
    skills:        lang === 'bg' ? 'Необходими умения'  : 'Skills required',
    goals:         lang === 'bg' ? 'Цели на проекта'    : 'Project goals',
    deliverables:  lang === 'bg' ? 'Очаквани резултати' : 'Deliverables',
    manager:       lang === 'bg' ? 'Ръководител'        : 'Project manager',
    contact:       lang === 'bg' ? 'Свържете се'        : 'Contact',
    events_h:      lang === 'bg' ? 'Предстоящи събития' : 'Upcoming events',
    spots:         lang === 'bg' ? 'свободни места'     : 'spots remaining',
    details:       lang === 'bg' ? 'Детайли'            : 'Details',
    org_label:     lang === 'bg' ? 'Организация'        : 'Organization',
    volunteers:    lang === 'bg' ? 'доброволци'         : 'volunteers needed',
    full:          lang === 'bg' ? 'Проектът е пълен'   : 'Project is full',
    pending:       lang === 'bg' ? '⏳ Заявката ви е в изчакване' : '⏳ Application pending review',
    rejected:      lang === 'bg' ? 'Заявката ви не беше одобрена' : 'Application not accepted',
    approved:      lang === 'bg' ? '✓ Вие сте доброволец по проекта' : '✓ You are a volunteer on this project',
    apply_btn:     lang === 'bg' ? 'Кандидатствай'     : 'Apply to volunteer',
    applying_btn:  lang === 'bg' ? 'Изпращане...'      : 'Submitting...',
    signup_btn:    lang === 'bg' ? 'Регистрирайте се за да кандидатствате' : 'Sign up to apply',
    all_projects:  lang === 'bg' ? '← Всички проекти'  : '← All projects',
    active:        lang === 'bg' ? 'Активен'            : 'Active',
  }

  const t = (enVal, bgVal) => lang === 'bg' ? (bgVal || enVal) : enVal

  const title         = t(project.title,         project.title_bg)
  const desc          = t(project.description,    project.description_bg)
  const goals         = t(project.goals,          project.goals_bg)
  const deliverables  = t(project.deliverables,   project.deliverables_bg)
  const managerName   = t(project.manager_name,   project.manager_name_bg)
  const catName       = project.categories
    ? t(project.categories.name, project.categories.name_bg) : null
  const spotsLeft     = Math.max(0, (project.volunteers_needed || 0) - (project.volunteers_enrolled || 0))
  const isFull        = project.volunteers_needed > 0 && spotsLeft === 0

  const ApplyBtn = () => {
    if (!user) return <Link to="/register" className="btn-primary w-full text-center">{L.signup_btn}</Link>
    if (profile?.role !== 'volunteer') return null
    if (application?.status === 'approved') return (
      <span className="block text-center text-sm font-medium py-2 text-brand-600">{L.approved}</span>
    )
    if (application?.status === 'pending') return (
      <span className="block text-center text-sm py-2.5 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">{L.pending}</span>
    )
    if (application?.status === 'rejected') return (
      <span className="block text-center text-sm py-2.5 px-4 rounded-xl bg-red-50 border border-red-200 text-red-600">{L.rejected}</span>
    )
    if (isFull) return (
      <span className="block text-center text-sm py-2.5 px-4 rounded-xl bg-gray-100 text-gray-500">{L.full}</span>
    )
    return (
      <button onClick={apply} disabled={applying} className="btn-primary w-full flex items-center justify-center gap-2">
        {applying && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {applying ? L.applying_btn : L.apply_btn}
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

      <Link to="/projects" className="text-sm mb-6 block" style={{ color: 'var(--text-faint)' }}>{L.all_projects}</Link>

      {/* Cover */}
      {project.cover_url && (
        <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden mb-6" style={{ background: 'var(--bg-subtle)' }}>
          <img src={project.cover_url} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ── Main column ── */}
        <div className="md:col-span-2 flex flex-col gap-6">

          {/* Title block */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {catName && (
                <span className="badge text-xs px-2 py-0.5"
                  style={{ background: (project.categories?.color || '#16a34a') + '20', color: project.categories?.color || '#16a34a' }}>
                  {catName}
                </span>
              )}
              <span className={'badge text-xs px-2 py-0.5 capitalize ' + (project.status === 'published' ? 'bg-brand-50 text-brand-700' : 'bg-blue-50 text-blue-700')}>
                {project.status === 'in_progress' ? L.active : project.status}
              </span>
            </div>
            <h1 className="text-2xl font-medium mb-2" style={{ color: 'var(--text)' }}>{title}</h1>
            {org && (
              <Link to={'/organizations/' + org.slug}
                className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600 mb-4">
                {org.logo_url && <img src={org.logo_url} alt={org.name} className="w-5 h-5 rounded object-cover" />}
                {org.name}
              </Link>
            )}
            {desc && <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-muted)' }}>{desc}</p>}
          </div>

          {/* Goals */}
          {goals && (
            <div className="card">
              <h2 className="text-base font-medium mb-3" style={{ color: 'var(--text)' }}>🎯 {L.goals}</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-muted)' }}>{goals}</p>
            </div>
          )}

          {/* Deliverables */}
          {deliverables && (
            <div className="card">
              <h2 className="text-base font-medium mb-3" style={{ color: 'var(--text)' }}>📦 {L.deliverables}</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-muted)' }}>{deliverables}</p>
            </div>
          )}

          {/* Skills */}
          {project.skills_required?.length > 0 && (
            <div className="card">
              <h2 className="text-base font-medium mb-3" style={{ color: 'var(--text)' }}>{L.skills}</h2>
              <div className="flex flex-wrap gap-2">
                {project.skills_required.map(s => (
                  <span key={s} className="badge bg-gray-100 text-gray-600 text-xs px-2.5 py-1">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Manager */}
          {(managerName || project.manager_email) && (
            <div className="card flex flex-col gap-3">
              <h2 className="text-base font-medium" style={{ color: 'var(--text)' }}>👤 {L.manager}</h2>
              {managerName && (
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{managerName}</p>
              )}
              {project.manager_email && (
                <a href={`mailto:${project.manager_email}`}
                  className="text-sm text-brand-400 hover:text-brand-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  {project.manager_email}
                </a>
              )}
            </div>
          )}

          {/* Events */}
          {events.length > 0 && (
            <div>
              <h2 className="text-base font-medium mb-3" style={{ color: 'var(--text)' }}>{L.events_h}</h2>
              <div className="flex flex-col gap-3">
                {events.map(ev => {
                  const evTitle = t(ev.title, ev.title_bg)
                  const evDesc  = t(ev.description, ev.description_bg)
                  const evDate  = ev.event_date ? new Date(ev.event_date).toLocaleDateString(
                    lang === 'bg' ? 'bg-BG' : 'en-GB',
                    { weekday:'short', day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }
                  ) : ''
                  return (
                    <div key={ev.id} className="card flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-medium" style={{ color: 'var(--text)' }}>{evTitle}</h3>
                        {ev.is_online && <span className="badge bg-blue-50 text-blue-700 text-xs shrink-0">Online</span>}
                      </div>
                      {evDate && <p className="text-xs" style={{ color: 'var(--text-faint)' }}>📅 {evDate}</p>}
                      {!ev.is_online && ev.city && <p className="text-xs" style={{ color: 'var(--text-faint)' }}>📍 {ev.city}{ev.address ? ', ' + ev.address : ''}</p>}
                      {evDesc && <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{evDesc}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-4">
          {/* Apply */}
          <div className="card flex flex-col gap-4">
            <div className="text-center py-2">
              <p className="text-3xl font-semibold text-brand-400">{spotsLeft}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{L.spots}</p>
            </div>
            <ApplyBtn />
          </div>

          {/* Details */}
          <div className="card flex flex-col gap-3">
            <h2 className="text-sm font-medium" style={{ color: 'var(--text)' }}>{L.details}</h2>
            {project.city && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--text-faint)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {project.city}{project.address ? ', ' + project.address : ''}
              </div>
            )}
            {project.start_date && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--text-faint)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                {new Date(project.start_date).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB', { day:'numeric', month:'long', year:'numeric' })}
                {project.end_date && ` — ${new Date(project.end_date).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB', { day:'numeric', month:'long', year:'numeric' })}`}
              </div>
            )}
            {project.volunteers_needed > 0 && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--text-faint)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {project.volunteers_needed} {L.volunteers}
              </div>
            )}
          </div>

          {/* Org card */}
          {org && (
            <Link to={'/organizations/' + org.slug}
              className="card hover:border-gray-200 hover:shadow-sm transition-all flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-brand-600 font-medium shrink-0 overflow-hidden bg-brand-50">
                {org.logo_url ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" /> : org.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-faint)' }}>{L.org_label}</p>
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{org.name}</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
