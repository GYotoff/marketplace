import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const STATUS_BADGE = {
  draft:       'bg-gray-100 text-gray-600',
  published:   'bg-brand-50 text-brand-700 border border-brand-200',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
  completed:   'bg-green-50 text-green-700 border border-green-200',
  cancelled:   'bg-red-50 text-red-600 border border-red-200',
}

const STATUS_LABEL = {
  draft: 'Draft', published: 'Published', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
}

export default function OrgProjects() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [org, setOrg] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const flash = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => { load() }, [user])

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data: om } = await supabase
      .from('organization_members')
      .select('organization_id, organizations(id, name, slug, status, is_active)')
      .eq('profile_id', user.id).eq('role', 'admin').eq('request_status', 'approved')
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

  const togglePublic = async (project) => {
    const { error } = await supabase.from('projects')
      .update({ show_in_public: !project.show_in_public, updated_at: new Date().toISOString() })
      .eq('id', project.id)
    if (!error) { flash('Updated'); load() } else flash(error.message, 'error')
  }

  const setStatus = async (project, status) => {
    const { error } = await supabase.from('projects')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', project.id)
    if (!error) { flash('Status updated'); load() } else flash(error.message, 'error')
  }

  const deleteProject = async (project) => {
    if (!confirm('Delete "' + project.title + '"? This cannot be undone.')) return
    const { error } = await supabase.from('projects').delete().eq('id', project.id)
    if (!error) { flash('Project deleted'); load() } else flash(error.message, 'error')
  }

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>
  if (!org) return <div className="max-w-lg mx-auto px-4 py-16 text-center"><p className="text-gray-500 mb-4">You are not an admin of any organization.</p></div>

  const canCreate = org.status === 'approved' && org.is_active

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {toast && (
        <div className={'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ' + (toast.type === 'error' ? 'bg-red-500' : 'bg-brand-400')}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{org.name}</p>
        </div>
        {canCreate
          ? <Link to="/org/projects/new" className="btn-primary">+ New project</Link>
          : <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Organization must be approved to create projects</span>}
      </div>

      {projects.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-sm mb-4">No projects yet.</p>
          {canCreate && <Link to="/org/projects/new" className="btn-primary">Create your first project</Link>}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {projects.map(p => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-medium text-gray-900">{p.title}</h3>
                    <span className={'badge text-xs px-2 py-0.5 ' + (STATUS_BADGE[p.status] || 'bg-gray-100 text-gray-600')}>
                      {STATUS_LABEL[p.status] || p.status}
                    </span>
                    {p.show_in_public && p.status === 'published' && (
                      <span className="badge bg-green-50 text-green-700 border border-green-200 text-xs px-2 py-0.5">Public</span>
                    )}
                  </div>
                  {p.city && <p className="text-xs text-gray-400">{p.city}</p>}
                  {p.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{p.volunteers_enrolled || 0} / {p.volunteers_needed || 0} volunteers</span>
                    {p.start_date && <span>From {new Date(p.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap">
                  <Link to={'/org/projects/' + p.id + '/edit'} className="btn-secondary text-xs py-1.5">Edit</Link>
                  <Link to={'/org/projects/' + p.id + '/events'} className="btn-secondary text-xs py-1.5">Events</Link>
                  {p.status === 'draft' && (
                    <button onClick={() => setStatus(p, 'published')} className="btn-primary text-xs py-1.5">Publish</button>
                  )}
                  {p.status === 'published' && (
                    <>
                      <button onClick={() => togglePublic(p)}
                        className={'text-xs border rounded-lg px-2.5 py-1.5 ' + (p.show_in_public ? 'border-green-200 text-green-700 hover:bg-green-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50')}>
                        {p.show_in_public ? 'Visible' : 'Hidden'}
                      </button>
                      <button onClick={() => setStatus(p, 'in_progress')} className="text-xs border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg px-2.5 py-1.5">Start</button>
                    </>
                  )}
                  {p.status === 'draft' && (
                    <button onClick={() => deleteProject(p)} className="text-xs border border-red-200 text-red-500 hover:bg-red-50 rounded-lg px-2.5 py-1.5">Delete</button>
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
