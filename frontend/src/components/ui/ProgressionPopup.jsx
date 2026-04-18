import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

/**
 * ProgressionPopup
 * - On mount: checks profile.pending_notifications (catches login-time notifications)
 * - Realtime subscription: listens for DB-pushed updates to pending_notifications
 *   so the popup fires immediately when an org admin confirms attendance,
 *   without requiring a page refresh.
 */
export default function ProgressionPopup() {
  const { profile, user, updateProfile } = useAuthStore()
  const [items,   setItems]   = useState([])
  const [visible, setVisible] = useState(false)
  const shownRef = useRef(new Set())   // track notification IDs already shown

  const lang = typeof window !== 'undefined'
    ? (localStorage.getItem('i18nextLng') === 'bg' ? 'bg' : 'en')
    : 'en'

  // ── Show notifications and clear from DB ────────────────────────────────────
  const handleNotifications = async (notifs) => {
    if (!Array.isArray(notifs) || notifs.length === 0) return

    // Filter out already-shown ones (guard against duplicate fires)
    const fresh = notifs.filter(n => !shownRef.current.has(n.id))
    if (fresh.length === 0) return

    fresh.forEach(n => shownRef.current.add(n.id))
    setItems(fresh)
    setVisible(true)

    // Clear from DB and local store
    await supabase.rpc('clear_pending_notifications')
    updateProfile({ pending_notifications: [] }).catch(() => {})
  }

  // ── On mount / profile load: check existing pending notifications ────────────
  useEffect(() => {
    if (!profile?.pending_notifications?.length) return
    handleNotifications(profile.pending_notifications)
  }, [profile?.id]) // Only on profile load, not every render

  // ── Realtime: subscribe to profile row changes ─────────────────────────────
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`profile-progress-${user.id}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const notifs = payload.new?.pending_notifications
          if (notifs?.length > 0) {
            handleNotifications(notifs)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  const dismiss = () => setVisible(false)
  if (!visible || items.length === 0) return null

  const rankings     = items.filter(i => i.type === 'ranking')
  const achievements = items.filter(i => i.type === 'achievement')

  const L = {
    title:      lang === 'bg' ? '🎉 Нови постижения!'  : '🎉 New achievements!',
    newRanking: lang === 'bg' ? 'Нов ранг'             : 'New ranking',
    newAchieve: lang === 'bg' ? 'Ново постижение'      : 'New achievement',
    dismiss:    lang === 'bg' ? 'Затвори'               : 'Dismiss',
    subtitle:   lang === 'bg' ? 'Вашите усилия дадоха плод!' : 'Your hard work is paying off!',
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={dismiss}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-2xl mb-1">🏆</p>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{L.title}</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{L.subtitle}</p>
        </div>

        {/* Items */}
        <div className="px-6 py-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">

          {/* Rankings first */}
          {rankings.map((item, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl p-3"
              style={{ background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.2)' }}>
              {item.icon_url
                ? <img src={item.icon_url} alt={item.name} className="w-14 h-14 object-contain shrink-0" />
                : <span className="text-4xl">🥇</span>}
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-0.5">
                  {L.newRanking}
                </p>
                <p className="font-bold text-base" style={{ color: 'var(--text)' }}>
                  {lang === 'bg' ? (item.name_bg || item.name) : item.name}
                </p>
                <p className="text-sm mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                  {lang === 'bg' ? (item.message_bg || item.message) : item.message}
                </p>
              </div>
            </div>
          ))}

          {/* Achievements */}
          {achievements.map((item, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl p-3"
              style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.25)' }}>
              {item.icon_url
                ? <img src={item.icon_url} alt={item.name}
                    className="w-12 h-12 object-contain rounded-lg shrink-0"
                    style={{ background: 'var(--bg-subtle)' }} />
                : <span className="text-4xl shrink-0">🎖️</span>}
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest mb-0.5"
                  style={{ color: '#c9a200' }}>{L.newAchieve}</p>
                <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                  {lang === 'bg' ? (item.name_bg || item.name) : item.name}
                </p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                  {lang === 'bg' ? (item.message_bg || item.message) : item.message}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <button type="button" onClick={dismiss} className="btn-primary w-full">
            {L.dismiss}
          </button>
        </div>
      </div>
    </div>
  )
}
