'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface HomeSection {
  id: string
  type: string
  position: number
  is_active: boolean
  content: any
}

const sectionLabels: Record<string, { label: string; icon: string }> = {
  custom: { label: 'Section Custom', icon: '✨' },
  hero: { label: 'Hero Principal', icon: '🎯' },
  stats: { label: 'Statistiques', icon: '📊' },
  reassurance: { label: 'Réassurance', icon: '✅' },
  produits: { label: 'Grille Produits', icon: '🛍️' },
  temoignages: { label: 'Témoignages', icon: '💬' },
  banniere: { label: 'Bannière Promo', icon: '🎁' },
  newsletter: { label: 'Newsletter', icon: '📧' },
  categories_slide: { label: 'Slide Catégories', icon: '🏷️' },
  mini_banniere: { label: 'Mini Bannière', icon: '📢' },
  produits_horizontal: { label: 'Section Produits', icon: '🛒' },
  avis_clients: { label: 'Avis Clients', icon: '⭐' },
  standard_qualite: { label: 'Standard Qualité', icon: '🏆' },
}

export default function AccueilAdmin() {
  const [sections, setSections] = useState<HomeSection[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingSlide, setUploadingSlide] = useState(false)
  const slideInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadSections() }, [])

  const loadSections = async () => {
    const { data } = await supabase.from('home_sections').select('*').order('position')
    if (data) setSections(data)
    setLoading(false)
  }

  const toggleSection = async (id: string, is_active: boolean) => {
    await supabase.from('home_sections').update({ is_active: !is_active }).eq('id', id)
    loadSections()
  }

  const moveSection = async (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === id)
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === sections.length - 1) return
    const newSections = [...sections]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newSections[index].position
    newSections[index].position = newSections[swapIndex].position
    newSections[swapIndex].position = temp
    await Promise.all([
      supabase.from('home_sections').update({ position: newSections[index].position }).eq('id', newSections[index].id),
      supabase.from('home_sections').update({ position: newSections[swapIndex].position }).eq('id', newSections[swapIndex].id),
    ])
    loadSections()
  }

  const saveContent = async () => {
    if (!editingSection) return
    setSaving(true)
    await supabase.from('home_sections').update({ content: editingSection.content }).eq('id', editingSection.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    loadSections()
  }

  const addCustomSection = async () => {
    const maxPosition = Math.max(...sections.map(s => s.position), 0)
    await supabase.from('home_sections').insert({
      type: 'custom',
      position: maxPosition + 1,
      is_active: true,
      content: {
        title: 'Nouvelle section',
        text: '',
        bg_color: '#ffffff',
        text_color: '#333333',
        font_size: '16px',
        padding: '40px',
        align: 'center',
        image_url: '',
        cta_text: '',
        cta_link: '',
        cta_color: '#FF6B00',
      }
    })
    loadSections()
  }

  const deleteSection = async (id: string) => {
    await supabase.from('home_sections').delete().eq('id', id)
    loadSections()
    if (editingSection?.id === id) setEditingSection(null)
  }

  const updateContent = (key: string, value: any) => {
    if (!editingSection) return
    setEditingSection({ ...editingSection, content: { ...editingSection.content, [key]: value } })
  }

  const handleSlideUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !editingSection) return
    setUploadingSlide(true)
    const file = e.target.files[0]
    const isVideo = file.type.startsWith('video/')
    const fileName = `hero-slides/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('product-images').upload(fileName, file)
    if (error) { alert('Erreur upload: ' + error.message); setUploadingSlide(false); return }
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)
    const newSlide = { type: isVideo ? 'video' : 'image', url: publicUrl }
    const slides = [...(editingSection.content.slides || []), newSlide]
    updateContent('slides', slides)
    setUploadingSlide(false)
  }

  const removeSlide = (index: number) => {
    if (!editingSection) return
    const slides = editingSection.content.slides.filter((_: any, i: number) => i !== index)
    updateContent('slides', slides)
  }

  const renderEditor = (section: HomeSection) => {
    const { type, content } = section

    if (type === 'hero') return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-2">🖼️ Slides (images/vidéos/gifs)</label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {(content.slides || []).map((slide: any, i: number) => (
              <div key={i} className="relative rounded-xl overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
                {slide.type === 'video'
                  ? <video src={slide.url} className="w-full h-full object-cover" muted />
                  : <img src={slide.url} alt="" className="w-full h-full object-cover" />}
                <button onClick={() => removeSlide(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">×</button>
                <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">{slide.type}</span>
              </div>
            ))}
          </div>
          <input ref={slideInputRef} type="file" accept="image/*,video/*" onChange={handleSlideUpload} className="hidden" />
          <button onClick={() => slideInputRef.current?.click()} disabled={uploadingSlide}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-inter text-sm hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors disabled:opacity-50">
            {uploadingSlide ? '⏳ Upload en cours...' : '+ Ajouter image / vidéo / gif'}
          </button>
          <p className="text-xs text-gray-400 font-inter mt-1">Si aucun slide → fond coloré uni</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">⚡ Vitesse du slide : {(content.slide_speed || 4000) / 1000}s</label>
          <input type="range" min="1000" max="10000" step="500" value={content.slide_speed || 4000} onChange={e => updateContent('slide_speed', parseInt(e.target.value))} className="w-full accent-[#FF6B00]" />
          <div className="flex justify-between text-xs text-gray-400 font-inter"><span>1s (rapide)</span><span>10s (lent)</span></div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">📐 Hauteur du Hero</label>
          <select value={content.slide_height || '500px'} onChange={e => updateContent('slide_height', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none">
            <option value="350px">Petite (350px)</option>
            <option value="500px">Normale (500px)</option>
            <option value="600px">Grande (600px)</option>
            <option value="700px">Très grande (700px)</option>
            <option value="100vh">Plein écran</option>
          </select>
        </div>
        {(content.slides || []).length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700 font-inter block mb-1">🌑 Opacité overlay : {Math.round((content.overlay_opacity ?? 0.5) * 100)}%</label>
            <input type="range" min="0" max="1" step="0.05" value={content.overlay_opacity ?? 0.5} onChange={e => updateContent('overlay_opacity', parseFloat(e.target.value))} className="w-full accent-[#FF6B00]" />
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Titre</label>
          <input type="text" value={content.title || ''} onChange={e => updateContent('title', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Couleur titre</label>
          <div className="flex gap-3 items-center">
            <input type="color" value={content.text_color || '#ffffff'} onChange={e => updateContent('text_color', e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-gray-200" />
            <input type="text" value={content.text_color || '#ffffff'} onChange={e => updateContent('text_color', e.target.value)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Taille police titre</label>
          <select value={content.font_size_title || '42px'} onChange={e => updateContent('font_size_title', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none">
            <option value="28px">Petite (28px)</option>
            <option value="36px">Normale (36px)</option>
            <option value="42px">Grande (42px)</option>
            <option value="52px">Très grande (52px)</option>
            <option value="64px">Géante (64px)</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Police titre</label>
          <select value={content.font_title || 'Poppins'} onChange={e => updateContent('font_title', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none">
            <option value="Poppins">Poppins (défaut)</option>
            <option value="Inter">Inter</option>
            <option value="Georgia">Georgia (serif)</option>
            <option value="Arial">Arial</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Sous-titre</label>
          <input type="text" value={content.subtitle || ''} onChange={e => updateContent('subtitle', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Couleur sous-titre</label>
          <div className="flex gap-3 items-center">
            <input type="color" value={content.subtitle_color || '#9ca3af'} onChange={e => updateContent('subtitle_color', e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-gray-200" />
            <input type="text" value={content.subtitle_color || '#9ca3af'} onChange={e => updateContent('subtitle_color', e.target.value)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Texte bouton CTA</label>
          <input type="text" value={content.cta_text || ''} onChange={e => updateContent('cta_text', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Lien bouton CTA</label>
          <input type="text" value={content.cta_link || '/catalogue'} onChange={e => updateContent('cta_link', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Couleur fond (si pas de slide)</label>
          <div className="flex gap-3 items-center">
            <input type="color" value={content.bg_color || '#1a1a2e'} onChange={e => updateContent('bg_color', e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-gray-200" />
            <input type="text" value={content.bg_color || '#1a1a2e'} onChange={e => updateContent('bg_color', e.target.value)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
        </div>
      </div>
    )

    if (type === 'stats') return (
      <div className="space-y-3">
        {(content.items || []).map((item: any, i: number) => (
          <div key={i} className="flex gap-3">
            <input type="text" value={item.number} placeholder="500+" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], number: e.target.value }; updateContent('items', items) }} className="w-24 px-3 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
            <input type="text" value={item.label} placeholder="Produits" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], label: e.target.value }; updateContent('items', items) }} className="flex-1 px-3 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
        ))}
      </div>
    )

    if (type === 'reassurance') return (
      <div className="space-y-3">
        {(content.items || []).map((item: any, i: number) => (
          <div key={i} className="flex gap-3">
            <input type="text" value={item.icon} placeholder="✅" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], icon: e.target.value }; updateContent('items', items) }} className="w-16 px-3 py-2 border border-gray-200 rounded-xl font-inter text-center focus:border-[#FF6B00] focus:outline-none" />
            <input type="text" value={item.label} placeholder="Texte" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], label: e.target.value }; updateContent('items', items) }} className="flex-1 px-3 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
        ))}
      </div>
    )

    if (type === 'banniere') return (
      <div className="space-y-4">
        <div><label className="text-sm font-medium text-gray-700 font-inter block mb-1">Titre</label><input type="text" value={content.title || ''} onChange={e => updateContent('title', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" /></div>
        <div><label className="text-sm font-medium text-gray-700 font-inter block mb-1">Sous-titre</label><input type="text" value={content.subtitle || ''} onChange={e => updateContent('subtitle', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" /></div>
        <div><label className="text-sm font-medium text-gray-700 font-inter block mb-1">Texte bouton</label><input type="text" value={content.cta_text || ''} onChange={e => updateContent('cta_text', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" /></div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Couleur fond</label>
          <div className="flex gap-3 items-center">
            <input type="color" value={content.bg_color || '#FF6B00'} onChange={e => updateContent('bg_color', e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-gray-200" />
            <input type="text" value={content.bg_color || '#FF6B00'} onChange={e => updateContent('bg_color', e.target.value)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
        </div>
      </div>
    )

    if (type === 'temoignages') return (
      <div className="space-y-4">
        <div><label className="text-sm font-medium text-gray-700 font-inter block mb-1">Titre section</label><input type="text" value={content.title || ''} onChange={e => updateContent('title', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" /></div>
        {(content.items || []).map((item: any, i: number) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-2">
            <input type="text" value={item.name} placeholder="Nom client" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], name: e.target.value }; updateContent('items', items) }} className="w-full px-3 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
            <textarea value={item.text} placeholder="Avis..." onChange={e => { const items = [...content.items]; items[i] = { ...items[i], text: e.target.value }; updateContent('items', items) }} className="w-full px-3 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" rows={2} />
          </div>
        ))}
        <button onClick={() => updateContent('items', [...(content.items || []), { name: '', text: '', rating: 5 }])} className="text-[#FF6B00] font-inter text-sm font-medium">+ Ajouter un témoignage</button>
      </div>
    )

    if (type === 'mini_banniere') return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Couleur fond</label>
          <div className="flex gap-3 items-center">
            <input type="color" value={content.bg_color || '#1a1a2e'} onChange={e => updateContent('bg_color', e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-gray-200" />
            <input type="text" value={content.bg_color || '#1a1a2e'} onChange={e => updateContent('bg_color', e.target.value)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Couleur texte</label>
          <div className="flex gap-3 items-center">
            <input type="color" value={content.text_color || '#ffffff'} onChange={e => updateContent('text_color', e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-gray-200" />
            <input type="text" value={content.text_color || '#ffffff'} onChange={e => updateContent('text_color', e.target.value)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-3">Éléments du bandeau</label>
          <div className="space-y-2">
            {(content.items || []).map((item: any, i: number) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={item.icon || ''} placeholder="⚡" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], icon: e.target.value }; updateContent('items', items) }} className="w-14 px-2 py-2 border border-gray-200 rounded-lg font-inter text-center focus:border-[#FF6B00] focus:outline-none" />
                <input type="text" value={item.text || ''} placeholder="Texte..." onChange={e => { const items = [...content.items]; items[i] = { ...items[i], text: e.target.value }; updateContent('items', items) }} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-inter focus:border-[#FF6B00] focus:outline-none" />
                <button onClick={() => { const items = content.items.filter((_: any, j: number) => j !== i); updateContent('items', items) }} className="text-red-400 px-2">×</button>
              </div>
            ))}
          </div>
          <button onClick={() => updateContent('items', [...(content.items || []), { icon: '', text: '' }])} className="w-full mt-3 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-inter text-sm hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">+ Ajouter un élément</button>
        </div>
      </div>
    )

    if (type === 'produits_horizontal') return (
      <div className="space-y-4">
        <div><label className="text-sm font-medium text-gray-700 font-inter block mb-1">Titre de la section</label><input type="text" value={content.title || ''} onChange={e => updateContent('title', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" /></div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Filtre produits</label>
          <select value={content.filter || 'all'} onChange={e => updateContent('filter', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none">
            <option value="all">Tous les produits</option>
            <option value="promo">Promotions</option>
            <option value="best_seller">Meilleures ventes</option>
            <option value="nouveau">Nouveautés</option>
            <option value="livraison_gratuite">Livraison gratuite</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Nombre de produits : {content.limit || 6}</label>
          <input type="range" min="2" max="12" step="1" value={content.limit || 6} onChange={e => updateContent('limit', parseInt(e.target.value))} className="w-full accent-[#FF6B00]" />
          <div className="flex justify-between text-xs text-gray-400 font-inter"><span>2</span><span>12</span></div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Couleur fond</label>
          <div className="flex gap-3 items-center">
            <input type="color" value={content.bg_color || '#FAFAF8'} onChange={e => updateContent('bg_color', e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-gray-200" />
            <input type="text" value={content.bg_color || '#FAFAF8'} onChange={e => updateContent('bg_color', e.target.value)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="show_commander" checked={content.show_commander !== false} onChange={e => updateContent('show_commander', e.target.checked)} className="w-4 h-4 accent-[#FF6B00]" />
          <label htmlFor="show_commander" className="text-sm font-medium text-gray-700 font-inter">Afficher bouton Commander</label>
        </div>
      </div>
    )

    if (type === 'categories_slide') return (
      <div className="space-y-4">
        <p className="text-xs text-gray-400 font-inter">Les boutons apparaissent en slide horizontal sous le Hero</p>
        <div className="space-y-2">
          {(content.items || []).map((item: any, i: number) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex gap-2">
                <input type="text" value={item.icon || ''} placeholder="🔥" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], icon: e.target.value }; updateContent('items', items) }} className="w-14 px-2 py-2 border border-gray-200 rounded-lg font-inter text-center focus:border-[#FF6B00] focus:outline-none" />
                <input type="text" value={item.label || ''} placeholder="Électronique" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], label: e.target.value }; updateContent('items', items) }} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-inter focus:border-[#FF6B00] focus:outline-none" />
                <button onClick={() => { const items = content.items.filter((_: any, j: number) => j !== i); updateContent('items', items) }} className="text-red-400 px-2">×</button>
              </div>
              <input type="text" value={item.slug || ''} placeholder="slug-categorie" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], slug: e.target.value }; updateContent('items', items) }} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-inter text-sm focus:border-[#FF6B00] focus:outline-none" />
            </div>
          ))}
        </div>
        <button onClick={() => updateContent('items', [...(content.items || []), { icon: '', label: '', slug: '' }])} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-inter text-sm hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">+ Ajouter une catégorie</button>
      </div>
    )

    if (type === 'avis_clients') return (
      <div className="space-y-4">
        <div><label className="text-sm font-medium text-gray-700 font-inter block mb-1">Titre section</label><input type="text" value={content.title || ''} onChange={e => updateContent('title', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" /></div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Couleur fond</label>
          <div className="flex gap-3 items-center">
            <input type="color" value={content.bg_color || '#FAFAF8'} onChange={e => updateContent('bg_color', e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-gray-200" />
            <input type="text" value={content.bg_color || '#FAFAF8'} onChange={e => updateContent('bg_color', e.target.value)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-3">Avis clients</label>
          <div className="space-y-3">
            {(content.items || []).map((item: any, i: number) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex gap-2">
                  <input type="text" value={item.name || ''} placeholder="Nom client" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], name: e.target.value }; updateContent('items', items) }} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-inter focus:border-[#FF6B00] focus:outline-none" />
                  <button onClick={() => { const items = content.items.filter((_: any, j: number) => j !== i); updateContent('items', items) }} className="text-red-400 px-2">×</button>
                </div>
                <textarea value={item.text || ''} placeholder="Avis..." onChange={e => { const items = [...content.items]; items[i] = { ...items[i], text: e.target.value }; updateContent('items', items) }} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-inter text-sm focus:border-[#FF6B00] focus:outline-none" rows={2} />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-inter">Note :</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} onClick={() => { const items = [...content.items]; items[i] = { ...items[i], rating: star }; updateContent('items', items) }} className={`text-xl ${star <= (item.rating || 5) ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
                    ))}
                  </div>
                </div>
                <input type="text" value={item.photo || ''} placeholder="URL photo client (optionnel)" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], photo: e.target.value }; updateContent('items', items) }} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-inter text-sm focus:border-[#FF6B00] focus:outline-none" />
              </div>
            ))}
          </div>
          <button onClick={() => updateContent('items', [...(content.items || []), { name: '', text: '', rating: 5, photo: '' }])} className="w-full mt-3 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-inter text-sm hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">+ Ajouter un avis</button>
        </div>
      </div>
    )

    if (type === 'standard_qualite') return (
      <div className="space-y-4">
        <div><label className="text-sm font-medium text-gray-700 font-inter block mb-1">Titre section</label><input type="text" value={content.title || ''} onChange={e => updateContent('title', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" /></div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Couleur fond</label>
          <div className="flex gap-3 items-center">
            <input type="color" value={content.bg_color || '#1a1a2e'} onChange={e => updateContent('bg_color', e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-gray-200" />
            <input type="text" value={content.bg_color || '#1a1a2e'} onChange={e => updateContent('bg_color', e.target.value)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-3">Points qualité</label>
          <div className="space-y-2">
            {(content.items || []).map((item: any, i: number) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex gap-2">
                  <input type="text" value={item.icon || ''} placeholder="🏆" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], icon: e.target.value }; updateContent('items', items) }} className="w-14 px-2 py-2 border border-gray-200 rounded-lg font-inter text-center" />
                  <input type="text" value={item.title || ''} placeholder="Titre" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], title: e.target.value }; updateContent('items', items) }} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-inter" />
                  <button onClick={() => { const items = content.items.filter((_: any, j: number) => j !== i); updateContent('items', items) }} className="text-red-400 px-2">×</button>
                </div>
                <input type="text" value={item.desc || ''} placeholder="Description" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], desc: e.target.value }; updateContent('items', items) }} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-inter text-sm" />
              </div>
            ))}
          </div>
          <button onClick={() => updateContent('items', [...(content.items || []), { icon: '', title: '', desc: '' }])} className="w-full mt-3 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-inter text-sm hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">+ Ajouter un point</button>
        </div>
      </div>
    )

    if (type === 'custom') return (
      <div className="space-y-4">
        <div><label className="text-sm font-medium text-gray-700 font-inter block mb-1">Titre</label><input type="text" value={content.title || ''} onChange={e => updateContent('title', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" /></div>
        <div><label className="text-sm font-medium text-gray-700 font-inter block mb-1">Texte</label><textarea value={content.text || ''} onChange={e => updateContent('text', e.target.value)} rows={4} className="w-full px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" /></div>
        <div><label className="text-sm font-medium text-gray-700 font-inter block mb-1">Image URL</label><input type="text" value={content.image_url || ''} onChange={e => updateContent('image_url', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" placeholder="https://..." /></div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Alignement</label>
          <select value={content.align || 'center'} onChange={e => updateContent('align', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none">
            <option value="left">Gauche</option>
            <option value="center">Centre</option>
            <option value="right">Droite</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Taille police</label>
          <select value={content.font_size || '16px'} onChange={e => updateContent('font_size', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none">
            <option value="14px">Petite (14px)</option>
            <option value="16px">Normale (16px)</option>
            <option value="20px">Grande (20px)</option>
            <option value="28px">Très grande (28px)</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Couleur fond</label>
          <div className="flex gap-3 items-center">
            <input type="color" value={content.bg_color || '#ffffff'} onChange={e => updateContent('bg_color', e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-gray-200" />
            <input type="text" value={content.bg_color || '#ffffff'} onChange={e => updateContent('bg_color', e.target.value)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Couleur texte</label>
          <div className="flex gap-3 items-center">
            <input type="color" value={content.text_color || '#333333'} onChange={e => updateContent('text_color', e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-gray-200" />
            <input type="text" value={content.text_color || '#333333'} onChange={e => updateContent('text_color', e.target.value)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Bouton CTA (optionnel)</label>
          <input type="text" value={content.cta_text || ''} onChange={e => updateContent('cta_text', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none mb-2" placeholder="Texte du bouton" />
          <input type="text" value={content.cta_link || ''} onChange={e => updateContent('cta_link', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" placeholder="Lien du bouton" />
        </div>
      </div>
    )

    if (type === 'newsletter') return (
      <div className="space-y-4">
        <div><label className="text-sm font-medium text-gray-700 font-inter block mb-1">Titre</label><input type="text" value={content.title || ''} onChange={e => updateContent('title', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" /></div>
        <div><label className="text-sm font-medium text-gray-700 font-inter block mb-1">Sous-titre</label><input type="text" value={content.subtitle || ''} onChange={e => updateContent('subtitle', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" /></div>
      </div>
    )

    return <p className="text-gray-400 font-inter text-sm">Pas d'éditeur pour ce type de section.</p>
  }

  // ── VUE ÉDITEUR (mobile : remplace la liste) ──
  if (editingSection) {
    const info = sectionLabels[editingSection.type] || { label: editingSection.type, icon: '📄' }
    return (
      <div className="max-w-4xl mx-auto">
        {/* Bouton retour */}
        <button
          onClick={() => setEditingSection(null)}
          className="flex items-center gap-2 mb-5 text-[#FF6B00] font-inter font-semibold text-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Retour aux sections
        </button>

        {/* Header section */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">{info.icon}</span>
          <div>
            <h1 className="text-xl font-bold text-charcoal font-poppins">{info.label}</h1>
            <p className="text-xs text-gray-400 font-inter">Position {editingSection.position}</p>
          </div>
          {/* Toggle visible/caché */}
          <button
            onClick={() => {
              toggleSection(editingSection.id, editingSection.is_active)
              setEditingSection({ ...editingSection, is_active: !editingSection.is_active })
            }}
            className={`ml-auto px-3 py-1 rounded-full text-xs font-inter font-medium transition-colors ${editingSection.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
          >
            {editingSection.is_active ? 'Visible' : 'Caché'}
          </button>
        </div>

        {/* Éditeur */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {renderEditor(editingSection)}
          <button
            onClick={saveContent}
            disabled={saving}
            className="w-full mt-6 bg-[#FF6B00] text-white font-inter font-bold py-3 rounded-full hover:bg-[#e55f00] transition-colors disabled:opacity-50"
          >
            {saving ? 'Sauvegarde...' : saved ? '✅ Sauvegardé !' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    )
  }

  // ── VUE LISTE (vue par défaut) ──
  return (
    <div className="max-w-4xl mx-auto">
      {/* Bouton retour vers Réglages */}
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 mb-5 text-[#FF6B00] font-inter font-semibold text-sm"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15,18 9,12 15,6" />
        </svg>
        Retour aux réglages
      </button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal font-poppins">Page d'accueil</h1>
        <p className="text-gray-600 font-inter mt-1">Gérez les sections de votre page d'accueil</p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00] mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section) => {
            const info = sectionLabels[section.type] || { label: section.type, icon: '📄' }
            return (
              <div
                key={section.id}
                className="bg-white rounded-2xl p-4 shadow-sm border-2 border-transparent cursor-pointer hover:border-[#FF6B00] transition-all"
                onClick={() => setEditingSection(section)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{info.icon}</span>
                    <div>
                      <p className="font-inter font-medium text-charcoal text-sm">{info.label}</p>
                      <p className="font-inter text-xs text-gray-400">Position {section.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); moveSection(section.id, 'up') }} className="p-1 text-gray-400 hover:text-gray-600">↑</button>
                    <button onClick={e => { e.stopPropagation(); moveSection(section.id, 'down') }} className="p-1 text-gray-400 hover:text-gray-600">↓</button>
                    {section.type === 'custom' && (
                      <button onClick={e => { e.stopPropagation(); deleteSection(section.id) }} className="text-red-400 hover:text-red-600 text-sm px-1">🗑️</button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); toggleSection(section.id, section.is_active) }}
                      className={`px-3 py-1 rounded-full text-xs font-inter font-medium transition-colors ${section.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {section.is_active ? 'Visible' : 'Caché'}
                    </button>
                    {/* Flèche indicatrice */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="9,18 15,12 9,6" />
                    </svg>
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