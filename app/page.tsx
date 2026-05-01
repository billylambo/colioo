'use client'

import { useState, useEffect, useRef } from 'react'
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
}

const fmt = (p: number) => p.toLocaleString('fr-FR') + ' FCFA'

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

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = Math.ceil(target / 50)
    const t = setInterval(() => {
      start = Math.min(start + step, target)
      setVal(start)
      if (start >= target) clearInterval(t)
    }, 25)
    return () => clearInterval(t)
  }, [target])
  return <span>{val.toLocaleString('fr-FR')}{suffix}</span>
}

function Countdown() {
  const [time, setTime] = useState({ h: 3, m: 47, s: 22 })
  useEffect(() => {
    const t = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev
        s--; if (s < 0) { s = 59; m-- } if (m < 0) { m = 59; h-- } if (h < 0) return prev
        return { h, m, s }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[time.h, time.m, time.s].map((v, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ background: 'rgba(255,255,255,.15)', color: '#fff', borderRadius: 5, padding: '2px 6px', fontSize: 13, fontWeight: 900, minWidth: 26, textAlign: 'center' }}>{pad(v)}</div>
          {i < 2 && <span style={{ color: 'rgba(255,255,255,.6)', fontWeight: 900, fontSize: 12 }}>:</span>}
        </span>
      ))}
    </div>
  )
}

