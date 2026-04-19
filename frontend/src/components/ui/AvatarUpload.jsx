import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export default function AvatarUpload({ size = 'lg', lang = 'en' }) {
  const { user, profile, updateProfile } = useAuthStore()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const inputRef = useRef(null)

  const sizeMap = {
    sm: 'w-12 h-12 text-base',
    md: 'w-16 h-16 text-xl',
    lg: 'w-24 h-24 text-3xl',
  }
  const avatarSize = sizeMap[size] || sizeMap.lg

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase()

  const avatarUrl = preview || profile?.avatar_url

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB')
      return
    }

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Only JPG, PNG, WebP or GIF allowed')
      return
    }

    setError('')
    setUploading(true)

    try {
      // Show local preview immediately
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)

      // Upload to Supabase Storage: avatars/{user_id}/avatar.{ext}
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      // Save URL to profile (add cache-busting so browser refreshes)
      const urlWithBust = `${publicUrl}?t=${Date.now()}`
      await updateProfile({ avatar_url: urlWithBust })
      setPreview(urlWithBust)

    } catch (err) {
      setError(err.message)
      setPreview(null)
    } finally {
      setUploading(false)
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    if (!profile?.avatar_url) return
    setUploading(true)
    try {
      // Delete from storage
      const path = `${user.id}/avatar`
      await supabase.storage.from('avatars').remove([
        `${user.id}/avatar.jpg`,
        `${user.id}/avatar.jpeg`,
        `${user.id}/avatar.png`,
        `${user.id}/avatar.webp`,
        `${user.id}/avatar.gif`,
      ])
      // Clear from profile
      await updateProfile({ avatar_url: null })
      setPreview(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar circle */}
      <div className="relative group">
        <div className={`${avatarSize} rounded-2xl overflow-hidden bg-brand-50 flex items-center justify-center font-medium text-brand-600 shrink-0`}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
              onError={() => setPreview(null)}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* Overlay on hover */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span className="text-white text-xs font-medium">Change</span>
            </>
          )}
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs text-brand-400 hover:text-brand-600 font-medium transition-colors"
        >
          {uploading ? (lang === 'bg' ? 'Качване...' : 'Uploading...') : avatarUrl ? (lang === 'bg' ? 'Смени снимката' : 'Change photo') : (lang === 'bg' ? 'Качи снимка' : 'Upload photo')}
        </button>
        {avatarUrl && !uploading && (
          <>
            <span className="text-gray-200">·</span>
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
            >
              {lang === 'bg' ? 'Премахни' : 'Remove'}
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}

      <p className="text-xs text-gray-400 text-center">
        JPG, PNG or WebP · Max 2MB
      </p>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
