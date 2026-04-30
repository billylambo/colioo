'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) { setChecked(true); return }

    const checkAuth = async () => {
      try {
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 3000))
        const authPromise = supabase.auth.getUser()
        const result = await Promise.race([authPromise, timeoutPromise])
        if (result && typeof result === 'object' && 'data' in result) {
          const { data: { user } } = result as { data: { user: unknown } }
          if (!user) { router.push('/admin/login'); return }
        }
      } catch (err) {
        console.error('Auth check failed:', err)
      } finally {
        setChecked(true)
      }
    }

    checkAuth()
  }, [router, isLoginPage])

  if (!checked) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2F2F7' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', borderWidth: 3, borderStyle: 'solid', borderColor: '#FF2D55 transparent transparent transparent', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (isLoginPage) return <>{children}</>

  return <>{children}</>
}