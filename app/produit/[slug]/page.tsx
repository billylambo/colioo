'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  original_price: number | null
  badge: string | null
  whatsapp_number: string
  logo_url?: string
  images: { url: string; position: number; is_cover: boolean }[]
  sections?: Record<string, unknown>
}

interface Upsell {
  id: string
  name: string
  price: number
  emoji: string
  color: string
  image_url?: string
}

interface Review {
  name: string
  rating: number
  text: string
  photo_url?: string
  colis_url?: string
}

interface PageProps {
  params: Promise<{ slug: string }>
}

const TOUS_PAYS = [
  { code: '+225', pays: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: '+223', pays: 'Mali', flag: '🇲🇱' },
  { code: '+226', pays: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+227', pays: 'Niger', flag: '🇳🇪' },
  { code: '+228', pays: 'Togo', flag: '🇹🇬' },
  { code: '+229', pays: 'Bénin', flag: '🇧🇯' },
  { code: '+221', pays: 'Sénégal', flag: '🇸🇳' },
  { code: '+224', pays: 'Guinée', flag: '🇬🇳' },
  { code: '+220', pays: 'Gambie', flag: '🇬🇲' },
  { code: '+231', pays: 'Libéria', flag: '🇱🇷' },
  { code: '+232', pays: 'Sierra Leone', flag: '🇸🇱' },
  { code: '+233', pays: 'Ghana', flag: '🇬🇭' },
  { code: '+234', pays: 'Nigeria', flag: '🇳🇬' },
  { code: '+212', pays: 'Maroc', flag: '🇲🇦' },
  { code: '+213', pays: 'Algérie', flag: '🇩🇿' },
  { code: '+216', pays: 'Tunisie', flag: '🇹🇳' },
  { code: '+20', pays: 'Égypte', flag: '🇪🇬' },
  { code: '+237', pays: 'Cameroun', flag: '🇨🇲' },
  { code: '+241', pays: 'Gabon', flag: '🇬🇦' },
  { code: '+242', pays: 'Congo', flag: '🇨🇬' },
  { code: '+243', pays: 'RD Congo', flag: '🇨🇩' },
  { code: '+244', pays: 'Angola', flag: '🇦🇴' },
  { code: '+251', pays: 'Éthiopie', flag: '🇪🇹' },
  { code: '+254', pays: 'Kenya', flag: '🇰🇪' },
  { code: '+27', pays: 'Afrique du Sud', flag: '🇿🇦' },
  { code: '+33', pays: 'France', flag: '🇫🇷' },
  { code: '+1', pays: 'USA/Canada', flag: '🇺🇸' },
]

const VILLES_CI: Record<string, string[]> = {
  'Abidjan': ['Abobo','Adjamé','Attécoubé','Cocody','Koumassi','Marcory','Plateau','Port-Bouët','Treichville','Yopougon','Bingerville','Anyama','Songon'],
  'Bouaké': ['Koko','Dar Es Salam','Sokoura','Broukro'],
  'Daloa': ['Orly','Kennedy','Lobia'],
  'Yamoussoukro': ['Habitat','Dioulakro','Assabou'],
  'San-Pédro': ['Bardot','Balmer','Cité'],
  'Korhogo': ['Sossorhon','Koko','Petit Paris'],
  'Man': ['Dompleu','Zéo'],
  'Gagnoa': ['Dioulabougou','Gozabo'],
  'Divo': ['Centre','Guitry'],
  'Abengourou': ['Centre','Quartier France'],
  'Grand-Bassam': ['Quartier France', 'Quartier Impérial', 'Moossou', 'Vitré', 'Gonzagueville', 'Koffikro', 'N\'Zida'],
}

export default function ProductPage({ params }: PageProps) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [upsells, setUpsells] = useState<Upsell[]>([])

  const [formName, setFormName] = useState('')
  const [indicatif, setIndicatif] = useState('+225')
  const [showIndicatifs, setShowIndicatifs] = useState(false)
  const [phoneNum, setPhoneNum] = useState('')
  const [ville, setVille] = useState('')
  const [villeAutre, setVilleAutre] = useState('')
  const [quartier, setQuartier] = useState('')
  const [quartierAutre, setQuartierAutre] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isFromAd, setIsFromAd] = useState(() => {
  if (typeof window === 'undefined') return false
  const p = new URLSearchParams(window.location.search)
  return p.has('fbclid') || p.has('ttclid') ||
    p.get('utm_source') === 'facebook' ||
    p.get('utm_source') === 'tiktok' ||
    p.get('utm_medium') === 'paid'
})

  const [selectedCouleur, setSelectedCouleur] = useState('')
  const [selectedTaille, setSelectedTaille] = useState('')
  const [selectedGrammage, setSelectedGrammage] = useState('')

