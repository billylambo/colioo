'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type OrderStatus = 'nouveau' | 'confirme' | 'livre' | 'annule'

interface Product {
  id: string
  name: string
  price: number
  original_price?: number
  is_published: boolean
  slug: string
  badge?: string
  images?: { url: string; is_cover: boolean }[]
}

interface Order {
  id: string
  order_number?: string
  customer_name: string
  customer_phone: string
  customer_district: string
  product_id: string
  total_price: number
  status: OrderStatus
  created_at: string
  no_wa?: boolean
  is_test?: boolean
  options_chosen?: { couleur?: string; taille?: string; grammage?: string }
  product?: { name: string; slug?: string }
}

interface DashboardStats {
  ca_today: number
  orders_today: number
  orders_total: number
  panier_moyen: number
  ca_week: number[]
  orders_week: number[]
}

const fmt = (p: number) => p.toLocaleString('fr-FR') + ' FCFA'

const STATUS_MAP: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  nouveau:  { label: 'En attente', color: '#FF9500', bg: '#FFF3CD' },
  confirme: { label: 'Confirmée',  color: '#007AFF', bg: '#E8F4FF' },
  livre:    { label: 'Livrée',     color: '#34C759', bg: '#ECFDF5' },
  annule:   { label: 'Annulée',    color: '#FF3B30', bg: '#FFF0F0' },
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)} sec`
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}j`
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 72, H = 36
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * W, y: H - ((v - min) / range) * H }))
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = line + ` L${W},${H} L0,${H}Z`
  const id = `sg${color.replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg width={W} height={H}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill={color} />
    </svg>
  )
}

function MetricCard({ label, value, change, pos, spark, color }: {
  label: string; value: string; change: string; pos: boolean; spark?: number[]; color: string
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '13px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, color: '#6B6B6B', fontWeight: 700, letterSpacing: .5, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 900, color: '#0D0D0D', marginBottom: 4 }}>{value}</div>
      {spark && spark.length > 1 && <Sparkline data={spark} color={color} />}
      <div style={{ marginTop: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: pos ? '#059669' : '#DC2626' }}>{pos ? '↑' : '↓'} {change}</span>
      </div>
    </div>
  )
}

function RevenueChart({ stats, accent }: { stats: DashboardStats; accent: string }) {
  const [hov, setHov] = useState<number | null>(null)
  const [view, setView] = useState<'CA' | 'Commandes'>('CA')
  const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const W = 340, H = 160, pL = 46, pR = 10, pT = 18, pB = 28
  const cW = W - pL - pR, cH = H - pT - pB
  const data = view === 'CA' ? stats.ca_week : stats.orders_week
  const max = Math.max(...data) || 1
  const barW = cW / DAYS.length * 0.52
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '14px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: '#6B6B6B', fontWeight: 700, letterSpacing: .5, marginBottom: 3 }}>7 DERNIERS JOURS</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0D0D0D' }}>
            {view === 'CA' ? fmt(data.reduce((a, b) => a + b, 0)) : `${data.reduce((a, b) => a + b, 0)} cmd`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['CA', 'Commandes'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ height: 26, padding: '0 9px', borderRadius: 8, background: view === v ? accent : '#F2F2F7', border: 'none', color: view === v ? '#fff' : '#6B6B6B', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{v}</button>
          ))}
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {[0, .25, .5, .75, 1].map(r => (
          <g key={r}>
            <line x1={pL} y1={pT + (1 - r) * cH} x2={W - pR} y2={pT + (1 - r) * cH} stroke="#F0F0F0" strokeWidth="1" />
            <text x={pL - 5} y={pT + (1 - r) * cH + 4} textAnchor="end" fontSize="9" fill="#AEAEB2">
              {view === 'CA' ? (r === 0 ? '0' : `${Math.round(max * r / 1000)}k`) : Math.round(max * r)}
            </text>
          </g>
        ))}
        {data.map((v, i) => {
          const x = pL + (i + .5) * cW / DAYS.length
          const bH = (v / max) * cH, y = pT + cH - bH
          const isH = hov === i
          return (
            <g key={i} style={{ cursor: 'pointer' }} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
              <rect x={x - barW / 2} y={pT} width={barW} height={cH} rx="3" fill="transparent" />
              <rect x={x - barW / 2} y={y} width={barW} height={bH} rx="4" fill={isH ? accent : accent + '22'} stroke={isH ? accent : 'none'} strokeWidth="1" style={{ transition: 'fill .2s' }} />
              {isH && (<><rect x={x - 34} y={y - 26} width={68} height={21} rx="6" fill="#111" /><text x={x} y={y - 11} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">{view === 'CA' ? `${Math.round(v / 1000)}k FCFA` : v + ' cmd'}</text></>)}
              <text x={x} y={H - 2} textAnchor="middle" fontSize="9" fill="#AEAEB2">{DAYS[i]}</text>
            </g>
          )
        })}
        {(() => {
          const pts = data.map((v, i) => `${pL + (i + .5) * cW / DAYS.length},${pT + cH - (v / max) * cH}`)
          const area = `M ${pts.join(' L ')} L ${pL + (DAYS.length - .5) * cW / DAYS.length} ${pT + cH} L ${pL + .5 * cW / DAYS.length} ${pT + cH} Z`
          return (
            <>
              <defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity=".14" /><stop offset="100%" stopColor={accent} stopOpacity="0" /></linearGradient></defs>
              <path d={area} fill="url(#chartGrad)" />
              <polyline points={pts.join(' ')} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".6" />
            </>
          )
        })()}
      </svg>
    </div>
  )
}

interface FunnelStats {
  visitors: number; product_views: number; forms: number; orders: number; delivered: number
}

function FunnelBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0D0D0D' }}>{label}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#0D0D0D' }}>{value.toLocaleString('fr-FR')}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color, background: color + '18', borderRadius: 6, padding: '2px 7px' }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height: 8, background: '#F2F2F7', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width .8s cubic-bezier(.22,1,.36,1)' }} />
      </div>
    </div>
  )
}

function FunnelSection({ funnel }: { funnel: FunnelStats }) {
  const steps = [
    { label: 'Visiteurs', value: funnel.visitors, color: '#007AFF' },
    { label: 'Fiches produit', value: funnel.product_views, color: '#9333EA' },
    { label: 'Formulaire', value: funnel.forms, color: '#FF9500' },
    { label: 'Commandes', value: funnel.orders, color: '#FF3B30' },
    { label: 'Livrées', value: funnel.delivered, color: '#34C759' },
  ]
  const total = funnel.visitors || 1
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>📊</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#0D0D0D' }}>Entonnoir de conversion</div>
          <div style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 600 }}>Taux final : <span style={{ color: '#34C759', fontWeight: 900 }}>{total > 0 ? Math.round((funnel.delivered / total) * 100) : 0}%</span></div>
        </div>
      </div>
      {steps.map((s, i) => <FunnelBar key={i} label={s.label} value={s.value} total={total} color={s.color} />)}
      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
        {[
          { label: 'Visite→Fiche', val: funnel.visitors > 0 ? Math.round((funnel.product_views / funnel.visitors) * 100) : 0 },
          { label: 'Fiche→Form', val: funnel.product_views > 0 ? Math.round((funnel.forms / funnel.product_views) * 100) : 0 },
          { label: 'Form→Cmd', val: funnel.forms > 0 ? Math.round((funnel.orders / funnel.forms) * 100) : 0 },
          { label: 'Cmd→Livré', val: funnel.orders > 0 ? Math.round((funnel.delivered / funnel.orders) * 100) : 0 },
        ].map((r, i) => (
          <div key={i} style={{ flex: 1, minWidth: 70, background: '#F8F8F8', borderRadius: 10, padding: '7px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#0D0D0D' }}>{r.val}%</div>
            <div style={{ fontSize: 9, color: '#AEAEB2', fontWeight: 700, marginTop: 2 }}>{r.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopProduitsSection({ accent }: { accent: string }) {
  const [items, setItems] = useState<{ name: string; revenue: number; ventes: number; cover?: string }[]>([])
  useEffect(() => {
    const load = async () => {
      const { data: orders } = await supabase.from('orders').select('product_id, total_price, product:product_id(name, product_images(url, is_cover))').neq('status', 'annule').eq('is_test', false)
      if (!orders) return
      const map: Record<string, { name: string; revenue: number; ventes: number; cover?: string }> = {}
      for (const o of orders as any[]) {
        const pid = o.product_id; if (!pid) continue
        const name = o.product?.name || 'Produit'
        const cover = o.product?.product_images?.find((i: any) => i.is_cover)?.url || o.product?.product_images?.[0]?.url
        if (!map[pid]) map[pid] = { name, revenue: 0, ventes: 0, cover }
        map[pid].revenue += o.total_price || 0; map[pid].ventes += 1
      }
      setItems(Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5))
    }
    load()
  }, [])
  if (items.length === 0) return null
  const maxRevenue = items[0]?.revenue || 1
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>🏆</span>
        <div style={{ fontSize: 15, fontWeight: 900, color: '#0D0D0D' }}>Top Produits</div>
      </div>
      {items.map((item, i) => {
        const pct = Math.round((item.revenue / maxRevenue) * 100)
        const colors = [accent, '#007AFF', '#34C759', '#FF9500', '#9333EA']
        const color = colors[i] || accent
        return (
          <div key={i} style={{ marginBottom: i < items.length - 1 ? 14 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <div style={{ width: 20, fontSize: 12, fontWeight: 900, color: '#AEAEB2', flexShrink: 0 }}>#{i + 1}</div>
              <div style={{ width: 32, height: 32, borderRadius: 9, overflow: 'hidden', background: '#F2F2F7', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.cover ? <img src={item.cover} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 16 }}>🛍️</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0D0D0D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                <div style={{ fontSize: 11, color: '#AEAEB2' }}>{item.ventes} vente{item.ventes > 1 ? 's' : ''}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0D0D0D', flexShrink: 0 }}>
                {item.revenue >= 1000000 ? `${(item.revenue / 1000000).toFixed(1)}M` : item.revenue >= 1000 ? `${Math.round(item.revenue / 1000)}k` : item.revenue.toLocaleString('fr-FR')}
              </div>
            </div>
            <div style={{ marginLeft: 30, height: 5, background: '#F2F2F7', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width .8s cubic-bezier(.22,1,.36,1)' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function OverviewTab({ stats, latestOrder, accent, funnel }: { stats: DashboardStats; latestOrder?: Order; accent: string; funnel: FunnelStats }) {
  const [notif, setNotif] = useState(false)
  useEffect(() => {
    if (!latestOrder) return
    const diffMinutes = (Date.now() - new Date(latestOrder.created_at).getTime()) / 1000 / 60
    setNotif(diffMinutes < 30)
  }, [latestOrder])
  return (
    <div>
      {notif && latestOrder && (
        <div style={{ background: `linear-gradient(135deg,${accent},${accent}bb)`, borderRadius: 16, padding: '13px 14px', marginBottom: 12, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛒</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 900 }}>Nouvelle commande — {latestOrder.customer_name}</div>
            <div style={{ fontSize: 11, opacity: .85 }}>{latestOrder.product?.name || 'Produit'} · {fmt(latestOrder.total_price)} · Il y a {timeAgo(latestOrder.created_at)}</div>
          </div>
          <button onClick={() => setNotif(false)} style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <MetricCard label="CA AUJOURD'HUI" value={stats.ca_today >= 1000 ? `${Math.round(stats.ca_today / 1000)}k` : fmt(stats.ca_today)} change="vs hier" pos={true} color={accent} spark={stats.ca_week} />
        <MetricCard label="COMMANDES" value={String(stats.orders_today)} change="aujourd'hui" pos={true} color="#007AFF" spark={stats.orders_week} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <MetricCard label="TOTAL COMMANDES" value={String(stats.orders_total)} change="depuis le début" pos={true} color="#34C759" spark={stats.orders_week} />
        <MetricCard label="PANIER MOYEN" value={stats.panier_moyen >= 1000 ? `${Math.round(stats.panier_moyen / 1000)}k` : fmt(stats.panier_moyen)} change="par commande" pos={true} color="#FF9500" spark={stats.ca_week} />
      </div>
      <RevenueChart stats={stats} accent={accent} />
      <FunnelSection funnel={funnel} />
      <TopProduitsSection accent={accent} />
    </div>
  )
}

function ConfirmModal({ message, onConfirm, onCancel, accent }: { message: string; onConfirm: () => void; onCancel: () => void; accent: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '24px 20px', width: '100%', maxWidth: 340, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 20, lineHeight: 1.4 }}>{message}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, height: 44, borderRadius: 12, background: '#F2F2F7', border: 'none', color: '#6B6B6B', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Annuler</button>
          <button onClick={onConfirm} style={{ flex: 1, height: 44, borderRadius: 12, background: accent, border: 'none', color: '#fff', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Confirmer</button>
        </div>
      </div>
    </div>
  )
}

function Toast({ msg }: { msg: string }) {
  if (!msg) return null
  return <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#0D0D0D', color: '#fff', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, zIndex: 999, whiteSpace: 'nowrap' }}>{msg}</div>
}

function ProductsTab({ accent }: { accent: string }) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [confirm, setConfirm] = useState<{ id: string; action: 'delete' | 'toggle'; label: string } | null>(null)
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('id, name, price, original_price, is_published, slug, badge, images:product_images(url, is_cover)').order('created_at', { ascending: false })
    setProducts((data || []) as Product[])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  const doToggle = async (p: Product) => {
    await supabase.from('products').update({ is_published: !p.is_published }).eq('id', p.id)
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_published: !x.is_published } : x))
    showToast(p.is_published ? '👁️ Produit masqué' : '✅ Produit visible')
  }
  const doDelete = async (id: string) => {
    await fetch(`/api/commander/products/${id}`, { method: 'DELETE' })
    setProducts(prev => prev.filter(x => x.id !== id))
    showToast('🗑️ Produit supprimé')
  }
  const handleConfirm = async () => {
    if (!confirm) return
    if (confirm.action === 'delete') await doDelete(confirm.id)
    else { const p = products.find(x => x.id === confirm.id); if (p) await doToggle(p) }
    setConfirm(null)
  }
  const visible = products.filter(p => filter === 'all' ? true : filter === 'published' ? p.is_published : !p.is_published)
  return (
    <div>
      <Toast msg={toast} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 900 }}>Produits ({products.length})</h3>
        <button onClick={() => router.push('/admin/produits/nouveau')} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>+ Nouveau</button>
      </div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 14, overflowX: 'auto' }}>
        {([['all', 'Tous'], ['published', 'Publiés'], ['draft', 'Brouillons']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ flexShrink: 0, height: 28, padding: '0 11px', borderRadius: 8, background: filter === v ? accent : '#fff', border: 'none', color: filter === v ? '#fff' : '#6B6B6B', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
        ))}
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#AEAEB2' }}>Chargement…</div>
        : visible.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#AEAEB2' }}><div style={{ fontSize: 36, marginBottom: 8 }}>📦</div><div style={{ fontSize: 14, fontWeight: 700 }}>Aucun produit</div></div>
        : visible.map(p => {
          const cover = p.images?.find(img => img.is_cover)?.url || p.images?.[0]?.url
          return (
            <div key={p.id} style={{ background: '#fff', borderRadius: 16, padding: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 11, opacity: p.is_published ? 1 : .6 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, overflow: 'hidden', background: '#F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cover ? <img src={cover} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>🛍️</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <span style={{ fontSize: 13, color: accent, fontWeight: 700 }}>{p.price.toLocaleString('fr-FR')} FCFA</span>
                  {p.original_price && <span style={{ fontSize: 11, color: '#AEAEB2', textDecoration: 'line-through' }}>{p.original_price.toLocaleString('fr-FR')}</span>}
                </div>
                <div style={{ marginTop: 3 }}>
                  <span style={{ fontSize: 10, background: p.is_published ? '#ECFDF5' : '#F2F2F7', color: p.is_published ? '#059669' : '#6B6B6B', borderRadius: 5, padding: '2px 7px', fontWeight: 700 }}>{p.is_published ? '✓ Publié' : 'Brouillon'}</span>
                  {p.badge && <span style={{ fontSize: 10, background: accent + '18', color: accent, borderRadius: 5, padding: '2px 7px', fontWeight: 700, marginLeft: 5 }}>{p.badge}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={() => router.push(`/admin/produits/${p.id}`)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </button>
                <button onClick={() => setConfirm({ id: p.id, action: 'toggle', label: `${p.is_published ? 'Masquer' : 'Publier'} "${p.name}" ?` })} style={{ width: 32, height: 32, borderRadius: '50%', background: p.is_published ? '#FFF0F3' : '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={p.is_published ? accent : '#AEAEB2'} strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                </button>
                <button onClick={() => setConfirm({ id: p.id, action: 'delete', label: `Supprimer définitivement "${p.name}" ?` })} style={{ width: 32, height: 32, borderRadius: '50%', background: '#FFF0F0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round"><polyline points="3,6 5,6 21,6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                </button>
              </div>
            </div>
          )
        })}
      {confirm && <ConfirmModal message={confirm.label} accent={accent} onConfirm={handleConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  )
}

// ── Templates de relance ──────────────────────────────────────────────────────
const TEMPLATES_DEFAUT = [
  {
    id: 'douce', label: 'Confirmation commande', emoji: '✅', color: '#25D366', delai: 'Immédiat',
    getMessage: (o: Order) => `Bonjour ${o.customer_name} !\n\nNous avons bien recu votre commande et nous vous en remercions.\n\nVoici le recap :\n\nProduit : ${o.product?.name || 'notre produit'}\nMontant : ${o.total_price.toLocaleString('fr-FR')} FCFA\nLivraison : ${o.customer_district}\n\nPaiement a la livraison — aucun risque pour vous.\n\nNous vous contacterons des que votre colis est pret. A tres bientot !`
  },
  {
    id: 'urgence', label: 'Urgence stock', emoji: '🔥', color: '#FF3B30', delai: '24h',
    getMessage: (o: Order) => `Bonjour ${o.customer_name} !\n\nStock limite ! Il ne reste que quelques unites de ${o.product?.name || 'ce produit'}.\n\nVotre commande de ${o.total_price.toLocaleString('fr-FR')} FCFA est reservee mais expire bientot.\n\nConfirmez maintenant avant rupture !`
  },
  {
    id: 'offre', label: 'Produit disponible !', emoji: '🎁', color: '#FF9500', delai: 'Relance prospect',
    getMessage: (o: Order) => `Bonjour ${o.customer_name} !\n\nBonne nouvelle ! Le produit que vous aviez commande est maintenant disponible.\n\nProduit : ${o.product?.name || 'notre produit'}\nPrix : ${o.total_price.toLocaleString('fr-FR')} FCFA\nLivraison : ${o.customer_district}\n\nPaiement a la livraison — aucun risque.\n\nOn finalise votre commande ?`
  },
]

// ── Modal de relance ──────────────────────────────────────────────────────────
function RelanceModal({ order, accent, onClose }: { order: Order; accent: string; onClose: () => void }) {
  const [selected, setSelected] = useState(0)
  const [customTemplates, setCustomTemplates] = useState<{ id: string; label: string; emoji: string; color: string; body: string }[]>([])
  const allTemplates = [
    ...TEMPLATES_DEFAUT,
    ...customTemplates.map(ct => ({
      id: ct.id, label: ct.label, emoji: ct.emoji, color: ct.color, delai: 'Custom',
      getMessage: (o: Order) => ct.body.replace('{nom}', o.customer_name).replace('{produit}', o.product?.name || 'notre produit').replace('{prix}', o.total_price.toLocaleString('fr-FR') + ' FCFA').replace('{ville}', o.customer_district)
    }))
  ]
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'relance_templates').single()
      if (data?.value) { try { setCustomTemplates(JSON.parse(data.value as string)) } catch {} }
    }
    load()
  }, [])
  const sendRelance = () => {
    const template = allTemplates[selected]
    const message = template.getMessage(order)
    const phone = order.customer_phone.replace(/\s/g, '').replace(/^\+/, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
    onClose()
  }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, padding: '20px 16px 36px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5E5EA', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 2 }}>Relancer {order.customer_name}</div>
        <div style={{ fontSize: 12, color: '#AEAEB2', marginBottom: 16 }}>{order.product?.name} · {order.customer_phone}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', marginBottom: 10 }}>Choisir un template :</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {allTemplates.map((t, i) => (
            <div key={t.id} onClick={() => setSelected(i)} style={{ padding: '12px 14px', borderRadius: 14, border: `2px solid ${selected === i ? t.color : '#E5E5EA'}`, background: selected === i ? t.color + '10' : '#F8F8F8', cursor: 'pointer', transition: 'all .2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>{t.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0D0D0D' }}>{t.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, background: t.color + '20', color: t.color, borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>{t.delai}</span>
              </div>
              <div style={{ fontSize: 12, color: '#6B6B6B', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{t.getMessage(order).slice(0, 120)}...</div>
            </div>
          ))}
        </div>
        <button onClick={sendRelance} style={{ width: '100%', height: 50, borderRadius: 14, background: '#25D366', border: 'none', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          💬 Envoyer sur WhatsApp
        </button>
      </div>
    </div>
  )
}

// ── ProspectsTab ──────────────────────────────────────────────────────────────
function ProspectsTab({ accent }: { accent: string }) {
  const [prospects, setProspects] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [relanceOrder, setRelanceOrder] = useState<Order | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_phone, customer_district, product_id, total_price, status, created_at, no_wa, options_chosen, product:product_id(name, slug)')
        .eq('is_test', true)
        .order('created_at', { ascending: false })
      setProspects((data || []) as unknown as Order[])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      {relanceOrder && <RelanceModal order={relanceOrder} accent={accent} onClose={() => setRelanceOrder(null)} />}

      <div style={{ background: '#FFF9E6', borderRadius: 14, padding: '14px', marginBottom: 14, border: '1px solid #FDE68A' }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: '#B45309', marginBottom: 4 }}>🧪 Prospects — Commandes de test</div>
        <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>
          Ces clients ont commandé un produit en mode test. Une fois le stock disponible, relance-les !
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, background: '#fff', borderRadius: 14, padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#FF9500' }}>{prospects.length}</div>
          <div style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 700, marginTop: 3 }}>Total prospects</div>
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: 14, padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: accent }}>{prospects.reduce((a, o) => a + o.total_price, 0).toLocaleString('fr-FR')}</div>
          <div style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 700, marginTop: 3 }}>FCFA potentiel</div>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#AEAEB2' }}>Chargement…</div>
        : prospects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#AEAEB2' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🧪</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Aucun prospect pour l'instant</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Active le mode test sur un produit pour commencer</div>
          </div>
        ) : prospects.map(o => (
          <div key={o.id} style={{ background: '#fff', borderRadius: 16, padding: '13px', marginBottom: 10, border: '2px solid #FDE68A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0D0D0D' }}>{o.customer_name}</div>
                  <span style={{ fontSize: 10, background: '#FFF3CD', color: '#B45309', borderRadius: 6, padding: '2px 7px', fontWeight: 800 }}>🧪 Test</span>
                </div>
                <div style={{ fontSize: 12, color: '#6B6B6B' }}>{o.customer_phone}</div>
                <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 2 }}>{o.product?.name}</div>
                <div style={{ fontSize: 11, color: '#AEAEB2', marginTop: 2 }}>{o.customer_district}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: accent }}>{o.total_price.toLocaleString('fr-FR')} FCFA</div>
                <div style={{ fontSize: 10, color: '#AEAEB2', marginTop: 4 }}>Il y a {timeAgo(o.created_at)}</div>
              </div>
            </div>
            <button onClick={() => setRelanceOrder(o)} style={{ width: '100%', height: 38, borderRadius: 10, background: '#25D366', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              💬 Relancer — Produit disponible !
            </button>
          </div>
        ))}
    </div>
  )
}

// ── AutoTab ───────────────────────────────────────────────────────────────────
function AutoTab({ accent }: { accent: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [relanceOrder, setRelanceOrder] = useState<Order | null>(null)
  const [filter, setFilter] = useState<'tous' | 'no_wa' | 'annule'>('tous')
  const [testing, setTesting] = useState(false)
  const [toast, setToast] = useState('')
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<{ id: string; label: string; emoji: string; color: string; body: string }[]>([])
  const [newTemplate, setNewTemplate] = useState({ label: '', emoji: '💬', color: '#FF6B00', body: '' })
  const [savingTemplate, setSavingTemplate] = useState(false)
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_phone, customer_district, product_id, total_price, status, created_at, no_wa, options_chosen, product:product_id(name, slug)')
        .or('no_wa.eq.true,status.eq.annule')
        .eq('is_test', false)
        .order('created_at', { ascending: false })
      setOrders((data || []) as unknown as Order[])git add .
      setLoading(false)
    }
    load()
    const loadTemplates = async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'relance_templates').single()
      if (data?.value) { try { setCustomTemplates(JSON.parse(data.value as string)) } catch {} }
    }
    loadTemplates()
  }, [])

  const testTelegram = async () => {
    setTesting(true)
    try {
      const res = await fetch('/api/telegram/test', { method: 'POST' })
      const data = await res.json()
      if (data.ok) showToast('✅ Message Telegram envoyé !')
      else showToast('❌ Erreur Telegram — vérifie le token')
    } catch { showToast('❌ Erreur réseau') }
    setTesting(false)
  }

  const saveTemplate = async () => {
    if (!newTemplate.label || !newTemplate.body) { showToast('⚠️ Remplis le nom et le message'); return }
    setSavingTemplate(true)
    const updated = [...customTemplates, { ...newTemplate, id: Date.now().toString() }]
    await supabase.from('settings').upsert({ key: 'relance_templates', value: JSON.stringify(updated) })
    setCustomTemplates(updated)
    setNewTemplate({ label: '', emoji: '💬', color: '#FF6B00', body: '' })
    setShowTemplateForm(false)
    setSavingTemplate(false)
    showToast('✅ Template sauvegardé !')
  }

  const deleteTemplate = async (id: string) => {
    const updated = customTemplates.filter(t => t.id !== id)
    await supabase.from('settings').upsert({ key: 'relance_templates', value: JSON.stringify(updated) })
    setCustomTemplates(updated)
    showToast('🗑️ Template supprimé')
  }

  const visible = orders.filter(o => filter === 'tous' ? true : filter === 'no_wa' ? o.no_wa === true : o.status === 'annule')

  return (
    <div>
      <Toast msg={toast} />
      {relanceOrder && <RelanceModal order={relanceOrder} accent={accent} onClose={() => setRelanceOrder(null)} />}

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Total', value: orders.length, color: '#007AFF' },
          { label: 'No WA', value: orders.filter(o => o.no_wa).length, color: '#FF9500' },
          { label: 'Annulées', value: orders.filter(o => o.status === 'annule').length, color: '#FF3B30' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, background: '#fff', borderRadius: 14, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 700, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#FFF9E6', borderRadius: 14, padding: '12px 14px', marginBottom: 14, border: '1px solid #FDE68A' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#B45309', marginBottom: 4 }}>💡 Comment ça marche ?</div>
        <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>
          <strong>No WA</strong> = Tu as reçu la notif Telegram mais pas le message WA. Clique "No WA" sur la commande dans l'onglet Commandes, puis relance ici.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
        {([['tous', 'Tous'], ['no_wa', '🔇 No WA'], ['annule', '❌ Annulées']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ flexShrink: 0, height: 30, padding: '0 12px', borderRadius: 8, background: filter === v ? accent : '#fff', border: 'none', color: filter === v ? '#fff' : '#6B6B6B', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#AEAEB2' }}>Chargement…</div>
        : visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#AEAEB2' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Aucune commande à relancer</div>
          </div>
        ) : visible.map(o => {
          const st = STATUS_MAP[o.status]
          return (
            <div key={o.id} style={{ background: '#fff', borderRadius: 16, padding: '13px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#0D0D0D' }}>{o.customer_name}</div>
                    {o.no_wa && <span style={{ fontSize: 10, background: '#FFF3CD', color: '#B45309', borderRadius: 6, padding: '2px 7px', fontWeight: 800 }}>🔇 No WA</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B6B6B' }}>{o.customer_phone}</div>
                  <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 2 }}>{o.product?.name || 'Produit'}</div>
                  <div style={{ fontSize: 11, color: '#AEAEB2', marginTop: 2 }}>{o.customer_district}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: accent }}>{o.total_price.toLocaleString('fr-FR')} FCFA</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: st.color, background: st.bg, borderRadius: 6, padding: '2px 8px', marginTop: 4, display: 'inline-block' }}>{st.label}</div>
                  <div style={{ fontSize: 10, color: '#AEAEB2', marginTop: 4 }}>Il y a {timeAgo(o.created_at)}</div>
                </div>
              </div>
              <button onClick={() => setRelanceOrder(o)} style={{ width: '100%', height: 38, borderRadius: 10, background: '#25D366', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                💬 Relancer sur WhatsApp
              </button>
            </div>
          )
        })}

      {/* Templates */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginTop: 8, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0D0D0D' }}>📝 Mes templates</div>
            <div style={{ fontSize: 11, color: '#AEAEB2', marginTop: 2 }}>Variables : {'{nom}'} {'{produit}'} {'{prix}'} {'{ville}'}</div>
          </div>
          <button onClick={() => setShowTemplateForm(!showTemplateForm)} style={{ height: 32, padding: '0 12px', borderRadius: 10, background: accent, border: 'none', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            {showTemplateForm ? '✕ Fermer' : '+ Nouveau'}
          </button>
        </div>
        {showTemplateForm && (
          <div style={{ background: '#F8F8F8', borderRadius: 14, padding: '14px', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input value={newTemplate.emoji} onChange={e => setNewTemplate(p => ({ ...p, emoji: e.target.value }))} placeholder="💬" style={{ width: 52, height: 42, borderRadius: 10, border: '1.5px solid #E5E5EA', textAlign: 'center', fontSize: 20, fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
              <input value={newTemplate.label} onChange={e => setNewTemplate(p => ({ ...p, label: e.target.value }))} placeholder="Nom du template..." style={{ flex: 1, height: 42, borderRadius: 10, border: '1.5px solid #E5E5EA', padding: '0 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
              <input type="color" value={newTemplate.color} onChange={e => setNewTemplate(p => ({ ...p, color: e.target.value }))} style={{ width: 42, height: 42, borderRadius: 10, border: '1.5px solid #E5E5EA', cursor: 'pointer', padding: 2 }} />
            </div>
            <textarea value={newTemplate.body} onChange={e => setNewTemplate(p => ({ ...p, body: e.target.value }))} placeholder={`Bonjour {nom} !\n\nVotre commande {produit} de {prix} est confirmée.\nLivraison à {ville}.\n\nMerci !`} style={{ width: '100%', height: 140, borderRadius: 10, border: '1.5px solid #E5E5EA', padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', resize: 'none', lineHeight: 1.6, boxSizing: 'border-box' }} />
            <div style={{ fontSize: 11, color: '#AEAEB2', marginTop: 6, marginBottom: 10 }}>Utilise {'{nom}'}, {'{produit}'}, {'{prix}'}, {'{ville}'} pour personnaliser</div>
            <button onClick={saveTemplate} disabled={savingTemplate} style={{ width: '100%', height: 42, borderRadius: 10, background: accent, border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: savingTemplate ? .7 : 1 }}>
              {savingTemplate ? 'Sauvegarde...' : '✅ Sauvegarder le template'}
            </button>
          </div>
        )}
        {customTemplates.length === 0 && !showTemplateForm ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#AEAEB2', fontSize: 13 }}>Aucun template — clique sur "+ Nouveau"</div>
        ) : customTemplates.map((t, i) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i > 0 ? '1px solid #F2F2F7' : 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: t.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{t.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0D0D0D' }}>{t.label}</div>
              <div style={{ fontSize: 11, color: '#AEAEB2', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.body.slice(0, 60)}...</div>
            </div>
            <button onClick={() => deleteTemplate(t.id)} style={{ width: 28, height: 28, borderRadius: '50%', background: '#FFF0F0', border: 'none', color: '#FF3B30', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>✕</button>
          </div>
        ))}
      </div>

      {/* Test Telegram */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>✈️</span>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#0D0D0D' }}>Test Telegram</div>
        </div>
        <div style={{ fontSize: 12, color: '#AEAEB2', marginBottom: 12 }}>Vérifie que ton bot Telegram fonctionne correctement.</div>
        <button onClick={testTelegram} disabled={testing} style={{ width: '100%', height: 42, borderRadius: 12, background: '#0088cc', border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: testing ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {testing ? 'Envoi...' : '📨 Envoyer un message test'}
        </button>
      </div>
    </div>
  )
}

// ── OrdersTab ─────────────────────────────────────────────────────────────────
function OrdersTab({ accent }: { accent: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')
  const [detail, setDetail] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ id: string; newStatus: OrderStatus; label: string } | null>(null)
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_phone, customer_district, product_id, total_price, status, created_at, no_wa, is_test, options_chosen, product:product_id(name)')
      .eq('is_test', false)
      .order('created_at', { ascending: false })
      .limit(50)
    setOrders((data || []) as unknown as Order[])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const changeStatus = async (id: string, newStatus: OrderStatus) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
    showToast('✅ Statut mis à jour')
  }

  const toggleNoWa = async (id: string, current: boolean) => {
    await supabase.from('orders').update({ no_wa: !current }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, no_wa: !current } : o))
    showToast(!current ? '🔇 Marqué No WA — visible dans Relances' : '✅ No WA retiré')
  }

  const visible = orders.filter(o => filter === 'all' || o.status === filter)
  const getDistrict = (d: string) => { const parts = d.split(' - '); return { ville: parts[0] || d, quartier: parts[1] || '' } }

  return (
    <div>
      <Toast msg={toast} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 900 }}>Commandes ({visible.length})</h3>
        <button onClick={load} style={{ height: 30, padding: '0 12px', borderRadius: 8, background: '#F2F2F7', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#6B6B6B', fontFamily: 'inherit' }}>🔄</button>
      </div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 12, overflowX: 'auto' }}>
        {([['all', 'Toutes'], ['nouveau', 'Attente'], ['confirme', 'Confirmées'], ['livre', 'Livrées'], ['annule', 'Annulées']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ flexShrink: 0, height: 28, padding: '0 10px', borderRadius: 8, background: filter === v ? accent : '#fff', border: 'none', color: filter === v ? '#fff' : '#6B6B6B', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
        ))}
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#AEAEB2' }}>Chargement…</div>
        : visible.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#AEAEB2' }}><div style={{ fontSize: 36, marginBottom: 8 }}>📭</div><div style={{ fontSize: 14, fontWeight: 700 }}>Aucune commande</div></div>
        : visible.map(o => {
          const st = STATUS_MAP[o.status] || STATUS_MAP.nouveau
          const { ville, quartier } = getDistrict(o.customer_district)
          const opts = o.options_chosen
          return (
            <div key={o.id} style={{ background: '#fff', borderRadius: 16, padding: 13, marginBottom: 10, border: o.no_wa ? '2px solid #FDE68A' : '2px solid transparent' }}>
              <div onClick={() => setDetail(detail === o.id ? null : o.id)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#0D0D0D' }}>{o.order_number || o.id.slice(0, 8).toUpperCase()}</span>
                    {o.no_wa && <span style={{ fontSize: 10, background: '#FFF3CD', color: '#B45309', borderRadius: 6, padding: '2px 6px', fontWeight: 800 }}>🔇 No WA</span>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: st.color, background: st.bg, borderRadius: 7, padding: '3px 8px' }}>{st.label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{o.customer_name}</div>
                    <div style={{ fontSize: 12, color: '#6B6B6B' }}>{o.customer_phone}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: accent }}>{fmt(o.total_price)}</div>
                    <div style={{ fontSize: 11, color: '#AEAEB2' }}>Il y a {timeAgo(o.created_at)}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#6B6B6B' }}>{o.product?.name || 'Produit'} · {ville}{quartier ? ` — ${quartier}` : ''}</div>
              </div>
              {detail === o.id && (
                <div style={{ marginTop: 12, padding: 12, background: '#F8F8F8', borderRadius: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[['👤 Client', o.customer_name], ['📱 Téléphone', o.customer_phone], ['📍 Ville', ville], ['🏘️ Quartier', quartier || '—'], ['💰 Total', fmt(o.total_price)], ['📦 Produit', o.product?.name || '—']].map(([l, v]) => (
                      <div key={l}><div style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 700 }}>{l}</div><div style={{ fontSize: 12, fontWeight: 700, color: '#0D0D0D' }}>{v}</div></div>
                    ))}
                  </div>
                  {(opts?.couleur || opts?.taille || opts?.grammage) && (
                    <div style={{ borderTop: '1px solid #E5E5EA', paddingTop: 8, marginTop: 8 }}>
                      <div style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 700, marginBottom: 4 }}>OPTIONS</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {opts?.couleur && <span style={{ fontSize: 11, background: accent + '18', color: accent, borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>🎨 {opts.couleur}</span>}
                        {opts?.taille && <span style={{ fontSize: 11, background: '#F2F2F7', color: '#0D0D0D', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>📐 {opts.taille}</span>}
                        {opts?.grammage && <span style={{ fontSize: 11, background: '#F2F2F7', color: '#0D0D0D', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>⚖️ {opts.grammage}</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {o.status === 'nouveau' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={() => setConfirm({ id: o.id, newStatus: 'confirme', label: `Confirmer la commande de ${o.customer_name} ?` })} style={{ flex: 1, height: 34, borderRadius: 10, background: '#ECFDF5', border: 'none', color: '#059669', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✓ Confirmer</button>
                  <button onClick={() => setConfirm({ id: o.id, newStatus: 'annule', label: `Annuler la commande de ${o.customer_name} ?` })} style={{ flex: 1, height: 34, borderRadius: 10, background: '#FFF0F0', border: 'none', color: '#DC2626', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✗ Annuler</button>
                </div>
              )}
              {o.status === 'confirme' && (
                <button onClick={() => setConfirm({ id: o.id, newStatus: 'livre', label: `Marquer livrée la commande de ${o.customer_name} ?` })} style={{ width: '100%', height: 34, borderRadius: 10, background: '#E8F4FF', border: 'none', color: '#007AFF', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginTop: 10 }}>🚚 Marquer comme livrée</button>
              )}
              {(o.status === 'nouveau' || o.status === 'confirme') && (
                <button onClick={() => toggleNoWa(o.id, o.no_wa || false)} style={{ width: '100%', height: 34, borderRadius: 10, background: o.no_wa ? '#FFF3CD' : '#F8F8F8', border: `1.5px solid ${o.no_wa ? '#FDE68A' : '#E5E5EA'}`, color: o.no_wa ? '#B45309' : '#6B6B6B', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
                  {o.no_wa ? '🔇 No WA — Retirer le marquage' : '🔇 No WA — Pas reçu le message'}
                </button>
              )}
              {o.status !== 'annule' && (
                <a href={`https://wa.me/${o.customer_phone.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 34, borderRadius: 10, background: '#F0FDF4', color: '#25D366', fontSize: 13, fontWeight: 800, textDecoration: 'none', marginTop: 8 }}>
                  💬 Contacter sur WhatsApp
                </a>
              )}
            </div>
          )
        })}
      {confirm && <ConfirmModal message={confirm.label} accent={accent} onConfirm={() => { changeStatus(confirm.id, confirm.newStatus); setConfirm(null) }} onCancel={() => setConfirm(null)} />}
    </div>
  )
}