function ProductCard({ p, accent, borderRadius, onTap }: { p: Product; accent: string; borderRadius: string; onTap: (p: Product) => void }) {
  const disc = p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : 0
  const [liked, setLiked] = useState(false)
  const img = p.product_images?.[0]?.url
  return (
    <div onClick={() => onTap(p)} style={{ background: '#fff', borderRadius, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 14px rgba(0,0,0,.08)' }}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(.97)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}>
      <div style={{ position: 'relative', height: 170, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {img ? <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} /> : <div style={{ fontSize: 56 }}>🛍️</div>}
        {p.badge && <div style={{ position: 'absolute', top: 8, left: 8, background: accent, color: '#fff', borderRadius: 5, padding: '3px 7px', fontSize: 10, fontWeight: 900 }}>{p.badge}</div>}
        {disc > 0 && <div style={{ position: 'absolute', top: 8, right: 36, background: 'rgba(255,45,85,.9)', color: '#fff', borderRadius: 5, padding: '3px 7px', fontSize: 10, fontWeight: 900 }}>-{disc}%</div>}
        <button onClick={e => { e.stopPropagation(); setLiked(l => !l) }} style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? accent : 'none'} stroke={liked ? accent : '#999'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
        </button>
      </div>
      <div style={{ padding: '10px 10px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#0D0D0D', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
        <div style={{ marginBottom: 6 }}><MiniStars /></div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: accent }}>{fmt(p.price)}</span>
          {p.original_price && <span style={{ fontSize: 11, color: '#AEAEB2', textDecoration: 'line-through' }}>{fmt(p.original_price)}</span>}
        </div>
        <button style={{ width: '100%', height: 32, borderRadius: 9, background: `linear-gradient(135deg,${accent},${accent}cc)`, border: 'none', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Commander</button>
      </div>
    </div>
  )
}

function WhyUs({ borderRadius }: { borderRadius: string }) {
  const items = [
    { icon: '💵', title: 'Paiement à la livraison', desc: 'Payez uniquement quand vous recevez. Zéro risque.', color: '#ECFDF5' },
    { icon: '🚚', title: 'Livraison 24–48h', desc: 'Abidjan en 24h. Intérieur du pays 3–5 jours.', color: '#E8F4FF' },
    { icon: '🔄', title: 'Retours gratuits 7j', desc: 'Pas satisfait(e) ? On reprend sans discussion.', color: '#FFF0F3' },
    { icon: '💬', title: 'Support WhatsApp 7j/7', desc: 'Notre équipe répond en moins de 30 minutes.', color: '#FFF3CD' },
    { icon: '✅', title: 'Produits vérifiés', desc: 'Chaque article contrôlé avant expédition.', color: '#F0F0FF' },
    { icon: '🔒', title: 'Données sécurisées', desc: 'Vos infos ne sont jamais partagées.', color: '#FFF8F0' },
  ]
  return (
    <div style={{ padding: '16px 12px 0' }}>
      <h2 style={{ fontSize: 17, fontWeight: 900, color: '#0D0D0D', marginBottom: 4 }}>🛡️ Pourquoi choisir Colioo ?</h2>
      <p style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 14 }}>Tout est pensé pour votre satisfaction.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: '#fff', borderRadius, padding: '14px 12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 10 }}>{item.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4, lineHeight: 1.3 }}>{item.title}</div>
            <div style={{ fontSize: 11, color: '#6B6B6B', lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const FAQS = [
  { q: 'Comment fonctionne le paiement à la livraison ?', a: 'Vous ne payez rien maintenant. Le paiement se fait en cash directement au livreur. Aucun risque pour vous.' },
  { q: 'Quel est le délai de livraison ?', a: 'À Abidjan : 24 à 48h. À l\'intérieur du pays : 3 à 5 jours. Vous serez contacté par WhatsApp avant.' },
  { q: 'Puis-je retourner un produit ?', a: 'Oui. Vous avez 7 jours après réception pour retourner le produit si vous n\'êtes pas satisfait(e).' },
  { q: 'Les tailles sont-elles standard ?', a: 'Nos tailles suivent le standard européen. En cas de doute, prenez la taille supérieure.' },
]

function FAQSection({ accent }: { accent: string }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div style={{ margin: '16px 12px 0', background: '#fff', borderRadius: 20, padding: '16px' }}>
      <h2 style={{ fontSize: 17, fontWeight: 900, marginBottom: 4 }}>❓ Questions fréquentes</h2>
      <p style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 14 }}>Tout ce que vous devez savoir avant de commander.</p>
      {FAQS.map((faq, i) => (
        <div key={i} style={{ borderTop: i === 0 ? 'none' : '1px solid #F2F2F7' }}>
          <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0D0D0D', lineHeight: 1.4 }}>{faq.q}</span>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: open === i ? accent : '#F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .2s' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={open === i ? '#fff' : '#6B6B6B'} strokeWidth="3" strokeLinecap="round" style={{ transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }}>
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </div>
          </button>
          {open === i && <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.65, paddingBottom: 14 }}>{faq.a}</p>}
        </div>
      ))}
    </div>
  )
}

const TESTIMONIALS = [
  { name: 'Aminata K.',   city: 'Cocody',   rating: 5, text: 'Livraison en moins de 24h, qualité incroyable ! Exactement comme sur la photo.', color: '#E8A87C', orders: 4 },
  { name: 'Fatou D.',     city: 'Yopougon', rating: 5, text: 'Paiement à la livraison, très rassurant. Je n\'ai payé qu\'après avoir vu le produit.', color: '#7CB8E8', orders: 2 },
  { name: 'Marie-Claire', city: 'Marcory',  rating: 5, text: 'La qualité dépasse mes attentes. Le tissu est magnifique et la coupe est parfaite.', color: '#A8D87C', orders: 6 },
  { name: 'Bamba S.',     city: 'Plateau',  rating: 4, text: 'Service client très réactif sur WhatsApp. Livraison rapide et bien emballée.', color: '#D4A8E8', orders: 3 },
]

function DrawerMenu({ open, onClose, accent, router }: { open: boolean; onClose: () => void; accent: string; router: ReturnType<typeof useRouter> }) {
  const go = (path: string) => { onClose(); router.push(path) }
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', opacity: open ? 1 : 0, transition: 'opacity .3s', pointerEvents: open ? 'all' : 'none' }} />
      <div style={{ position: 'fixed', top: 0, left: 0, transform: open ? 'translateX(0)' : 'translateX(-100%)', width: '80%', maxWidth: 300, height: '100dvh', background: '#fff', zIndex: 90, transition: 'transform .35s cubic-bezier(.32,.72,0,1)', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 30px rgba(0,0,0,.15)' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0D0D0D' }}>Menu</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {[
            { icon: '🏠', label: 'Accueil', path: '/' },
            { icon: '🛍️', label: 'Catalogue', path: '/catalogue' },
            { icon: 'ℹ️', label: 'À propos', path: '/a-propos' },
            { icon: '📞', label: 'Contact', path: '/contact' },
            { icon: '📄', label: 'Mentions légales', path: '/mentions-legales' },
          ].map((item, i) => (
            <button key={i} onClick={() => go(item.path)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', borderBottom: '1px solid #F8F8F8' }}>
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{item.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0D0D0D' }}>{item.label}</span>
              <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2.5" strokeLinecap="round"><polyline points="9,18 15,12 9,6" /></svg>
            </button>
          ))}
        </div>
        <div style={{ padding: '16px 20px 32px', borderTop: '1px solid #F2F2F7' }}>
          <button onClick={() => go('/admin')} style={{ width: '100%', height: 46, borderRadius: 14, background: `linear-gradient(135deg,${accent},${accent}cc)`, border: 'none', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            🔐 Connexion Admin
          </button>
        </div>
      </div>
    </>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCat, setActiveCat] = useState('Tout')
  const [ready, setReady] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const g = (key: string, fallback = '') => settings[key] || fallback

  useEffect(() => {
    const load = async () => {
      try {
        const { data: rawSettings } = await supabase.from('settings').select('key, value')
        if (rawSettings) {
          const map: Record<string, string> = {}
          for (const row of rawSettings as { key: string; value: unknown }[]) {
            const raw = row.value
            if (typeof raw === 'string') map[row.key] = raw.replace(/^"|"$/g, '')
            else if (typeof raw === 'object' && raw !== null) map[row.key] = JSON.stringify(raw)
            else map[row.key] = String(raw ?? '')
          }
          setSettings(map)
        }
        const { data: prods } = await supabase
          .from('products')
          .select('id, name, price, original_price, slug, badge, category_id, product_images(url)')
          .order('created_at', { ascending: false })
          .limit(12)
        if (prods) setProducts(prods as Product[])
        const { data: cats } = await supabase
          .from('categories')
          .select('id, name')
          .order('name')
        if (cats) setCategories(cats as Category[])
      } catch (e) {
        console.error('Erreur chargement:', e)
      } finally {
        setReady(true)
      }
    }
    load()
  }, [])

  const accent       = g('primary_color', '#FF2D55')
  const bgColor      = g('bg_color', '#F2F2F7')
  const darkColor    = g('dark_color', '#1A1A2E')
  const borderRadius = g('border_radius', '16px')
  const borderBtn    = g('border_radius_btn', '50px')
  const siteName     = g('site_name', 'COLIOO')
  const siteTagline  = g('site_tagline', 'MODE PREMIUM · COD')
  const logoUrl      = g('logo_url', '')
  const heroType     = g('hero_type', 'color')
  const heroBgColor  = g('hero_bg_color', '#1A1A2E')
  const heroBgUrl    = g('hero_bg_url', '')
  const heroOverlay  = g('hero_overlay', '0.5')
  const heroTextColor = g('hero_text_color', '#FFFFFF')
  const heroBadge    = g('hero_badge', '🔥 Nouvelle Collection 2026')
  const heroTitle    = g('hero_title', 'La Mode Premium\nLivrée Chez Vous')
  const heroCTA      = g('hero_cta_text', 'Commander Maintenant')
  const heroCTAUrl   = g('hero_cta_url', '/catalogue')
  const whatsapp     = g('whatsapp', '2250000000000')
  const footerSlogan    = g('footer', '{}') 
  const footerData      = (() => { try { return JSON.parse(footerSlogan) } catch { return {} } })()
  const footerSloganTxt = footerData.slogan || 'La boutique premium pour l\'Afrique'
  const footerCopyright = footerData.copyright || `© 2026 ${siteName} — Tous droits réservés.`
  const footerLiens     = footerData.liens || [['Catalogue', '/catalogue'], ['À propos', '/a-propos'], ['Contact', '/contact'], ['Mentions légales', '/mentions-legales']]
  const fontHeading  = g('font_heading', 'Poppins')
  const fontBody     = g('font_body', 'Inter')

  const filteredProducts = activeCat === 'Tout'
    ? products
    : products.filter(p => {
        const cat = categories.find(c => c.name === activeCat)
        return cat ? p.category_id === cat.id : true
      })

  const goProduct = (p: Product) => router.push(`/produit/${p.slug}`)

  return (
    <>
      {!ready && (
        <div style={{ position: 'fixed', inset: 0, background: '#F2F2F7', zIndex: 999, display: 'flex', flexDirection: 'column', gap: 12, padding: 12 }}>
          <div style={{ height: 52, background: '#fff', borderRadius: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 230, background: '#E5E5EA', borderRadius: 24, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 90, background: '#fff', borderRadius: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${fontHeading}:wght@700;900&family=${fontBody}:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: '${fontBody}', -apple-system, sans-serif; background: ${bgColor}; }
        h1, h2, h3 { font-family: '${fontHeading}', sans-serif; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes shimmer { 0%{transform:translateX(-150%) skewX(-20deg)} 100%{transform:translateX(350%) skewX(-20deg)} }
      `}</style>

      <DrawerMenu open={menuOpen} onClose={() => setMenuOpen(false)} accent={accent} router={router} />

      <div style={{ background: bgColor, minHeight: '100dvh', paddingBottom: 20 }}>

        {/* ── Ticker Banner défilant ── */}
        

        {/* ── Social Proof pop-ups ── */}
        

        {/* ── Header sticky ── */}
        <div style={{ background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(20px)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(0,0,0,.06)', position: 'sticky', top: 0, zIndex: 40 }}>
          <div>
            {logoUrl
              ? <img src={logoUrl} alt={siteName} style={{ height: 32, objectFit: 'contain' }} />
              : <div style={{ fontSize: 18, fontWeight: 900, color: '#0D0D0D', letterSpacing: .5 }}>{siteName}</div>
            }
            <div style={{ fontSize: 10, color: accent, fontWeight: 700, letterSpacing: .3 }}>{siteTagline}</div>
          </div>
          <div onClick={() => router.push('/catalogue')} style={{ flex: 1, height: 36, borderRadius: 12, background: '#F2F2F7', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <span style={{ fontSize: 13, color: '#AEAEB2' }}>Rechercher…</span>
          </div>
          <button onClick={() => setMenuOpen(true)} style={{ width: 36, height: 36, borderRadius: 12, background: '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <div style={{ width: 16, height: 2, borderRadius: 1, background: '#0D0D0D' }} />
            <div style={{ width: 16, height: 2, borderRadius: 1, background: '#0D0D0D' }} />
            <div style={{ width: 12, height: 2, borderRadius: 1, background: '#0D0D0D' }} />
          </button>
        </div>

        {/* Hero */}
        <div style={{ position: 'relative', margin: '12px 12px 0', borderRadius: 24, overflow: 'hidden', height: 230 }}>
          {(heroType === 'image' || heroType === 'gif') && heroBgUrl && (
            <img src={heroBgUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {heroType === 'video' && heroBgUrl && (
            <video autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}>
              <source src={heroBgUrl} />
            </video>
          )}
          <div style={{ position: 'absolute', inset: 0, background: heroType === 'color' ? `linear-gradient(145deg,${heroBgColor},${darkColor})` : `rgba(0,0,0,${heroOverlay})` }} />
          <div style={{ position: 'absolute', top: -40, right: -30, width: 200, height: 200, borderRadius: '50%', background: `${accent}1A` }} />
          <div style={{ position: 'relative', zIndex: 2, padding: '20px 18px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '4px 12px', marginBottom: 10, border: '1px solid rgba(255,255,255,.18)' }}>
              <span style={{ fontSize: 12, color: heroTextColor, fontWeight: 700 }}>{heroBadge}</span>
            </div>
            <h1 style={{ fontSize: 23, fontWeight: 900, color: heroTextColor, lineHeight: 1.2, marginBottom: 10, textShadow: '0 2px 10px rgba(0,0,0,.3)', whiteSpace: 'pre-line' }}>{heroTitle}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex' }}>
                {['#E8A87C', '#7CB8E8', '#A8D87C'].map((c, i) => (
                  <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: '2px solid rgba(255,255,255,.3)', marginLeft: i ? -6 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff' }}>{['A', 'F', 'M'][i]}</div>
                ))}
              </div>
              <span style={{ fontSize: 12, color: heroTextColor, fontWeight: 600, opacity: .85 }}>+1 247 clientes satisfaites</span>
            </div>
            <button onClick={() => router.push(heroCTAUrl)} style={{ height: 42, padding: '0 20px', borderRadius: borderBtn, background: accent, border: 'none', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 8px 22px ${accent}66` }}>
              {heroCTA}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ margin: '12px 12px 0', background: '#fff', borderRadius: borderRadius, padding: '14px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
          {[
            { icon: '🛍️', content: <AnimatedCounter target={1247} suffix="+" />, label: 'Commandes' },
            { icon: '⭐', content: <span>4.8</span>, label: 'Note moy.' },
            { icon: '✅', content: <AnimatedCounter target={98} suffix="%" />, label: 'Satisfaites' },
          ].map((item, i) => (
            <span key={i} style={{ display: 'contents' }}>
              {i > 0 && <div style={{ width: 1, height: 36, background: '#F2F2F7' }} />}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, marginBottom: 4 }}>{item.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0D0D0D' }}>{item.content}</div>
                <div style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 600 }}>{item.label}</div>
              </div>
            </span>
          ))}
        </div>

        {/* Vente flash */}
        {products.length > 0 && (
          <div style={{ margin: '12px 12px 0', background: '#fff', borderRadius: borderRadius, overflow: 'hidden' }}>
            <div style={{ background: `linear-gradient(90deg,${accent},${accent}cc)`, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>⚡ Vente Flash</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.8)', fontWeight: 600 }}>Fin dans</span>
                <Countdown />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, padding: '12px', overflowX: 'auto' }}>
              {products.slice(0, 6).map(p => {
                const img = p.product_images?.[0]?.url
                const disc = p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : 0
                return (
                  <div key={p.id} onClick={() => goProduct(p)} style={{ flexShrink: 0, width: 108, cursor: 'pointer' }}>
                    <div style={{ height: 96, borderRadius: 12, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, marginBottom: 6, position: 'relative', overflow: 'hidden' }}>
                      {img ? <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} /> : <span>🛍️</span>}
                      {disc > 0 && <div style={{ position: 'absolute', top: 4, right: 4, background: accent, color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 900 }}>-{disc}%</div>}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#0D0D0D', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: accent }}>{fmt(p.price)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Catégories */}
        {categories.length > 0 && (
          <div style={{ padding: '14px 12px 0' }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
              {['Tout', ...categories.map(c => c.name)].map(c => (
                <button key={c} onClick={() => setActiveCat(c)} style={{ flexShrink: 0, height: 32, padding: '0 14px', borderRadius: borderBtn, border: 'none', background: activeCat === c ? accent : '#fff', color: activeCat === c ? '#fff' : '#6B6B6B', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', whiteSpace: 'nowrap', boxShadow: activeCat === c ? `0 4px 12px ${accent}44` : 'none' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trust badges */}
        <div style={{ margin: '14px 12px 0', borderRadius: borderRadius, overflow: 'hidden', background: `linear-gradient(135deg,${darkColor},#16213E)`, padding: '16px 12px' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ icon: '🚚', title: 'Livraison rapide', sub: '24–48h Abidjan' }, { icon: '💵', title: 'Paiement COD', sub: 'Cash à livraison' }, { icon: '🔄', title: 'Retours 7j', sub: 'Satisfait garanti' }].map((item, i) => (
              <span key={i} style={{ display: 'contents' }}>
                {i > 0 && <div style={{ width: 1, background: 'rgba(255,255,255,.1)' }} />}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, textAlign: 'center', padding: '0 4px' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{item.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>{item.title}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', lineHeight: 1.3 }}>{item.sub}</div>
                </div>
              </span>
            ))}
          </div>
        </div>

        {/* Grille produits */}
        <div style={{ padding: '16px 12px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: '#0D0D0D' }}>✨ Tendances</h2>
            <span onClick={() => router.push('/catalogue')} style={{ fontSize: 13, color: accent, fontWeight: 700, cursor: 'pointer' }}>Voir tout →</span>
          </div>
          {!ready ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#AEAEB2', fontSize: 14 }}>Chargement…</div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#AEAEB2', fontSize: 14 }}>Aucun produit pour l'instant</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {filteredProducts.map(p => <ProductCard key={p.id} p={p} accent={accent} borderRadius={borderRadius} onTap={goProduct} />)}
            </div>
          )}
        </div>

        <WhyUs borderRadius={borderRadius} />

        {/* Bannière promo */}
        <div style={{ margin: '16px 12px 0', borderRadius: borderRadius, overflow: 'hidden', position: 'relative', height: 130, background: `linear-gradient(135deg,${accent},${accent}99)` }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
          <div style={{ position: 'relative', zIndex: 1, padding: '22px 20px' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', fontWeight: 700, marginBottom: 4 }}>OFFRE SPÉCIALE</div>
            <div style={{ fontSize: 21, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Livraison GRATUITE<br />dès 30 000 FCFA</div>
            <button onClick={() => router.push('/catalogue')} style={{ height: 33, padding: '0 16px', borderRadius: borderBtn, background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.35)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>En profiter →</button>
          </div>
        </div>

        {/* Témoignages */}
        <div style={{ padding: '16px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px', marginBottom: 12 }}>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: '#0D0D0D' }}>⭐ Elles nous font confiance</h2>
            <span style={{ fontSize: 11, color: '#6B6B6B', fontWeight: 600 }}>1 247+ avis</span>
          </div>
          <div style={{ display: 'flex', gap: 10, padding: '0 12px', overflowX: 'auto', paddingBottom: 4 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ flexShrink: 0, width: 220, background: '#fff', borderRadius: borderRadius, padding: '14px', boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 14, flexShrink: 0 }}>{t.name[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: '#AEAEB2' }}>📍 {t.city} · {t.orders} commandes</div>
                  </div>
                  <div style={{ background: '#ECFDF5', borderRadius: 6, padding: '2px 6px', fontSize: 9, color: '#059669', fontWeight: 700 }}>✓ Vérifié</div>
                </div>
                <MiniStars rating={t.rating} size={11} />
                <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.55, marginTop: 7 }}>&ldquo;{t.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>

        <FAQSection accent={accent} />

        {/* CTA final */}
        <div style={{ margin: '16px 12px 0', background: `linear-gradient(135deg,${darkColor},#16213E)`, borderRadius: borderRadius, padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: `${accent}22` }} />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12, animation: 'float 2.5s ease-in-out infinite' }}>🛍️</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 8, lineHeight: 1.3 }}>Prête à commander ?</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', marginBottom: 20, lineHeight: 1.6 }}>Rejoignez les <strong style={{ color: '#fff' }}>1 247 clientes</strong> satisfaites ce mois-ci.</p>
            <button onClick={() => router.push('/catalogue')} style={{ width: '100%', height: 52, borderRadius: borderBtn, background: `linear-gradient(135deg,${accent},${accent}99)`, border: 'none', color: '#fff', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 10px 28px ${accent}55`, marginBottom: 12 }}>
              Découvrir nos produits →
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              {['💵 COD', '🚚 24h', '🔒 Sécurisé'].map(t => (
                <span key={t} style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div style={{ margin: '14px 12px 0', background: '#fff', borderRadius: borderRadius, padding: '16px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#F0FFF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>💬</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 2 }}>Rejoignez notre communauté</div>
            <div style={{ fontSize: 12, color: '#6B6B6B' }}>Offres exclusives & nouveautés sur WhatsApp</div>
          </div>
          <button onClick={() => window.open(`https://wa.me/${whatsapp}`, '_blank')} style={{ height: 36, padding: '0 14px', borderRadius: borderBtn, background: '#25D366', border: 'none', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Rejoindre</button>
        </div>

        {/* Footer */}
        <div style={{ background: '#111', padding: '22px 16px 40px', marginTop: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: 1, marginBottom: 4 }}>{siteName}</div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>{footerSloganTxt}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {(Array.isArray(footerLiens) ? footerLiens : []).map((lien: any, i: number) => {
              const label = Array.isArray(lien) ? lien[0] : lien.label
              const href = Array.isArray(lien) ? lien[1] : lien.href
              return <span key={i} onClick={() => router.push(href)} style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', cursor: 'pointer' }}>{label}</span>
            })}
          </div>
          <div style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.08)', fontSize: 11, color: 'rgba(255,255,255,.18)' }}>{footerCopyright}</div>
        </div>

      </div>
    </>
  )
}