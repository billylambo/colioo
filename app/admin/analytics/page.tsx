'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface OrderData {
  id: string
  status: string
  total_price: number
  created_at: string
  product_id: string
}

export default function Analytics() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [accent, setAccent] = useState('#FF6B00')
  const [period, setPeriod] = useState<'7j' | '30j' | 'tout'>('30j')

  const [stats, setStats] = useState({
    totalProducts: 0, totalOrders: 0, nouveaux: 0,
    confirmes: 0, livres: 0, annules: 0,
    revenueConfirme: 0, revenueLivre: 0, revenuePotentiel: 0,
  })
  const [topProducts, setTopProducts] = useState<{ name: string; count: number; revenue: number }[]>([])
  const [recentOrders, setRecentOrders] = useState<{ date: string; count: number; revenue: number }[]>([])

  useEffect(() => { loadAll() }, [period])

  const loadAll = async () => {
    setLoading(true)
    try {
      const { data: settings } = await supabase.from('settings').select('key, value').eq('key', 'primary_color').single()
      if (settings?.value) setAccent(String(settings.value).replace(/^"|"$/g, ''))

      const now = new Date()
      const from = period === '7j'
        ? new Date(now.getTime() - 7 * 86400000).toISOString()
        : period === '30j'
        ? new Date(now.getTime() - 30 * 86400000).toISOString()
        : null

      const { count: prodCount } = await supabase.from('products').select('id', { count: 'exact' }).eq('is_published', true)

      let query = supabase.from('orders').select('id, status, total_price, created_at, product_id')
      if (from) query = query.gte('created_at', from)
      const { data: orders } = await query.order('created_at', { ascending: false })

      const allOrders: OrderData[] = orders || []
      const nouveaux = allOrders.filter(o => o.status === 'nouveau')
      const confirmes = allOrders.filter(o => o.status === 'confirme')
      const livres = allOrders.filter(o => o.status === 'livre')
      const annules = allOrders.filter(o => o.status === 'annule')

      setStats({
        totalProducts: prodCount || 0, totalOrders: allOrders.length,
        nouveaux: nouveaux.length, confirmes: confirmes.length,
        livres: livres.length, annules: annules.length,
        revenueConfirme: confirmes.reduce((a, o) => a + (o.total_price || 0), 0),
        revenueLivre: livres.reduce((a, o) => a + (o.total_price || 0), 0),
        revenuePotentiel: nouveaux.reduce((a, o) => a + (o.total_price || 0), 0),
      })

      const { data: topData } = await supabase
        .from('orders').select('product_id, total_price, products:product_id(name)')
        .in('status', ['confirme', 'livre'])
      if (topData) {
        const grouped: Record<string, { name: string; count: number; revenue: number }> = {}
        for (const o of topData as any[]) {
          const key = o.product_id
          if (!grouped[key]) grouped[key] = { name: o.products?.name || 'Supprimé', count: 0, revenue: 0 }
          grouped[key].count++
          grouped[key].revenue += o.total_price || 0
        }
        setTopProducts(Object.values(grouped).sort((a, b) => b.count - a.count).slice(0, 5))
      }

      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i))
        return d.toISOString().slice(0, 10)
      })
      setRecentOrders(last7.map(date => {
        const dayOrders = allOrders.filter(o => o.created_at.slice(0, 10) === date)
        return {
          date, count: dayOrders.length,
          revenue: dayOrders.filter(o => ['confirme', 'livre'].includes(o.status)).reduce((a, o) => a + (o.total_price || 0), 0),
        }
      }))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const maxRevenue = Math.max(...recentOrders.map(d => d.revenue), 1)
  const maxCount = Math.max(...recentOrders.map(d => d.count), 1)
  const formatDay = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })

  return (
    <>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } @keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ maxWidth: 480, margin: '0 auto', background: '#F2F2F7', minHeight: '100dvh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', paddingBottom: 32 }}>

        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E5E5EA', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 40 }}>
          <button onClick={() => router.push('/admin')} style={{ width: 36, height: 36, borderRadius: '50%', background: '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900 }}>Analytics</div>
            <div style={{ fontSize: 11, color: '#AEAEB2' }}>Vue d'ensemble de votre boutique</div>
          </div>
        </div>

        <div style={{ padding: '12px 12px 0' }}>

          {/* Filtres période */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {(['7j', '30j', 'tout'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ flex: 1, height: 36, borderRadius: 10, border: `1.5px solid ${period === p ? accent : '#E5E5EA'}`, background: period === p ? accent : '#fff', color: period === p ? '#fff' : '#6B6B6B', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
                {p === 'tout' ? 'Tout' : p}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', borderWidth: 3, borderStyle: 'solid', borderColor: `${accent} transparent transparent transparent`, animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            </div>
          ) : (
            <>
              {/* Revenus */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                {[
                  { label: 'Revenus livrés', value: stats.revenueLivre, icon: '✅', color: '#059669', bg: '#ECFDF5' },
                  { label: 'Revenus confirmés', value: stats.revenueConfirme, icon: '🤝', color: '#1E40AF', bg: '#EFF6FF' },
                  { label: 'Potentiel (nouveaux)', value: stats.revenuePotentiel, icon: '⏳', color: '#B45309', bg: '#FFF9E6' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '12px 10px', border: `1px solid ${s.color}22`, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: s.color }}>{s.value >= 1000 ? `${Math.round(s.value / 1000)}k` : s.value.toLocaleString('fr-FR')}</div>
                    <div style={{ fontSize: 9, color: s.color, fontWeight: 700, marginTop: 2 }}>FCFA</div>
                    <div style={{ fontSize: 9, color: s.color, fontWeight: 600, marginTop: 2, lineHeight: 1.3 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Stats commandes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'Produits publiés', value: stats.totalProducts, icon: '📦', color: '#6B6B6B', bg: '#F8F8F8' },
                  { label: 'Total commandes', value: stats.totalOrders, icon: '🛒', color: '#007AFF', bg: '#E8F4FF' },
                  { label: 'Nouveaux', value: stats.nouveaux, icon: '🆕', color: '#B45309', bg: '#FFF9E6' },
                  { label: 'Confirmés', value: stats.confirmes, icon: '✅', color: '#059669', bg: '#ECFDF5' },
                  { label: 'Livrés', value: stats.livres, icon: '🚚', color: '#1E40AF', bg: '#EFF6FF' },
                  { label: 'Annulés', value: stats.annules, icon: '❌', color: '#DC2626', bg: '#FEF2F2' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '12px 10px', border: `1px solid ${s.color}22`, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: s.color, marginTop: 2, lineHeight: 1.3 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Graphique 7 jours */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 16 }}>📈 Commandes — 7 derniers jours</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110 }}>
                  {recentOrders.map((day, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: accent, height: 12 }}>{day.revenue > 0 ? `${Math.round(day.revenue / 1000)}k` : ''}</div>
                      <div style={{ width: '100%', position: 'relative', height: 80, display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 3, height: `${(day.revenue / maxRevenue) * 100}%`, background: accent + '30', borderRadius: '5px 5px 0 0', minHeight: day.revenue > 0 ? 3 : 0 }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 3, right: 0, height: `${(day.count / maxCount) * 100}%`, background: accent, borderRadius: '5px 5px 0 0', minHeight: day.count > 0 ? 3 : 0 }} />
                      </div>
                      <div style={{ fontSize: 9, color: '#AEAEB2', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{formatDay(day.date)}</div>
                      {day.count > 0 && <div style={{ fontSize: 10, fontWeight: 900, color: '#0D0D0D' }}>{day.count}</div>}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6B6B6B' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: accent }} /> Commandes
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6B6B6B' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: accent + '30' }} /> Revenus
                  </div>
                </div>
              </div>

              {/* Top produits */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '16px' }}>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14 }}>🏆 Top produits vendus</div>
                {topProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#AEAEB2', fontSize: 14 }}>Pas encore de données</div>
                ) : topProducts.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: i < topProducts.length - 1 ? '1px solid #F2F2F7' : 'none' }}>
                    <div style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0D0D0D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#6B6B6B', marginTop: 2 }}>{p.revenue >= 1000 ? `${Math.round(p.revenue / 1000)}k` : p.revenue.toLocaleString('fr-FR')} FCFA</div>
                      <div style={{ height: 5, background: '#F2F2F7', borderRadius: 3, marginTop: 5, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(p.count / topProducts[0].count) * 100}%`, background: accent, borderRadius: 3 }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: accent, flexShrink: 0 }}>{p.count} vte{p.count > 1 ? 's' : ''}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}