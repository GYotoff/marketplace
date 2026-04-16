import { useEffect } from 'react'

/**
 * ConfirmDialog — reusable confirmation popup
 *
 * Usage:
 *   const [confirm, setConfirm] = useState(null)
 *   // trigger: setConfirm({ title, message, onConfirm, variant: 'danger'|'warning'|'default' })
 *   // in JSX: <ConfirmDialog config={confirm} onClose={() => setConfirm(null)} />
 */
export default function ConfirmDialog({ config, onClose }) {
  useEffect(() => {
    if (!config) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [config, onClose])

  if (!config) return null

  const { title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, variant = 'default' } = config

  const btnClass = {
    danger:  'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    default: 'bg-brand-400 hover:bg-brand-500 text-white',
  }[variant] || 'bg-brand-400 hover:bg-brand-500 text-white'

  const iconBg = {
    danger:  'bg-red-100 text-red-600',
    warning: 'bg-amber-100 text-amber-600',
    default: 'bg-brand-50 text-brand-600',
  }[variant]

  const icons = {
    danger: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
    default: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <div className="rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
            {icons[variant]}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base" style={{ color: 'var(--text)' }}>{title}</h3>
            {message && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{message}</p>}
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose}
            className="btn-secondary text-sm px-4">
            {cancelLabel}
          </button>
          <button onClick={() => { onConfirm(); onClose() }}
            className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors ${btnClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
