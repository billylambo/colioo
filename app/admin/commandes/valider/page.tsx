'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_ville: string
  customer_district: string
  total_price: number
  status: string
  created_at: string
  products: { name: string }
}

export default function CommandesAValider() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; orderId: string | null; action: 'confirme' | 'annule' | null }>({ isOpen: false, orderId: null, action: null })

  useEffect(() => { loadOrders() }, [])

  const loadOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, products(name)')
      .eq('status', 'nouveau')
      .order('created_at', { ascending: false })
    if (data) setOrders(data)
    setLoading(false)
  }

  const handleAction = (id: string, action: 'confirme' | 'annule') => {
    setConfirmModal({ isOpen: true, orderId: id, action })
  }

  const confirmAction = async () => {
    if (!confirmModal.orderId || !confirmModal.action) return
    await supabase.from('orders').update({ status: confirmModal.action }).eq('id', confirmModal.orderId)
    setConfirmModal({ isOpen: false, orderId: null, action: null })
    loadOrders()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.action === 'confirme' ? 'Valider cette commande ?' : 'Rejeter cette commande ?'}
        message={confirmModal.action === 'confirme' ? 'La commande sera marquée comme confirmée.' : 'La commande sera annulée définitivement.'}
        confirmLabel={confirmModal.action === 'confirme' ? '✅ Valider' : '❌ Rejeter'}
        confirmColor={confirmModal.action === 'confirme' ? '#10b981' : '#ef4444'}
        onConfirm={confirmAction}
        onCancel={() => setConfirmModal({ isOpen: false, orderId: null, action: null })}
      />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-charcoal font-poppins">Commandes à valider</h1>
        <p className="text-gray-600 font-inter mt-1">{orders.length} commande(s) en attente</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00] mx-auto"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-gray-400 font-inter">Aucune commande en attente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-poppins font-bold text-charcoal">{order.customer_name}</h3>
                  <p className="text-gray-500 font-inter text-sm">{order.customer_phone}</p>
                  <p className="text-gray-500 font-inter text-sm">{order.customer_district}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#FF6B00] font-poppins font-bold">{order.total_price?.toLocaleString()} FCFA</p>
                  <p className="text-gray-400 font-inter text-xs">{new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <p className="text-charcoal font-inter text-sm mb-4">📦 {order.products?.name}</p>
              <div className="flex gap-3">
                <button onClick={() => handleAction(order.id, 'confirme')}
                  className="flex-1 bg-green-500 text-white font-inter font-bold py-2 rounded-full hover:bg-green-600 transition-colors">
                  ✅ Valider
                </button>
                <button onClick={() => handleAction(order.id, 'annule')}
                  className="flex-1 bg-red-100 text-red-600 font-inter font-bold py-2 rounded-full hover:bg-red-200 transition-colors">
                  ❌ Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}