'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Category { id: string; name: string; slug: string }
interface Argument { icon: string; text: string }
interface Spec { key: string; value: string }
interface Review { name: string; rating: number; text: string }
interface FaqItem { question: string; answer: string }
interface ComparaisonItem { feature: string; notre_produit: string; concurrent: string }
interface Couleur { nom: string; hex: string }
interface PersuasionSection { tag: string; title: string; text: string; image_url: string; visible: boolean; order: number }
interface UpsellItem { id: string; name: string; price: number; emoji: string; color: string; image_url?: string }

const accent = '#FF6B00'

const inputStyle: React.CSSProperties = {
  width: '100%', height: 46, borderRadius: 12, border: '1.5px solid #E5E5EA',
  padding: '0 14px', fontSize: 16, fontFamily: 'inherit', outline: 'none',
  background: '#FAFAFA', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: '#0D0D0D', marginBottom: 6, display: 'block'
}
const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 16, padding: 16, marginBottom: 14
}

export default function NouveauProduit() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const colorNameRef = useRef<HTMLInputElement>(null)
  const colorPickerRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingSecIdx, setUploadingSecIdx] = useState<number | null>(null)
  const [uploadingUpsellIdx, setUploadingUpsellIdx] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [badge, setBadge] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [isPublished, setIsPublished] = useState(false)

  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [coverIndex, setCoverIndex] = useState(0)

  const [heroTagline, setHeroTagline] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [arguments_, setArguments] = useState<Argument[]>([{ icon: '✅', text: '' }])
  const [specs, setSpecs] = useState<Spec[]>([{ key: '', value: '' }])
  const [reviews, setReviews] = useState<Review[]>([{ name: '', rating: 5, text: '' }])
  const [faq, setFaq] = useState<FaqItem[]>([{ question: '', answer: '' }])
  const [comparaison, setComparaison] = useState<ComparaisonItem[]>([])
  const [bundle, setBundle] = useState({ title: '', items: [{ name: '', price: '' }] })
  const [couleurs, setCouleurs] = useState<Couleur[]>([])
  const [tailles, setTailles] = useState<string[]>([])
  const [grammages, setGrammages] = useState<string[]>([])
  const [newTaille, setNewTaille] = useState('')
  const [newGrammage, setNewGrammage] = useState('')
  const [persuasionSections, setPersuasionSections] = useState<PersuasionSection[]>([])
  const [upsellItems, setUpsellItems] = useState<UpsellItem[]>([])
  const [sectionsVisible, setSectionsVisible] = useState({
    hero_tagline: true, arguments: true, description: true, specs: true,
    reviews: false, faq: true, video_url: false, bundle: false,
    comparaison: false, variantes: false,
  })

  useEffect(() => { loadCategories() }, [])

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('position')
    if (data) setCategories(data)
  }

  const handleNameChange = (value: string) => {
    setName(value)
    setSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const newFiles = Array.from(e.target.files).slice(0, 6 - images.length)
    const imageCompression = (await import('browser-image-compression')).default
    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true }
    const compressed: File[] = [], previews: string[] = []
    for (const file of newFiles) {
      try { const c = await imageCompression(file, options); compressed.push(c); previews.push(URL.createObjectURL(c)) }
      catch { compressed.push(file); previews.push(URL.createObjectURL(file)) }
    }
    setImages([...images, ...compressed])
    setImagePreviews([...imagePreviews, ...previews])
  }

  const uploadSectionImage = async (file: File, idx: number) => {
    setUploadingSecIdx(idx)
    try {
      const ext = file.name.split('.').pop()
      const path = `sections/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('colioo-assets').upload(path, file, { upsert: true })
      if (error) { alert('Erreur upload: ' + error.message); return }
      const { data } = supabase.storage.from('colioo-assets').getPublicUrl(path)
      const a = [...persuasionSections]; a[idx].image_url = data.publicUrl; setPersuasionSections(a)
    } finally { setUploadingSecIdx(null) }
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

  const moveSection = (i: number, dir: 'up' | 'down') => {
    const a = [...persuasionSections]
    const j = dir === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]
    setPersuasionSections(a)
  }

  const saveProduct = async (publish: boolean) => {
    if (!name || !price || !whatsappNumber) { alert('Nom, prix et WhatsApp sont obligatoires'); return }
    setSaving(true)
    try {
      const { data: product, error } = await supabase.from('products').insert({
        name, slug, price: parseInt(price),
        original_price: originalPrice ? parseInt(originalPrice) : null,
        badge: badge || null, category_id: categoryId || null,
        whatsapp_number: whatsappNumber, is_published: publish
      }).select().single()
      if (error) throw error
      await supabase.from('product_sections').insert({
        product_id: product.id, hero_tagline: heroTagline,
        arguments: arguments_.filter(a => a.text), description,
        specs: specs.filter(s => s.key && s.value),
        reviews: reviews.filter(r => r.name && r.text),
        faq: faq.filter(f => f.question && f.answer),
        video_url: videoUrl || null, bundle: bundle.title ? bundle : {},
        comparaison: comparaison.filter(c => c.feature),
        couleurs: couleurs.filter(c => c.hex),
        tailles: tailles.filter(t => t), grammages: grammages.filter(g => g),
        sections_visible: sectionsVisible, persuasion_sections: persuasionSections,
        upsell_items: upsellItems,
      })
      if (images.length > 0) {
        setUploading(true)
        for (let i = 0; i < images.length; i++) {
          const fileName = `${product.id}/${Date.now()}-${i}.webp`
          await supabase.storage.from('product-images').upload(fileName, images[i])
          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)
          await supabase.from('product_images').insert({ product_id: product.id, url: publicUrl, position: i, is_cover: i === coverIndex })
        }
      }
      alert(publish ? '✅ Produit publié !' : '✅ Brouillon enregistré !')
      router.push('/admin')
    } catch (err) {
      console.error(err); alert('Erreur lors de l\'enregistrement')
    } finally { setSaving(false); setUploading(false) }
  }

  const sectionsList = [
    { key: 'hero_tagline', label: 'Accroche', icon: '✍️' },
    { key: 'arguments', label: 'Arguments', icon: '✅' },
    { key: 'description', label: 'Description', icon: '📝' },
    { key: 'specs', label: 'Caractéristiques', icon: '📊' },
    { key: 'variantes', label: 'Variantes', icon: '🎨' },
    { key: 'reviews', label: 'Avis', icon: '⭐' },
    { key: 'faq', label: 'FAQ', icon: '❓' },
    { key: 'video_url', label: 'Vidéo', icon: '📹' },
    { key: 'bundle', label: 'Bundle', icon: '🎁' },
    { key: 'comparaison', label: 'Comparaison', icon: '⚖️' },
  ]

  const tabs = [
    { id: 1, label: 'Infos de base' },
    { id: 2, label: 'Photos' },
    { id: 3, label: 'Sections' },
    { id: 4, label: '🖼️ Persuasion' },
  ]

  return (
    <>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; } button { font-family: inherit; }`}</style>
      <div style={{ maxWidth: 480, margin: '0 auto', background: '#F2F2F7', minHeight: '100dvh', paddingBottom: 100 }}>

        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E5E5EA', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 40 }}>
          <button onClick={() => router.push('/admin')} style={{ width: 36, height: 36, borderRadius: '50%', background: '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900 }}>Nouveau produit</div>
            <div style={{ fontSize: 11, color: '#AEAEB2' }}>Créez un nouveau produit</div>
          </div>
          <button onClick={() => saveProduct(true)} disabled={saving} style={{ height: 36, padding: '0 16px', borderRadius: 12, background: accent, border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: saving ? .7 : 1 }}>
            {saving ? 'Pub…' : 'Publier'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, background: '#fff', borderBottom: '1px solid #E5E5EA', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, minWidth: 80, height: 44, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: activeTab === tab.id ? accent : '#AEAEB2', borderBottom: activeTab === tab.id ? `2.5px solid ${accent}` : '2.5px solid transparent', transition: 'all .2s', whiteSpace: 'nowrap', padding: '0 8px' }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '12px 12px 0' }}>

          {/* ── TAB 1 ── */}
          {activeTab === 1 && (
            <div>
              <div style={cardStyle}>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F2F2F7' }}>🏷️ Infos de base</div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Nom du produit *</label>
                  <input style={inputStyle} value={name} onChange={e => handleNameChange(e.target.value)} placeholder="Nom du produit" />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Slug URL</label>
                  <input style={inputStyle} value={slug} onChange={e => setSlug(e.target.value)} placeholder="slug-url" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>Prix (FCFA) *</label>
                    <input style={inputStyle} type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="15000" />
                  </div>
                  <div>
                    <label style={labelStyle}>Prix barré</label>
                    <input style={inputStyle} type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="20000" />
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Badge</label>
                  <select style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }} value={badge} onChange={e => setBadge(e.target.value)}>
                    <option value="">Aucun</option>
                    <option value="nouveau">Nouveau</option>
                    <option value="promo">Promo</option>
                    <option value="best_seller">Best Seller</option>
                    <option value="rupture">Rupture de stock</option>
                    <option value="livraison_gratuite">Livraison gratuite</option>
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Catégorie</label>
                  <select style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Numéro WhatsApp *</label>
                  <input style={inputStyle} value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="22500000000" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => setIsPublished(!isPublished)} style={{ width: 44, height: 24, borderRadius: 12, background: isPublished ? accent : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: isPublished ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isPublished ? accent : '#AEAEB2' }}>{isPublished ? 'Publié' : 'Brouillon'}</span>
                </div>
              </div>

              {/* Boutons save */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => saveProduct(false)} disabled={saving} style={{ flex: 1, height: 46, borderRadius: 14, background: '#F2F2F7', border: 'none', color: '#6B6B6B', fontSize: 14, fontWeight: 800, cursor: 'pointer', opacity: saving ? .7 : 1 }}>
                  {saving ? 'Enregistrement…' : '💾 Brouillon'}
                </button>
                <button onClick={() => saveProduct(true)} disabled={saving} style={{ flex: 2, height: 46, borderRadius: 14, background: `linear-gradient(135deg,${accent},${accent}cc)`, border: 'none', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', opacity: saving ? .7 : 1 }}>
                  {saving ? 'Publication…' : '🚀 Publier le produit'}
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 2 ── */}
          {activeTab === 2 && (
            <div>
              <div style={cardStyle}>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F2F2F7' }}>📸 Photos ({images.length}/6)</div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
                <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed #E5E5EA', borderRadius: 14, padding: '24px 16px', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#6B6B6B' }}>Ajouter des photos</div>
                  <div style={{ fontSize: 12, color: '#AEAEB2', marginTop: 4 }}>{images.length}/6 photos</div>
                </div>

                {imagePreviews.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
                    {imagePreviews.map((preview, index) => (
                      <div key={index} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: coverIndex === index ? `2.5px solid ${accent}` : '2.5px solid transparent' }}>
                        <img src={preview} alt="" style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                        <button onClick={() => { setImages(images.filter((_, i) => i !== index)); setImagePreviews(imagePreviews.filter((_, i) => i !== index)) }} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: '#FF3B30', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>✕</button>
                        <button onClick={() => setCoverIndex(index)} style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 10, padding: '2px 6px', borderRadius: 6, background: coverIndex === index ? accent : 'rgba(0,0,0,.6)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                          {coverIndex === index ? '✓ Cover' : 'Cover'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {uploading && <div style={{ textAlign: 'center', padding: 20, color: '#AEAEB2', fontSize: 13 }}>⏳ Upload en cours…</div>}
              </div>
            </div>
          )}

          {/* ── TAB 3 ── */}
          {activeTab === 3 && (
            <div>
              <div style={cardStyle}>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>Sections visibles</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {sectionsList.map(s => (
                    <button key={s.key} onClick={() => setSectionsVisible(prev => ({ ...prev, [s.key]: !prev[s.key as keyof typeof sectionsVisible] }))}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', borderRadius: 12, border: `2px solid ${sectionsVisible[s.key as keyof typeof sectionsVisible] ? accent : '#E5E5EA'}`, background: sectionsVisible[s.key as keyof typeof sectionsVisible] ? accent + '10' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: sectionsVisible[s.key as keyof typeof sectionsVisible] ? accent : '#6B6B6B' }}>
                      <span>{s.icon}</span> {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {sectionsVisible.hero_tagline && (
                <div style={cardStyle}>
                  <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>✍️ Accroche courte</div>
                  <input style={inputStyle} value={heroTagline} onChange={e => setHeroTagline(e.target.value)} placeholder="Le produit idéal pour..." />
                </div>
              )}

              {sectionsVisible.arguments && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>✅ Arguments clés</div>
                    <button onClick={() => setArguments([...arguments_, { icon: '✅', text: '' }])} style={{ fontSize: 13, color: accent, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>+ Ajouter</button>
                  </div>
                  {arguments_.map((arg, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <select value={arg.icon} onChange={e => { const a = [...arguments_]; a[i].icon = e.target.value; setArguments(a) }} style={{ width: 56, height: 46, borderRadius: 12, border: '1.5px solid #E5E5EA', fontSize: 18, textAlign: 'center', background: '#FAFAFA', outline: 'none', cursor: 'pointer' }}>
                        {['✅','⭐','🚚','💯','🎁','🔥','💪','🌟','🔊','💧'].map(ic => <option key={ic} value={ic}>{ic}</option>)}
                      </select>
                      <input style={{ ...inputStyle, flex: 1 }} value={arg.text} onChange={e => { const a = [...arguments_]; a[i].text = e.target.value; setArguments(a) }} placeholder="Argument..." />
                      {arguments_.length > 1 && <button onClick={() => setArguments(arguments_.filter((_, j) => j !== i))} style={{ width: 36, height: 46, borderRadius: 12, background: '#FFF0F0', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 18, fontWeight: 900, flexShrink: 0 }}>×</button>}
                    </div>
                  ))}
                </div>
              )}

              {sectionsVisible.description && (
                <div style={cardStyle}>
                  <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>📝 Description</div>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ ...inputStyle, height: 'auto', padding: '12px 14px', resize: 'none', lineHeight: 1.6 }} placeholder="Décrivez votre produit..." />
                </div>
              )}

              {sectionsVisible.specs && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>📊 Caractéristiques</div>
                    <button onClick={() => setSpecs([...specs, { key: '', value: '' }])} style={{ fontSize: 13, color: accent, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>+ Ajouter</button>
                  </div>
                  {specs.map((spec, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input style={{ ...inputStyle, flex: 1 }} value={spec.key} onChange={e => { const s = [...specs]; s[i].key = e.target.value; setSpecs(s) }} placeholder="Clé" />
                      <input style={{ ...inputStyle, flex: 1 }} value={spec.value} onChange={e => { const s = [...specs]; s[i].value = e.target.value; setSpecs(s) }} placeholder="Valeur" />
                      {specs.length > 1 && <button onClick={() => setSpecs(specs.filter((_, j) => j !== i))} style={{ width: 36, height: 46, borderRadius: 12, background: '#FFF0F0', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 18, fontWeight: 900, flexShrink: 0 }}>×</button>}
                    </div>
                  ))}
                </div>
              )}

              {sectionsVisible.variantes && (
                <div style={cardStyle}>
                  <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14 }}>🎨 Variantes</div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Couleurs</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      {couleurs.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8F8F8', borderRadius: 10, padding: '6px 10px' }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: c.hex, border: '1px solid #E5E5EA' }} />
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{c.nom}</span>
                          <button onClick={() => setCouleurs(couleurs.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 14, fontWeight: 900 }}>×</button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input ref={colorPickerRef} type="color" defaultValue="#FF6B00" style={{ width: 46, height: 46, borderRadius: 12, border: '1.5px solid #E5E5EA', cursor: 'pointer', padding: 2 }} />
                      <input ref={colorNameRef} style={{ ...inputStyle, flex: 1 }} placeholder="Nom (ex: Rouge)" />
                      <button onClick={() => { const hex = colorPickerRef.current?.value; const nom = colorNameRef.current?.value; if (hex && nom) { setCouleurs([...couleurs, { nom, hex }]); if (colorNameRef.current) colorNameRef.current.value = '' } }} style={{ height: 46, padding: '0 14px', borderRadius: 12, background: accent, border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Ajouter</button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Tailles</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      {tailles.map((t, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8F8F8', borderRadius: 10, padding: '6px 10px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{t}</span>
                          <button onClick={() => setTailles(tailles.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 14, fontWeight: 900 }}>×</button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input style={{ ...inputStyle, flex: 1 }} value={newTaille} onChange={e => setNewTaille(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newTaille) { setTailles([...tailles, newTaille]); setNewTaille('') }}} placeholder="Ex: S, M, L, XL..." />
                      <button onClick={() => { if (newTaille) { setTailles([...tailles, newTaille]); setNewTaille('') }}} style={{ height: 46, padding: '0 14px', borderRadius: 12, background: accent, border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>+ Ajouter</button>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Grammages / Poids</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      {grammages.map((g, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8F8F8', borderRadius: 10, padding: '6px 10px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{g}</span>
                          <button onClick={() => setGrammages(grammages.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 14, fontWeight: 900 }}>×</button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input style={{ ...inputStyle, flex: 1 }} value={newGrammage} onChange={e => setNewGrammage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newGrammage) { setGrammages([...grammages, newGrammage]); setNewGrammage('') }}} placeholder="Ex: 250g, 500g..." />
                      <button onClick={() => { if (newGrammage) { setGrammages([...grammages, newGrammage]); setNewGrammage('') }}} style={{ height: 46, padding: '0 14px', borderRadius: 12, background: accent, border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>+ Ajouter</button>
                    </div>
                  </div>
                </div>
              )}

              {sectionsVisible.reviews && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>⭐ Avis clients</div>
                    <button onClick={() => setReviews([...reviews, { name: '', rating: 5, text: '' }])} style={{ fontSize: 13, color: accent, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>+ Ajouter</button>
                  </div>
                  {reviews.map((review, i) => (
                    <div key={i} style={{ border: '1px solid #E5E5EA', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input style={{ ...inputStyle, flex: 1 }} value={review.name} onChange={e => { const r = [...reviews]; r[i].name = e.target.value; setReviews(r) }} placeholder="Nom du client" />
                        {reviews.length > 1 && <button onClick={() => setReviews(reviews.filter((_, j) => j !== i))} style={{ width: 36, height: 46, borderRadius: 12, background: '#FFF0F0', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 18, fontWeight: 900, flexShrink: 0 }}>×</button>}
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                        {[1,2,3,4,5].map(s => <button key={s} onClick={() => { const r = [...reviews]; r[i].rating = s; setReviews(r) }} style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: s <= review.rating ? '#FF9500' : '#E5E5EA' }}>★</button>)}
                      </div>
                      <textarea value={review.text} onChange={e => { const r = [...reviews]; r[i].text = e.target.value; setReviews(r) }} rows={2} style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'none' }} placeholder="Avis..." />
                    </div>
                  ))}
                </div>
              )}

              {sectionsVisible.faq && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>❓ FAQ</div>
                    <button onClick={() => setFaq([...faq, { question: '', answer: '' }])} style={{ fontSize: 13, color: accent, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>+ Ajouter</button>
                  </div>
                  {faq.map((item, i) => (
                    <div key={i} style={{ border: '1px solid #E5E5EA', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input style={{ ...inputStyle, flex: 1 }} value={item.question} onChange={e => { const f = [...faq]; f[i].question = e.target.value; setFaq(f) }} placeholder="Question..." />
                        {faq.length > 1 && <button onClick={() => setFaq(faq.filter((_, j) => j !== i))} style={{ width: 36, height: 46, borderRadius: 12, background: '#FFF0F0', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 18, fontWeight: 900, flexShrink: 0 }}>×</button>}
                      </div>
                      <textarea value={item.answer} onChange={e => { const f = [...faq]; f[i].answer = e.target.value; setFaq(f) }} rows={2} style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'none' }} placeholder="Réponse..." />
                    </div>
                  ))}
                </div>
              )}

              {sectionsVisible.video_url && (
                <div style={cardStyle}>
                  <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>📹 Vidéo YouTube</div>
                  <input style={inputStyle} value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
                </div>
              )}

              {sectionsVisible.bundle && (
                <div style={cardStyle}>
                  <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>🎁 Bundle</div>
                  <input style={{ ...inputStyle, marginBottom: 10 }} value={bundle.title} onChange={e => setBundle({ ...bundle, title: e.target.value })} placeholder="Titre du bundle" />
                  {bundle.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input style={{ ...inputStyle, flex: 2 }} value={item.name} onChange={e => { const items = [...bundle.items]; items[i].name = e.target.value; setBundle({ ...bundle, items }) }} placeholder="Nom" />
                      <input style={{ ...inputStyle, flex: 1 }} value={item.price} onChange={e => { const items = [...bundle.items]; items[i].price = e.target.value; setBundle({ ...bundle, items }) }} placeholder="Prix" />
                      {bundle.items.length > 1 && <button onClick={() => setBundle({ ...bundle, items: bundle.items.filter((_, j) => j !== i) })} style={{ width: 36, height: 46, borderRadius: 12, background: '#FFF0F0', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 18, fontWeight: 900, flexShrink: 0 }}>×</button>}
                    </div>
                  ))}
                  <button onClick={() => setBundle({ ...bundle, items: [...bundle.items, { name: '', price: '' }] })} style={{ fontSize: 13, color: accent, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>+ Ajouter un item</button>
                </div>
              )}

              {sectionsVisible.comparaison && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>⚖️ Comparaison</div>
                    <button onClick={() => setComparaison([...comparaison, { feature: '', notre_produit: '', concurrent: '' }])} style={{ fontSize: 13, color: accent, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>+ Ajouter</button>
                  </div>
                  {comparaison.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
                      <input style={{ ...inputStyle, fontSize: 12, padding: '0 8px' }} value={item.feature} onChange={e => { const c = [...comparaison]; c[i].feature = e.target.value; setComparaison(c) }} placeholder="Fonctionnalité" />
                      <input style={{ ...inputStyle, fontSize: 12, padding: '0 8px', border: `1.5px solid ${accent}` }} value={item.notre_produit} onChange={e => { const c = [...comparaison]; c[i].notre_produit = e.target.value; setComparaison(c) }} placeholder="✅ Nous" />
                      <input style={{ ...inputStyle, fontSize: 12, padding: '0 8px' }} value={item.concurrent} onChange={e => { const c = [...comparaison]; c[i].concurrent = e.target.value; setComparaison(c) }} placeholder="❌ Eux" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 4 ── */}
          {activeTab === 4 && (
            <div>
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>📣 Sections persuasion</div>
                  <span style={{ fontSize: 11, color: '#AEAEB2' }}>{persuasionSections.length} section(s)</span>
                </div>
                <div style={{ fontSize: 12, color: '#AEAEB2', marginBottom: 14 }}>Page de vente visuelle basée sur des images.</div>

                <button onClick={() => setPersuasionSections([...persuasionSections, { tag: 'Hook', title: '', text: '', image_url: '', visible: true, order: persuasionSections.length }])}
                  style={{ width: '100%', height: 46, background: accent, border: 'none', borderRadius: 14, color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', marginBottom: 14 }}>
                  + Ajouter une section
                </button>

                {persuasionSections.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#AEAEB2' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
                    <div style={{ fontSize: 13 }}>Aucune section — clique sur "+ Ajouter"</div>
                  </div>
                )}

                {persuasionSections.map((sec, i) => (
                  <div key={i} style={{ border: '1px solid #E5E5EA', borderRadius: 14, padding: 14, marginBottom: 12, background: '#F8F8F8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#AEAEB2', background: '#E5E5EA', borderRadius: 6, padding: '2px 8px' }}>{i + 1}/{persuasionSections.length}</span>
                      <select value={sec.tag} onChange={e => { const a = [...persuasionSections]; a[i].tag = e.target.value; setPersuasionSections(a) }} style={{ flex: 1, height: 40, borderRadius: 10, border: '1.5px solid #E5E5EA', padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
                        {['Hook','Promesse','Avant/Après','Comment ça marche','Bénéfices','Preuve','Avis','Réassurance','Offre','Urgence'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      <button onClick={() => moveSection(i, 'up')} disabled={i === 0} style={{ height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid #E5E5EA', background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: i === 0 ? .3 : 1 }}>↑</button>
                      <button onClick={() => moveSection(i, 'down')} disabled={i === persuasionSections.length - 1} style={{ height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid #E5E5EA', background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: i === persuasionSections.length - 1 ? .3 : 1 }}>↓</button>
                      <button onClick={() => { const a = [...persuasionSections]; a[i].visible = !a[i].visible; setPersuasionSections(a) }} style={{ height: 32, padding: '0 10px', borderRadius: 8, border: `1px solid ${sec.visible ? '#34C759' : '#E5E5EA'}`, background: sec.visible ? '#ECFDF5' : '#fff', color: sec.visible ? '#059669' : '#AEAEB2', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        {sec.visible ? '✓ Visible' : '✗ Masqué'}
                      </button>
                      <button onClick={() => setPersuasionSections(persuasionSections.filter((_, j) => j !== i))} style={{ height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid #FFB3B3', background: '#FFF0F0', color: '#FF3B30', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}>🗑️</button>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <label style={labelStyle}>🖼️ Image</label>
                      {sec.image_url && (
                        <div style={{ position: 'relative', marginBottom: 8 }}>
                          <img src={sec.image_url} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10 }} />
                          <button onClick={() => { const a = [...persuasionSections]; a[i].image_url = ''; setPersuasionSections(a) }} style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,.6)', color: '#fff', border: '2px solid #fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>✕</button>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="file" accept="image/*" id={`img-sec-${i}`} style={{ display: 'none' }} onChange={async e => { const file = e.target.files?.[0]; if (file) await uploadSectionImage(file, i) }} />
                        <button onClick={() => document.getElementById(`img-sec-${i}`)?.click()} disabled={uploadingSecIdx === i} style={{ height: 40, padding: '0 14px', borderRadius: 10, border: `1.5px solid ${accent}44`, background: accent + '10', color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          {uploadingSecIdx === i ? '⏳ Upload…' : '📁 Uploader'}
                        </button>
                        <input style={{ ...inputStyle, flex: 1, height: 40 }} value={sec.image_url} onChange={e => { const a = [...persuasionSections]; a[i].image_url = e.target.value; setPersuasionSections(a) }} placeholder="ou URL https://..." />
                      </div>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <label style={labelStyle}>Titre</label>
                      <input style={inputStyle} value={sec.title} onChange={e => { const a = [...persuasionSections]; a[i].title = e.target.value; setPersuasionSections(a) }} placeholder="Titre (optionnel)" />
                    </div>
                    <div>
                      <label style={labelStyle}>Texte</label>
                      <textarea value={sec.text} onChange={e => { const a = [...persuasionSections]; a[i].text = e.target.value; setPersuasionSections(a) }} rows={3} style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'none' }} placeholder="Texte (optionnel)" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Upsells */}
              <div style={cardStyle}>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>🛍️ Upsells</div>
                <div style={{ fontSize: 12, color: '#AEAEB2', marginBottom: 14 }}>Produits additionnels affichés dans la barre de commande.</div>

                {upsellItems.map((item, i) => (
                  <div key={i} style={{ border: '1px solid #E5E5EA', borderRadius: 14, padding: 14, marginBottom: 12, background: '#F8F8F8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 800 }}>Upsell {i + 1}</span>
                      <button onClick={() => setUpsellItems(upsellItems.filter((_, j) => j !== i))} style={{ height: 30, padding: '0 10px', borderRadius: 8, background: '#FFF0F0', border: 'none', color: '#FF3B30', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🗑️ Supprimer</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                      <div>
                        <label style={labelStyle}>Emoji</label>
                        <input style={inputStyle} value={item.emoji} onChange={e => { const a = [...upsellItems]; a[i].emoji = e.target.value; setUpsellItems(a) }} placeholder="🎁" />
                      </div>
                      <div>
                        <label style={labelStyle}>Couleur</label>
                        <input type="color" value={item.color || accent} onChange={e => { const a = [...upsellItems]; a[i].color = e.target.value; setUpsellItems(a) }} style={{ width: '100%', height: 46, borderRadius: 12, border: '1.5px solid #E5E5EA', cursor: 'pointer', padding: 2 }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Prix FCFA</label>
                        <input style={inputStyle} type="number" value={item.price} onChange={e => { const a = [...upsellItems]; a[i].price = Number(e.target.value); setUpsellItems(a) }} placeholder="5000" />
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={labelStyle}>Nom</label>
                      <input style={inputStyle} value={item.name} onChange={e => { const a = [...upsellItems]; a[i].name = e.target.value; setUpsellItems(a) }} placeholder="Housse de transport" />
                    </div>
                    <div>
                      <label style={labelStyle}>🖼️ Image (optionnel)</label>
                      {item.image_url && (
                        <div style={{ position: 'relative', marginBottom: 8, display: 'inline-block' }}>
                          <img src={item.image_url} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `2.5px solid ${item.color || accent}` }} />
                          <button onClick={() => { const a = [...upsellItems]; a[i].image_url = ''; setUpsellItems(a) }} style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#FF3B30', color: '#fff', border: '2px solid #fff', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>✕</button>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="file" accept="image/*" id={`upsell-img-${i}`} style={{ display: 'none' }} onChange={async e => { const file = e.target.files?.[0]; if (file) await uploadUpsellImage(file, i) }} />
                        <button onClick={() => document.getElementById(`upsell-img-${i}`)?.click()} disabled={uploadingUpsellIdx === i} style={{ height: 40, padding: '0 14px', borderRadius: 10, border: `1.5px solid ${accent}44`, background: accent + '10', color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          {uploadingUpsellIdx === i ? '⏳ Upload…' : '📁 Image'}
                        </button>
                        <input style={{ ...inputStyle, flex: 1, height: 40 }} value={item.image_url || ''} onChange={e => { const a = [...upsellItems]; a[i].image_url = e.target.value; setUpsellItems(a) }} placeholder="ou URL https://..." />
                      </div>
                    </div>
                  </div>
                ))}

                <button onClick={() => setUpsellItems([...upsellItems, { id: Date.now().toString(), name: '', price: 0, emoji: '🎁', color: accent, image_url: '' }])}
                  style={{ width: '100%', height: 46, background: accent, border: 'none', borderRadius: 14, color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>
                  + Ajouter un upsell
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}