'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Argument { icon: string; text: string }
interface Spec { key: string; value: string }
interface Review { name: string; rating: number; text: string; photo_url?: string; colis_url?: string }
interface FaqItem { question: string; answer: string }
interface ComparaisonItem { feature: string; notre_produit: string; concurrent: string }
interface BundleItem { name: string; price: number }
interface UpsellItem { id: string; name: string; price: number; emoji: string; color: string; image_url?: string }
interface PersuasionSection { tag: string; title: string; text: string; image_url: string; visible: boolean; order: number }
interface Category { id: string; name: string }

const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, borderRadius: 10, border: '1.5px solid #E5E5EA',
  padding: '0 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  background: '#FAFAFA', boxSizing: 'border-box'
}
const textareaStyle: React.CSSProperties = {
  width: '100%', borderRadius: 10, border: '1.5px solid #E5E5EA',
  padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  background: '#FAFAFA', boxSizing: 'border-box', resize: 'none'
}

function Toast({ msg }: { msg: string }) {
  if (!msg) return null
  return <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#0D0D0D', color: '#fff', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 700, zIndex: 999, whiteSpace: 'nowrap' }}>{msg}</div>
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 14 }}><div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F2F2F7' }}>{title}</div>{children}</div>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', marginBottom: 6 }}>{label}</div>{children}</div>
}

