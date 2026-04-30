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

const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00] font-inter text-sm"
const labelCls = "block text-sm font-medium text-charcoal font-inter mb-2"

export default function NouveauProduit() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const DRAFT_KEY = 'colioo_draft_product'
  const [showDraftBanner, setShowDraftBanner] = useState(false)

  useEffect(() => {
    loadCategories()
    if (localStorage.getItem(DRAFT_KEY)) setShowDraftBanner(true)
  }, [])

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
    const compressed: File[] = []
    const previews: string[] = []
    for (const file of newFiles) {
      try {
        const c = await imageCompression(file, options)
        compressed.push(c); previews.push(URL.createObjectURL(c))
      } catch { compressed.push(file); previews.push(URL.createObjectURL(file)) }
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
      const a = [...persuasionSections]
      a[idx].image_url = data.publicUrl
      setPersuasionSections(a)
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
      const a = [...upsellItems]
      a[idx].image_url = data.publicUrl
      setUpsellItems(a)
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
        product_id: product.id,
        hero_tagline: heroTagline,
        arguments: arguments_.filter(a => a.text),
        description, specs: specs.filter(s => s.key && s.value),
        reviews: reviews.filter(r => r.name && r.text),
        faq: faq.filter(f => f.question && f.answer),
        video_url: videoUrl || null,
        bundle: bundle.title ? bundle : {},
        comparaison: comparaison.filter(c => c.feature),
        couleurs: couleurs.filter(c => c.hex),
        tailles: tailles.filter(t => t),
        grammages: grammages.filter(g => g),
        sections_visible: sectionsVisible,
        persuasion_sections: persuasionSections,
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

      localStorage.removeItem(DRAFT_KEY)
      alert(publish ? '✅ Produit publié !' : '✅ Brouillon enregistré !')
      router.push('/admin/produits')
    } catch (err) {
      console.error(err)
      alert('Erreur lors de l\'enregistrement')
    } finally { setSaving(false); setUploading(false) }
  }

  const sectionsList = [
    { key: 'hero_tagline', label: 'Accroche courte', icon: '✍️' },
    { key: 'arguments', label: 'Arguments clés', icon: '✅' },
    { key: 'description', label: 'Description', icon: '📝' },
    { key: 'specs', label: 'Caractéristiques', icon: '📊' },
    { key: 'variantes', label: 'Couleurs / Tailles / Poids', icon: '🎨' },
    { key: 'reviews', label: 'Avis clients', icon: '⭐' },
    { key: 'faq', label: 'FAQ', icon: '❓' },
    { key: 'video_url', label: 'Vidéo YouTube', icon: '📹' },
    { key: 'bundle', label: 'Bundle/Offre groupée', icon: '🎁' },
    { key: 'comparaison', label: 'Tableau comparaison', icon: '⚖️' },
  ]

  const tabs = [
    { id: 1, label: 'Infos de base' },
    { id: 2, label: 'Photos' },
    { id: 3, label: 'Sections' },
    { id: 4, label: '🖼️ Persuasion' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {showDraftBanner && (
        <div className="bg-orange-100 border border-orange-400 text-orange-800 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
          <span className="font-inter text-sm">Brouillon sauvegardé détecté</span>
          <div className="flex gap-2">
            <button onClick={() => setShowDraftBanner(false)} className="px-3 py-1.5 bg-[#FF6B00] text-white text-sm font-inter rounded-lg">OK</button>
            <button onClick={() => { localStorage.removeItem(DRAFT_KEY); setShowDraftBanner(false) }} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-inter rounded-lg">Ignorer</button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-charcoal font-poppins">Nouveau produit</h1>
        <p className="text-gray-600 font-inter mt-1">Créez un nouveau produit pour votre boutique</p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 font-inter text-sm font-medium transition-all rounded-t-lg ${activeTab === tab.id ? 'bg-white text-[#FF6B00] border-b-2 border-[#FF6B00] -mb-px' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── TAB 1 ── */}
      {activeTab === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Nom du produit *</label>
              <input type="text" value={name} onChange={e => handleNameChange(e.target.value)} className={inputCls} placeholder="Nom du produit" />
            </div>
            <div>
              <label className={labelCls}>Slug URL</label>
              <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className={inputCls} placeholder="slug-url" />
            </div>
            <div>
              <label className={labelCls}>Prix (FCFA) *</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className={inputCls} placeholder="15000" />
            </div>
            <div>
              <label className={labelCls}>Prix barré (FCFA)</label>
              <input type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} className={inputCls} placeholder="20000" />
            </div>
            <div>
              <label className={labelCls}>Badge</label>
              <select value={badge} onChange={e => setBadge(e.target.value)} className={inputCls}>
                <option value="">Aucun</option>
                <option value="nouveau">Nouveau</option>
                <option value="promo">Promo</option>
                <option value="best_seller">Best Seller</option>
                <option value="rupture">Rupture de stock</option>
                <option value="livraison_gratuite">Livraison gratuite</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Catégorie</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputCls}>
                <option value="">Sélectionner une catégorie</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Numéro WhatsApp *</label>
              <input type="text" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} className={inputCls} placeholder="22500000000" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <button onClick={() => setIsPublished(!isPublished)} style={{ width: 44, height: 24, borderRadius: 12, background: isPublished ? '#FF6B00' : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: isPublished ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
              </button>
              <span className={`text-sm font-medium font-inter ${isPublished ? 'text-[#FF6B00]' : 'text-gray-500'}`}>{isPublished ? 'Publié' : 'Brouillon'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2 ── */}
      {activeTab === 2 && (
        <div className="space-y-6">
          <div>
            <label className={labelCls}>Photos (max 6)</label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#FF6B00] transition-colors">
              <div className="text-4xl mb-2">📸</div>
              <p className="text-gray-500 font-inter">Cliquez pour ajouter des photos</p>
              <p className="text-sm text-gray-400 font-inter mt-1">{images.length}/6 photos</p>
            </div>
          </div>
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt="" className={`w-full h-28 object-cover rounded-lg ${coverIndex === index ? 'ring-2 ring-[#FF6B00]' : ''}`} />
                  <button onClick={() => { setImages(images.filter((_, i) => i !== index)); setImagePreviews(imagePreviews.filter((_, i) => i !== index)) }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">×</button>
                  <button onClick={() => setCoverIndex(index)} className={`absolute bottom-1 left-1 text-xs px-2 py-1 rounded ${coverIndex === index ? 'bg-[#FF6B00] text-white' : 'bg-gray-800 text-white'}`}>
                    {coverIndex === index ? '✓ Couverture' : 'Définir'}
                  </button>
                </div>
              ))}
            </div>
          )}
          {uploading && <div className="text-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00] mx-auto mb-2"></div><p className="text-gray-600 font-inter">Upload en cours…</p></div>}
        </div>
      )}

      {/* ── TAB 3 ── */}
      {activeTab === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-poppins font-bold text-charcoal mb-4">Sections visibles</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {sectionsList.map(s => (
                <button key={s.key} onClick={() => setSectionsVisible(prev => ({ ...prev, [s.key]: !prev[s.key as keyof typeof sectionsVisible] }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm font-inter ${sectionsVisible[s.key as keyof typeof sectionsVisible] ? 'border-[#FF6B00] bg-orange-50 text-[#FF6B00]' : 'border-gray-200 text-gray-400'}`}>
                  <span>{s.icon}</span> {s.label}
                </button>
              ))}
            </div>
          </div>

          {sectionsVisible.hero_tagline && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-poppins font-bold text-charcoal mb-3">✍️ Accroche courte</h3>
              <input type="text" value={heroTagline} onChange={e => setHeroTagline(e.target.value)} className={inputCls} placeholder="Le produit idéal pour..." />
            </div>
          )}

          {sectionsVisible.arguments && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-poppins font-bold text-charcoal">✅ Arguments clés</h3>
                <button onClick={() => setArguments([...arguments_, { icon: '✅', text: '' }])} className="text-sm text-[#FF6B00] font-inter">+ Ajouter</button>
              </div>
              {arguments_.map((arg, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <select value={arg.icon} onChange={e => { const a = [...arguments_]; a[i].icon = e.target.value; setArguments(a) }} className="w-20 px-2 py-2 border border-gray-300 rounded-lg font-inter text-sm">
                    {['✅','⭐','🚚','💯','🎁','🔥','💪','🌟','🔊','💧'].map(ic => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                  <input type="text" value={arg.text} onChange={e => { const a = [...arguments_]; a[i].text = e.target.value; setArguments(a) }} className={`flex-1 ${inputCls}`} placeholder="Argument..." />
                  {arguments_.length > 1 && <button onClick={() => setArguments(arguments_.filter((_, j) => j !== i))} className="text-red-500 px-2 text-xl">×</button>}
                </div>
              ))}
            </div>
          )}

          {sectionsVisible.description && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-poppins font-bold text-charcoal mb-3">📝 Description</h3>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className={inputCls} placeholder="Décrivez votre produit..." />
            </div>
          )}

          {sectionsVisible.specs && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-poppins font-bold text-charcoal">📊 Caractéristiques</h3>
                <button onClick={() => setSpecs([...specs, { key: '', value: '' }])} className="text-sm text-[#FF6B00] font-inter">+ Ajouter</button>
              </div>
              {specs.map((spec, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input type="text" value={spec.key} onChange={e => { const s = [...specs]; s[i].key = e.target.value; setSpecs(s) }} className={`flex-1 ${inputCls}`} placeholder="Clé (ex: Matière)" />
                  <input type="text" value={spec.value} onChange={e => { const s = [...specs]; s[i].value = e.target.value; setSpecs(s) }} className={`flex-1 ${inputCls}`} placeholder="Valeur (ex: Aluminium)" />
                  {specs.length > 1 && <button onClick={() => setSpecs(specs.filter((_, j) => j !== i))} className="text-red-500 px-2 text-xl">×</button>}
                </div>
              ))}
            </div>
          )}

          {sectionsVisible.variantes && (
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-6">
              <h3 className="font-poppins font-bold text-charcoal">🎨 Variantes</h3>
              <div>
                <label className={labelCls}>Couleurs</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {couleurs.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: c.hex }} />
                      <span className="text-sm font-inter">{c.nom}</span>
                      <button onClick={() => setCouleurs(couleurs.filter((_, j) => j !== i))} className="text-red-400 text-sm">×</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="color" id="colorPicker" className="w-10 h-10 rounded cursor-pointer border" defaultValue="#FF6B00" />
                  <input type="text" placeholder="Nom (ex: Rouge)" id="colorName" className={`flex-1 ${inputCls}`} />
                  <button onClick={() => {
                    const hex = (document.getElementById('colorPicker') as HTMLInputElement)?.value
                    const nom = (document.getElementById('colorName') as HTMLInputElement)?.value
                    if (hex && nom) { setCouleurs([...couleurs, { nom, hex }]); (document.getElementById('colorName') as HTMLInputElement).value = '' }
                  }} className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-inter text-sm">+ Ajouter</button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Tailles</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tailles.map((t, i) => <div key={i} className="flex items-center gap-1 bg-gray-50 border rounded-lg px-3 py-1"><span className="text-sm font-inter">{t}</span><button onClick={() => setTailles(tailles.filter((_, j) => j !== i))} className="text-red-400 text-sm ml-1">×</button></div>)}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newTaille} onChange={e => setNewTaille(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newTaille) { setTailles([...tailles, newTaille]); setNewTaille('') }}} className={`flex-1 ${inputCls}`} placeholder="Ex: S, M, L, XL..." />
                  <button onClick={() => { if (newTaille) { setTailles([...tailles, newTaille]); setNewTaille('') }}} className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-inter text-sm">+ Ajouter</button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Grammages / Poids</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {grammages.map((g, i) => <div key={i} className="flex items-center gap-1 bg-gray-50 border rounded-lg px-3 py-1"><span className="text-sm font-inter">{g}</span><button onClick={() => setGrammages(grammages.filter((_, j) => j !== i))} className="text-red-400 text-sm ml-1">×</button></div>)}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newGrammage} onChange={e => setNewGrammage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newGrammage) { setGrammages([...grammages, newGrammage]); setNewGrammage('') }}} className={`flex-1 ${inputCls}`} placeholder="Ex: 250g, 500g..." />
                  <button onClick={() => { if (newGrammage) { setGrammages([...grammages, newGrammage]); setNewGrammage('') }}} className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-inter text-sm">+ Ajouter</button>
                </div>
              </div>
            </div>
          )}

          {sectionsVisible.reviews && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-poppins font-bold text-charcoal">⭐ Avis clients</h3>
                <button onClick={() => setReviews([...reviews, { name: '', rating: 5, text: '' }])} className="text-sm text-[#FF6B00] font-inter">+ Ajouter</button>
              </div>
              {reviews.map((review, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 mb-3">
                  <div className="flex items-center gap-3 mb-3">
                    <input type="text" value={review.name} onChange={e => { const r = [...reviews]; r[i].name = e.target.value; setReviews(r) }} className={`flex-1 ${inputCls}`} placeholder="Nom du client" />
                    <div className="flex">{[1,2,3,4,5].map(s => <button key={s} onClick={() => { const r = [...reviews]; r[i].rating = s; setReviews(r) }} className={`text-xl ${s <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>)}</div>
                    {reviews.length > 1 && <button onClick={() => setReviews(reviews.filter((_, j) => j !== i))} className="text-red-500 text-xl">×</button>}
                  </div>
                  <textarea value={review.text} onChange={e => { const r = [...reviews]; r[i].text = e.target.value; setReviews(r) }} rows={2} className={inputCls} placeholder="Avis..." />
                </div>
              ))}
            </div>
          )}

          {sectionsVisible.faq && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-poppins font-bold text-charcoal">❓ FAQ</h3>
                <button onClick={() => setFaq([...faq, { question: '', answer: '' }])} className="text-sm text-[#FF6B00] font-inter">+ Ajouter</button>
              </div>
              {faq.map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 mb-3 space-y-2">
                  <div className="flex gap-2">
                    <input type="text" value={item.question} onChange={e => { const f = [...faq]; f[i].question = e.target.value; setFaq(f) }} className={`flex-1 ${inputCls}`} placeholder="Question..." />
                    {faq.length > 1 && <button onClick={() => setFaq(faq.filter((_, j) => j !== i))} className="text-red-500 text-xl px-2">×</button>}
                  </div>
                  <textarea value={item.answer} onChange={e => { const f = [...faq]; f[i].answer = e.target.value; setFaq(f) }} rows={2} className={inputCls} placeholder="Réponse..." />
                </div>
              ))}
            </div>
          )}

          {sectionsVisible.video_url && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-poppins font-bold text-charcoal mb-3">📹 Vidéo YouTube</h3>
              <input type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className={inputCls} placeholder="https://www.youtube.com/watch?v=..." />
            </div>
          )}

          {sectionsVisible.bundle && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-poppins font-bold text-charcoal mb-3">🎁 Bundle / Offre groupée</h3>
              <input type="text" value={bundle.title} onChange={e => setBundle({ ...bundle, title: e.target.value })} className={`${inputCls} mb-3`} placeholder="Titre du bundle" />
              {bundle.items.map((item, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input type="text" value={item.name} onChange={e => { const items = [...bundle.items]; items[i].name = e.target.value; setBundle({ ...bundle, items }) }} className={`flex-1 ${inputCls}`} placeholder="Nom de l'item" />
                  <input type="text" value={item.price} onChange={e => { const items = [...bundle.items]; items[i].price = e.target.value; setBundle({ ...bundle, items }) }} className="w-32 px-3 py-2 border border-gray-300 rounded-lg font-inter text-sm" placeholder="Prix FCFA" />
                  {bundle.items.length > 1 && <button onClick={() => setBundle({ ...bundle, items: bundle.items.filter((_, j) => j !== i) })} className="text-red-500 text-xl px-2">×</button>}
                </div>
              ))}
              <button onClick={() => setBundle({ ...bundle, items: [...bundle.items, { name: '', price: '' }] })} className="text-sm text-[#FF6B00] font-inter mt-2">+ Ajouter un item</button>
            </div>
          )}

          {sectionsVisible.comparaison && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-poppins font-bold text-charcoal">⚖️ Tableau comparaison</h3>
                <button onClick={() => setComparaison([...comparaison, { feature: '', notre_produit: '', concurrent: '' }])} className="text-sm text-[#FF6B00] font-inter">+ Ajouter</button>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <p className="text-xs font-inter font-medium text-gray-500">Fonctionnalité</p>
                <p className="text-xs font-inter font-medium text-[#FF6B00]">Notre produit</p>
                <p className="text-xs font-inter font-medium text-gray-500">Concurrent</p>
              </div>
              {comparaison.map((item, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                  <input type="text" value={item.feature} onChange={e => { const c = [...comparaison]; c[i].feature = e.target.value; setComparaison(c) }} className="px-2 py-1.5 border border-gray-300 rounded-lg font-inter text-sm" placeholder="Ex: Qualité" />
                  <input type="text" value={item.notre_produit} onChange={e => { const c = [...comparaison]; c[i].notre_produit = e.target.value; setComparaison(c) }} className="px-2 py-1.5 border border-[#FF6B00] rounded-lg font-inter text-sm" placeholder="✅ Premium" />
                  <input type="text" value={item.concurrent} onChange={e => { const c = [...comparaison]; c[i].concurrent = e.target.value; setComparaison(c) }} className="px-2 py-1.5 border border-gray-300 rounded-lg font-inter text-sm" placeholder="❌ Basique" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4 : Persuasion + Upsells ── */}
      {activeTab === 4 && (
        <div className="space-y-6">

          {/* Sections persuasion */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-poppins font-bold text-charcoal">📣 Sections de persuasion</h2>
              <span className="text-xs text-gray-400 font-inter">{persuasionSections.length} section(s)</span>
            </div>
            <p className="text-sm text-gray-500 font-inter mb-4">Page de vente visuelle basée sur des images.</p>

            <button onClick={() => setPersuasionSections([...persuasionSections, { tag: 'Hook', title: '', text: '', image_url: '', visible: true, order: persuasionSections.length }])}
              className="w-full py-3 bg-[#FF6B00] text-white font-inter font-bold rounded-xl mb-4 hover:bg-[#e55f00] transition-colors">
              + Ajouter une section
            </button>

            {persuasionSections.length === 0 && (
              <div className="text-center py-10 bg-gray-50 rounded-xl">
                <div className="text-4xl mb-3">🖼️</div>
                <p className="text-gray-400 font-inter text-sm">Aucune section — clique sur "+ Ajouter" pour commencer</p>
              </div>
            )}

            {persuasionSections.map((sec, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold text-gray-400 bg-gray-200 rounded px-2 py-0.5">{i + 1}/{persuasionSections.length}</span>
                  <select value={sec.tag} onChange={e => { const a = [...persuasionSections]; a[i].tag = e.target.value; setPersuasionSections(a) }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-inter text-sm">
                    {['Hook','Promesse','Avant/Après','Comment ça marche','Bénéfices','Preuve','Avis','Réassurance','Offre','Urgence'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button onClick={() => moveSection(i, 'up')} disabled={i === 0} className="px-3 py-1.5 text-xs font-inter font-bold border border-gray-200 rounded-lg bg-white disabled:opacity-30">↑ Monter</button>
                  <button onClick={() => moveSection(i, 'down')} disabled={i === persuasionSections.length - 1} className="px-3 py-1.5 text-xs font-inter font-bold border border-gray-200 rounded-lg bg-white disabled:opacity-30">↓ Descendre</button>
                  <button onClick={() => { const a = [...persuasionSections]; a.splice(i + 1, 0, { ...a[i] }); setPersuasionSections(a) }} className="px-3 py-1.5 text-xs font-inter font-bold bg-blue-50 text-blue-600 rounded-lg border border-blue-200">⧉ Dupliquer</button>
                  <button onClick={() => { const a = [...persuasionSections]; a[i].visible = !a[i].visible; setPersuasionSections(a) }} className={`px-3 py-1.5 text-xs font-inter font-bold rounded-lg ${sec.visible ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                    {sec.visible ? '✓ Visible' : '✗ Masqué'}
                  </button>
                  <button onClick={() => setPersuasionSections(persuasionSections.filter((_, j) => j !== i))} className="px-3 py-1.5 text-xs font-inter font-bold bg-red-50 text-red-500 rounded-lg border border-red-200 ml-auto">🗑️ Supprimer</button>
                </div>
                <div className="mb-3">
                  <label className={labelCls}>🖼️ Image</label>
                  {sec.image_url && (
                    <div className="relative mb-2">
                      <img src={sec.image_url} alt="" className="w-full max-h-48 object-cover rounded-lg border border-gray-200" />
                      <button onClick={() => { const a = [...persuasionSections]; a[i].image_url = ''; setPersuasionSections(a) }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center border-2 border-white">✕</button>
                    </div>
                  )}
                  <div className="flex gap-2 items-center flex-wrap">
                    <input type="file" accept="image/*" id={`img-sec-${i}`} className="hidden"
                      onChange={async e => { const file = e.target.files?.[0]; if (file) await uploadSectionImage(file, i) }} />
                    <button onClick={() => document.getElementById(`img-sec-${i}`)?.click()} disabled={uploadingSecIdx === i}
                      className="px-3 py-2 text-sm font-inter font-bold text-[#FF6B00] bg-orange-50 border border-orange-200 rounded-lg disabled:opacity-50">
                      {uploadingSecIdx === i ? '⏳ Upload…' : '📁 Uploader'}
                    </button>
                    <span className="text-xs text-gray-400 font-inter">ou URL :</span>
                    <input type="text" value={sec.image_url} onChange={e => { const a = [...persuasionSections]; a[i].image_url = e.target.value; setPersuasionSections(a) }}
                      className="flex-1 min-w-32 px-3 py-2 border border-gray-300 rounded-lg font-inter text-sm" placeholder="https://..." />
                  </div>
                </div>
                <div className="mb-3">
                  <label className={labelCls}>Titre</label>
                  <input type="text" value={sec.title} onChange={e => { const a = [...persuasionSections]; a[i].title = e.target.value; setPersuasionSections(a) }} className={inputCls} placeholder="Titre (optionnel)" />
                </div>
                <div>
                  <label className={labelCls}>Texte</label>
                  <textarea value={sec.text} onChange={e => { const a = [...persuasionSections]; a[i].text = e.target.value; setPersuasionSections(a) }} rows={3} className={inputCls} placeholder="Texte (optionnel si l'image parle d'elle-même)" />
                </div>
              </div>
            ))}

            {persuasionSections.length > 0 && (
              <button onClick={() => setPersuasionSections([...persuasionSections, { tag: 'Hook', title: '', text: '', image_url: '', visible: true, order: persuasionSections.length }])}
                className="w-full py-2.5 border-2 border-dashed border-gray-300 text-gray-500 font-inter text-sm rounded-xl hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">
                + Ajouter une section
              </button>
            )}
          </div>

          {/* ── UPSELLS avec upload image ── */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-poppins font-bold text-charcoal mb-2">🛍️ Upsells</h2>
            <p className="text-sm text-gray-500 font-inter mb-4">Produits additionnels affichés en cercles dans la barre de commande.</p>

            {upsellItems.map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold font-inter">Upsell {i + 1}</span>
                  <button onClick={() => setUpsellItems(upsellItems.filter((_, j) => j !== i))} className="text-red-500 text-sm font-inter">🗑️ Supprimer</button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className={labelCls}>Emoji</label>
                    <input type="text" value={item.emoji} onChange={e => { const a = [...upsellItems]; a[i].emoji = e.target.value; setUpsellItems(a) }} className={inputCls} placeholder="🎁" />
                  </div>
                  <div>
                    <label className={labelCls}>Couleur</label>
                    <input type="color" value={item.color || '#FF6B00'} onChange={e => { const a = [...upsellItems]; a[i].color = e.target.value; setUpsellItems(a) }} className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer p-1" />
                  </div>
                  <div>
                    <label className={labelCls}>Prix (FCFA)</label>
                    <input type="number" value={item.price} onChange={e => { const a = [...upsellItems]; a[i].price = Number(e.target.value); setUpsellItems(a) }} className={inputCls} placeholder="5000" />
                  </div>
                </div>

                <div className="mb-3">
                  <label className={labelCls}>Nom</label>
                  <input type="text" value={item.name} onChange={e => { const a = [...upsellItems]; a[i].name = e.target.value; setUpsellItems(a) }} className={inputCls} placeholder="Housse de transport" />
                </div>

                {/* ── Upload image upsell ── */}
                <div className="mb-3">
                  <label className={labelCls}>🖼️ Image (remplace l'emoji dans le cercle)</label>
                  {item.image_url && (
                    <div className="relative mb-2 inline-block">
                      <img src={item.image_url} alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: `2.5px solid ${item.color || '#FF6B00'}` }} />
                      <button onClick={() => { const a = [...upsellItems]; a[i].image_url = ''; setUpsellItems(a) }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center border-2 border-white">✕</button>
                    </div>
                  )}
                  <div className="flex gap-2 items-center flex-wrap mt-2">
                    <input type="file" accept="image/*" id={`upsell-img-${i}`} className="hidden"
                      onChange={async e => { const file = e.target.files?.[0]; if (file) await uploadUpsellImage(file, i) }} />
                    <button onClick={() => document.getElementById(`upsell-img-${i}`)?.click()} disabled={uploadingUpsellIdx === i}
                      className="px-3 py-2 text-sm font-inter font-bold text-[#FF6B00] bg-orange-50 border border-orange-200 rounded-lg disabled:opacity-50">
                      {uploadingUpsellIdx === i ? '⏳ Upload…' : '📁 Uploader une image'}
                    </button>
                    <span className="text-xs text-gray-400 font-inter">ou URL :</span>
                    <input type="text" value={item.image_url || ''} onChange={e => { const a = [...upsellItems]; a[i].image_url = e.target.value; setUpsellItems(a) }}
                      className="flex-1 min-w-32 px-3 py-2 border border-gray-300 rounded-lg font-inter text-sm" placeholder="https://..." />
                  </div>
                </div>

                {/* Aperçu cercle */}
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg,${item.color || '#FF6B00'}28,${item.color || '#FF6B00'}66)`, border: `2.5px solid ${item.color || '#FF6B00'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, overflow: 'hidden' }}>
                    {item.image_url
                      ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : item.emoji || '🎁'
                    }
                  </div>
                  <div>
                    <div className="text-sm font-bold font-inter">{item.name || 'Nom du produit'}</div>
                    <div className="text-sm font-bold text-[#FF6B00]">{Number(item.price || 0).toLocaleString('fr-FR')} FCFA</div>
                  </div>
                  <span className="ml-auto text-xs text-gray-400 italic">Aperçu cercle</span>
                </div>
              </div>
            ))}

            <button onClick={() => setUpsellItems([...upsellItems, { id: Date.now().toString(), name: '', price: 0, emoji: '🎁', color: '#FF6B00', image_url: '' }])}
              className="w-full py-3 bg-[#FF6B00] text-white font-inter font-bold rounded-xl hover:bg-[#e55f00] transition-colors">
              + Ajouter un upsell
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
        <button onClick={() => router.push('/admin/produits')} className="px-4 py-2 border border-gray-300 rounded-lg text-charcoal font-inter hover:bg-gray-50">Annuler</button>
        <button onClick={() => saveProduct(false)} disabled={saving} className="px-4 py-2 bg-gray-600 text-white rounded-lg font-inter hover:bg-gray-700 disabled:opacity-50">
          {saving ? 'Enregistrement…' : 'Enregistrer brouillon'}
        </button>
        <button onClick={() => saveProduct(true)} disabled={saving} className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-inter font-bold hover:bg-[#e55f00] disabled:opacity-50">
          {saving ? 'Publication…' : 'Publier le produit'}
        </button>
      </div>
    </div>
  )
}