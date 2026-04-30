'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Email ou mot de passe incorrect')
      } else {
        router.refresh()
        router.push('/admin')
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#FF6B00,#FF6B00bb)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>🛍️</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#FF6B00', fontFamily: 'Poppins, sans-serif', marginBottom: 6 }}>COLIOO Admin</h1>
          <p style={{ color: '#6B6B6B', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>Connexion à votre espace administrateur</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>

          {/* Erreur */}
          {error && (
            <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 12, padding: '12px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span style={{ color: '#DC2626', fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0D0D0D', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@colioo.ci"
                style={{ width: '100%', height: 50, borderRadius: 14, border: '1.5px solid #E5E5EA', padding: '0 16px', fontSize: 15, fontFamily: 'Inter, sans-serif', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box', transition: 'border .2s' }}
                onFocus={e => e.target.style.border = '1.5px solid #FF6B00'}
                onBlur={e => e.target.style.border = '1.5px solid #E5E5EA'}
              />
            </div>

            {/* Mot de passe */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0D0D0D', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{ width: '100%', height: 50, borderRadius: 14, border: '1.5px solid #E5E5EA', padding: '0 50px 0 16px', fontSize: 15, fontFamily: 'Inter, sans-serif', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box', transition: 'border .2s' }}
                  onFocus={e => e.target.style.border = '1.5px solid #FF6B00'}
                  onBlur={e => e.target.style.border = '1.5px solid #E5E5EA'}
                />
                {/* Bouton voir/cacher */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showPassword ? (
                    // Oeil barré — cacher
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2" strokeLinecap="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    // Oeil — voir
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', height: 52, borderRadius: 14, background: loading ? '#AEAEB2' : 'linear-gradient(135deg,#FF6B00,#FF6B00cc)', border: 'none', color: '#fff', fontSize: 16, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .2s', position: 'relative', overflow: 'hidden' }}
            >
              {loading ? '⏳ Connexion...' : '🔐 Se connecter'}
            </button>

          </form>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 20, color: '#AEAEB2', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
          COLIOO © 2026 Accès réservé aux administrateurs
        </p>

      </div>
    </div>
  )
}