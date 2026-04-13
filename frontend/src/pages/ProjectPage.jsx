import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export default function ProjectPage() {
  const { id } = useParams()
  const { i18n } = useTranslation()
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [org, setOrg] = useState(null)
  const [events, setEvents] = useState([])
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [applying, setApplying] = useState(false)
  const [toast, setToast] = useState(null)

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

    // Load published+public events for this project
    const { data: evs } = await supabase
      .from('events')
      .select('*')
      .eq('project_id', id)
      .eq('status', 'published')
      .eq('show_in_public', true)
      .order('event_date', { ascending: true })
    setEvents(evs || [])

    // Check if current user has applied
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
    if (error) flash(error.message, 'error')
    else { flash('Application submitted!'); load() }
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
      <h1 className="text-xl font-medium text-gray-900 mb-2">Project not found</h1>
      <p className="text-gray-500 text-sm mb-6">This project doesn't exist or is not publicly visible.</p>
      <Link to="/projects" className="btn-primary">Browse projects</Link>
    </div>
  )

  const title = (i18n.language === 'bg' && project.title_bg) ? project.title_bg : project.title
  const desc  = (i18n.language === 'bg' && project.description_bg) ? project.description_bg : project.description
  const catName = project.categories ? (i18n.language === 'bg' && project.categories.name_bg ? project.categories.name_bg : project.categories.name) : null
  const spotsLeft = Math.max(0, (project.volunteers_needed || 0) - (project.volunteers_enrolled || 0))
  const isFull = project.volunteers_needed > 0 && spotsLeft === 0

  const ApplyBtn = () => {
    if (!user) return (
      <Link to="/register" className="btn-primary w-full text-center">Sign up to apply</Link>
    )
    if (profile?.role !== 'volunteer') return null
    if (application?.status === 'approved') return (
      <span className="block text-center text-sm text-brand-600 font-medium py-2">✓ You are a volunteer on this project</span>
    )
    if (application?.status === 'pending') return (
      <span className="block text-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl py-2.5 px-4">⏳ Application pending review</span>
    )
    if (application?.status === 'rejected') return (
      <span className="block text-center text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl py-2.5 px-4">Application not accepted</span>
    )
    if (isFull) return (
      <span className="block text-center text-sm text-gray-500 bg-gray-100 rounded-xl py-2.5 px-4">Project is full</span>
    )
    return (
      <button onClick={apply} disabled={applying} className="btn-primary w-full flex items-center justify-center gap-2">
        {applying && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {applying ? 'Submitting...' : 'Apply to volunteer'}
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

      {/* Breadcrumb */}
      <Link to="/projects" className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">← All projects</Link>

      {/* Cover */}
      {project.cover_url && (
        <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden mb-6 bg-gray-100">
          <img src={project.cover_url} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {catName && (
                <span className="badge text-xs px-2 py-0.5" style={{ background: project.categories?.color ? project.categories.color + '20' : '#f0fdf4', color: project.categories?.color || '#16a34a' }}>
                  {catName}
                </span>
              )}
              <span className={'badge text-xs px-2 py-0.5 capitalize ' + (project.status === 'published' ? 'bg-brand-50 text-brand-700' : 'bg-blue-50 text-blue-700')}>
                {project.status === 'in_progress' ? 'In progress' : project.status}
              </span>
            </div>
            <h1 className="text-2xl font-medium text-gray-900 mb-2">{title}</h1>
            {org && (
              <Link to={'/organizations/' + org.slug} className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600 mb-4">
                {org.logo_url && <img src={org.logo_url} alt={org.name} className="w-5 h-5 rounded object-cover" />}
                {org.name}
              </Link>
            )}
            {desc && (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{desc}</p>
            )}
          </div>

          {/* Skills */}
          {project.skills_required?.length > 0 && (
            <div className="card">
              <h2 className="text-base font-medium text-gray-900 mb-3">{i18n.language === 'bg' ? 'Необходими умения' : 'Skills required'}</h2>
              <div className="flex flex-wrap gap-2">
                {project.skills_required.map(s => (
                  <span key={s} className="badge bg-gray-100 text-gray-600 text-xs px-2.5 py-1">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          {events.length > 0 && (
            <div>
              <h2 className="text-base font-medium text-gray-900 mb-3">{i18n.language === 'bg' ? 'Предстоящи събития' : 'Upcoming events'}</h2>
              <div className="flex flex-col gap-3">
                {events.map(ev => {
                  const evTitle = (i18n.language === 'bg' && ev.title_bg) ? ev.title_bg : ev.title
                  const evDesc  = (i18n.language === 'bg' && ev.description_bg) ? ev.description_bg : ev.description
                  const evDate  = ev.event_date ? new Date(ev.event_date).toLocaleDateString(i18n.language === 'bg' ? 'bg-BG' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
                  return (
                    <div key={ev.id} className="card flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-medium text-gray-900">{evTitle}</h3>
                        {ev.is_online && <span className="badge bg-blue-50 text-blue-700 text-xs shrink-0">Online</span>}
                      </div>
                      {evDate && <p className="text-xs text-gray-400">📅 {evDate}</p>}
                      {!ev.is_online && ev.city && <p className="text-xs text-gray-400">📍 {ev.city}{ev.address ? ', ' + ev.address : ''}</p>}
                      {ev.is_online && ev.online_url && <a href={ev.online_url} target="_blank" rel="noreferrer" className="text-xs text-brand-500 hover:text-brand-600">Join online →</a>}
                      {evDesc && <p className="text-sm text-gray-500 leading-relaxed">{evDesc}</p>}
                      {ev.volunteers_needed > 0 && (
                        <p className="text-xs text-gray-400">{ev.volunteers_enrolled || 0} / {ev.volunteers_needed} {i18n.language === 'bg' ? 'доброволци' : 'volunteers'}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="card flex flex-col gap-4">
            {/* Spots */}
            <div className="text-center py-2">
              <p className="text-3xl font-semibold text-brand-400">{spotsLeft}</p>
              <p className="text-xs text-gray-400 mt-0.5">{i18n.language === 'bg' ? 'свободни места' : 'spots remaining'}</p>
            </div>
            <ApplyBtn />
          </div>

          <div className="card flex flex-col gap-3">
            <h2 className="text-sm font-medium text-gray-700">{i18n.language === 'bg' ? 'Детайли' : 'Details'}</h2>
            {project.city && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {project.city}{project.address ? ', ' + project.address : ''}
              </div>
            )}
            {project.start_date && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                {new Date(project.start_date).toLocaleDateString(i18n.language === 'bg' ? 'bg-BG' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                {project.end_date && ` — ${new Date(project.end_date).toLocaleDateString(i18n.language === 'bg' ? 'bg-BG' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
              </div>
            )}
            {project.volunteers_needed > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {project.volunteers_needed} {i18n.language === 'bg' ? 'доброволци' : 'volunteers needed'}
              </div>
            )}
          </div>

          {org && (
            <Link to={'/organizations/' + org.slug} className="card hover:border-gray-200 hover:shadow-sm transition-all flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-medium shrink-0 overflow-hidden">
                {org.logo_url ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" /> : org.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">{i18n.language === 'bg' ? 'Организация' : 'Organization'}</p>
                <p className="text-sm font-medium text-gray-900 truncate">{org.name}</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