export default function AdminProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [accent, setAccent] = useState('#FF2D55')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [tab, setTab] = useState<'infos' | 'sections' | 'vente'>('infos')
  const [categories, setCategories] = useState<Category[]>([])

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [badge, setBadge] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [isTestMode, setIsTestMode] = useState(false)
  const [wasTestMode, setWasTestMode] = useState(false)

  const [logoUrl, setLogoUrl] = useState('')
  const [logoPosition, setLogoPosition] = useState<'left' | 'center' | 'right'>('left')
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [heroTagline, setHeroTagline] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [arguments_, setArguments] = useState<Argument[]>([])
  const [specs, setSpecs] = useState<Spec[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [faq, setFaq] = useState<FaqItem[]>([])
  const [comparaison, setComparaison] = useState<ComparaisonItem[]>([])
  const [persuasionSections, setPersuasionSections] = useState<PersuasionSection[]>([])

  const [bundleTitle, setBundleTitle] = useState('')
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([])
  const [upsellItems, setUpsellItems] = useState<UpsellItem[]>([])
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [uploadingUpsellIdx, setUploadingUpsellIdx] = useState<number | null>(null)
  const [uploadingReviewPhoto, setUploadingReviewPhoto] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: settings } = await supabase.from('settings').select('key, value')
      if (settings) {
        const c = (settings as { key: string; value: string }[]).find(r => r.key === 'primary_color')
        if (c?.value) setAccent(c.value.replace(/^"|"$/g, ''))
      }
      const { data: cats } = await supabase.from('categories').select('id, name').order('name')
      if (cats) setCategories(cats as Category[])

      const { data: prod } = await supabase
        .from('products')
        .select('*, sections:product_sections(*)')
        .eq('id', id)
        .single()

      if (prod) {
        setName(prod.name || '')
        setSlug(prod.slug || '')
        setPrice(String(prod.price || ''))
        setOriginalPrice(String(prod.original_price || ''))
        setBadge(prod.badge || '')
        setCategoryId(prod.category_id || '')
        setWhatsappNumber(prod.whatsapp_number || '')
        setIsPublished(prod.is_published ?? true)
        setIsTestMode(prod.is_test_mode || false)
        setWasTestMode(prod.is_test_mode || false)
        setLogoUrl(prod.logo_url || '')
        const s = prod.sections?.[0] || {}
        setLogoPosition(s.logo_position || 'left')
        setHeroTagline(s.hero_tagline || '')
        setDescription(s.description || '')
        setVideoUrl(s.video_url || '')
        setArguments(s.arguments || [])
        setSpecs(s.specs || [])
        setReviews(s.reviews || [])
        setFaq(s.faq || [])
        setComparaison(s.comparaison || [])
        setPersuasionSections(s.persuasion_sections || [])
        setBundleTitle(s.bundle?.title || '')
        setBundleItems(s.bundle?.items || [])
        setUpsellItems(s.upsell_items || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setSaving(true)
    try {
      await supabase.from('products').update({
        name, slug,
        price: Number(price),
        original_price: originalPrice ? Number(originalPrice) : null,
        badge: badge || null,
        category_id: categoryId || null,
        whatsapp_number: whatsappNumber || null,
        is_published: isPublished,
        is_test_mode: isTestMode,
        logo_url: logoUrl || null,
      }).eq('id', id)

      // Si on vient de désactiver le mode test → archiver les commandes comme prospects
      if (wasTestMode && !isTestMode) {
        await supabase
          .from('orders')
          .update({ is_test: true })
          .eq('product_id', id)
          .eq('status', 'nouveau')
        setWasTestMode(false)
        showToast('🧪 Commandes archivées dans Prospects !')
      }

      const sectionsData = {
        product_id: id,
        logo_position: logoPosition,
        hero_tagline: heroTagline,
        description,
        video_url: videoUrl,
        arguments: arguments_,
        specs, reviews, faq, comparaison,
        bundle: { title: bundleTitle, items: bundleItems },
        persuasion_sections: persuasionSections,
        upsell_items: upsellItems,
      }

      const { data: existing } = await supabase.from('product_sections').select('id').eq('product_id', id).single()
      if (existing) {
        await supabase.from('product_sections').update(sectionsData).eq('product_id', id)
      } else {
        await supabase.from('product_sections').insert(sectionsData)
      }
      showToast('✅ Produit enregistré !')
    } catch (e) {
      console.error(e)
      showToast('❌ Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const uploadLogo = async (file: File) => {
    setUploadingLogo(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `logos/${id}-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('colioo-assets').upload(path, file, { upsert: true })
      if (error) { alert('Erreur upload logo: ' + error.message); return }
      const { data } = supabase.storage.from('colioo-assets').getPublicUrl(path)
      setLogoUrl(data.publicUrl)
    } finally { setUploadingLogo(false) }
  }

  const uploadSectionImage = async (file: File, idx: number) => {
    setUploadingIdx(idx)
    try {
      const ext = file.name.split('.').pop()
      const path = `sections/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('colioo-assets').upload(path, file, { upsert: true })
      if (error) { alert('Erreur upload: ' + error.message); return }
      const { data } = supabase.storage.from('colioo-assets').getPublicUrl(path)
      const a = [...persuasionSections]; a[idx].image_url = data.publicUrl; setPersuasionSections(a)
    } finally { setUploadingIdx(null) }
  }

  const uploadUpsellImage = async (file: File, idx: number) => {
    setUploadingUpsellIdx(idx)
    try {
      const ext = file.name.split('.').pop()
      const path = `upsells/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('colioo-assets').upload(path, file, { upsert: true })
      if (error) { alert('Erreur upload: ' + error.message); return }
      const { data } = supabase.storage.from('colioo-assets').getPublicUrl(path)
      const a = [...upsellItems]; a[idx].image_url = data.publicUrl; setUpsellItems(a)
    } finally { setUploadingUpsellIdx(null) }
  }

  const uploadReviewImage = async (file: File, idx: number, type: 'photo' | 'colis') => {
    const key = `${idx}-${type}`
    setUploadingReviewPhoto(key)
    try {
      const ext = file.name.split('.').pop()
      const path = `reviews/${Date.now()}-${type}.${ext}`
      const { error } = await supabase.storage.from('colioo-assets').upload(path, file, { upsert: true })
      if (error) { alert('Erreur upload: ' + error.message); return }
      const { data } = supabase.storage.from('colioo-assets').getPublicUrl(path)
      const a = [...reviews]
      if (type === 'photo') a[idx].photo_url = data.publicUrl
      else a[idx].colis_url = data.publicUrl
      setReviews(a)
    } finally { setUploadingReviewPhoto(null) }
  }

  const moveSection = (i: number, dir: 'up' | 'down') => {
    const a = [...persuasionSections]
    const j = dir === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]
    setPersuasionSections(a)
  }

  const duplicateSection = (i: number) => {
    const a = [...persuasionSections]
    a.splice(i + 1, 0, { ...a[i] })
    setPersuasionSections(a)
  }

  const tabs = [
    { id: 'infos', label: '📋 Infos' },
    { id: 'sections', label: '🎨 Sections' },
    { id: 'vente', label: '💰 Vente' },
  ] as const

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#AEAEB2', fontFamily: 'system-ui' }}>Chargement…</div>

  return (
    <>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F2F2F7; } input, textarea, select { font-family: inherit; }`}</style>
      <Toast msg={toast} />

      <div style={{ maxWidth: 640, margin: '0 auto', paddingBottom: 40 }}>

        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E5E5EA', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 40 }}>
          <button onClick={() => router.push('/admin/produits')} style={{ width: 34, height: 34, borderRadius: '50%', background: '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900 }}>{name || 'Produit'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 11, color: '#AEAEB2' }}>Édition du produit</div>
              {isTestMode && <span style={{ fontSize: 10, background: '#FFF3CD', color: '#B45309', borderRadius: 6, padding: '2px 7px', fontWeight: 800 }}>🧪 Mode Test</span>}
            </div>
          </div>
          <button onClick={() => router.push(`/produit/${slug}`)} style={{ height: 32, padding: '0 12px', borderRadius: 10, background: '#F2F2F7', border: 'none', color: '#6B6B6B', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>👁️ Voir</button>
          <button onClick={save} disabled={saving} style={{ height: 36, padding: '0 18px', borderRadius: 12, background: `linear-gradient(135deg,${accent},${accent}cc)`, border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? .7 : 1 }}>
            {saving ? 'Enreg…' : 'Enregistrer'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 12px 0' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, height: 36, borderRadius: 10, border: 'none', background: tab === t.id ? accent : '#fff', color: tab === t.id ? '#fff' : '#6B6B6B', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '12px 12px 0' }}>

          {/* ── INFOS ── */}
          {tab === 'infos' && (
            <Section title="📋 Informations de base">
              <Field label="Nom du produit">
                <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Ex: JBL Go 4" />
              </Field>
              <Field label="Slug (URL)">
                <input style={inputStyle} value={slug} onChange={e => setSlug(e.target.value)} placeholder="jbl-go-4" />
              </Field>
              <Field label="Prix (FCFA)">
                <input style={inputStyle} type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="25000" />
              </Field>
              <Field label="Prix barré (FCFA)">
                <input style={inputStyle} type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="30000" />
              </Field>
              <Field label="Badge">
                <select value={badge} onChange={e => setBadge(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Aucun</option>
                  <option value="nouveau">Nouveau</option>
                  <option value="promo">Promo</option>
                  <option value="best_seller">Best Seller</option>
                  <option value="livraison_gratuite">Livraison gratuite</option>
                  <option value="rupture">Rupture</option>
                </select>
              </Field>
              <Field label="Catégorie">
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Aucune catégorie</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Lien ou Numéro WhatsApp">
                <input style={inputStyle} value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="2250700000000 ou https://wa.me/2250700000000" />
                <div style={{ fontSize: 11, color: '#AEAEB2', marginTop: 4 }}>Entre le numéro seul (ex: 2250700000000) ou un lien wa.me complet</div>
              </Field>

              {/* Logo produit */}
              <Field label="🏷️ Logo produit (affiché au-dessus du carousel)">
                {logoUrl && (
                  <div style={{ position: 'relative', marginBottom: 10, display: 'inline-block' }}>
                    <img src={logoUrl} alt="Logo" style={{ height: 60, maxWidth: 200, objectFit: 'contain', borderRadius: 10, border: '1.5px solid #E5E5EA', background: '#F8F8F8', padding: 6 }} />
                    <button onClick={() => setLogoUrl('')} style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: '#FF3B30', border: '2px solid #fff', cursor: 'pointer', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>✕</button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                  <input type="file" accept="image/*" id="logo-upload" style={{ display: 'none' }}
                    onChange={async e => { const file = e.target.files?.[0]; if (file) await uploadLogo(file) }} />
                  <button onClick={() => document.getElementById('logo-upload')?.click()} disabled={uploadingLogo}
                    style={{ height: 38, padding: '0 14px', borderRadius: 10, background: uploadingLogo ? '#F2F2F7' : accent + '15', border: `1.5px solid ${accent}44`, color: uploadingLogo ? '#AEAEB2' : accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {uploadingLogo ? '⏳ Upload…' : '📁 Uploader le logo'}
                  </button>
                  <span style={{ fontSize: 12, color: '#AEAEB2' }}>ou URL :</span>
                  <input style={{ ...inputStyle, flex: 1, minWidth: 140 }} value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', marginBottom: 6 }}>Position du logo</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['left', 'center', 'right'] as const).map(pos => (
                      <button key={pos} onClick={() => setLogoPosition(pos)}
                        style={{ flex: 1, height: 36, borderRadius: 10, border: `2px solid ${logoPosition === pos ? accent : '#E5E5EA'}`, background: logoPosition === pos ? accent + '12' : '#fff', color: logoPosition === pos ? accent : '#6B6B6B', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
                        {pos === 'left' ? '⬅ Gauche' : pos === 'center' ? '↔ Centre' : 'Droite ➡'}
                      </button>
                    ))}
                  </div>
                </div>
              </Field>

              {/* Toggle Publié */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <button onClick={() => setIsPublished(!isPublished)} style={{ width: 44, height: 24, borderRadius: 12, background: isPublished ? accent : '#E5E5EA', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: isPublished ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
                </button>
                <span style={{ fontSize: 13, fontWeight: 700, color: isPublished ? accent : '#6B6B6B' }}>{isPublished ? 'Publié' : 'Brouillon'}</span>
              </div>

              {/* ── Toggle Mode Test ── */}
              <div style={{ marginTop: 14, padding: '14px', background: isTestMode ? '#FFF9E6' : '#F8F8F8', borderRadius: 14, border: `1.5px solid ${isTestMode ? '#FDE68A' : '#E5E5EA'}`, transition: 'all .3s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <button onClick={() => setIsTestMode(!isTestMode)} style={{ width: 44, height: 24, borderRadius: 12, background: isTestMode ? '#FF9500' : '#E5E5EA', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0, marginTop: 2 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: isTestMode ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: isTestMode ? '#B45309' : '#6B6B6B', marginBottom: 4 }}>
                      🧪 {isTestMode ? 'Mode Test activé' : 'Mode Test désactivé'}
                    </div>
                    <div style={{ fontSize: 12, color: isTestMode ? '#92400E' : '#AEAEB2', lineHeight: 1.5 }}>
                      {isTestMode
                        ? 'Le produit est visible et commandable. Les commandes sont comptées dans tes stats. Désactive pour archiver les commandes dans Prospects.'
                        : 'Active pour tester l\'intérêt du marché avant de commander le stock. Les commandes reçues seront archivées dans Prospects quand tu désactiveras.'}
                    </div>
                  </div>
                </div>

                {/* Avertissement désactivation */}
                {wasTestMode && !isTestMode && (
                  <div style={{ marginTop: 10, padding: '10px 12px', background: '#FFF0F0', borderRadius: 10, border: '1px solid #FFCDD2' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#DC2626', marginBottom: 4 }}>⚠️ Mode test désactivé</div>
                    <div style={{ fontSize: 11, color: '#6B6B6B', lineHeight: 1.5 }}>
                      En enregistrant, toutes les commandes <strong>"nouveau"</strong> de ce produit seront archivées dans <strong>Prospects</strong>. Tu pourras les relancer quand le stock sera disponible.
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* ── SECTIONS ── */}
          {tab === 'sections' && (
            <>
              <Section title="✏️ Hero">
                <Field label="Phrase bénéfice (sous le titre)">
                  <input style={inputStyle} value={heroTagline} onChange={e => setHeroTagline(e.target.value)} placeholder="Le haut-parleur Bluetooth ultra-portable audacieux" />
                </Field>
              </Section>

              <Section title="📝 Description">
                <textarea style={{ ...textareaStyle, height: 100 }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Description détaillée du produit…" />
              </Section>

              <Section title="📹 Vidéo YouTube">
                <Field label="URL YouTube">
                  <input style={inputStyle} value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                </Field>
              </Section>

              <Section title="✅ Arguments">
                {arguments_.map((arg, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input style={{ ...inputStyle, width: 60 }} value={arg.icon} onChange={e => { const a = [...arguments_]; a[i].icon = e.target.value; setArguments(a) }} placeholder="🔊" />
                    <input style={{ ...inputStyle, flex: 1 }} value={arg.text} onChange={e => { const a = [...arguments_]; a[i].text = e.target.value; setArguments(a) }} placeholder="Son puissant 360°" />
                    <button onClick={() => setArguments(arguments_.filter((_, j) => j !== i))} style={{ width: 36, height: 42, borderRadius: 10, background: '#FFF0F0', border: 'none', cursor: 'pointer', color: '#FF3B30', fontSize: 16, flexShrink: 0 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setArguments([...arguments_, { icon: '', text: '' }])} style={{ height: 36, padding: '0 14px', borderRadius: 10, background: accent + '15', border: `1px solid ${accent}44`, color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Ajouter</button>
              </Section>

              <Section title="📊 Caractéristiques">
                {specs.map((spec, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input style={{ ...inputStyle, flex: 1 }} value={spec.key} onChange={e => { const a = [...specs]; a[i].key = e.target.value; setSpecs(a) }} placeholder="Autonomie" />
                    <input style={{ ...inputStyle, flex: 1 }} value={spec.value} onChange={e => { const a = [...specs]; a[i].value = e.target.value; setSpecs(a) }} placeholder="7 heures" />
                    <button onClick={() => setSpecs(specs.filter((_, j) => j !== i))} style={{ width: 36, height: 42, borderRadius: 10, background: '#FFF0F0', border: 'none', cursor: 'pointer', color: '#FF3B30', fontSize: 16, flexShrink: 0 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setSpecs([...specs, { key: '', value: '' }])} style={{ height: 36, padding: '0 14px', borderRadius: 10, background: accent + '15', border: `1px solid ${accent}44`, color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Ajouter</button>
              </Section>

              <Section title="⭐ Avis clients">
                {reviews.map((review, i) => (
                  <div key={i} style={{ background: '#F8F8F8', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input style={{ ...inputStyle, flex: 1 }} value={review.name} onChange={e => { const a = [...reviews]; a[i].name = e.target.value; setReviews(a) }} placeholder="Nicole" />
                      <select value={review.rating} onChange={e => { const a = [...reviews]; a[i].rating = Number(e.target.value); setReviews(a) }} style={{ ...inputStyle, width: 80, cursor: 'pointer' }}>
                        {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} ⭐</option>)}
                      </select>
                      <button onClick={() => setReviews(reviews.filter((_, j) => j !== i))} style={{ width: 36, height: 42, borderRadius: 10, background: '#FFF0F0', border: 'none', cursor: 'pointer', color: '#FF3B30', fontSize: 16, flexShrink: 0 }}>✕</button>
                    </div>
                    <textarea style={{ ...textareaStyle, height: 60, marginBottom: 10 }} value={review.text} onChange={e => { const a = [...reviews]; a[i].text = e.target.value; setReviews(a) }} placeholder="Excellent produit !" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6B', marginBottom: 6 }}>👤 Photo du client</div>
                        {review.photo_url && (
                          <div style={{ position: 'relative', marginBottom: 6, display: 'inline-block' }}>
                            <img src={review.photo_url} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E5E5EA', display: 'block' }} />
                            <button onClick={() => { const a = [...reviews]; a[i].photo_url = ''; setReviews(a) }} style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#FF3B30', border: '2px solid #fff', cursor: 'pointer', color: '#fff', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>✕</button>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <input type="file" accept="image/*" id={`review-photo-${i}`} style={{ display: 'none' }} onChange={async e => { const file = e.target.files?.[0]; if (file) await uploadReviewImage(file, i, 'photo') }} />
                          <button onClick={() => document.getElementById(`review-photo-${i}`)?.click()} disabled={uploadingReviewPhoto === `${i}-photo`} style={{ height: 32, padding: '0 10px', borderRadius: 8, background: accent + '15', border: `1px solid ${accent}44`, color: accent, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {uploadingReviewPhoto === `${i}-photo` ? '⏳' : '📁 Upload'}
                          </button>
                          <input style={{ ...inputStyle, height: 32, fontSize: 12 }} value={review.photo_url || ''} onChange={e => { const a = [...reviews]; a[i].photo_url = e.target.value; setReviews(a) }} placeholder="URL photo…" />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6B', marginBottom: 6 }}>📦 Photo du colis reçu</div>
                        {review.colis_url && (
                          <div style={{ position: 'relative', marginBottom: 6, display: 'inline-block' }}>
                            <img src={review.colis_url} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: '2px solid #E5E5EA', display: 'block' }} />
                            <button onClick={() => { const a = [...reviews]; a[i].colis_url = ''; setReviews(a) }} style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#FF3B30', border: '2px solid #fff', cursor: 'pointer', color: '#fff', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>✕</button>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <input type="file" accept="image/*" id={`review-colis-${i}`} style={{ display: 'none' }} onChange={async e => { const file = e.target.files?.[0]; if (file) await uploadReviewImage(file, i, 'colis') }} />
                          <button onClick={() => document.getElementById(`review-colis-${i}`)?.click()} disabled={uploadingReviewPhoto === `${i}-colis`} style={{ height: 32, padding: '0 10px', borderRadius: 8, background: accent + '15', border: `1px solid ${accent}44`, color: accent, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {uploadingReviewPhoto === `${i}-colis` ? '⏳' : '📁 Upload'}
                          </button>
                          <input style={{ ...inputStyle, height: 32, fontSize: 12 }} value={review.colis_url || ''} onChange={e => { const a = [...reviews]; a[i].colis_url = e.target.value; setReviews(a) }} placeholder="URL colis…" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setReviews([...reviews, { name: '', rating: 5, text: '', photo_url: '', colis_url: '' }])} style={{ height: 36, padding: '0 14px', borderRadius: 10, background: accent + '15', border: `1px solid ${accent}44`, color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Ajouter</button>
              </Section>

              <Section title="❓ FAQ">
                {faq.map((item, i) => (
                  <div key={i} style={{ background: '#F8F8F8', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input style={{ ...inputStyle, flex: 1 }} value={item.question} onChange={e => { const a = [...faq]; a[i].question = e.target.value; setFaq(a) }} placeholder="Question…" />
                      <button onClick={() => setFaq(faq.filter((_, j) => j !== i))} style={{ width: 36, height: 42, borderRadius: 10, background: '#FFF0F0', border: 'none', cursor: 'pointer', color: '#FF3B30', fontSize: 16, flexShrink: 0 }}>✕</button>
                    </div>
                    <textarea style={{ ...textareaStyle, height: 60 }} value={item.answer} onChange={e => { const a = [...faq]; a[i].answer = e.target.value; setFaq(a) }} placeholder="Réponse…" />
                  </div>
                ))}
                <button onClick={() => setFaq([...faq, { question: '', answer: '' }])} style={{ height: 36, padding: '0 14px', borderRadius: 10, background: accent + '15', border: `1px solid ${accent}44`, color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Ajouter</button>
              </Section>

              <Section title="⚖️ Comparaison">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 36px', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6B' }}>Fonctionnalité</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6B', textAlign: 'center' }}>Nous</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6B', textAlign: 'center' }}>Concurrent</span>
                  <span />
                </div>
                {comparaison.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 36px', gap: 8, marginBottom: 8 }}>
                    <input style={inputStyle} value={item.feature} onChange={e => { const a = [...comparaison]; a[i].feature = e.target.value; setComparaison(a) }} placeholder="Étanchéité" />
                    <input style={inputStyle} value={item.notre_produit} onChange={e => { const a = [...comparaison]; a[i].notre_produit = e.target.value; setComparaison(a) }} placeholder="✓" />
                    <input style={inputStyle} value={item.concurrent} onChange={e => { const a = [...comparaison]; a[i].concurrent = e.target.value; setComparaison(a) }} placeholder="✗" />
                    <button onClick={() => setComparaison(comparaison.filter((_, j) => j !== i))} style={{ width: 36, height: 42, borderRadius: 10, background: '#FFF0F0', border: 'none', cursor: 'pointer', color: '#FF3B30', fontSize: 16 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setComparaison([...comparaison, { feature: '', notre_produit: '', concurrent: '' }])} style={{ height: 36, padding: '0 14px', borderRadius: 10, background: accent + '15', border: `1px solid ${accent}44`, color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Ajouter</button>
              </Section>

              <Section title="📣 Sections de persuasion (image-based)">
                <p style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 14, lineHeight: 1.5 }}>Crée une page de vente visuelle. Chaque section peut avoir une image pleine largeur + texte.</p>
                <button onClick={() => setPersuasionSections([...persuasionSections, { tag: 'Hook', title: '', text: '', image_url: '', visible: true, order: persuasionSections.length }])} style={{ width: '100%', height: 42, borderRadius: 12, background: accent, border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14 }}>+ Ajouter une section</button>
                {persuasionSections.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 16px', background: '#F8F8F8', borderRadius: 12, color: '#AEAEB2', fontSize: 14 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
                    Aucune section — clique sur "+ Ajouter" pour commencer
                  </div>
                )}
                {persuasionSections.map((sec, i) => (
                  <div key={i} style={{ background: '#F8F8F8', borderRadius: 14, padding: 14, marginBottom: 12, border: '1.5px solid #E5E5EA' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#AEAEB2', background: '#E5E5EA', borderRadius: 6, padding: '2px 8px' }}>{i + 1}/{persuasionSections.length}</span>
                      <select value={sec.tag} onChange={e => { const a = [...persuasionSections]; a[i].tag = e.target.value; setPersuasionSections(a) }} style={{ ...inputStyle, flex: 1, cursor: 'pointer', height: 36 }}>
                        {['Hook','Promesse','Avant/Après','Comment ça marche','Bénéfices','Preuve','Avis','Réassurance','Offre','Urgence'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                      <button onClick={() => moveSection(i, 'up')} disabled={i === 0} style={{ height: 30, padding: '0 10px', borderRadius: 8, background: '#fff', border: '1px solid #E5E5EA', color: i === 0 ? '#AEAEB2' : '#6B6B6B', fontSize: 12, fontWeight: 700, cursor: i === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>↑ Monter</button>
                      <button onClick={() => moveSection(i, 'down')} disabled={i === persuasionSections.length - 1} style={{ height: 30, padding: '0 10px', borderRadius: 8, background: '#fff', border: '1px solid #E5E5EA', color: i === persuasionSections.length - 1 ? '#AEAEB2' : '#6B6B6B', fontSize: 12, fontWeight: 700, cursor: i === persuasionSections.length - 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>↓ Descendre</button>
                      <button onClick={() => duplicateSection(i)} style={{ height: 30, padding: '0 10px', borderRadius: 8, background: '#E8F4FF', border: 'none', color: '#007AFF', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>⧉ Dupliquer</button>
                      <button onClick={() => { const a = [...persuasionSections]; a[i].visible = !a[i].visible; setPersuasionSections(a) }} style={{ height: 30, padding: '0 10px', borderRadius: 8, background: sec.visible ? '#ECFDF5' : '#F2F2F7', border: 'none', color: sec.visible ? '#059669' : '#6B6B6B', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {sec.visible ? '✓ Visible' : '✗ Masqué'}
                      </button>
                      <button onClick={() => setPersuasionSections(persuasionSections.filter((_, j) => j !== i))} style={{ height: 30, padding: '0 10px', borderRadius: 8, background: '#FFF0F0', border: 'none', color: '#FF3B30', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' }}>🗑️ Supprimer</button>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', marginBottom: 8 }}>🖼️ Image</div>
                      {sec.image_url && (
                        <div style={{ position: 'relative', marginBottom: 8 }}>
                          <img src={sec.image_url} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 10, border: '1px solid #E5E5EA', display: 'block' }} />
                          <button onClick={() => { const a = [...persuasionSections]; a[i].image_url = ''; setPersuasionSections(a) }} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.6)', border: '2px solid #fff', cursor: 'pointer', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>✕</button>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input type="file" accept="image/*" id={`img-sec-${i}`} style={{ display: 'none' }} onChange={async e => { const file = e.target.files?.[0]; if (file) await uploadSectionImage(file, i) }} />
                        <button onClick={() => document.getElementById(`img-sec-${i}`)?.click()} disabled={uploadingIdx === i} style={{ height: 38, padding: '0 14px', borderRadius: 10, background: uploadingIdx === i ? '#F2F2F7' : accent + '15', border: `1.5px solid ${accent}44`, color: uploadingIdx === i ? '#AEAEB2' : accent, fontSize: 13, fontWeight: 700, cursor: uploadingIdx === i ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {uploadingIdx === i ? '⏳ Upload…' : '📁 Uploader'}
                        </button>
                        <span style={{ fontSize: 12, color: '#AEAEB2' }}>ou URL :</span>
                        <input style={{ ...inputStyle, flex: 1, minWidth: 140 }} value={sec.image_url} onChange={e => { const a = [...persuasionSections]; a[i].image_url = e.target.value; setPersuasionSections(a) }} placeholder="https://..." />
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', marginBottom: 6 }}>Titre</div>
                      <input style={inputStyle} value={sec.title} onChange={e => { const a = [...persuasionSections]; a[i].title = e.target.value; setPersuasionSections(a) }} placeholder="Titre (optionnel)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', marginBottom: 6 }}>Texte</div>
                      <textarea style={{ ...textareaStyle, height: 80 }} value={sec.text} onChange={e => { const a = [...persuasionSections]; a[i].text = e.target.value; setPersuasionSections(a) }} placeholder="Texte (optionnel si image suffisante)" />
                    </div>
                  </div>
                ))}
                {persuasionSections.length > 0 && (
                  <button onClick={() => setPersuasionSections([...persuasionSections, { tag: 'Hook', title: '', text: '', image_url: '', visible: true, order: persuasionSections.length }])} style={{ width: '100%', height: 42, borderRadius: 12, background: '#F2F2F7', border: '2px dashed #E5E5EA', color: '#6B6B6B', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Ajouter une section</button>
                )}
              </Section>
            </>
          )}

          {/* ── VENTE ── */}
          {tab === 'vente' && (
            <>
              <Section title="🎁 Bundle">
                <Field label="Titre du bundle">
                  <input style={inputStyle} value={bundleTitle} onChange={e => setBundleTitle(e.target.value)} placeholder="Pack Complet" />
                </Field>
                {bundleItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input style={{ ...inputStyle, flex: 1 }} value={item.name} onChange={e => { const a = [...bundleItems]; a[i].name = e.target.value; setBundleItems(a) }} placeholder="Housse de protection" />
                    <input style={{ ...inputStyle, width: 110 }} type="number" value={item.price} onChange={e => { const a = [...bundleItems]; a[i].price = Number(e.target.value); setBundleItems(a) }} placeholder="5000" />
                    <button onClick={() => setBundleItems(bundleItems.filter((_, j) => j !== i))} style={{ width: 36, height: 42, borderRadius: 10, background: '#FFF0F0', border: 'none', cursor: 'pointer', color: '#FF3B30', fontSize: 16, flexShrink: 0 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setBundleItems([...bundleItems, { name: '', price: 0 }])} style={{ height: 36, padding: '0 14px', borderRadius: 10, background: accent + '15', border: `1px solid ${accent}44`, color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Ajouter</button>
              </Section>

              <Section title="🛍️ Upsells">
                <p style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 14, lineHeight: 1.5 }}>Le client peut les ajouter — ils s'affichent en cercles dans la barre sticky.</p>
                {upsellItems.map((item, i) => (
                  <div key={i} style={{ background: '#F8F8F8', borderRadius: 12, padding: 12, marginBottom: 12, border: '1px solid #E5E5EA' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 800 }}>Upsell {i + 1}</span>
                      <button onClick={() => setUpsellItems(upsellItems.filter((_, j) => j !== i))} style={{ height: 28, padding: '0 10px', borderRadius: 8, background: '#FFF0F0', border: 'none', color: '#FF3B30', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ Supprimer</button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', marginBottom: 6 }}>Emoji</div>
                        <input style={{ ...inputStyle, width: 70 }} value={item.emoji} onChange={e => { const a = [...upsellItems]; a[i].emoji = e.target.value; setUpsellItems(a) }} placeholder="🎁" />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', marginBottom: 6 }}>Couleur</div>
                        <input type="color" value={item.color || '#FF6B00'} onChange={e => { const a = [...upsellItems]; a[i].color = e.target.value; setUpsellItems(a) }} style={{ width: 42, height: 42, borderRadius: 10, border: '1.5px solid #E5E5EA', cursor: 'pointer', padding: 2 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', marginBottom: 6 }}>Prix (FCFA)</div>
                        <input style={inputStyle} type="number" value={item.price} onChange={e => { const a = [...upsellItems]; a[i].price = Number(e.target.value); setUpsellItems(a) }} placeholder="5000" />
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', marginBottom: 6 }}>Nom</div>
                      <input style={inputStyle} value={item.name} onChange={e => { const a = [...upsellItems]; a[i].name = e.target.value; setUpsellItems(a) }} placeholder="Housse de transport" />
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', marginBottom: 6 }}>🖼️ Image (remplace l'emoji dans le cercle)</div>
                      {item.image_url && (
                        <div style={{ position: 'relative', marginBottom: 8, display: 'inline-block' }}>
                          <img src={item.image_url} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `2.5px solid ${item.color || '#FF6B00'}`, display: 'block' }} />
                          <button onClick={() => { const a = [...upsellItems]; a[i].image_url = ''; setUpsellItems(a) }} style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#FF3B30', border: '2px solid #fff', cursor: 'pointer', color: '#fff', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>✕</button>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input type="file" accept="image/*" id={`upsell-img-${i}`} style={{ display: 'none' }} onChange={async e => { const file = e.target.files?.[0]; if (file) await uploadUpsellImage(file, i) }} />
                        <button onClick={() => document.getElementById(`upsell-img-${i}`)?.click()} disabled={uploadingUpsellIdx === i} style={{ height: 36, padding: '0 12px', borderRadius: 10, background: uploadingUpsellIdx === i ? '#F2F2F7' : accent + '15', border: `1.5px solid ${accent}44`, color: uploadingUpsellIdx === i ? '#AEAEB2' : accent, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {uploadingUpsellIdx === i ? '⏳ Upload…' : '📁 Uploader'}
                        </button>
                        <span style={{ fontSize: 12, color: '#AEAEB2' }}>ou URL :</span>
                        <input style={{ ...inputStyle, flex: 1, minWidth: 120 }} value={item.image_url || ''} onChange={e => { const a = [...upsellItems]; a[i].image_url = e.target.value; setUpsellItems(a) }} placeholder="https://..." />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fff', borderRadius: 10, border: '1px solid #F2F2F7' }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg,${item.color || '#FF6B00'}28,${item.color || '#FF6B00'}66)`, border: `2.5px solid ${item.color || '#FF6B00'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, overflow: 'hidden' }}>
                        {item.image_url ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.emoji || '🎁'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{item.name || 'Nom du produit'}</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: accent }}>{Number(item.price || 0).toLocaleString('fr-FR')} FCFA</div>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#AEAEB2', fontStyle: 'italic' }}>Aperçu</span>
                    </div>
                  </div>
                ))}
                <button onClick={() => setUpsellItems([...upsellItems, { id: Date.now().toString(), name: '', price: 0, emoji: '🎁', color: '#FF6B00', image_url: '' }])} style={{ width: '100%', height: 44, borderRadius: 12, background: accent, border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  + Ajouter un upsell
                </button>
              </Section>
            </>
          )}

          <button onClick={save} disabled={saving} style={{ width: '100%', height: 50, borderRadius: 16, background: `linear-gradient(135deg,${accent},${accent}cc)`, border: 'none', color: '#fff', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4, opacity: saving ? .7 : 1 }}>
            {saving ? 'Enregistrement…' : '✅ Enregistrer'}
          </button>
        </div>
      </div>
    </>
  )
}