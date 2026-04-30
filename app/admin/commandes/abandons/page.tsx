'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface AbandonEvent {
  id: string
  created_at: string
  metadata: {
    name: string
    phone: string
    district: string
  }
  products: { name: string; price: number }
}

export default function CommandesAbandons() {
  const [abandons, setAbandons] = useState<AbandonEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAbandons()
  }, [])

  const loadAbandons = async () => {
    const { data } = await supabase
      .from('events')
      .select('*, products(name, price)')
      .eq('event_type', 'whatsapp_redirect')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setAbandons(data)
    setLoading(false)
  }

  const relancer = (phone: string, productName: string) => {
    const message = `Bonjour ! 👋 Vous avez consulté *${productName}* sur COLIOO. Avez-vous des questions ? Nous sommes là pour vous aider ! 😊`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-charcoal font-poppins">Abandons de commande</h1>
        <p className="text-gray-600 font-inter mt-1">{abandons.length} visiteur(s) à relancer</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00] mx-auto"></div>
        </div>
      ) : abandons.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-400 font-inter">Aucun abandon enregistré</p>
        </div>
      ) : (
        <div className="space-y-4">
          {abandons.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-poppins font-bold text-charcoal">
                    {event.metadata?.name || 'Visiteur anonyme'}
                  </h3>
                  <p className="text-gray-500 font-inter text-sm">{event.metadata?.phone || 'Pas de téléphone'}</p>
                  <p className="text-gray-500 font-inter text-sm">{event.metadata?.district || ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#FF6B00] font-poppins font-bold">{event.products?.price?.toLocaleString()} FCFA</p>
                  <p className="text-gray-400 font-inter text-xs">{new Date(event.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <p className="text-charcoal font-inter text-sm mb-4">📦 {event.products?.name}</p>
              {event.metadata?.phone && (
                <button
                  onClick={() => relancer(event.metadata.phone, event.products?.name)}
                  className="w-full bg-[#25D366] text-white font-inter font-bold py-2 rounded-full hover:bg-green-600 transition-colors"
                >
                  💬 Relancer sur WhatsApp
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}