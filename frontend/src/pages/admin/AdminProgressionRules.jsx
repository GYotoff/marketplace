import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from 'react-i18next'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const METRICS = [
  { key: 'confirmed_events', label: 'Confirmed events',   labelBg: 'Потвърдени събития' },
  { key: 'total_hours',      label: 'Total hours',        labelBg: 'Общо часове' },
  { key: 'months_active',    label: 'Months active',      labelBg: 'Месеци активност' },
  { key: 'profile_complete', label: 'Profile complete',   labelBg: 'Пълен профил (0/1)' },
]
const OPERATORS = ['>=', '>', '=']
const EMPTY_FORM = { entity_type: 'ranking', entity_id: '', trigger_metric: 'confirmed_events', threshold: '', operator: '>=' }

function RuleForm({ initial = EMPTY_FORM, rankings, achievements, onSave, onCancel, saving, lang = 'en' }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const entityOptions = form.entity_type === 'ranking' ? rankings : achievements
  const entityLabel   = form.entity_type === 'ranking' ? 'Ranking' : 'Achievement'

  return (
    <div className="card flex flex-col gap-4" style={{ borderColor: 'rgba(29,158,117,0.4)' }}>
      <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
        {initial.id ? (lang === 'bg' ? 'Редактирай правило' : 'Edit rule') : (lang === 'bg' ? 'Ново правило' : 'New rule')}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Type</label>
          <select className="input" value={form.entity_type}
            onChange={e => set('entity_type', e.target.value)}>
            <option value="ranking">Ranking</option>
            <option value="achievement">Achievement</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{entityLabel}</label>
          <select className="input" value={form.entity_id}
            onChange={e => set('entity_id', e.target.value)}>
            <option value="">{lang === 'bg' ? '— избери —' : '— select —'}</option>
            {entityOptions.map(e => (
              <option key={e.id} value={e.id}>{e.type || e.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Trigger metric</label>
          <select className="input" value={form.trigger_metric}
            onChange={e => set('trigger_metric', e.target.value)}>
            {METRICS.map(m => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="w-24 shrink-0">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Operator</label>
            <select className="input" value={form.operator} onChange={e => set('operator', e.target.value)}>
              {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Threshold</label>
            <input type="number" className="input" value={form.threshold}
              onChange={e => set('threshold', e.target.value)} placeholder="e.g. 5" min="0" step="0.5" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_active" checked={form.is_active !== false}
            onChange={e => set('is_active', e.target.checked)} className="rounded" />
          <label htmlFor="is_active" className="text-sm" style={{ color: 'var(--text-muted)' }}>Active</label>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary text-sm px-4">{lang === 'bg' ? 'Отказ' : 'Cancel'}</button>
        <button type="button"
          disabled={!form.entity_id || form.threshold === '' || saving}
          onClick={() => onSave(form)}
          className="btn-primary text-sm px-4 disabled:opacity-50">
          {saving ? (lang === 'bg' ? 'Запазване…' : 'Saving…') : (lang === 'bg' ? 'Запази правило' : 'Save rule')}
        </button>
      </div>
    </div>
  )
}

export default function AdminProgressionRules() {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const { user } = useAuthStore()
  const [rules,        setRules]    = useState([])
  const [rankings,     setRankings] = useState([])
  const [achievements, setAchievs]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [editing,  setEditing]  = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [confirm,  setConfirm]  = useState(null)
  const [toast,    setToast]    = useState(null)
  const timerRef = useRef(null)

  const flash = (msg, type = 'ok') => {
    setToast({ msg, type })
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setToast(null), 3000)
  }

  const load = async () => {
    setLoading(true)
    const [{ data: r }, { data: rk }, { data: ach }] = await Promise.all([
      supabase.from('progression_rules').select('*').order('entity_type').order('created_at'),
      supabase.from('rankings').select('id,type,type_bg,icon_url').order('created_at'),
      supabase.from('achievements').select('id,name,name_bg,badge_url').order('name'),
    ])
    setRules(r || [])
    setRankings(rk || [])
    setAchievs(ach || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveRule = async (form) => {
    setSaving(true)
    const payload = {
      entity_type:    form.entity_type,
      entity_id:      form.entity_id,
      trigger_metric: form.trigger_metric,
      threshold:      parseFloat(form.threshold),
      operator:       form.operator,
      is_active:      form.is_active !== false,
      updated_by:     user.id,
    }
    const { error } = form.id
      ? await supabase.from('progression_rules').update(payload).eq('id', form.id)
      : await supabase.from('progression_rules').insert(payload)
    if (error) flash(error.message, 'error')
    else { flash(lang === 'bg' ? 'Запазено!' : 'Saved!'); setEditing(null); await load() }
    setSaving(false)
  }

  const toggleActive = async (rule) => {
    await supabase.from('progression_rules').update({ is_active: !rule.is_active }).eq('id', rule.id)
    await load()
  }

  const deleteRule = (rule) => {
    setConfirm({
      title: lang === 'bg' ? 'Изтрий правило?' : 'Delete rule?',
      message: `Remove the rule for "${rule.entity_type}" threshold ${rule.operator} ${rule.threshold}?`,
      confirmLabel: lang === 'bg' ? 'Изтрий' : 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        await supabase.from('progression_rules').delete().eq('id', rule.id)
        flash(lang === 'bg' ? 'Изтрито' : 'Deleted')
        await load()
      },
    })
  }

  const getEntityName = (rule) => {
    if (rule.entity_type === 'ranking') {
      const r = rankings.find(x => x.id === rule.entity_id)
      return r ? r.type : rule.entity_id
    }
    const a = achievements.find(x => x.id === rule.entity_id)
    return a ? a.name : rule.entity_id
  }

  const getEntityIcon = (rule) => {
    if (rule.entity_type === 'ranking') {
      const r = rankings.find(x => x.id === rule.entity_id)
      return r?.icon_url ? <img src={r.icon_url} alt="" className="w-8 h-8 object-contain" /> : '🏅'
    }
    const a = achievements.find(x => x.id === rule.entity_id)
    return a?.badge_url
      ? <img src={a.badge_url} alt="" className="w-8 h-8 object-contain rounded" />
      : '🎖️'
  }

  const metricLabel = (m) => METRICS.find(x => x.key === m)?.label || m

  const rankingRules     = rules.filter(r => r.entity_type === 'ranking')
  const achievementRules = rules.filter(r => r.entity_type === 'achievement')

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white
          ${toast.type === 'error' ? 'bg-red-500' : 'bg-brand-400'}`}>
          {toast.msg}
        </div>
      )}
      <ConfirmDialog config={confirm} onClose={() => setConfirm(null)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Progression rules</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Define when rankings and achievements are automatically awarded to volunteers
          </p>
        </div>
        {editing !== 'new' && (
          <button type="button" onClick={() => setEditing('new')} className="btn-primary text-sm">
            + New rule
          </button>
        )}
      </div>

      {/* Metric legend */}
      <div className="card mb-6 mt-4 p-4">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>Available metrics</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {METRICS.map(m => (
            <div key={m.key} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <code className="font-mono text-brand-400">{m.key}</code>
              <span>— {m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* New rule form */}
      {editing === 'new' && (
        <div className="mb-5">
          <RuleForm rankings={rankings} achievements={achievements}
            onSave={saveRule} onCancel={() => setEditing(null)} saving={saving} lang={lang} />
        </div>
      )}

      {loading && <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Loading…</p>}

      {/* Ranking rules */}
      {rankingRules.length > 0 && (
        <section className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-faint)' }}>
            Ranking rules ({rankingRules.length})
          </p>
          <div className="flex flex-col gap-2">
            {rankingRules.map(rule => (
              <div key={rule.id}>
                {editing?.id === rule.id ? (
                  <RuleForm initial={editing} rankings={rankings} achievements={achievements}
                    onSave={saveRule} onCancel={() => setEditing(null)} saving={saving} lang={lang} />
                ) : (
                  <div className="card flex items-center gap-3 flex-wrap py-3 px-4"
                    style={{ opacity: rule.is_active ? 1 : 0.5 }}>
                    <div className="shrink-0">{getEntityIcon(rule)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                          {getEntityName(rule)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-mono"
                          style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                          {metricLabel(rule.trigger_metric)} {rule.operator} {rule.threshold}
                        </span>
                        {!rule.is_active && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>inactive</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button type="button" onClick={() => toggleActive(rule)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors"
                        style={{ borderColor: 'var(--border-mid)', color: 'var(--text-muted)' }}>
                        {rule.is_active ? lang === 'bg' ? 'Пауза' : 'Pause' : lang === 'bg' ? 'Активирай' : 'Activate'}
                      </button>
                      <button type="button" onClick={() => setEditing(rule)}
                        className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                      <button type="button" onClick={() => deleteRule(rule)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors"
                        style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>✕</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Achievement rules */}
      {achievementRules.length > 0 && (
        <section>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-faint)' }}>
            Achievement rules ({achievementRules.length})
          </p>
          <div className="flex flex-col gap-2">
            {achievementRules.map(rule => (
              <div key={rule.id}>
                {editing?.id === rule.id ? (
                  <RuleForm initial={editing} rankings={rankings} achievements={achievements}
                    onSave={saveRule} onCancel={() => setEditing(null)} saving={saving} lang={lang} />
                ) : (
                  <div className="card flex items-center gap-3 flex-wrap py-3 px-4"
                    style={{ opacity: rule.is_active ? 1 : 0.5 }}>
                    <div className="shrink-0">{getEntityIcon(rule)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                          {getEntityName(rule)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-mono"
                          style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                          {metricLabel(rule.trigger_metric)} {rule.operator} {rule.threshold}
                        </span>
                        {!rule.is_active && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>inactive</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button type="button" onClick={() => toggleActive(rule)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors"
                        style={{ borderColor: 'var(--border-mid)', color: 'var(--text-muted)' }}>
                        {rule.is_active ? lang === 'bg' ? 'Пауза' : 'Pause' : lang === 'bg' ? 'Активирай' : 'Activate'}
                      </button>
                      <button type="button" onClick={() => setEditing(rule)}
                        className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                      <button type="button" onClick={() => deleteRule(rule)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors"
                        style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>✕</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
