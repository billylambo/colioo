'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  original_price: number | null
  badge: string | null
  is_published: boolean
  created_at: string
  images: { url: string; is_cover: boolean }[]
}

export default function ProduitsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; productId: string | null }>({ isOpen: false, productId: null })

  useEffect(() => { loadProducts() }, [])

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`*, images:product_images(url, is_cover)`)
      .order('created_at', { ascending: false })
    if (!error && data) setProducts(data)
    setLoading(false)
  }

  const deleteProduct = async (id: string) => {
    setConfirmModal({ isOpen: true, productId: id })
  }

  const confirmDelete = async () => {
    if (!confirmModal.productId) return
    const id = confirmModal.productId
    setConfirmModal({ isOpen: false, productId: null })
    setDeleting(id)
    const response = await fetch(`/api/commander/products/${id}`, { method: 'DELETE' })
    const data = await response.json()
    const error = response.ok ? null : data.error
    if (error) {
      alert(`Erreur: ${error.message}`)
    } else {
      setProducts(products.filter(p => p.id !== id))
    }
    setDeleting(null)
  }

  const getCoverImage = (product: Product) => {
    const cover = product.images?.find(img => img.is_cover)
    return cover?.url || product.images?.[0]?.url || null
  }

  const getBadgeInfo = (badge: string | null) => {
    switch (badge) {
      case 'nouveau': return { label: 'Nouveau', bg: '#DBEAFE', text: '#1D4ED8' }
      case 'promo': return { label: 'Promo', bg: '#FEE2E2', text: '#DC2626' }
      case 'best_seller': return { label: 'Best Seller', bg: '#FFEDD5', text: '#EA580C' }
      case 'rupture': return { label: 'Rupture', bg: '#F3F4F6', text: '#6B7280' }
      case 'livraison_gratuite': return { label: 'Livraison gratuite', bg: '#DCFCE7', text: '#16A34A' }
      default: return null
    }
  }

  return (
    <div>
      <button onClick={() => window.history.back()} className="flex items-center gap-2 mb-5 text-[#FF6B00] font-inter font-semibold text-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
        Retour
      </button>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Supprimer ce produit ?"
        message="Cette action est irréversible. Le produit sera définitivement supprimé."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        confirmColor="#ef4444"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, productId: null })}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal font-poppins">Mes produits</h1>
          <p className="text-gray-500 font-inter mt-1 text-sm">{products.length} produit{products.length > 1 ? 's' : ''}</p>
        </div>
        <Link href="/admin/produits/nouveau"
          className="bg-[#FF6B00] text-white font-inter font-bold py-2 px-5 rounded-full hover:bg-[#e55f00] transition-colors text-sm">
          + Nouveau
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00] mx-auto"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-gray-400 font-inter mb-4">Aucun produit</p>
          <Link href="/admin/produits/nouveau" className="bg-[#FF6B00] text-white font-inter font-bold py-2 px-6 rounded-full">
            Créer un produit
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const coverUrl = getCoverImage(product)
            const badgeInfo = getBadgeInfo(product.badge)
            return (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 p-4">

                  {/* Photo */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {coverUrl ? (
                      <img src={coverUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="font-inter font-bold text-charcoal text-sm truncate">{product.name}</p>
                    <p className="font-inter text-xs text-gray-400 truncate mb-1">/{product.slug}</p>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Prix */}
                      <span className="font-poppins font-bold text-[#FF6B00] text-sm">
                        {product.price.toLocaleString()} FCFA
                      </span>
                      {product.original_price && (
                        <span className="font-inter text-xs text-gray-400 line-through">
                          {product.original_price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {/* Badge */}
                      {badgeInfo && (
                        <span style={{ background: badgeInfo.bg, color: badgeInfo.text }}
                          className="px-2 py-0.5 rounded-full text-xs font-inter font-medium">
                          {badgeInfo.label}
                        </span>
                      )}
                      {/* Statut */}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-inter font-medium ${product.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {product.is_published ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link href={`/admin/produits/${product.id}`}
                      className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      disabled={deleting === product.id}
                      className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors disabled:opacity-50">
                      {deleting === product.id ? (
                        <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3,6 5,6 21,6" />
                          <path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6" />
                          <path d="M10,11v6M14,11v6" />
                          <path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1V6" />
                        </svg>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}