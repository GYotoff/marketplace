import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', desc: 'Visible to everyone including non-registered users', icon: '🌐' },
  { value: 'registered', label: 'Registered users', desc: 'Visible only to logged-in volunteers, orgs and corps', icon: '🔒' },
  { value: 'hidden', label: 'Hidden', desc: 'Not visible in the portal (draft)', icon: '👁' },
]

const CONTENT_FIELDS = [
  { key: 'description', label: 'Description (EN)', type: 'textarea', required: true },
  { key: 'description_bg', label: 'Description (BG)', type: 'textarea' },
  { key: 'tagline', label: 'Tagline (EN)', type: 'text' },
  { key: 'tagline_bg', label: 'Tagline (BG)', type: 'text' },
  { key: 'mission', label: 'Mission statement', type: 'textarea' },
  { key: 'cover_url', label: 'Cover image URL', type: 'url' },
  { key: 'video_url', label: 'Video URL (YouTube / Vimeo)', type: 'url' },
  { key: 'facebook_url', label: 'Facebook URL', type: 'url' },
  { key: 'instagram_url', label: 'Instagram URL', type: 'url' },
  { key: 'linkedin_url', label: 'LinkedIn URL', type: 'url' },
  { key: 'website', label: 'Website', type: 'url' },
]

function ContentField({ field, value, visibility, isPublished, onSave }) {
  const [localValue, setLocalValue] = useState(value || '')
  const [localVis, setLocalVis] = useState(visibility || 'public')
  const [localPublished, setLocalPublished] = useState(isPublished ?? false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const isDirty = localValue !== (value || '') || localVis !== (visibility || 'public') || localPublished !== (isPublished ?? false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(field.key, localValue, localVis, localPublished)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const visLabel = VISIBILITY_OPTIONS.find(v => v.value === localVis)

  return (
    <div className={`border rounded-xl transition-all ${expanded ? 'border-brand-200 shadow-sm' : 'border-gray-100'}`}>
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full shrink-0 ${localPublished ? 'bg-brand-400' : 'bg-gray-300'}`} />
          <div>
            <p className="text-sm font-medium text-gray-900">{field.label}</p>
            <p className="text-xs text-gray-400">
              {visLabel?.icon} {visLabel?.label} · {localPublished ? 'Published' : 'Draft'}
              {localValue && ` · ${localValue.slice(0, 40)}${localValue.length > 40 ? '...' : ''}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && <span className="text-xs text-amber-500 font-medium">Unsaved</span>}
          {saved && <span className="text-xs text-brand-500 font-medium">Saved ✓</span>}
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-gray-100 pt-3">
          {/* Value editor */}
          {field.type === 'textarea' ? (
            <textarea rows={4} className="input resize-none text-sm"
              placeholder={`Enter ${field.label.toLowerCase()}...`}
              value={localValue} onChange={e => setLocalValue(e.target.value)} />
          ) : (
            <input type={field.type} className="input text-sm"
              placeholder={`Enter ${field.label.toLowerCase()}...`}
              value={localValue} onChange={e => setLocalValue(e.target.value)} />
          )}

          {/* Visibility selector */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Visibility</p>
            <div className="flex flex-col gap-2">
              {VISIBILITY_OPTIONS.map(opt => (
                <label key={opt.value}
                  className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    localVis === opt.value ? 'border-brand-300 bg-brand-50' : 'border-gray-100 hover:border-gray-200'
                  }`}>
                  <input type="radio" name={`vis-${field.key}`} value={opt.value}
                    checked={localVis === opt.value} onChange={() => setLocalVis(opt.value)} className="mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-700">{opt.icon} {opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Published toggle */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Published</p>
              <p className="text-xs text-gray-400">When off, this field is not visible in the portal</p>
            </div>
            <button
              type="button"
              onClick={() => setLocalPublished(!localPublished)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localPublished ? 'bg-brand-400' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localPublished ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Save button */}
          <button onClick={handleSave} disabled={saving || !isDirty}
            className={`btn-primary text-sm flex items-center justify-center gap-2 ${(!isDirty && !saving) ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function OrgContentEditor() {
  const { user } = useAuthStore()
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [org, setOrg] = useState(null)
  const [contentMap, setContentMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return
    setLoading(true)

    // Find org membership
    const { data: memberRow } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('profile_id', user.id)
      .in('role', ['admin', 'content_creator'])
      .single()

    if (!memberRow) { setLoading(false); return }
    setUserRole(memberRow.role)

    const [orgRes, contentRes] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', memberRow.organization_id).single(),
      supabase.from('org_content').select('*').eq('organization_id', memberRow.organization_id),
    ])

    setOrg(orgRes.data)

    // Build content map by field_name
    const map = {}
    ;(contentRes.data || []).forEach(c => { map[c.field_name] = c })
    setContentMap(map)
    setLoading(false)
  }

  const handleSave = async (fieldName, value, visibility, isPublished) => {
    if (!org) return
    await supabase.from('org_content').upsert({
      organization_id: org.id,
      field_name: fieldName,
      field_value: value,
      visibility,
      is_published: isPublished,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,field_name' })

    setContentMap(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], field_value: value, visibility, is_published: isPublished }
    }))
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!org) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-gray-500 mb-4">You are not a member of any organization.</p>
      <Link to="/organizations/register" className="btn-primary">Register an organization</Link>
    </div>
  )

  const publishedCount = Object.values(contentMap).filter(c => c.is_published).length

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Content editor</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {org.name} · <span className="capitalize">{userRole?.replace('_', ' ')}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            <span className="font-medium text-brand-400">{publishedCount}</span> fields published
          </div>
          <Link to={`/organizations/${org.slug}`} target="_blank" className="btn-secondary text-sm">
            Preview →
          </Link>
        </div>
      </div>

      {org.status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-700">
          Your organization is pending approval. Content changes are saved but won't be visible in the portal until approved.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {CONTENT_FIELDS.map(field => (
          <ContentField
            key={field.key}
            field={field}
            value={contentMap[field.key]?.field_value || ''}
            visibility={contentMap[field.key]?.visibility || 'public'}
            isPublished={contentMap[field.key]?.is_published ?? false}
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  )
}
