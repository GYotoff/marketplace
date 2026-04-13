import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const STATUS_BADGE = {
  draft:     'bg-gray-100 text-gray-600',
  published: 'bg-brand-50 text-brand-700 border border-brand-200',
  cancelled: 'bg-red-50 text-red-600 border border-red-200',
  completed: 'bg-green-50 text-green-700 border border-green-200',
}

export default function OrgProjectEvents() {
  const { projectId } = useParams()
  const { user } = useAuthStore()
  const [project, setProject] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const flash = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => { load() }, [user, projectId])

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data: p } = await supabase.from('projects').select('id, title, status, organization_id').eq('id', projectId).single()
    if (!p) { setLoading(false); return }
    setProject(p)
    const { data } = await supabase.from('events').select('*').eq('project_id', projectId).order('event_date', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  const togglePublic = async (ev) => {
    const { error } = await supabase.from('events').update({ show_in_public: !ev.show_in_public, updated_at: new Date().toISOString() }).eq('id', ev.id)
    if (!error) { flash('Updated'); load() } else flash(error.message, 'error')
  }

  const setStatus = async (ev, status) => {
    const { error } = await supabase.from('events').update({ status, updated_at: new Date().toISOString() }).eq('id', ev.id)
    if (!error) { flash('Status updated'); load() } else flash(error.message, 'error')
  }

  const deleteEvent = async (ev) => {
    if (!confirm('Delete "' + ev.title + '"?')) return
    const { error } = await supabase.from('events').delete().eq('id', ev.id)
    if (!error) { flash('Event deleted'); load() } else flash(error.message, 'error')
  }

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>
  if (!project) return <div className="max-w-lg mx-auto px-4 py-16 text-center"><p className="text-gray-500">Project not found.</p></div>

  const canAddEvent = project.status === 'published'

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {toast && (
        <div className={'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ' + (toast.type === 'error' ? 'bg-red-500' : 'bg-brand-400')}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/org/projects" className="text-xs text-gray-400 hover:text-gray-600 mb-1 block">← All projects</Link>
          <h1 className="text-xl font-medium text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-0.5">{project.title}</p>
        </div>
        {canAddEvent
          ? <Link to={'/org/projects/' + projectId + '/events/new'} className="btn-primary">+ New event</Link>
          : <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Publish project first to add events</span>}
      </div>

      {events.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-sm mb-4">No events yet for this project.</p>
          {canAddEvent && <Link to={'/org/projects/' + projectId + '/events/new'} className="btn-primary">Add first event</Link>}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map(ev => (
            <div key={ev.id} className="card flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-medium text-gray-900">{ev.title}</h3>
                  <span className={'badge text-xs px-2 py-0.5 capitalize ' + (STATUS_BADGE[ev.status] || 'bg-gray-100 text-gray-600')}>{ev.status}</span>
                  {ev.show_in_public && ev.status === 'published' && (
                    <span className="badge bg-green-50 text-green-700 border border-green-200 text-xs px-2 py-0.5">Public</span>
                  )}
                </div>
                {ev.city && <p className="text-xs text-gray-400">{ev.city}{ev.is_online ? ' · Online' : ''}</p>}
                {ev.event_date && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(ev.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">{ev.volunteers_enrolled || 0} / {ev.volunteers_needed || 0} volunteers</p>
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap">
                <Link to={'/org/projects/' + projectId + '/events/' + ev.id + '/edit'} className="btn-secondary text-xs py-1.5">Edit</Link>
                {ev.status === 'draft' && (
                  <button onClick={() => setStatus(ev, 'published')} className="btn-primary text-xs py-1.5">Publish</button>
                )}
                {ev.status === 'published' && (
                  <button onClick={() => togglePublic(ev)}
                    className={'text-xs border rounded-lg px-2.5 py-1.5 ' + (ev.show_in_public ? 'border-green-200 text-green-700 hover:bg-green-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50')}>
                    {ev.show_in_public ? 'Visible' : 'Hidden'}
                  </button>
                )}
                {ev.status === 'draft' && (
                  <button onClick={() => deleteEvent(ev)} className="text-xs border border-red-200 text-red-500 hover:bg-red-50 rounded-lg px-2.5 py-1.5">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