useEffect(() => {
  if (drawerOpen) {
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
  } else {
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.width = ''
  }
  return () => {
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.width = ''
  }
}, [drawerOpen])

  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const indicatifRef = useRef<HTMLDivElement>(null)

  const g = (key: string, fallback = '') => settings[key] || fallback

  useEffect(() => {
    const init = async () => {
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
        const { slug } = await params
        const { data } = await supabase
          .from('products')
          .select('*, is_test_mode, images:product_images(url, position, is_cover), sections:product_sections(*)')
          .eq('slug', slug)
          .single()
        if (data) {
          const sortedImages = (data.images || []).sort((a: { position: number }, b: { position: number }) => a.position - b.position)
          setProduct({ ...data, images: sortedImages, sections: data.sections?.[0] || {} })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const villeFinalCheck = ville === 'Autre' ? villeAutre : ville
    const quartierFinalCheck = (quartier === 'Autre' || quartier === 'Autre quartier') ? quartierAutre : quartier
    if (!formName || !phoneNum || !villeFinalCheck || (ville !== 'Autre' && !quartierFinalCheck)) return
    if (!product) return
    setSubmitting(true)
    try {
      const totalUpsells = upsells.reduce((a, u) => a + u.price, 0)
      const phoneComplet = indicatif + phoneNum
      const villeFinal = ville === 'Autre' ? villeAutre : ville
      const quartierFinal = (quartier === 'Autre' || quartier === 'Autre quartier') ? quartierAutre : quartier
      const optionsArr = [
        selectedCouleur && `Couleur: ${selectedCouleur}`,
        selectedTaille && `Taille: ${selectedTaille}`,
        selectedGrammage && `Grammage: ${selectedGrammage}`,
      ].filter(Boolean)

      const orderNum = `CMD-${Date.now().toString().slice(-6)}`
      const totalFinal = product.price * quantity + totalUpsells

      const { error } = await supabase.from('orders').insert({
        product_id: product.id,
        customer_name: formName,
        customer_phone: phoneComplet,
        customer_district: `${villeFinal} - ${quartierFinal}`,
        total_price: totalFinal,
        status: 'nouveau',
        options_chosen: { couleur: selectedCouleur, taille: selectedTaille, grammage: selectedGrammage },
        order_number: orderNum,
        is_test: (product as any).is_test_mode === true,
      })
      if (error) { alert('Erreur: ' + error.message); return }

      try {
        await fetch('/api/telegram/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNum,
            customerName: formName,
            customerPhone: phoneComplet,
            productName: product.name,
            ville: villeFinal,
            quartier: quartierFinal,
            total: totalFinal,
          }),
        })
      } catch (err) {
        console.error('Telegram notify error:', err)
      }

      const message =
       `NOUVELLE COMMANDE` +
        `\nRef : ${orderNum}` +
        `\n-------------------` +
        `\n\nProduit : ${product.name}` +
        `\nPrix : ${totalFinal.toLocaleString('fr-FR')} FCFA` +
        (optionsArr.length ? `\nOptions : ${optionsArr.join(', ')}` : '') +
        (upsells.length > 0 ? `\nExtras : ${upsells.map(u => u.name).join(', ')}` : '') +
        `\nQuantite : ${quantity}` +
        `\n\n-------------------` +
        `\nNom : ${formName}` +
        `\nTel : ${phoneComplet}` +
        `\nAdresse : ${villeFinal} — ${quartierFinal}` +
        `\n-------------------` +
        `\n\nPaiement a la livraison confirme` +
        `\nMerci de confirmer cette commande des que possible !`

      const waRaw = product.whatsapp_number || g('whatsapp', '2250000000000')
      const waClean = waRaw
        .replace('https://wa.me/', '')
        .replace('https://api.whatsapp.com/send?phone=', '')
        .replace(/\+/g, '')
        .replace(/\s/g, '')
        .split('?')[0]
        .split('/message/')[0]
      const url = `https://wa.me/${waClean}?text=${encodeURIComponent(message)}`
      setFormName(''); setPhoneNum(''); setVille(''); setVilleAutre(''); setQuartier(''); setQuartierAutre('')
      setUpsells([])
      setDrawerOpen(false)
      setShowSuccess(true)
      setTimeout(() => {
        window.open(url, '_blank')
      }, 300)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const accent = g('primary_color', '#FF2D55')
  const darkColor = g('dark_color', '#1A1A2E')
  const borderRadius = g('border_radius', '16px')
  const borderBtn = g('border_radius_btn', '50px')

  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2F2F7' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', borderWidth: 3, borderStyle: 'solid', borderColor: `${accent} transparent transparent transparent`, animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!product) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 48 }}>😕</div>
      <div style={{ fontSize: 16, fontWeight: 700 }}>Produit non trouvé</div>
      <button onClick={() => router.push('/catalogue')} style={{ height: 42, padding: '0 20px', borderRadius: borderBtn, background: accent, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Retour au catalogue</button>
    </div>
  )

  const images = product.images || []
  const coverImage = images.find(img => img.is_cover) || images[0]
  const s = product.sections || {} as Record<string, unknown>
  const logoPosition = (s.logo_position as string) || 'left'
  const arguments_ = (s.arguments as { icon: string; text: string }[]) || []
  const specs = (s.specs as { key: string; value: string }[]) || []
  const reviews = (s.reviews as Review[]) || []
  const faq = (s.faq as { question: string; answer: string }[]) || []
  const comparaison = (s.comparaison as { feature: string; notre_produit: string; concurrent: string }[]) || []
  const bundle = (s.bundle as { title?: string; items?: { name: string; price: number }[] }) || {}
  const persuasionSections = (s.persuasion_sections as { tag: string; title: string; text: string; image_url: string; visible: boolean }[]) || []
  const upsellItems = (s.upsell_items as Upsell[]) || []
  const couleurs = (s.couleurs as { nom: string; hex: string }[]) || []
  const tailles = (s.tailles as string[]) || []
  const grammages = (s.grammages as string[]) || []

  const getYoutubeId = (url: string) => url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1] || null
  const disc = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : 0
  const totalPrice = product.price * quantity + upsells.reduce((a, u) => a + u.price, 0)
  const hasOptions = couleurs.length > 0 || tailles.length > 0 || grammages.length > 0
  const quartiersDisponibles = (ville && ville !== 'Autre') ? (VILLES_CI[ville] || []) : []

  const toggleUpsell = (item: Upsell) => {
    setUpsells(prev => prev.find(u => u.id === item.id) ? prev.filter(u => u.id !== item.id) : [...prev, item])
  }

  const nextImage = () => setSelectedImage(i => (i + 1) % images.length)
  const prevImage = () => setSelectedImage(i => (i - 1 + images.length) % images.length)

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 50, borderRadius: 14, border: '1.5px solid #E5E5EA',
    padding: '0 16px', fontSize: 16, fontFamily: 'inherit', outline: 'none',
    background: '#FAFAFA', boxSizing: 'border-box'
  }
  const selectStyle: React.CSSProperties = {
    width: '100%', height: 50, borderRadius: 14, border: '1.5px solid #E5E5EA',
    padding: '0 16px', fontSize: 16, fontFamily: 'inherit', outline: 'none',
    background: '#FAFAFA', boxSizing: 'border-box', cursor: 'pointer',
    appearance: 'none', WebkitAppearance: 'none',
  }

  const logoJustify = logoPosition === 'center' ? 'center' : logoPosition === 'right' ? 'flex-end' : 'flex-start'

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F2F2F7; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        @keyframes pop { 0%{transform:scale(0)} 70%{transform:scale(1.15)} 100%{transform:scale(1)} }
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(350%) skewX(-20deg); }
          @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes popIn {
          0% { transform: scale(0.5) translateY(40px); opacity: 0; }
          70% { transform: scale(1.08) translateY(-8px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        }
      `}</style>

      <div style={{ maxWidth: 480, margin: '0 auto', width: '100%', background: '#F2F2F7', minHeight: '100dvh', paddingBottom: 140 }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 8px', background: '#f0f0f0' }}>
          {!isFromAd && (
            <button onClick={() => router.push('/catalogue')} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 50, background: 'rgba(0,0,0,.08)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0D0D0D' }}>Catalogue</span>
            </button>
          )}
          {product.logo_url
            ? <img src={product.logo_url} alt="Logo" style={{ height: 40, maxWidth: 140, objectFit: 'contain', margin: isFromAd ? '0 auto' : '0 0 0 auto' }} />
            : <div style={{ flex: 1 }} />
          }
        </div>

        <div style={{ position: 'relative', background: '#f0f0f0', overflow: 'hidden', userSelect: 'none' }}
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            touchEndX.current = e.changedTouches[0].clientX
            const diff = touchStartX.current - touchEndX.current
            if (Math.abs(diff) > 40 && images.length > 1) {
              if (diff > 0) nextImage(); else prevImage()
            }
          }}
        >
          <div style={{ height: 380, position: 'relative', overflow: 'hidden' }}>
            {images.length > 0
              ? <img src={images[selectedImage]?.url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'opacity .25s' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>🛍️</div>
            }
            {images.length > 1 && (
              <>
                <button onClick={prevImage} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.85)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
                </button>
                <button onClick={nextImage} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.85)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round"><polyline points="9,18 15,12 9,6" /></svg>
                </button>
                <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
                  {images.map((_, i) => (
                    <div key={i} onClick={() => setSelectedImage(i)} style={{ width: selectedImage === i ? 18 : 6, height: 6, borderRadius: 3, background: selectedImage === i ? accent : 'rgba(255,255,255,.6)', transition: 'all .3s', cursor: 'pointer' }} />
                  ))}
                </div>
              </>
            )}
            {product.badge && (
              <div style={{ position: 'absolute', top: 12, left: 12, background: accent, color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 800 }}>{product.badge}</div>
            )}
            {disc > 0 && (
              <div style={{ position: 'absolute', top: 12, right: 12, background: '#FF3B30', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 800 }}>-{disc}%</div>
            )}
          </div>

          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px 12px', overflowX: 'auto', background: '#f0f0f0', justifyContent: 'center' }}>
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} style={{ flexShrink: 0, width: 54, height: 54, borderRadius: 10, overflow: 'hidden', border: `2.5px solid ${selectedImage === i ? accent : '#E5E5EA'}`, transform: selectedImage === i ? 'scale(1.05)' : 'scale(1)', transition: 'all .2s', cursor: 'pointer', background: 'none', padding: 0 }}>
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 12px 0' }}>

          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0D0D0D', lineHeight: 1.2, marginBottom: 4 }}>{product.name}</h1>
          {(s.hero_tagline as string) && <p style={{ fontSize: 14, color: '#6B6B6B', marginBottom: 10 }}>{s.hero_tagline as string}</p>}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: accent }}>{product.price.toLocaleString('fr-FR')} FCFA</span>
            {product.original_price && <span style={{ fontSize: 16, color: '#AEAEB2', textDecoration: 'line-through' }}>{product.original_price.toLocaleString('fr-FR')} FCFA</span>}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#ECFDF5', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#059669' }}>💵 Paiement à la livraison</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#E8F4FF', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#007AFF' }}>🚚 Livraison 24–48h</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#FFF3CD', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#B45309' }}>⏳ Stock limité</span>
          </div>

          <div style={{ background: '#FFF0F3', border: '1px solid #FFD0DC', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#CC0033' }}>12 personnes regardent ce produit en ce moment</span>
          </div>

          <div style={{ background: '#fff', borderRadius: borderRadius, padding: '14px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', marginBottom: 8 }}>Quantité</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 36, height: 36, borderRadius: '50%', background: '#F2F2F7', border: 'none', fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#0D0D0D', minWidth: 28, textAlign: 'center' }}>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} style={{ width: 36, height: 36, borderRadius: '50%', background: accent, border: 'none', fontSize: 18, fontWeight: 700, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>
              {couleurs.length > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', marginBottom: 8 }}>Couleur</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {couleurs.map((c, i) => (
                      <button key={i} onClick={() => setSelectedCouleur(selectedCouleur === c.nom ? '' : c.nom)} title={c.nom}
                        style={{ width: 30, height: 30, borderRadius: '50%', background: c.hex, border: `3px solid ${selectedCouleur === c.nom ? accent : 'transparent'}`, outline: `2px solid ${selectedCouleur === c.nom ? accent : '#E5E5EA'}`, cursor: 'pointer', transition: 'all .2s', flexShrink: 0 }} />
                    ))}
                  </div>
                  {selectedCouleur && <div style={{ fontSize: 11, color: accent, fontWeight: 700, marginTop: 4 }}>{selectedCouleur}</div>}
                </div>
              )}
            </div>

            {tailles.length > 0 && (
              <div style={{ marginTop: 12, borderTop: couleurs.length > 0 ? '1px solid #F2F2F7' : 'none', paddingTop: couleurs.length > 0 ? 12 : 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', marginBottom: 8 }}>Taille</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {tailles.map((t, i) => (
                    <button key={i} onClick={() => setSelectedTaille(selectedTaille === t ? '' : t)}
                      style={{ padding: '6px 14px', borderRadius: 8, border: `2px solid ${selectedTaille === t ? accent : '#E5E5EA'}`, background: selectedTaille === t ? accent : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: selectedTaille === t ? '#fff' : '#0D0D0D', transition: 'all .2s' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {grammages.length > 0 && (
              <div style={{ marginTop: 12, borderTop: '1px solid #F2F2F7', paddingTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', marginBottom: 8 }}>Grammage</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {grammages.map((g2, i) => (
                    <button key={i} onClick={() => setSelectedGrammage(selectedGrammage === g2 ? '' : g2)}
                      style={{ padding: '6px 14px', borderRadius: 8, border: `2px solid ${selectedGrammage === g2 ? accent : '#E5E5EA'}`, background: selectedGrammage === g2 ? accent : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: selectedGrammage === g2 ? '#fff' : '#0D0D0D', transition: 'all .2s' }}>
                      {g2}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {hasOptions && (
            <button onClick={() => setDrawerOpen(true)} style={{ position: 'relative', overflow: 'hidden', width: '100%', height: 52, borderRadius: 50, background: accent, border: 'none', color: '#fff', fontSize: 15, fontWeight: 900, letterSpacing: .4, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 8px 24px ${accent}44`, marginBottom: 14 }}>
              COMMANDER
              <span style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent)', animation: 'shimmer 2.5s infinite' }} />
            </button>
          )}

          {arguments_.length > 0 && (
            <div style={{ background: '#fff', borderRadius: borderRadius, padding: '14px', marginBottom: 14 }}>
              {arguments_.map((arg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < arguments_.length - 1 ? 10 : 0 }}>
                  <span style={{ fontSize: 20 }}>{arg.icon}</span>
                  <span style={{ fontSize: 14, color: '#0D0D0D', fontWeight: 600 }}>{arg.text}</span>
                </div>
              ))}
            </div>
          )}

          {persuasionSections.filter(sec => sec.visible !== false).map((sec, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: borderRadius, overflow: 'hidden', marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
              {sec.image_url && <img src={sec.image_url} alt={sec.title || ''} style={{ width: '100%', objectFit: 'cover', display: 'block' }} />}
              {(sec.title || sec.text) && (
                <div style={{ padding: '16px' }}>
                  {sec.title && <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0D0D0D', marginBottom: 8, lineHeight: 1.3 }}>{sec.title}</h3>}
                  {sec.text && <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.65, margin: 0 }}>{sec.text}</p>}
                </div>
              )}
            </div>
          ))}

          {upsellItems.length > 0 && (
            <div style={{ background: '#fff', borderRadius: borderRadius, padding: '16px', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>🎁 Complétez votre commande</h3>
              <p style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 14 }}>Ajoutez et économisez</p>
              {upsellItems.map(item => {
                const added = !!upsells.find(u => u.id === item.id)
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, background: added ? accent + '10' : '#F8F8F8', border: `1.5px solid ${added ? accent + '44' : 'transparent'}`, transition: 'all .25s', marginBottom: 10 }}>
                    <div style={{ width: 54, height: 54, borderRadius: 12, flexShrink: 0, overflow: 'hidden', background: `linear-gradient(135deg,${item.color}28,${item.color}66)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                      {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{item.name}</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: accent, marginTop: 2 }}>{item.price.toLocaleString('fr-FR')} FCFA</div>
                    </div>
                    <button onClick={() => toggleUpsell(item)} style={{ width: 36, height: 36, borderRadius: '50%', background: added ? accent : '#fff', border: `2px solid ${added ? accent : '#E5E5EA'}`, color: added ? '#fff' : '#6B6B6B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: added ? 16 : 22, transition: 'all .25s' }}>
                      {added ? '✓' : '+'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {bundle.title && (
            <div style={{ background: darkColor, borderRadius: borderRadius, padding: '16px', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 12 }}>🎁 {bundle.title}</h2>
              {(bundle.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < (bundle.items?.length ?? 0) - 1 ? '1px solid rgba(255,255,255,.1)' : 'none' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>{item.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: accent }}>{item.price.toLocaleString('fr-FR')} FCFA</span>
                </div>
              ))}
            </div>
          )}

          {(s.video_url as string) && getYoutubeId(s.video_url as string) && (
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 10 }}>📹 Vidéo</h2>
              <div style={{ borderRadius: borderRadius, overflow: 'hidden', aspectRatio: '16/9' }}>
                <iframe src={`https://www.youtube.com/embed/${getYoutubeId(s.video_url as string)}`} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
              </div>
            </div>
          )}

          {(s.description as string) && (
            <div style={{ background: '#fff', borderRadius: borderRadius, padding: '16px', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 10 }}>📝 Description</h2>
              <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{s.description as string}</p>
            </div>
          )}

          {specs.length > 0 && (
            <div style={{ background: '#fff', borderRadius: borderRadius, padding: '16px', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 12 }}>📊 Caractéristiques</h2>
              {specs.map((spec, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < specs.length - 1 ? '1px solid #F2F2F7' : 'none' }}>
                  <span style={{ fontSize: 13, color: '#6B6B6B' }}>{spec.key}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0D0D0D' }}>{spec.value}</span>
                </div>
              ))}
            </div>
          )}

          {comparaison.length > 0 && (
            <div style={{ background: darkColor, borderRadius: borderRadius, padding: '16px', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 12 }}>⚖️ Comparaison</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 700 }}>Fonctionnalité</span>
                <span style={{ fontSize: 11, color: accent, fontWeight: 700, textAlign: 'center' }}>Nous</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 700, textAlign: 'center' }}>Concurrent</span>
              </div>
              {comparaison.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,.08)' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,.7)' }}>{item.feature}</span>
                  <span style={{ fontSize: 12, color: '#fff', textAlign: 'center', fontWeight: 700 }}>{item.notre_produit}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', textAlign: 'center' }}>{item.concurrent}</span>
                </div>
              ))}
            </div>
          )}

          {reviews.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 12 }}>⭐ Avis clients</h2>
              {reviews.map((review, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: borderRadius, padding: '14px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    {review.photo_url
                      ? <img src={review.photo_url} alt={review.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E5E5EA', flexShrink: 0 }} />
                      : <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg,${accent}28,${accent}66)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>👤</div>
                    }
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#0D0D0D' }}>{review.name}</span>
                        <span style={{ fontSize: 10, background: '#ECFDF5', color: '#059669', borderRadius: 6, padding: '2px 6px', fontWeight: 700 }}>✓ Vérifié</span>
                      </div>
                      <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
                        {[1,2,3,4,5].map(star => (
                          <svg key={star} width="12" height="12" viewBox="0 0 24 24" fill={star <= review.rating ? '#FF9500' : '#E5E5EA'} stroke="none">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.55, marginBottom: review.colis_url ? 10 : 0 }}>{review.text}</p>
                  {review.colis_url && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#AEAEB2', marginBottom: 6 }}>📦 Colis reçu</div>
                      <img src={review.colis_url} alt="Colis reçu" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 10, border: '1px solid #E5E5EA', display: 'block' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {faq.length > 0 && (
            <div style={{ background: '#fff', borderRadius: borderRadius, padding: '16px', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 12 }}>❓ Questions fréquentes</h2>
              {faq.map((item, i) => (
                <div key={i} style={{ borderTop: i === 0 ? 'none' : '1px solid #F2F2F7' }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0D0D0D', lineHeight: 1.4 }}>{item.question}</span>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: openFaq === i ? accent : '#F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .2s' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={openFaq === i ? '#fff' : '#6B6B6B'} strokeWidth="3" strokeLinecap="round" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }}>
                        <polyline points="6,9 12,15 18,9" />
                      </svg>
                    </div>
                  </button>
                  {openFaq === i && <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.65, paddingBottom: 13 }}>{item.answer}</p>}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[{ icon: '🔒', label: 'Paiement sécurisé' }, { icon: '🚚', label: 'Livraison rapide' }, { icon: '🔄', label: 'Retours 7j' }].map((item, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6B6B6B', lineHeight: 1.3 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* STICKY BAR */}
        <div style={{ position: 'fixed', bottom: 14, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 28px)', maxWidth: 452, zIndex: 50, background: 'rgba(255,255,255,.82)', backdropFilter: 'blur(20px) saturate(1.8)', borderRadius: 20, border: '1px solid rgba(255,255,255,.6)', boxShadow: '0 8px 32px rgba(0,0,0,.14), 0 2px 8px rgba(0,0,0,.08)', padding: '10px 12px' }}>
          {upsells.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '6px 8px', background: 'rgba(0,0,0,.04)', borderRadius: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg,${accent}28,${accent}66)`, border: `2px solid ${accent}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {coverImage ? <img src={coverImage.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 16 }}>🛍️</span>}
              </div>
              {upsells.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: '#AEAEB2' }}>+</span>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${u.color}28,${u.color}66)`, border: `2px solid ${u.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, overflow: 'hidden' }}>
                      {u.image_url ? <img src={u.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{u.emoji}</span>}
                    </div>
                    <button onClick={() => setUpsells(prev => prev.filter(x => x.id !== u.id))} style={{ position: 'absolute', top: -3, right: -3, width: 15, height: 15, borderRadius: '50%', background: '#FF3B30', color: '#fff', border: '1.5px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, padding: 0, fontWeight: 900 }}>✕</button>
                  </div>
                </div>
              ))}
              <div style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 900, color: accent }}>{totalPrice.toLocaleString('fr-FR')} FCFA</div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, overflow: 'hidden', background: '#f5f5f5', flexShrink: 0 }}>
              {coverImage && <img src={coverImage.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0D0D0D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: accent }}>{totalPrice.toLocaleString('fr-FR')} FCFA</div>
            </div>
            <button onClick={() => setDrawerOpen(true)} style={{ position: 'relative', overflow: 'hidden', flexShrink: 0, background: accent, border: 'none', borderRadius: 50, padding: '11px 22px', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 6px 20px ${accent}55`, fontSize: 14, fontWeight: 900, letterSpacing: .3, whiteSpace: 'nowrap' }}>
              COMMANDER
              <span style={{ position: 'absolute', top: 0, left: 0, width: '45%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent)', animation: 'shimmer 2.5s infinite' }} />
            </button>
          </div>
        </div>

        {/* DRAWER */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: drawerOpen ? 'rgba(0,0,0,.5)' : 'transparent', backdropFilter: drawerOpen ? 'blur(4px)' : 'none', transition: 'all .3s', pointerEvents: drawerOpen ? 'all' : 'none' }} onClick={() => setDrawerOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: 0, left: '50%', transform: `translateX(-50%) translateY(${drawerOpen ? '0' : '100%'})`, width: '100%', maxWidth: 480, background: '#fff', borderRadius: '24px 24px 0 0', transition: 'transform .35s cubic-bezier(.32,.72,0,1)', maxHeight: '94vh', overflowY: 'auto' }}>

            <div style={{ padding: '10px 16px 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5E5EA', margin: '0 auto 16px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900 }}>Commander</h2>
                <button onClick={() => setDrawerOpen(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>

            <div style={{ padding: '0 16px 36px' }}>
              <div style={{ background: '#F8F8F8', borderRadius: 14, padding: '12px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: upsells.length > 0 ? 12 : 0 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', background: '#f0f0f0', flexShrink: 0 }}>
                    {coverImage && <img src={coverImage.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0D0D0D' }}>{product.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: accent, marginTop: 2 }}>{totalPrice.toLocaleString('fr-FR')} FCFA</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 10, padding: '4px 8px', border: '1px solid #E5E5EA' }}>
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 24, height: 24, borderRadius: '50%', background: '#F2F2F7', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ fontSize: 14, fontWeight: 900, minWidth: 18, textAlign: 'center' }}>{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} style={{ width: 24, height: 24, borderRadius: '50%', background: accent, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>
                {upsells.length > 0 && (
                  <div style={{ borderTop: '1px solid #E5E5EA', paddingTop: 10 }}>
                    {upsells.map(u => (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden', background: `linear-gradient(135deg,${u.color}28,${u.color}66)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                          {u.image_url ? <img src={u.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.emoji}
                        </div>
                        <span style={{ flex: 1, fontSize: 12, fontWeight: 700 }}>{u.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 900, color: accent }}>{u.price.toLocaleString('fr-FR')} FCFA</span>
                        <button onClick={() => setUpsells(prev => prev.filter(x => x.id !== u.id))} style={{ width: 22, height: 22, borderRadius: '50%', background: '#FFF0F0', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                {couleurs.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0D0D0D', marginBottom: 8 }}>Couleur</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {couleurs.map((c, i) => (
                        <button key={i} type="button" onClick={() => setSelectedCouleur(selectedCouleur === c.nom ? '' : c.nom)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, border: `2px solid ${selectedCouleur === c.nom ? accent : '#E5E5EA'}`, background: selectedCouleur === c.nom ? accent + '10' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: selectedCouleur === c.nom ? accent : '#0D0D0D', transition: 'all .2s' }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: c.hex }} />
                          {c.nom}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {tailles.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0D0D0D', marginBottom: 8 }}>Taille</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {tailles.map((t, i) => (
                        <button key={i} type="button" onClick={() => setSelectedTaille(selectedTaille === t ? '' : t)}
                          style={{ padding: '6px 14px', borderRadius: 8, border: `2px solid ${selectedTaille === t ? accent : '#E5E5EA'}`, background: selectedTaille === t ? accent : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: selectedTaille === t ? '#fff' : '#0D0D0D', transition: 'all .2s' }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {grammages.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0D0D0D', marginBottom: 8 }}>Grammage</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {grammages.map((g2, i) => (
                        <button key={i} type="button" onClick={() => setSelectedGrammage(selectedGrammage === g2 ? '' : g2)}
                          style={{ padding: '6px 14px', borderRadius: 8, border: `2px solid ${selectedGrammage === g2 ? accent : '#E5E5EA'}`, background: selectedGrammage === g2 ? accent : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: selectedGrammage === g2 ? '#fff' : '#0D0D0D', transition: 'all .2s' }}>
                          {g2}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nom / Prénoms */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0D0D0D', marginBottom: 8 }}>Nom / Prénoms</div>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Votre nom et prénoms"
                    style={{
                      ...inputStyle,
                      border: `1.5px solid ${submitted && !formName ? '#FF3B30' : '#E5E5EA'}`,
                      background: submitted && !formName ? '#FFF5F5' : '#FAFAFA',
                    }}
                  />
                  {submitted && !formName && <div style={{ fontSize: 11, color: '#FF3B30', fontWeight: 700, marginTop: 4 }}>⚠️ Ce champ est obligatoire</div>}
                </div>

                {/* Téléphone */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0D0D0D', marginBottom: 4 }}>
                    Numéro de téléphone <span style={{ fontWeight: 900, color: '#25D366' }}>(WhatsApp uniquement)</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div ref={indicatifRef} style={{ position: 'relative', flexShrink: 0 }}>
                      <button type="button" onClick={() => setShowIndicatifs(!showIndicatifs)}
                        style={{ height: 50, padding: '0 12px', borderRadius: 14, border: `1.5px solid ${submitted && !phoneNum ? '#FF3B30' : '#E5E5EA'}`, background: submitted && !phoneNum ? '#FFF5F5' : '#FAFAFA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        <span>{TOUS_PAYS.find(i => i.code === indicatif)?.flag}</span>
                        <span>{indicatif}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="3" strokeLinecap="round"><polyline points="6,9 12,15 18,9" /></svg>
                      </button>
                      {showIndicatifs && (
                        <div style={{ position: 'absolute', top: 54, left: 0, background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,.15)', zIndex: 100, minWidth: 220, maxHeight: 260, overflowY: 'auto', border: '1px solid #E5E5EA' }}>
                          {TOUS_PAYS.map(ind => (
                            <button key={ind.code} type="button" onClick={() => { setIndicatif(ind.code); setShowIndicatifs(false) }}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: indicatif === ind.code ? accent + '10' : 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                              <span style={{ fontSize: 18 }}>{ind.flag}</span>
                              <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{ind.pays}</span>
                              <span style={{ fontSize: 12, color: '#6B6B6B' }}>{ind.code}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={phoneNum}
                      onChange={e => setPhoneNum(e.target.value)}
                      onBlur={() => setShowIndicatifs(false)}
                      placeholder="0X XX XX XX XX"
                      style={{
                        ...inputStyle,
                        flex: 1,
                        border: `1.5px solid ${submitted && !phoneNum ? '#FF3B30' : '#E5E5EA'}`,
                        background: submitted && !phoneNum ? '#FFF5F5' : '#FAFAFA',
                      }}
                    />
                  </div>
                  {submitted && !phoneNum && <div style={{ fontSize: 11, color: '#FF3B30', fontWeight: 700, marginTop: 4 }}>⚠️ Ce champ est obligatoire</div>}
                </div>

                {/* Ville */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0D0D0D', marginBottom: 8 }}>Ville</div>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={ville}
                      onChange={e => { setVille(e.target.value); setQuartier(''); setQuartierAutre(''); setVilleAutre('') }}
                      style={{
                        ...selectStyle,
                        border: `1.5px solid ${submitted && !ville ? '#FF3B30' : '#E5E5EA'}`,
                        background: submitted && !ville ? '#FFF5F5' : '#FAFAFA',
                      }}
                    >
                      <option value="">Choisir une ville…</option>
                      {Object.keys(VILLES_CI).map(v => <option key={v} value={v}>{v}</option>)}
                      <option value="Autre" style={{ fontWeight: 700, color: accent }}>📍 Ma ville n'est pas dans la liste → Cliquer ici</option>
                    </select>
                    <svg style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="3" strokeLinecap="round"><polyline points="6,9 12,15 18,9" /></svg>
                  </div>
                  {submitted && !ville && <div style={{ fontSize: 11, color: '#FF3B30', fontWeight: 700, marginTop: 4 }}>⚠️ Ce champ est obligatoire</div>}
                  {ville === 'Autre' && (
                    <div style={{ marginTop: 8, padding: '10px 12px', background: accent + '10', borderRadius: 12, border: `2px dashed ${accent}` }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: accent, marginBottom: 6 }}>📍 Saisir votre ville manuellement</div>
                      <input
                        type="text"
                        value={villeAutre}
                        onChange={e => setVilleAutre(e.target.value)}
                        placeholder="Ex: Dimbokro, Tiassalé..."
                        style={{
                          ...inputStyle,
                          border: `1.5px solid ${submitted && !villeAutre ? '#FF3B30' : accent + '44'}`,
                          background: '#fff',
                        }}
                      />
                      {submitted && !villeAutre && <div style={{ fontSize: 11, color: '#FF3B30', fontWeight: 700, marginTop: 4 }}>⚠️ Veuillez saisir votre ville</div>}
                    </div>
                  )}
                </div>

                {/* Commune / Quartier */}
                {ville && ville !== 'Autre' && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0D0D0D', marginBottom: 8 }}>Commune / Quartier</div>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={quartier}
                        onChange={e => { setQuartier(e.target.value); setQuartierAutre('') }}
                        style={{
                          ...selectStyle,
                          border: `1.5px solid ${submitted && !quartier ? '#FF3B30' : '#E5E5EA'}`,
                          background: submitted && !quartier ? '#FFF5F5' : '#FAFAFA',
                        }}
                      >
                        <option value="">Choisir une commune / quartier…</option>
                        {(VILLES_CI[ville] || []).map(q => <option key={q} value={q}>{q}</option>)}
                        <option value="Autre" style={{ fontWeight: 700, color: accent }}>📍 Mon quartier n'est pas dans la liste → Cliquer ici</option>
                      </select>
                      <svg style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="3" strokeLinecap="round"><polyline points="6,9 12,15 18,9" /></svg>
                    </div>
                    {submitted && !quartier && <div style={{ fontSize: 11, color: '#FF3B30', fontWeight: 700, marginTop: 4 }}>⚠️ Ce champ est obligatoire</div>}
                    {(quartier === 'Autre' || quartier === 'Autre quartier') && (
                      <div style={{ marginTop: 8, padding: '10px 12px', background: accent + '10', borderRadius: 12, border: `2px dashed ${accent}` }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: accent, marginBottom: 6 }}>📍 Saisir votre commune / quartier manuellement</div>
                        <input
                          type="text"
                          value={quartierAutre}
                          onChange={e => setQuartierAutre(e.target.value)}
                          placeholder="Ex: Résidence Les Fleurs, Cité Bethel..."
                          style={{
                            ...inputStyle,
                            border: `1.5px solid ${submitted && !quartierAutre ? '#FF3B30' : accent + '44'}`,
                            background: '#fff',
                          }}
                        />
                        {submitted && !quartierAutre && <div style={{ fontSize: 11, color: '#FF3B30', fontWeight: 700, marginTop: 4 }}>⚠️ Veuillez saisir votre commune / quartier</div>}
                      </div>
                    )}
                  </div>
                )}

                {/* Bouton submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ position: 'relative', overflow: 'hidden', width: '100%', height: 52, borderRadius: borderBtn, background: `linear-gradient(135deg,${accent},${accent}cc)`, border: 'none', color: '#fff', fontSize: 16, fontWeight: 900, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: `0 8px 24px ${accent}44`, opacity: submitting ? .7 : 1 }}>
                  {submitting ? '⏳ Envoi…' : '📲 Commander sur WhatsApp'}
                  {!submitting && <span style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent)', animation: 'shimmer 2.5s infinite' }} />}
                </button>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 14 }}>
                  {['💵 Paiement à livraison', '🔒 100% sécurisé', '🚚 Livraison rapide'].map(t => (
                    <span key={t} style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 600 }}>{t}</span>
                  ))}
                </div>
              </form>
            </div>
          </div>
        </div>

      </div>
      {/* SUCCESS POPUP */}
      {showSuccess && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowSuccess(false)}>

          {/* Confettis */}
          {[...Array(24)].map((_, i) => {
            const colors = [accent, '#FFD700', '#FF6B6B', '#4ADE80', '#60A5FA', '#F472B6', '#FBBF24', '#A78BFA']
            const color = colors[i % colors.length]
            const left = `${(i * 4.2) % 100}%`
            const delay = `${(i * 0.08)}s`
            const duration = `${1.8 + (i % 5) * 0.3}s`
            const size = 6 + (i % 4) * 3
            const shapes = ['50%', '0%', '0%', '50%']
            const shape = shapes[i % shapes.length]
            return (
              <div key={i} style={{
                position: 'fixed', top: '-20px', left, width: size, height: size,
                background: color, borderRadius: shape,
                animation: `confettiFall ${duration} ${delay} ease-in forwards`,
                pointerEvents: 'none', zIndex: 201,
                transform: `rotate(${i * 15}deg)`
              }} />
            )
          })}

          {/* Card */}
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 28, padding: '36px 28px 28px',
            textAlign: 'center', width: '100%', maxWidth: 360, position: 'relative',
            animation: 'popIn .5s cubic-bezier(.32,.72,0,1) forwards',
            boxShadow: '0 32px 80px rgba(0,0,0,.25)'
          }}>

            {/* Icône */}
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg,${accent},${accent}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 20px', boxShadow: `0 12px 32px ${accent}44`, animation: 'float 2.5s ease-in-out infinite' }}>
              🎉
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0D0D0D', marginBottom: 8, lineHeight: 1.2 }}>
              Commande confirmée !
            </h2>
            <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.65, marginBottom: 24, animation: 'fadeInUp .4s .2s both' }}>
              Merci pour votre commande 🙏<br />
              Notre équipe va vous contacter très bientôt sur <strong style={{ color: '#25D366' }}>WhatsApp</strong> pour confirmer la livraison.
            </p>

            {/* Badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap', animation: 'fadeInUp .4s .3s both' }}>
              {['💵 Paiement à livraison', '🚚 Livraison 24–48h', '🔒 Sécurisé'].map(t => (
                <span key={t} style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6B', background: '#F2F2F7', borderRadius: 20, padding: '4px 10px' }}>{t}</span>
              ))}
            </div>

            <button onClick={() => setShowSuccess(false)} style={{
              width: '100%', height: 50, borderRadius: borderBtn,
              background: `linear-gradient(135deg,${accent},${accent}cc)`,
              border: 'none', color: '#fff', fontSize: 15, fontWeight: 900,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: `0 8px 24px ${accent}44`,
              animation: 'fadeInUp .4s .4s both'
            }}>
              ✨ Continuer mes achats
            </button>
          </div>
        </div>
      )}

    </>
  )
}