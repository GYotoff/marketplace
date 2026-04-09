import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const VIS = [
  { value: 'public',     label: 'Public',           desc: 'Visible to everyone', icon: '🌐' },
  { value: 'registered', label: 'Registered users', desc: 'Logged-in users only', icon: '🔒' },
  { value: 'hidden',     label: 'Hidden',            desc: 'Not visible (draft)',  icon: '👁' },
]

const FIELDS = [
  { key: 'description',    label: 'Description (EN)',           type: 'textarea' },
  { key: 'description_bg', label: 'Description (BG)',           type: 'textarea' },
  { key: 'tagline',        label: 'Tagline (EN)',                type: 'text' },
  { key: 'tagline_bg',     label: 'Tagline (BG)',                type: 'text' },
  { key: 'mission',        label: 'CSR Mission statement',       type: 'textarea' },
  { key: 'cover_url',      label: 'Cover image URL',             type: 'url' },
  { key: 'video_url',      label: 'Video URL (YouTube / Vimeo)', type: 'url' },
  { key: 'facebook_url',   label: 'Facebook URL',                type: 'url' },
  { key: 'instagram_url',  label: 'Instagram URL',               type: 'url' },
  { key: 'linkedin_url',   label: 'LinkedIn URL',                type: 'url' },
  { key: 'website',        label: 'Website',                     type: 'url' },
]

function FieldEditor({ field, value, visibility, isPublished, onSave }) {
  const [val, setVal] = useState(value || '')
  const [vis, setVis] = useState(visibility || 'public')
  const [pub, setPub] = useState(isPublished || false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [open, setOpen]     = useState(false)

  const dirty = val !== (value || '') || vis !== (visibility || 'public') || pub !== (isPublished || false)
  const currentVis = VIS.find(o => o.value === vis)

  const handleSave = async () => {
    setSaving(true)
    await onSave(field.key, val, vis, pub)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={'border rounded-xl transition-all ' + (open ? 'border-brand-200 shadow-sm' : 'border-gray-100')}>
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer select-none" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-3">
          <span className={'w-2 h-2 rounded-full shrink-0 ' + (pub ? 'bg-brand-400' : 'bg-gray-300')} />
          <div>
            <p className="text-sm font-medium text-gray-900">{field.label}</p>
            <p className="text-xs text-gray-400">
              {currentVis && currentVis.icon} {currentVis && currentVis.label} · {pub ? 'Published' : 'Draft'}
              {val ? ' · ' + val.slice(0, 40) + (val.length > 40 ? '…' : '') : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs text-amber-500 font-medium">Unsaved</span>}
          {saved && <span className="text-xs text-brand-500 font-medium">Saved ✓</span>}
          <svg className={'w-4 h-4 text-gray-400 transition-transform ' + (open ? 'rotate-180' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-gray-100 pt-3">
          {field.type === 'textarea'
            ? <textarea rows={4} className="input resize-none text-sm" value={val} onChange={e => setVal(e.target.value)} placeholder={'Enter ' + field.label.toLowerCase() + '…'} />
            : <input type={field.type} className="input text-sm" value={val} onChange={e => setVal(e.target.value)} placeholder={'Enter ' + field.label.toLowerCase() + '…'} />
          }
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Visibility</p>
            <div className="flex flex-col gap-2">
              {VIS.map(opt => (
                <label key={opt.value} className={'flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ' + (vis === opt.value ? 'border-brand-300 bg-brand-50' : 'border-gray-100 hover:border-gray-200')}>
                  <input type="radio" name={'vis-' + field.key} value={opt.value} checked={vis === opt.value} onChange={() => setVis(opt.value)} className="mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-700">{opt.icon} {opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Published</p>
              <p className="text-xs text-gray-400">When off, hidden from the portal</p>
            </div>
            <button type="button" onClick={() => setPub(p => !p)} className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors ' + (pub ? 'bg-brand-400' : 'bg-gray-200')}>
              <span className={'inline-block h-4 w-4 transform rounded-full bg-white transition-transform ' + (pub ? 'translate-x-6' : 'translate-x-1')} />
            </button>
          </div>
          <button onClick={handleSave} disabled={saving || !dirty} className={'btn-primary text-sm flex items-center justify-center gap-2 ' + (!dirty && !saving ? 'opacity-50 cursor-not-allowed' : '')}>
            {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function CorpContentEditor() {
  const { user } = useAuthStore()
  const [corp, setCorp] = useState(null)
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [user])

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data: row } = await supabase.from('corporation_members').select('corporation_id').eq('profile_id', user.id).eq('role', 'admin').eq('request_status', 'approved').single()
    if (!row) { setLoading(false); return }
    const [{ data: corpData }, { data: rows }] = await Promise.all([
      supabase.from('corporations').select('*').eq('id', row.corporation_id).single(),
      supabase.from('corp_content').select('*').eq('corporation_id', row.corporation_id),
    ])
    setCorp(corpData)
    const map = {}
    ;(rows || []).forEach(r => { map[r.field_name] = r })
    setContent(map)
    setLoading(false)
  }

  const handleSave = async (fieldName, value, visibility, isPublished) => {
    if (!corp) return
    await supabase.from('corp_content').upsert({ corporation_id: corp.id, field_name: fieldName, field_value: value, visibility, is_published: isPublished, updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: 'corporation_id,field_name' })
    setContent(prev => ({ ...prev, [fieldName]: { ...prev[fieldName], field_value: value, visibility, is_published: isPublished } }))
  }

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>
  if (!corp) return <div className="max-w-lg mx-auto px-4 py-16 text-center"><p className="text-gray-500 mb-4">You are not an admin of any corporation.</p><Link to="/corporations/register" className="btn-primary">Register a corporation</Link></div>

  const publishedCount = Object.values(content).filter(f => f.is_published).length

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Content editor</h1>
          <p className="text-sm text-gray-500 mt-0.5">{corp.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500"><span className="font-medium text-brand-400">{publishedCount}</span> fields published</span>
          <Link to={'/corporations/' + corp.slug} target="_blank" className="btn-secondary text-sm">Preview →</Link>
        </div>
      </div>
      {corp.status === 'pending' && <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-700">Pending approval — content won't be visible until approved.</div>}
      <div className="flex flex-col gap-3">
        {FIELDS.map(field => (
          <FieldEditor key={field.key} field={field} value={(content[field.key] && content[field.key].field_value) || ''} visibility={(content[field.key] && content[field.key].visibility) || 'public'} isPublished={(content[field.key] && content[field.key].is_published) || false} onSave={handleSave} />
        ))}
      </div>
    </div>
  )
}
