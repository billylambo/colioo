'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Order {
  id: string
  product_id: string
  customer_name: string
  customer_phone: string
  customer_district: string
  options_chosen: { couleur?: string; taille?: string; grammage?: string } | null
  status: string
  total_price: number
  order_number: string | null
  created_at: string
  product?: { name: string }
}

export default function CommandesPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('tous')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [accent, setAccent] = useState('#FF6B00')
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; orderId: string | null; action: string | null }>({ isOpen: false, orderId: null, action: null })

  useEffect(() => {
    fetchOrders()
    loadAccent()
  }, [])

  const loadAccent = async () => {
    const { data } = await supabase.from('settings').select('key, value').eq('key', 'primary_color').single()
    if (data?.value) setAccent(String(data.value).replace(/^"|"$/g, ''))
  }

  async function fetchOrders() {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`*, product:product_id(name)`)
      .order('created_at', { ascending: false })
    if (!error) setOrders(data || [])
    setLoading(false)
  }

  const handleAction = (orderId: string, action: string) => {
    setConfirmModal({ isOpen: true, orderId, action })
  }

  const confirmAction = async () => {
    if (!confirmModal.orderId || !confirmModal.action) return
    const { error } = await supabase.from('orders').update({ status: confirmModal.action }).eq('id', confirmModal.orderId)
    if (!error) setOrders(orders.map(o => o.id === confirmModal.orderId ? { ...o, status: confirmModal.action! } : o))
    setConfirmModal({ isOpen: false, orderId: null, action: null })
  }

  const getModalProps = (action: string | null) => {
    switch (action) {
      case 'confirme': return { title: 'Valider la commande ?', message: 'La commande sera marquée comme confirmée.', confirmLabel: '✅ Valider', confirmColor: '#10b981' }
      case 'annule': return { title: 'Annuler la commande ?', message: 'La commande sera annulée.', confirmLabel: '❌ Annuler', confirmColor: '#ef4444' }
      case 'livre': return { title: 'Marquer comme livré ?', message: 'La commande sera marquée comme livrée.', confirmLabel: '🚚 Livré', confirmColor: '#3b82f6' }
      default: return { title: '', message: '', confirmLabel: 'Confirmer', confirmColor: '#FF6B00' }
    }
  }

  const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    nouveau:  { label: 'Nouveau',   bg: '#FFF9E6', color: '#B45309', dot: '#F59E0B' },
    confirme: { label: 'Confirmé',  bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
    livre:    { label: 'Livré',     bg: '#EFF6FF', color: '#1E40AF', dot: '#3B82F6' },
    annule:   { label: 'Annulé',    bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
  }

  const filteredOrders = orders.filter(order => {
    const s = search.toLowerCase()
    const matchSearch =
      order.customer_name.toLowerCase().includes(s) ||
      order.customer_phone.includes(search) ||
      order.customer_district.toLowerCase().includes(s) ||
      (order.product?.name || '').toLowerCase().includes(s) ||
      (order.order_number || '').toLowerCase().includes(s)
    const matchStatus = filterStatus === 'tous' || order.status === filterStatus
    return matchSearch && matchStatus
  })

  const stats = {
    total: orders.length,
    nouveau: orders.filter(o => o.status === 'nouveau').length,
    confirme: orders.filter(o => o.status === 'confirme').length,
    livre: orders.filter(o => o.status === 'livre').length,
    annule: orders.filter(o => o.status === 'annule').length,
    revenue: orders.filter(o => o.status !== 'annule').reduce((a, o) => a + (o.total_price || 0), 0),
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const getDistrict = (d: string) => {
    const parts = d.split(' - ')
    return { ville: parts[0] || d, quartier: parts[1] || '' }
  }

  const modalProps = getModalProps(confirmModal.action)

  const statCards = [
    { label: 'Total', value: stats.total, color: '#6B6B6B', bg: '#F8F8F8' },
    { label: 'Nouveaux', value: stats.nouveau, color: '#B45309', bg: '#FFF9E6' },
    { label: 'Confirmés', value: stats.confirme, color: '#065F46', bg: '#ECFDF5' },
    { label: 'Livrés', value: stats.livre, color: '#1E40AF', bg: '#EFF6FF' },
    { label: 'Revenus', value: stats.revenue.toLocaleString('fr-FR') + ' FCFA', color: accent, bg: accent + '12', wide: true },
  ]

  return (
    <div style={{ padding: '24px 20px', maxWidth: 1100, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <button onClick={() => window.history.back()} className="flex items-center gap-2 mb-5 text-[#FF6B00] font-inter font-semibold text-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
        Retour
      </button>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={modalProps.title}
        message={modalProps.message}
        confirmLabel={modalProps.confirmLabel}
        confirmColor={modalProps.confirmColor}
        onConfirm={confirmAction}
        onCancel={() => setConfirmModal({ isOpen: false, orderId: null, action: null })}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0D0D0D', margin: 0 }}>Commandes</h1>
          <p style={{ fontSize: 13, color: '#6B6B6B', margin: '2px 0 0' }}>{filteredOrders.length} commande(s) affichée(s)</p>
        </div>
        <button onClick={fetchOrders} style={{ height: 38, padding: '0 16px', borderRadius: 10, background: '#F2F2F7', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#6B6B6B', fontFamily: 'inherit' }}>
          🔄 Actualiser
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '14px 16px', border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>{s.label}</div>
            <div style={{ fontSize: s.wide ? 15 : 22, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Rechercher nom, téléphone, produit, CMD-..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, height: 42, borderRadius: 12, border: '1.5px solid #E5E5EA', padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {['tous', 'nouveau', 'confirme', 'livre', 'annule'].map(s => {
            const cfg = s === 'tous' ? { label: 'Tous', dot: '#6B6B6B' } : { label: STATUS_CONFIG[s]?.label, dot: STATUS_CONFIG[s]?.dot }
            const active = filterStatus === s
            return (
              <button key={s} onClick={() => setFilterStatus(s)} style={{ height: 42, padding: '0 14px', borderRadius: 12, border: `1.5px solid ${active ? cfg.dot : '#E5E5EA'}`, background: active ? cfg.dot + '15' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: active ? cfg.dot : '#6B6B6B', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s' }}>
                {s !== 'tous' && <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot }} />}
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Liste commandes */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#AEAEB2', fontSize: 14 }}>Chargement…</div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#AEAEB2' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Aucune commande trouvée</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredOrders.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.nouveau
            const { ville, quartier } = getDistrict(order.customer_district)
            const expanded = expandedId === order.id
            const opts = order.options_chosen
            const hasOpts = opts && (opts.couleur || opts.taille || opts.grammage)

            return (
              <div key={order.id} style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #F0F0F0', overflow: 'hidden', transition: 'box-shadow .2s', boxShadow: expanded ? '0 4px 20px rgba(0,0,0,.08)' : 'none' }}>
                {/* Ligne principale */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }} onClick={() => setExpandedId(expanded ? null : order.id)}>

                  {/* Statut dot */}
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />

                  {/* Référence */}
                  <div style={{ width: 100, flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0D0D0D' }}>{order.order_number || `#${order.id.slice(0,6)}`}</div>
                    <div style={{ fontSize: 11, color: '#AEAEB2' }}>{formatDate(order.created_at)}</div>
                  </div>

                  {/* Client */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0D0D0D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.customer_name}</div>
                    <div style={{ fontSize: 12, color: '#6B6B6B' }}>{order.customer_phone}</div>
                  </div>

                  {/* Produit */}
                  <div style={{ flex: 1, minWidth: 0, display: 'none' }} className="sm-show">
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0D0D0D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.product?.name || 'Supprimé'}</div>
                    <div style={{ fontSize: 11, color: '#6B6B6B' }}>{ville}{quartier ? ` — ${quartier}` : ''}</div>
                  </div>

                  {/* Prix */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: accent }}>{(order.total_price || 0).toLocaleString('fr-FR')} FCFA</div>
                    <div style={{ display: 'inline-block', marginTop: 3, padding: '2px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700 }}>{cfg.label}</div>
                  </div>

                  {/* Chevron */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2.5" strokeLinecap="round" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
                    <polyline points="6,9 12,15 18,9" />
                  </svg>
                </div>

                {/* Détails expandés */}
                {expanded && (
                  <div style={{ borderTop: '1px solid #F2F2F7', padding: '16px', background: '#FAFAFA' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#AEAEB2', marginBottom: 4 }}>PRODUIT</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0D0D0D' }}>{order.product?.name || 'Supprimé'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#AEAEB2', marginBottom: 4 }}>LIVRAISON</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0D0D0D' }}>{ville}</div>
                        {quartier && <div style={{ fontSize: 12, color: '#6B6B6B' }}>{quartier}</div>}
                      </div>
                      {hasOpts && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#AEAEB2', marginBottom: 4 }}>OPTIONS</div>
                          {opts?.couleur && <div style={{ fontSize: 13, color: '#0D0D0D' }}>🎨 {opts.couleur}</div>}
                          {opts?.taille && <div style={{ fontSize: 13, color: '#0D0D0D' }}>📐 {opts.taille}</div>}
                          {opts?.grammage && <div style={{ fontSize: 13, color: '#0D0D0D' }}>⚖️ {opts.grammage}</div>}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#AEAEB2', marginBottom: 4 }}>TOTAL</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: accent }}>{(order.total_price || 0).toLocaleString('fr-FR')} FCFA</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {order.status === 'nouveau' && (
                        <>
                          <button onClick={() => handleAction(order.id, 'confirme')} style={{ height: 38, padding: '0 16px', borderRadius: 10, background: '#10B981', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            ✅ Valider
                          </button>
                          <button onClick={() => handleAction(order.id, 'annule')} style={{ height: 38, padding: '0 16px', borderRadius: 10, background: '#EF4444', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            ❌ Annuler
                          </button>
                        </>
                      )}
                      {order.status === 'confirme' && (
                        <button onClick={() => handleAction(order.id, 'livre')} style={{ height: 38, padding: '0 16px', borderRadius: 10, background: '#3B82F6', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          🚚 Marquer livré
                        </button>
                      )}
                      <a href={`https://wa.me/${order.customer_phone.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer"
                        style={{ height: 38, padding: '0 16px', borderRadius: 10, background: '#25D366', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                        💬 WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}