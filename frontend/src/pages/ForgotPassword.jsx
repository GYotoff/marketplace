import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-gray-900">Reset your password</h1>
          <p className="text-gray-500 text-sm mt-1">We'll send you a link to reset it</p>
        </div>

        {done ? (
          <div className="card text-center">
            <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <p className="text-gray-700 font-medium mb-1">Check your inbox</p>
            <p className="text-sm text-gray-500 mb-5">We sent a reset link to <strong>{email}</strong></p>
            <Link to="/login" className="btn-primary block">Back to login</Link>
          </div>
        ) : (
          <div className="card">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input type="email" required className="input" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
            <p className="text-sm text-gray-500 text-center mt-4">
              <Link to="/login" className="text-brand-400 hover:text-brand-600">Back to login</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
