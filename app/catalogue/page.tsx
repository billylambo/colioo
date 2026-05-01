'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Product {
  id: string
  name: string
  price: number
  original_price?: number
  slug: string
  badge?: string
  category_id?: string
  product_images: { url: string }[]
}

interface Category {
  id: string
  name: string
  slug: string
}

const fmt = (p: number) => p.toLocaleString('fr-FR') + ' FCFA'

const SORT_OPTIONS = [
  { id: 'newest',     label: 'Nouveautés'      },
  { id: 'price_asc',  label: 'Prix croissant'  },
  { id: 'price_desc', label: 'Prix décroissant' },
]

const PRICE_RANGES = [
  { id: 'all',  label: 'Tous les prix',    min: 0,      max: Infinity },
  { id: 'low',  label: 'Moins de 50 000',  min: 0,      max: 50000    },
  { id: 'mid',  label: '50 000 – 150 000', min: 50000,  max: 150000   },
  { id: 'high', label: 'Plus de 150 000',  min: 150000, max: Infinity },
]

function MiniStars({ rating = 4.5, size = 10 }: { rating?: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.floor(rating) ? '#FF9500' : '#E5E5EA'} stroke="none">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  )
}

function FilterSheet({ visible, sort, setSort, priceRange, setPriceRange, onClose, onReset, resultCount, accent }: {
  visible: boolean; sort: string; setSort: (s: string) => void
  priceRange: string; setPriceRange: (p: string) => void
  onClose: () => void; onReset: () => void; resultCount: number; accent: string
}) {
  if (!visible) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderRadius: '22px 22px 0 0', paddingBottom: 32 }}>
        <div style={{ padding: '10px 16px 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5E5EA', margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span style={{ fontSize: 17, fontWeight: 900 }}>Filtres & Tri</span>
            <button onClick={onReset} style={{ fontSize: 13, color: accent, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Réinitialiser</button>
          </div>
        </div>
        <div style={{ padding: '0 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#6B6B6B', marginBottom: 10 }}>TRIER PAR</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SORT_OPTIONS.map(s => (
              <button key={s.id} onClick={() => setSort(s.id)} style={{ height: 32, padding: '0 14px', borderRadius: 20, border: 'none', background: sort === s.id ? accent : '#F2F2F7', color: sort === s.id ? '#fff' : '#6B6B6B', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F2F2F7', paddingTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#6B6B6B', marginBottom: 10 }}>PRIX</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PRICE_RANGES.map(p => (
              <button key={p.id} onClick={() => setPriceRange(p.id)} style={{ height: 44, padding: '0 14px', borderRadius: 12, border: priceRange === p.id ? `2px solid ${accent}` : '1.5px solid #E5E5EA', background: priceRange === p.id ? accent + '10' : '#fff', color: priceRange === p.id ? accent : '#0D0D0D', fontSize: 14, fontWeight: priceRange === p.id ? 800 : 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all .2s' }}>
                {p.label}
                {priceRange === p.id && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: '0 16px' }}>
          <button onClick={onClose} style={{ width: '100%', height: 50, borderRadius: 16, background: `linear-gradient(135deg,${accent},${accent}cc)`, border: 'none', color: '#fff', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
            Voir {resultCount} produit{resultCount > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

function GridCard({ p, accent, onTap }: { p: Product; accent: string; onTap: (p: Product) => void }) {
  const [liked, setLiked] = useState(false)
  const disc = p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : 0
  const img = p.product_images?.[0]?.url  // ✅ url

  return (
    <div onClick={() => onTap(p)} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(.97)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}>
      <div style={{ position: 'relative', height: 160, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {img
          ? <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          : <div style={{ fontSize: 52 }}>🛍️</div>
        }
        {p.badge && <div style={{ position: 'absolute', top: 7, left: 7, background: accent, color: '#fff', borderRadius: 5, padding: '2px 7px', fontSize: 9, fontWeight: 900 }}>{p.badge}</div>}
        {disc > 0 && <div style={{ position: 'absolute', top: 7, right: 32, background: 'rgba(255,45,85,.9)', color: '#fff', borderRadius: 5, padding: '2px 6px', fontSize: 9, fontWeight: 900 }}>-{disc}%</div>}
        <button onClick={e => { e.stopPropagation(); setLiked(l => !l) }} style={{ position: 'absolute', top: 5, right: 5, width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? accent : 'none'} stroke={liked ? accent : '#999'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
        </button>
      </div>
      <div style={{ padding: '9px 10px 11px' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#0D0D0D', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
        <div style={{ marginBottom: 5 }}><MiniStars size={10} /></div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 7 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: accent }}>{fmt(p.price)}</span>
          {p.original_price && <span style={{ fontSize: 10, color: '#AEAEB2', textDecoration: 'line-through' }}>{fmt(p.original_price)}</span>}
        </div>
        <button style={{ width: '100%', height: 28, borderRadius: 8, background: `linear-gradient(135deg,${accent},${accent}cc)`, border: 'none', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Commander</button>
      </div>
    </div>
  )
}

function ListCard({ p, accent, onTap }: { p: Product; accent: string; onTap: (p: Product) => void }) {
  const [liked, setLiked] = useState(false)
  const disc = p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : 0
  const img = p.product_images?.[0]?.url  // ✅ url

  return (
    <div onClick={() => onTap(p)} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', display: 'flex', marginBottom: 10, boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(.99)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}>
      <div style={{ width: 110, flexShrink: 0, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {img
          ? <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          : <div style={{ fontSize: 44 }}>🛍️</div>
        }
        {p.badge && <div style={{ position: 'absolute', top: 6, left: 6, background: accent, color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 900 }}>{p.badge}</div>}
        {disc > 0 && <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(255,45,85,.9)', color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 900 }}>-{disc}%</div>}
      </div>
      <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0D0D0D', lineHeight: 1.3, flex: 1, paddingRight: 8 }}>{p.name}</div>
            <button onClick={e => { e.stopPropagation(); setLiked(l => !l) }} style={{ width: 28, height: 28, borderRadius: '50%', background: '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? accent : 'none'} stroke={liked ? accent : '#999'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            </button>
          </div>
          <MiniStars size={11} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 900, color: accent }}>{fmt(p.price)}</span>
            {p.original_price && <span style={{ fontSize: 11, color: '#AEAEB2', textDecoration: 'line-through', marginLeft: 6 }}>{fmt(p.original_price)}</span>}
          </div>
          <button style={{ height: 32, padding: '0 14px', borderRadius: 10, background: `linear-gradient(135deg,${accent},${accent}cc)`, border: 'none', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Commander</button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onReset, accent }: { onReset: () => void; accent: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
      <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Aucun produit trouvé</div>
      <div style={{ fontSize: 14, color: '#6B6B6B', marginBottom: 24, lineHeight: 1.6 }}>Essayez de modifier vos filtres ou votre recherche.</div>
      <button onClick={onReset} style={{ height: 44, padding: '0 24px', borderRadius: 14, background: accent, border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Réinitialiser les filtres</button>
    </div>
  )
}

export default function CataloguePage() {
  const router = useRouter()
  const [accent, setAccent] = useState('#FF2D55')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState('Tout')
  const [sort, setSort] = useState('newest')
  const [priceRange, setPriceRange] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilter, setShowFilter] = useState(false)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: settings } = await supabase.from('settings').select('key, value')
      if (settings) {
        const c = (settings as {key:string;value:string}[]).find(r => r.key === 'primary_color')
        if (c?.value) setAccent(c.value)
      }

      // ✅ product_images(url) — colonne correcte
      const { data: prods, error } = await supabase
        .from('products')
        .select('id, name, price, original_price, slug, badge, category_id, product_images(url)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error) console.error('Produits:', error.message)
      if (prods) setProducts(prods as Product[])

      const { data: cats, error: catErr } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('position')

      if (catErr) console.error('Catégories:', catErr.message)
      if (cats) setCategories(cats as Category[])

      setLoading(false)
    }
    load()
  }, [])

  const priceObj = PRICE_RANGES.find(p => p.id === priceRange)!

  const filtered = useMemo(() => {
    let list = [...products]
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.badge?.toLowerCase().includes(q))
    }
    if (activeCat !== 'Tout') {
      const cat = categories.find(c => c.name === activeCat)
      if (cat) list = list.filter(p => p.category_id === cat.id)
    }
    list = list.filter(p => p.price >= priceObj.min && p.price < priceObj.max)
    if (sort === 'price_asc')  list = list.sort((a, b) => a.price - b.price)
    if (sort === 'price_desc') list = list.sort((a, b) => b.price - a.price)
    return list
  }, [products, query, activeCat, categories, priceObj, sort])

  const hasFilters = sort !== 'newest' || priceRange !== 'all'
  const activeFilterCount = (sort !== 'newest' ? 1 : 0) + (priceRange !== 'all' ? 1 : 0)
  const reset = useCallback(() => { setQuery(''); setSort('newest'); setPriceRange('all'); setActiveCat('Tout') }, [])
  const goProduct = (p: Product) => router.push(`/produit/${p.slug}`)

  return (
    <>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F2F2F7; } button { font-family: inherit; } ::-webkit-scrollbar { width: 0; height: 0; }`}</style>

      <div style={{ position: 'relative', height: '100dvh', display: 'flex', flexDirection: 'column', background: '#F2F2F7', maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,.07)', padding: '10px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <button onClick={() => router.push('/')} style={{ width: 36, height: 36, borderRadius: '50%', background: '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
            </button>
            <div style={{ flex: 1, height: 40, borderRadius: 14, background: '#F2F2F7', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', border: focused ? `2px solid ${accent}` : '2px solid transparent', transition: 'border .2s' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={focused ? accent : '#AEAEB2'} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="Rechercher un produit…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#0D0D0D' }} />
              {query && <button onClick={() => setQuery('')} style={{ width: 18, height: 18, borderRadius: '50%', background: '#AEAEB2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, flexShrink: 0 }}>✕</button>}
            </div>
            <button onClick={() => setShowFilter(true)} style={{ width: 40, height: 40, borderRadius: 14, background: hasFilters ? accent : '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={hasFilters ? '#fff' : '#0D0D0D'} strokeWidth="2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
              {activeFilterCount > 0 && <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#fff', border: `2px solid ${accent}` }} />}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2 }}>
            {['Tout', ...categories.map(c => c.name)].map(c => (
              <button key={c} onClick={() => setActiveCat(c)} style={{ flexShrink: 0, height: 30, padding: '0 14px', borderRadius: 20, border: 'none', background: activeCat === c ? accent : '#F2F2F7', color: activeCat === c ? '#fff' : '#6B6B6B', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', whiteSpace: 'nowrap', boxShadow: activeCat === c ? `0 4px 12px ${accent}44` : 'none' }}>{c}</button>
            ))}
          </div>
        </div>

        {/* Résultats + toggle vue */}
        <div style={{ padding: '10px 14px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: '#6B6B6B', fontWeight: 600 }}>
            <strong style={{ color: '#0D0D0D' }}>{filtered.length}</strong> produit{filtered.length !== 1 ? 's' : ''}{query ? ` pour "${query}"` : ''}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {([{ id: 'grid', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg> }, { id: 'list', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> }] as const).map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id as 'grid' | 'list')} style={{ width: 32, height: 32, borderRadius: 10, background: viewMode === v.id ? accent : '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: viewMode === v.id ? '#fff' : '#6B6B6B', transition: 'all .2s' }}>{v.icon}</button>
            ))}
          </div>
        </div>

        {/* Chips actifs */}
        {(hasFilters || query) && (
          <div style={{ padding: '0 14px 8px', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
            {sort !== 'newest' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: accent + '15', borderRadius: 20, padding: '4px 10px', border: `1px solid ${accent}30` }}>
                <span style={{ fontSize: 12, color: accent, fontWeight: 700 }}>{SORT_OPTIONS.find(s => s.id === sort)?.label}</span>
                <button onClick={() => setSort('newest')} style={{ width: 14, height: 14, borderRadius: '50%', background: accent, border: 'none', cursor: 'pointer', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, padding: 0 }}>✕</button>
              </div>
            )}
            {priceRange !== 'all' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: accent + '15', borderRadius: 20, padding: '4px 10px', border: `1px solid ${accent}30` }}>
                <span style={{ fontSize: 12, color: accent, fontWeight: 700 }}>{PRICE_RANGES.find(p => p.id === priceRange)?.label}</span>
                <button onClick={() => setPriceRange('all')} style={{ width: 14, height: 14, borderRadius: '50%', background: accent, border: 'none', cursor: 'pointer', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, padding: 0 }}>✕</button>
              </div>
            )}
            <button onClick={reset} style={{ height: 24, padding: '0 10px', borderRadius: 20, background: '#F2F2F7', border: 'none', color: '#6B6B6B', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Effacer tout</button>
          </div>
        )}

        {/* Produits */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2px 12px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#AEAEB2', fontSize: 14 }}>Chargement…</div>
          ) : filtered.length === 0 ? (
            <EmptyState onReset={reset} accent={accent} />
          ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 8 }}>
              {filtered.map(p => <GridCard key={p.id} p={p} accent={accent} onTap={goProduct} />)}
            </div>
          ) : (
            <div style={{ paddingTop: 8 }}>
              {filtered.map(p => <ListCard key={p.id} p={p} accent={accent} onTap={goProduct} />)}
            </div>
          )}
        </div>

        <FilterSheet visible={showFilter} sort={sort} setSort={setSort} priceRange={priceRange} setPriceRange={setPriceRange} onClose={() => setShowFilter(false)} onReset={() => { setSort('newest'); setPriceRange('all') }} resultCount={filtered.length} accent={accent} />
      </div>
    </>
  )
}