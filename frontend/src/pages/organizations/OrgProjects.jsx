import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const STATUS_BADGE = {
  draft:     'bg-gray-100 text-gray-600',
  published: 'bg-brand-50 text-brand-700 border border-brand-200',
  completed: 'bg-green-50 text-green-700 border border-green-200',
  cancelled: 'bg-red-50 text-red-600 border border-red-200',
}

const STATUS_LABEL_EN = { draft: 'Draft', published: 'Published', completed: 'Completed', cancelled: 'Cancelled' }
const STATUS_LABEL_BG = { draft: 'Чернова', published: 'Публикуван', completed: 'Завършен', cancelled: 'Отменен' }

export default function OrgProjects() {
  const { user } = useAuthStore()
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [org, setOrg] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState(null)

  const flash = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => { load() }, [user?.id])

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data: om } = await supabase
      .from('organization_members')
      .select('organization_id, organizations(id, name, slug, status, is_active)')
      .eq('profile_id', user.id)
      .eq('role', 'admin')
      .eq('request_status', 'approved')
      .single()
    if (!om) { setLoading(false); return }
    setOrg(om.organizations)
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', om.organizations.id)
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  const togglePublic = (project) => {
    const next = !project.show_in_public
    setConfirm({
      title: next ? (lang === 'bg' ? 'Публикуване за публиката?' : 'Make publicly visible?') : (lang === 'bg' ? 'Скриване от публиката?' : 'Hide from public?'),
      message: project.title,
      confirmLabel: next ? (lang === 'bg' ? 'Публикувай' : 'Make visible') : (lang === 'bg' ? 'Скрий' : 'Hide'),
      variant: next ? 'default' : 'warning',
      onConfirm: () => _execTogglePublic(project),
    })
  }
  const _execTogglePublic = async (project) => {
    const next = !project.show_in_public
    const { error } = await supabase
      .from('projects')
      .update({ show_in_public: next, updated_at: new Date().toISOString() })
      .eq('id', project.id)
    if (error) flash(error.message, 'error')
    else { flash(next ? (lang === 'bg' ? 'Проектът е вече публично видим' : 'Project is now visible publicly') : (lang === 'bg' ? 'Проектът е скрит от публиката' : 'Project hidden from public')); load() }
  }

  const publish = (project) => {
    setConfirm({
      title: lang === 'bg' ? 'Публикуване на проект?' : 'Publish project?',
      message: project.title,
      confirmLabel: lang === 'bg' ? 'Публикувай' : 'Publish',
      variant: 'default',
      onConfirm: () => _execPublish(project),
    })
  }
  const _execPublish = async (project) => {
    const { error } = await supabase
      .from('projects')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', project.id)
    if (error) flash(error.message, 'error')
    else { flash(lang === 'bg' ? 'Проектът е публикуван' : 'Project published'); await load() }
  }

  const complete = (project) => {
    setConfirm({
      title: lang === 'bg' ? 'Завърши проект?' : 'Complete project?',
      message: project.title,
      confirmLabel: lang === 'bg' ? 'Завърши' : 'Complete',
      variant: 'warning',
      onConfirm: () => _execComplete(project),
    })
  }
  const _execComplete = async (project) => {
    const { error } = await supabase
      .from('projects')
      .update({ status: 'completed', show_in_public: false, updated_at: new Date().toISOString() })
      .eq('id', project.id)
    if (error) flash(error.message, 'error')
    else { flash(lang === 'bg' ? 'Проектът е отбелязан като завършен' : 'Project marked as completed'); await load() }
  }

  const deleteProject = async (project) => {
    setConfirm({
      title: lang === 'bg' ? 'Изтриване на проект?' : 'Delete project?',
      message: project.title,
      confirmLabel: lang === 'bg' ? 'Изтрий' : 'Delete',
      variant: 'danger',
      onConfirm: () => _doDelete(project),
    })
  }
  const _doDelete = async (project) => {
    const { error } = await supabase.from('projects').delete().eq('id', project.id)
    if (error) flash(error.message, 'error')
    else { flash(lang === 'bg' ? 'Проектът е изтрит' : 'Project deleted'); await load() }
  }

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

  const canCreate = org.status === 'approved' && org.is_active

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
          <h1 className="text-xl font-medium text-gray-900">{lang === 'bg' ? 'Проекти' : 'Projects'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{org.name}</p>
        </div>
        {canCreate
          ? <Link to="/org/projects/new" className="btn-primary">{lang==='bg'?'+ Нов проект':'+ New project'}</Link>
          : <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Organization must be approved to create projects</span>
        }
      </div>

      {projects.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-sm mb-4">lang==='bg'?'Няма проекти.':'No projects yet.'</p>
          {canCreate && <Link to="/org/projects/new" className="btn-primary">{lang === 'bg' ? 'Създайте първия си проект' : 'Create your first project'}</Link>}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {projects.map(p => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-medium text-gray-900">{lang==='bg'?(p.title_bg||p.title):p.title}</h3>
                    <span className={'badge text-xs px-2 py-0.5 ' + (STATUS_BADGE[p.status] || 'bg-gray-100 text-gray-600')}>
                      {(lang === 'bg' ? STATUS_LABEL_BG : STATUS_LABEL_EN)[p.status] || p.status}
                    </span>
                    {p.status === 'published' && (
                      <span className={'badge text-xs px-2 py-0.5 ' + (p.show_in_public ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500')}>
                        {p.show_in_public ? 'Visible' : 'Hidden'}
                      </span>
                    )}
                  </div>
                  {p.city && <p className="text-xs text-gray-400">{p.city}</p>}
                  {p.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{p.volunteers_enrolled || 0} / {p.volunteers_needed || 0} volunteers</span>
                    {p.start_date && <span>From {new Date(p.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0 flex-wrap items-center">
                  <Link to={'/org/projects/' + p.id + '/edit'} className="btn-secondary text-xs py-1.5">{lang === 'bg' ? 'Редактирай' : 'Edit'}</Link>

                  {p.status !== 'completed' && p.status !== 'cancelled' && (
                    <Link to={'/org/projects/' + p.id + '/events'} className="btn-secondary text-xs py-1.5">{lang === 'bg' ? 'Събития' : 'Events'}</Link>
                  )}

                  {/* Draft: can publish or delete */}
                  {p.status === 'draft' && (
                    <>
                      <button onClick={() => publish(p)} className="btn-primary text-xs py-1.5">{lang === 'bg' ? 'Публикувай' : 'Publish'}</button>
                      <button onClick={() => deleteProject(p)} className="text-xs border border-red-200 text-red-500 hover:bg-red-50 rounded-lg px-2.5 py-1.5">{lang === 'bg' ? 'Изтрий' : 'Delete'}</button>
                    </>
                  )}

                  {/* Published: toggle visibility + complete */}
                  {p.status === 'published' && (
                    <>
                      <button
                        onClick={() => togglePublic(p)}
                        className={'text-xs border rounded-lg px-2.5 py-1.5 font-medium transition-colors ' + (p.show_in_public
                          ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {p.show_in_public ? lang === 'bg' ? '● Видим' : '● Visible' : lang === 'bg' ? '○ Скрит' : '○ Hidden'}
                      </button>
                      <button onClick={() => complete(p)} className="text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg px-2.5 py-1.5">{lang === 'bg' ? 'Завърши' : 'Complete'}</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
