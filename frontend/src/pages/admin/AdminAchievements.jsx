import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from 'react-i18next'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

/** Inline badge upload — picks file, uploads to achievement-badges bucket, returns public URL */
function BadgeUpload({ currentUrl, onUploaded, lang = 'en' }) {
  const { user } = useAuthStore()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview]     = useState(currentUrl || null)
  const [error, setError]         = useState('')
  const inputRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Max 2 MB'); return }
    if (!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(file.type)) {
      setError('PNG, JPG, WebP or SVG only'); return
    }
    setError('')
    setUploading(true)

    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)

    const ext  = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('achievement-badges').upload(path, file, { upsert: true })

    if (upErr) { setError(upErr.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage
      .from('achievement-badges').getPublicUrl(path)

    onUploaded(publicUrl)
    setUploading(false)
  }

  const handleRemove = () => {
    setPreview(null)
    onUploaded('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex items-center gap-4">
      {/* Preview */}
      <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-mid)' }}>
        {preview
          ? <img src={preview} alt="" className="w-full h-full object-contain p-1" />
          : <span className="text-2xl">🎖️</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <button type="button" onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-50">
            {uploading ? 'Uploading…' : preview ? lang === 'bg' ? 'Смени значката' : 'Change badge' : lang === 'bg' ? 'Качи значка' : 'Upload badge'}
          </button>
          {preview && (
            <button type="button" onClick={handleRemove}
              className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}>
              Remove
            </button>
          )}
        </div>
        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>PNG, JPG, WebP or SVG · max 2 MB</p>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <input ref={inputRef} type="file" className="hidden"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleFile} />
      </div>
    </div>
  )
}

const EMPTY = { name: '', name_bg: '', message: '', message_bg: '', badge_url: '' }

function AchievementForm({ initial = EMPTY, onSave, onCancel, saving, lang = 'en' }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="card flex flex-col gap-4" style={{ borderColor: 'rgba(29,158,117,0.4)' }}>
      <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
        {initial.id ? (lang === 'bg' ? 'Редактирай постижение' : 'Edit achievement') : (lang === 'bg' ? 'Ново постижение' : 'New achievement')}
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
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Badge image</label>
          <BadgeUpload
            currentUrl={form.badge_url || ''}
            onUploaded={url => set('badge_url', url)}
            lang={lang}
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary text-sm px-4">Cancel</button>
        <button type="button" disabled={!form.name || !form.name_bg || saving}
          onClick={() => onSave(form)}
          className="btn-primary text-sm px-4 disabled:opacity-50">
          {saving ? (lang === 'bg' ? 'Запазване…' : 'Saving…') : (lang === 'bg' ? 'Запази постижение' : 'Save achievement')}
        </button>
      </div>
    </div>
  )
}

export default function AdminAchievements() {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
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
    else { flash(lang === 'bg' ? 'Запазено!' : 'Saved!'); setEditing(null); await load() }
    setSaving(false)
  }

  const deleteRow = (row) => {
    setConfirm({
      title: `Delete "${row.name}"?`,
      message: 'This will remove the achievement definition. Volunteers who have this achievement will still have the ID stored on their profile.',
      confirmLabel: lang === 'bg' ? 'Изтрий' : 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        const { error } = await supabase.from('achievements').delete().eq('id', row.id)
        if (error) flash(error.message, 'error')
        else { flash(lang === 'bg' ? 'Изтрито' : 'Deleted'); await load() }
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
