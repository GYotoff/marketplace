import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const EMPTY = { name: '', name_bg: '', message: '', message_bg: '', badge_url: '' }

function AchievementForm({ initial = EMPTY, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="card flex flex-col gap-4" style={{ borderColor: 'rgba(29,158,117,0.4)' }}>
      <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
        {initial.id ? 'Edit achievement' : 'New achievement'}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Name (EN) *</label>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. First Responder" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Name (BG) *</label>
          <input className="input" value={form.name_bg} onChange={e => set('name_bg', e.target.value)}
            placeholder="напр. Пръв отговарящ" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Message (EN)</label>
          <textarea className="input resize-none" rows={2} value={form.message}
            onChange={e => set('message', e.target.value)}
            placeholder="Awarded for completing 10 events…" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Message (BG)</label>
          <textarea className="input resize-none" rows={2} value={form.message_bg}
            onChange={e => set('message_bg', e.target.value)}
            placeholder="Присъдено за завършване на 10 събития…" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Badge URL</label>
          <input className="input" value={form.badge_url} onChange={e => set('badge_url', e.target.value)}
            placeholder="https://… or /badges/my-achievement.png" />
          {form.badge_url && (
            <img src={form.badge_url} alt="" className="w-12 h-12 mt-2 object-contain rounded-lg"
              style={{ background: 'var(--bg-subtle)' }} />
          )}
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary text-sm px-4">Cancel</button>
        <button type="button" disabled={!form.name || !form.name_bg || saving}
          onClick={() => onSave(form)}
          className="btn-primary text-sm px-4 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save achievement'}
        </button>
      </div>
    </div>
  )
}

export default function AdminAchievements() {
  const { user } = useAuthStore()
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [search, setSearch]   = useState('')
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast]     = useState(null)
  const timerRef = useRef(null)

  const flash = (msg, type = 'ok') => {
    setToast({ msg, type })
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setToast(null), 3000)
  }

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('achievements').select('*').order('created_at')
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveRow = async (form) => {
    setSaving(true)
    const payload = {
      name: form.name, name_bg: form.name_bg,
      message: form.message || null, message_bg: form.message_bg || null,
      badge_url: form.badge_url || null,
      updated_by: user.id,
    }
    let error
    if (form.id) {
      ;({ error } = await supabase.from('achievements').update(payload).eq('id', form.id))
    } else {
      ;({ error } = await supabase.from('achievements').insert(payload))
    }
    if (error) flash(error.message, 'error')
    else { flash('Saved!'); setEditing(null); await load() }
    setSaving(false)
  }

  const deleteRow = (row) => {
    setConfirm({
      title: `Delete "${row.name}"?`,
      message: 'This will remove the achievement definition. Volunteers who have this achievement will still have the ID stored on their profile.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        const { error } = await supabase.from('achievements').delete().eq('id', row.id)
        if (error) flash(error.message, 'error')
        else { flash('Deleted'); await load() }
      },
    })
  }

  const filtered = rows.filter(r => {
    const s = search.toLowerCase()
    return !s || r.name.toLowerCase().includes(s) || r.name_bg.toLowerCase().includes(s)
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-brand-400'}`}>
          {toast.msg}
        </div>
      )}
      <ConfirmDialog config={confirm} onClose={() => setConfirm(null)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Achievements</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Define achievement badges that can be awarded to volunteers · {rows.length} total
          </p>
        </div>
        {editing !== 'new' && (
          <button type="button" onClick={() => setEditing('new')} className="btn-primary text-sm">
            + New achievement
          </button>
        )}
      </div>

      {/* Search */}
      {rows.length > 3 && (
        <input type="search" className="input mb-5" placeholder="Search achievements…"
          value={search} onChange={e => setSearch(e.target.value)} />
      )}

      {/* New form */}
      {editing === 'new' && (
        <div className="mb-5">
          <AchievementForm onSave={saveRow} onCancel={() => setEditing(null)} saving={saving} />
        </div>
      )}

      {/* List */}
      {loading && <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Loading…</p>}
      {!loading && filtered.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-2xl mb-2">🏆</p>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>No achievements yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
            Click "+ New achievement" to create the first one
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map(row => (
          <div key={row.id}>
            {editing?.id === row.id ? (
              <AchievementForm initial={editing} onSave={saveRow} onCancel={() => setEditing(null)} saving={saving} />
            ) : (
              <div className="card flex items-center gap-4 flex-wrap">
                {/* Badge */}
                {row.badge_url
                  ? <img src={row.badge_url} alt={row.name} className="w-12 h-12 object-contain shrink-0 rounded-lg"
                      style={{ background: 'var(--bg-subtle)' }} />
                  : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background: 'var(--bg-subtle)' }}>🎖️</div>}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{row.name}</span>
                    <span className="text-xs" style={{ color: 'var(--text-faint)' }}>/</span>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{row.name_bg}</span>
                  </div>
                  {row.message && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{row.message}</p>}
                  {row.message_bg && <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>{row.message_bg}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                      Created {new Date(row.created_at).toLocaleDateString('en-GB')}
                    </p>
                    {row.updated_at !== row.created_at && (
                      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                        · Updated {new Date(row.updated_at).toLocaleDateString('en-GB')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => setEditing(row)}
                    className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                  <button type="button" onClick={() => deleteRow(row)}
                    className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                    style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
