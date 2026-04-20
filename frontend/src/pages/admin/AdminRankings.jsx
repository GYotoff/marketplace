import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from 'react-i18next'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

/** Inline ranking icon upload — uploads to ranking-icons bucket, returns public URL */
function RankingIconUpload({ currentUrl, onUploaded, lang = 'en' }) {
  const { user } = useAuthStore()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview]     = useState(currentUrl || null)
  const [error, setError]         = useState('')
  const inputRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError(lang === 'bg' ? 'Макс. 2 МБ' : 'Max 2 MB'); return }
    if (!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(file.type)) {
      setError(lang === 'bg' ? 'Само PNG, JPG, WebP или SVG' : 'PNG, JPG, WebP or SVG only'); return
    }
    setError('')
    setUploading(true)

    setPreview(URL.createObjectURL(file))

    const ext  = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('ranking-icons').upload(path, file, { upsert: true })

    if (upErr) { setError(upErr.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage
      .from('ranking-icons').getPublicUrl(path)

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
      <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-mid)' }}>
        {preview
          ? <img src={preview} alt="" className="w-full h-full object-contain p-1" />
          : <span className="text-2xl">🏅</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <button type="button" onClick={() => inputRef.current?.click()}
            disabled={uploading} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-50">
            {uploading ? 'Uploading…' : preview ? lang === 'bg' ? 'Смени иконата' : 'Change icon' : lang === 'bg' ? 'Качи икона' : 'Upload icon'}
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

const EMPTY = { type: '', type_bg: '', message: '', message_bg: '', icon_url: '' }

function RankingForm({ initial = EMPTY, onSave, onCancel, saving, lang = 'en' }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="card flex flex-col gap-4 border-brand-200" style={{ borderColor: 'rgba(29,158,117,0.4)' }}>
      <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
        {initial.id ? (lang === 'bg' ? 'Редактирай ранг' : 'Edit ranking') : (lang === 'bg' ? 'Нов ранг' : 'New ranking')}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Type (EN) *</label>
          <input className="input" value={form.type} onChange={e => set('type', e.target.value)} placeholder="e.g. Bronze" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Type (BG) *</label>
          <input className="input" value={form.type_bg} onChange={e => set('type_bg', e.target.value)} placeholder="напр. Бронзов" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Message (EN)</label>
          <input className="input" value={form.message} onChange={e => set('message', e.target.value)} placeholder="Congratulations!…" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Message (BG)</label>
          <input className="input" value={form.message_bg} onChange={e => set('message_bg', e.target.value)} placeholder="Поздравления!…" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Ranking icon</label>
          <RankingIconUpload
            currentUrl={form.icon_url || ''}
            onUploaded={url => set('icon_url', url)}
            lang={lang}
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary text-sm px-4">Cancel</button>
        <button type="button" disabled={!form.type || !form.type_bg || saving}
          onClick={() => onSave(form)}
          className="btn-primary text-sm px-4 disabled:opacity-50">
          {saving ? (lang === 'bg' ? 'Запазване…' : 'Saving…') : (lang === 'bg' ? 'Запази ранг' : 'Save ranking')}
        </button>
      </div>
    </div>
  )
}

export default function AdminRankings() {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const { user } = useAuthStore()
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)   // null | 'new' | row object
  const [saving, setSaving]   = useState(false)
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
    const { data } = await supabase.from('rankings').select('*').order('created_at')
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveRow = async (form) => {
    setSaving(true)
    const payload = {
      type: form.type, type_bg: form.type_bg,
      message: form.message || null, message_bg: form.message_bg || null,
      icon_url: form.icon_url || null,
      updated_by: user.id,
    }
    let error
    if (form.id) {
      ;({ error } = await supabase.from('rankings').update(payload).eq('id', form.id))
    } else {
      ;({ error } = await supabase.from('rankings').insert(payload))
    }
    if (error) flash(error.message, 'error')
    else { flash(lang === 'bg' ? 'Запазено!' : 'Saved!'); setEditing(null); await load() }
    setSaving(false)
  }

  const deleteRow = (row) => {
    setConfirm({
      title: `Delete "${row.type}"?`,
      message: lang === 'bg' ? 'Рангът ще бъде премахнат. Доброволците с този ранг ще запазят ID-то, но то ще се показва като липсващо.' : 'This will remove the ranking. Volunteers with this rank will keep the ID but it will show as missing.',
      confirmLabel: lang === 'bg' ? 'Изтрий' : 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        const { error } = await supabase.from('rankings').delete().eq('id', row.id)
        if (error) flash(error.message, 'error')
        else { flash(lang === 'bg' ? 'Изтрито' : 'Deleted'); await load() }
      },
    })
  }

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
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>{lang === 'bg' ? 'Рангове' : 'Rankings'}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage volunteer ranking tiers and their icons</p>
        </div>
        {editing !== 'new' && (
          <button type="button" onClick={() => setEditing('new')} className="btn-primary text-sm">
            + New ranking
          </button>
        )}
      </div>

      {/* New form */}
      {editing === 'new' && (
        <div className="mb-5">
          <RankingForm onSave={saveRow} onCancel={() => setEditing(null)} saving={saving} />
        </div>
      )}

      {/* List */}
      {loading && <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Loading…</p>}
      <div className="flex flex-col gap-3">
        {rows.map(row => (
          <div key={row.id}>
            {editing?.id === row.id ? (
              <RankingForm initial={editing} onSave={saveRow} onCancel={() => setEditing(null)} saving={saving} />
            ) : (
              <div className="card flex items-center gap-4 flex-wrap">
                {/* Icon */}
                {row.icon_url
                  ? <img src={row.icon_url} alt={row.type} className="w-12 h-12 object-contain shrink-0" />
                  : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background: 'var(--bg-subtle)' }}>🏅</div>}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{row.type}</span>
                    <span className="text-xs" style={{ color: 'var(--text-faint)' }}>/</span>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{row.type_bg}</span>
                  </div>
                  {row.message && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{row.message}</p>}
                  {row.message_bg && <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>{row.message_bg}</p>}
                  <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                    Updated {new Date(row.updated_at).toLocaleDateString('en-GB')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => setEditing(row)}
                    className="btn-secondary text-xs py-1.5 px-3">{lang === 'bg' ? 'Редактирай' : 'Edit'}</button>
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