// ── ResetSiteButton ───────────────────────────────────────────────────────────
function ResetSiteButton({ accent }: { accent: string }) {
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleReset = async () => {
    if (confirmText !== 'SUPPRIMER') { showToast('⚠️ Tape exactement SUPPRIMER'); return }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: authError } = await supabase.auth.signInWithPassword({ email: user?.email || '', password })
      if (authError) { showToast('❌ Mot de passe incorrect'); setLoading(false); return }
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('whatsapp_subscribers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('product_sections').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('home_sections').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      setStep(3)
    } catch (e) {
      showToast('❌ Erreur lors de la réinitialisation')
    }
    setLoading(false)
  }

  const openModal = () => { setShowModal(true); setStep(1); setPassword(''); setConfirmText('') }

  return (
    <>
      <Toast msg={toast} />
      <div style={{ background: '#FFF0F0', borderRadius: 16, padding: '16px', marginTop: 14, border: '1.5px solid #FFCDD2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>🗑️</span>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#DC2626' }}>Réinitialiser le site</div>
        </div>
        <div style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 12, lineHeight: 1.6 }}>
          Supprime tous les produits, commandes, catégories, abonnés et sections. <strong>Irréversible</strong>.
        </div>
        <button onClick={openModal} style={{ width: '100%', height: 42, borderRadius: 12, background: '#DC2626', border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          🗑️ Réinitialiser le site
        </button>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px 20px', width: '100%', maxWidth: 360 }}>
            {step === 1 && (
              <>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 56, marginBottom: 12 }}>⚠️</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#DC2626', marginBottom: 10 }}>Action irréversible !</div>
                  <div style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.7 }}>Cette action va supprimer <strong>définitivement</strong> :<br />Produits · Commandes · Catégories<br />Abonnés WhatsApp · Sections homepage</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowModal(false)} style={{ flex: 1, height: 44, borderRadius: 12, background: '#F2F2F7', border: 'none', color: '#6B6B6B', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Annuler</button>
                  <button onClick={() => setStep(2)} style={{ flex: 1, height: 44, borderRadius: 12, background: '#DC2626', border: 'none', color: '#fff', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Continuer →</button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4, color: '#0D0D0D' }}>🔐 Confirmation requise</div>
                <div style={{ fontSize: 12, color: '#AEAEB2', marginBottom: 16 }}>Vérifie ton identité avant de continuer</div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', marginBottom: 6 }}>Mot de passe admin</div>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Ton mot de passe" style={{ width: '100%', height: 46, borderRadius: 12, border: '1.5px solid #E5E5EA', padding: '0 44px 0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2" strokeLinecap="round">
                        {showPassword ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                      </svg>
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', marginBottom: 6 }}>Tape <strong>SUPPRIMER</strong> pour confirmer</div>
                  <input type="text" value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="SUPPRIMER" style={{ width: '100%', height: 46, borderRadius: 12, border: `1.5px solid ${confirmText === 'SUPPRIMER' ? '#DC2626' : '#E5E5EA'}`, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: confirmText === 'SUPPRIMER' ? '#FFF5F5' : '#fff' }} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowModal(false)} style={{ flex: 1, height: 44, borderRadius: 12, background: '#F2F2F7', border: 'none', color: '#6B6B6B', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Annuler</button>
                  <button onClick={handleReset} disabled={loading || confirmText !== 'SUPPRIMER' || !password} style={{ flex: 1, height: 44, borderRadius: 12, background: '#DC2626', border: 'none', color: '#fff', fontWeight: 900, cursor: loading || confirmText !== 'SUPPRIMER' || !password ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, opacity: loading || confirmText !== 'SUPPRIMER' || !password ? .5 : 1 }}>
                    {loading ? '⏳ Suppression...' : '🗑️ Supprimer tout'}
                  </button>
                </div>
              </>
            )}
            {step === 3 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#059669', marginBottom: 8 }}>Site réinitialisé !</div>
                <div style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 20, lineHeight: 1.6 }}>Toutes les données ont été supprimées. Le site est prêt pour une nouvelle marque.</div>
                <button onClick={() => { setShowModal(false); window.location.reload() }} style={{ width: '100%', height: 44, borderRadius: 12, background: accent, border: 'none', color: '#fff', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>✅ Terminer</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ── SettingsTab ───────────────────────────────────────────────────────────────
function SettingsTab({ accent, onAccentChange }: { accent: string; onAccentChange: (c: string) => void }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [tempColor, setTempColor] = useState(accent)
  const [showProspects, setShowProspects] = useState(false)
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const saveColor = async () => {
    setSaving(true)
    await supabase.from('settings').upsert({ key: 'primary_color', value: tempColor })
    onAccentChange(tempColor)
    setSaving(false)
    showToast('🎨 Couleur enregistrée !')
  }

  const PRESETS = [
    { hex: '#FF2D55', label: 'Rouge' }, { hex: '#FF6B00', label: 'Orange' },
    { hex: '#007AFF', label: 'Bleu' }, { hex: '#34C759', label: 'Vert' },
    { hex: '#9333EA', label: 'Violet' }, { hex: '#0D0D0D', label: 'Noir' },
  ]

  return (
    <div>
      <Toast msg={toast} />

      {/* Prospects bottom sheet */}
      {showProspects && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowProspects(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#F2F2F7', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', padding: '20px 12px 36px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5E5EA', margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, padding: '0 4px' }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>🧪 Prospects</div>
              <button onClick={() => setShowProspects(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <ProspectsTab accent={accent} />
          </div>
        </div>
      )}

      <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 14 }}>Réglages</h3>

      {/* Couleur */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>🎨 Couleur du site</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          {PRESETS.map(c => (
            <button key={c.hex} onClick={() => setTempColor(c.hex)} title={c.label} style={{ width: 36, height: 36, borderRadius: '50%', background: c.hex, border: 'none', cursor: 'pointer', outline: tempColor === c.hex ? `3px solid ${c.hex}` : '3px solid transparent', outlineOffset: 3, boxShadow: '0 2px 8px rgba(0,0,0,.2)' }} />
          ))}
          <input type="color" value={tempColor} onChange={e => setTempColor(e.target.value)} style={{ width: 36, height: 36, borderRadius: '50%', border: '2px dashed #E5E5EA', cursor: 'pointer', padding: 2 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: tempColor }} />
          <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#6B6B6B' }}>{tempColor}</span>
        </div>
        <button onClick={saveColor} disabled={saving} style={{ width: '100%', height: 44, borderRadius: 12, background: `linear-gradient(135deg,${tempColor},${tempColor}bb)`, border: 'none', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? .7 : 1 }}>
          {saving ? 'Enregistrement…' : 'Appliquer cette couleur'}
        </button>
      </div>

      {/* Prospects */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>🧪 Prospects</div>
        <div style={{ fontSize: 12, color: '#AEAEB2', marginBottom: 12, lineHeight: 1.5 }}>
          Commandes reçues en mode test — à relancer quand le stock est disponible.
        </div>
        <button onClick={() => setShowProspects(true)} style={{ width: '100%', height: 42, borderRadius: 12, background: '#FFF9E6', border: '1.5px solid #FDE68A', color: '#B45309', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          🧪 Voir les prospects
        </button>
      </div>

      {/* Navigation rapide */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>🔗 Navigation rapide</div>
        {[
          { icon: '🏠', label: 'Paramètres accueil', sub: 'Sections homepage', href: '/admin/parametres/accueil' },
          { icon: '📄', label: 'Pages statiques', sub: 'À propos, Contact…', href: '/admin/parametres/pages' },
          { icon: '🛍️', label: 'Tous les produits', sub: 'Gestion complète', href: '/admin/produits' },
          { icon: '📦', label: 'Toutes les commandes', sub: 'Vue complète', href: '/admin/commandes' },
          { icon: '📊', label: 'Analytics', sub: 'Statistiques détaillées', href: '/admin/analytics' },
          { icon: '🗂️', label: 'Catégories', sub: 'Gérer les catégories', href: '/admin/categories' },
        ].map((item, i) => (
          <div key={i} onClick={() => router.push(item.href)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderTop: i > 0 ? '1px solid #F2F2F7' : 'none', cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{item.icon}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 800 }}>{item.label}</div><div style={{ fontSize: 11, color: '#AEAEB2' }}>{item.sub}</div></div>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2.5" strokeLinecap="round"><polyline points="9,18 15,12 9,6" /></svg>
          </div>
        ))}
      </div>

      <ResetSiteButton accent={accent} />
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState<'overview' | 'products' | 'orders' | 'auto' | 'settings'>('overview')
  const [accent, setAccent] = useState('#FF2D55')
  const [stats, setStats] = useState<DashboardStats>({ ca_today: 0, orders_today: 0, orders_total: 0, panier_moyen: 0, ca_week: [0,0,0,0,0,0,0], orders_week: [0,0,0,0,0,0,0] })
  const [latestOrder, setLatestOrder] = useState<Order | undefined>()
  const [funnel, setFunnel] = useState<FunnelStats>({ visitors: 0, product_views: 0, forms: 0, orders: 0, delivered: 0 })

  useEffect(() => {
    supabase.from('settings').select('key, value').then(({ data }) => {
      const c = (data || []).find((r: any) => r.key === 'primary_color')
      if (c?.value) setAccent(String(c.value).replace(/^"|"$/g, ''))
    })
    const loadStats = async () => {
      const today = new Date().toISOString().slice(0, 10)
      const { data: allOrders } = await supabase.from('orders').select('total_price, created_at, status').eq('is_test', false).order('created_at', { ascending: false })
      const { data: latest } = await supabase.from('orders').select('id, order_number, customer_name, customer_phone, customer_district, product_id, total_price, status, created_at, product:product_id(name)').eq('is_test', false).order('created_at', { ascending: false }).limit(1)
      if (latest?.[0]) setLatestOrder(latest[0] as Order)
      const rows = allOrders || []
      const todayRows = rows.filter((o: any) => o.created_at?.startsWith(today))
      const ca_today = todayRows.reduce((a: number, o: any) => a + (o.total_price || 0), 0)
      const orders_today = todayRows.length
      const orders_total = rows.length
      const panier_moyen = orders_total > 0 ? rows.reduce((a: number, o: any) => a + (o.total_price || 0), 0) / orders_total : 0
      const ca_week: number[] = [], orders_week: number[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const ds = d.toISOString().slice(0, 10)
        const dayRows = rows.filter((o: any) => o.created_at?.startsWith(ds))
        ca_week.push(dayRows.reduce((a: number, o: any) => a + (o.total_price || 0), 0))
        orders_week.push(dayRows.length)
      }
      setStats({ ca_today, orders_today, orders_total, panier_moyen, ca_week, orders_week })
      const formCount = rows.length
      const orderCount = rows.filter((o: any) => ['confirme','livre','annule'].includes(o.status)).length
      const deliveredCount = rows.filter((o: any) => o.status === 'livre').length
      const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_published', true)
      const productViews = (productCount || 0) * 18
      const estimatedVisitors = Math.round(productViews * 1.65)
      setFunnel({ visitors: estimatedVisitors, product_views: productViews, forms: formCount, orders: orderCount, delivered: deliveredCount })
    }
    loadStats()
  }, [])

  const tabs = [
    { id: 'overview', label: 'Aperçu',    icon: '📊' },
    { id: 'products', label: 'Produits',  icon: '🛍️' },
    { id: 'orders',   label: 'Commandes', icon: '📦' },
    { id: 'auto',     label: 'Relances',  icon: '💬' },
    { id: 'settings', label: 'Réglages',  icon: '⚙️' },
  ] as const

  return (
    <>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; } button { font-family: inherit; } ::-webkit-scrollbar { width: 0; height: 0; }`}</style>
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#F2F2F7', maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E5E5EA', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${accent},${accent}bb)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 16, flexShrink: 0 }}>C</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900 }}>Colioo Admin</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34C759' }} />
              <span style={{ fontSize: 11, color: '#34C759', fontWeight: 600 }}>En ligne · Admin</span>
            </div>
          </div>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', borderRadius: 10, background: '#F2F2F7', textDecoration: 'none', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9,22 9,12 15,12 15,22" /></svg>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#6B6B6B' }}>Voir le site</span>
          </a>
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 4px' }}>
          {tab === 'overview' && <OverviewTab stats={stats} latestOrder={latestOrder} accent={accent} funnel={funnel} />}
          {tab === 'products' && <ProductsTab accent={accent} />}
          {tab === 'orders'   && <OrdersTab accent={accent} />}
          {tab === 'auto'     && <AutoTab accent={accent} />}
          {tab === 'settings' && <SettingsTab accent={accent} onAccentChange={setAccent} />}
          <div style={{ height: 16 }} />
        </div>

        {/* Bottom nav */}
        <div style={{ background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid #E5E5EA', display: 'flex', padding: '6px 0 8px', flexShrink: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 0 6px', fontFamily: 'inherit' }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: tab === t.id ? accent : '#AEAEB2' }}>{t.label}</span>
              {tab === t.id && <div style={{ width: 20, height: 3, borderRadius: 2, background: accent, marginTop: 2 }} />}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}