'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface HomeSection {
  id: string
  type: string
  position: number
  is_active: boolean
  content: any
}

const accent = '#FF6B00'

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

const inputS: React.CSSProperties = {
  width: '100%', height: 44, borderRadius: 12, border: '1.5px solid #E5E5EA',
  padding: '0 12px', fontSize: 16, fontFamily: 'inherit', outline: 'none',
  background: '#FAFAFA', boxSizing: 'border-box',
}
const labelS: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#6B6B6B', marginBottom: 6, display: 'block' }
const rowS: React.CSSProperties = { marginBottom: 14 }

export default function AccueilAdmin() {
  const router = useRouter()
  const [sections, setSections] = useState<HomeSection[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingSlide, setUploadingSlide] = useState(false)
  const [toast, setToast] = useState('')
  const slideInputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  useEffect(() => { loadSections() }, [])

  const loadSections = async () => {
    const { data } = await supabase.from('home_sections').select('*').order('position')
    if (data) setSections(data)
    setLoading(false)
  }

  const toggleSection = async (id: string, is_active: boolean) => {
    await supabase.from('home_sections').update({ is_active: !is_active }).eq('id', id)
    setSections(prev => prev.map(s => s.id === id ? { ...s, is_active: !is_active } : s))
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
    showToast('✅ Section sauvegardée !')
    setTimeout(() => setSaved(false), 2000)
    loadSections()
  }

  const addCustomSection = async () => {
    const maxPosition = Math.max(...sections.map(s => s.position), 0)
    await supabase.from('home_sections').insert({
      type: 'custom', position: maxPosition + 1, is_active: true,
      content: { title: 'Nouvelle section', text: '', bg_color: '#ffffff', text_color: '#333333', font_size: '16px', padding: '40px', align: 'center', image_url: '', cta_text: '', cta_link: '', cta_color: accent }
    })
    loadSections()
    showToast('✅ Section ajoutée !')
  }

  const deleteSection = async (id: string) => {
    if (!confirm('Supprimer cette section ?')) return
    await supabase.from('home_sections').delete().eq('id', id)
    loadSections()
    if (editingSection?.id === id) setEditingSection(null)
    showToast('🗑️ Section supprimée')
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
    const slides = [...(editingSection.content.slides || []), { type: isVideo ? 'video' : 'image', url: publicUrl }]
    updateContent('slides', slides)
    setUploadingSlide(false)
  }

  const removeSlide = async (index: number) => {
    if (!editingSection) return
    const newSlides = editingSection.content.slides.filter((_: any, i: number) => i !== index)
    const newSection = { ...editingSection, content: { ...editingSection.content, slides: newSlides } }
    setEditingSection(newSection)
    await supabase.from('home_sections').update({ content: newSection.content }).eq('id', editingSection.id)
    showToast('🗑️ Slide supprimé !')
  }

  const renderEditor = (section: HomeSection) => {
    const { type, content } = section

    if (type === 'hero') return (
      <div>
        <div style={rowS}>
          <label style={labelS}>🖼️ Slides (images/vidéos/gifs)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            {(content.slides || []).map((slide: any, i: number) => (
              <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '16/9', background: '#F2F2F7' }}>
                {slide.type === 'video'
                  ? <video src={slide.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                  : <img src={slide.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                <button onClick={() => removeSlide(i)} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: '#FF3B30', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>✕</button>
                <span style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>{slide.type}</span>
              </div>
            ))}
          </div>
          <input ref={slideInputRef} type="file" accept="image/*,video/*" onChange={handleSlideUpload} style={{ display: 'none' }} />
          <button onClick={() => slideInputRef.current?.click()} disabled={uploadingSlide} style={{ width: '100%', height: 44, border: '2px dashed #E5E5EA', borderRadius: 12, background: 'none', color: '#AEAEB2', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {uploadingSlide ? '⏳ Upload…' : '+ Ajouter image / vidéo / gif'}
          </button>
          <div style={{ fontSize: 11, color: '#AEAEB2', marginTop: 4 }}>Si aucun slide → fond coloré uni</div>
        </div>
        <div style={rowS}>
          <label style={labelS}>⚡ Vitesse du slide : {(content.slide_speed || 4000) / 1000}s</label>
          <input type="range" min="1000" max="10000" step="500" value={content.slide_speed || 4000} onChange={e => updateContent('slide_speed', parseInt(e.target.value))} style={{ width: '100%', accentColor: accent }} />
        </div>
        <div style={rowS}>
          <label style={labelS}>📐 Hauteur du Hero</label>
          <select value={content.slide_height || '500px'} onChange={e => updateContent('slide_height', e.target.value)} style={{ ...inputS, cursor: 'pointer' }}>
            <option value="350px">Petite (350px)</option>
            <option value="500px">Normale (500px)</option>
            <option value="600px">Grande (600px)</option>
            <option value="700px">Très grande (700px)</option>
            <option value="100vh">Plein écran</option>
          </select>
        </div>
        {(content.slides || []).length > 0 && (
          <div style={rowS}>
            <label style={labelS}>🌑 Opacité overlay : {Math.round((content.overlay_opacity ?? 0.5) * 100)}%</label>
            <input type="range" min="0" max="1" step="0.05" value={content.overlay_opacity ?? 0.5} onChange={e => updateContent('overlay_opacity', parseFloat(e.target.value))} style={{ width: '100%', accentColor: accent }} />
          </div>
        )}
        <div style={rowS}><label style={labelS}>Titre</label><input style={inputS} type="text" value={content.title || ''} onChange={e => updateContent('title', e.target.value)} /></div>
        <div style={rowS}>
          <label style={labelS}>Couleur titre</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="color" value={content.text_color || '#ffffff'} onChange={e => updateContent('text_color', e.target.value)} style={{ width: 44, height: 44, borderRadius: 10, border: '1.5px solid #E5E5EA', cursor: 'pointer', padding: 2 }} />
            <input style={{ ...inputS, flex: 1 }} value={content.text_color || '#ffffff'} onChange={e => updateContent('text_color', e.target.value)} />
          </div>
        </div>
        <div style={rowS}>
          <label style={labelS}>Taille police titre</label>
          <select style={{ ...inputS, cursor: 'pointer' }} value={content.font_size_title || '42px'} onChange={e => updateContent('font_size_title', e.target.value)}>
            <option value="28px">Petite (28px)</option><option value="36px">Normale (36px)</option><option value="42px">Grande (42px)</option><option value="52px">Très grande (52px)</option><option value="64px">Géante (64px)</option>
          </select>
        </div>
        <div style={rowS}><label style={labelS}>Sous-titre</label><input style={inputS} type="text" value={content.subtitle || ''} onChange={e => updateContent('subtitle', e.target.value)} /></div>
        <div style={rowS}><label style={labelS}>Texte bouton CTA</label><input style={inputS} type="text" value={content.cta_text || ''} onChange={e => updateContent('cta_text', e.target.value)} /></div>
        <div style={rowS}><label style={labelS}>Lien bouton CTA</label><input style={inputS} type="text" value={content.cta_link || '/catalogue'} onChange={e => updateContent('cta_link', e.target.value)} /></div>
        <div style={rowS}>
          <label style={labelS}>Couleur fond (si pas de slide)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="color" value={content.bg_color || '#1a1a2e'} onChange={e => updateContent('bg_color', e.target.value)} style={{ width: 44, height: 44, borderRadius: 10, border: '1.5px solid #E5E5EA', cursor: 'pointer', padding: 2 }} />
            <input style={{ ...inputS, flex: 1 }} value={content.bg_color || '#1a1a2e'} onChange={e => updateContent('bg_color', e.target.value)} />
          </div>
        </div>
      </div>
    )

    if (type === 'stats') return (
      <div>
        {(content.items || []).map((item: any, i: number) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input style={{ ...inputS, width: 90 }} type="text" value={item.number} placeholder="500+" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], number: e.target.value }; updateContent('items', items) }} />
            <input style={{ ...inputS, flex: 1 }} type="text" value={item.label} placeholder="Produits" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], label: e.target.value }; updateContent('items', items) }} />
          </div>
        ))}
      </div>
    )

    if (type === 'reassurance') return (
      <div>
        {(content.items || []).map((item: any, i: number) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input style={{ ...inputS, width: 60, textAlign: 'center' }} type="text" value={item.icon} placeholder="✅" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], icon: e.target.value }; updateContent('items', items) }} />
            <input style={{ ...inputS, flex: 1 }} type="text" value={item.label} placeholder="Texte" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], label: e.target.value }; updateContent('items', items) }} />
          </div>
        ))}
      </div>
    )

    if (type === 'banniere') return (
      <div>
        <div style={rowS}><label style={labelS}>Titre</label><input style={inputS} type="text" value={content.title || ''} onChange={e => updateContent('title', e.target.value)} /></div>
        <div style={rowS}><label style={labelS}>Sous-titre</label><input style={inputS} type="text" value={content.subtitle || ''} onChange={e => updateContent('subtitle', e.target.value)} /></div>
        <div style={rowS}><label style={labelS}>Texte bouton</label><input style={inputS} type="text" value={content.cta_text || ''} onChange={e => updateContent('cta_text', e.target.value)} /></div>
        <div style={rowS}>
          <label style={labelS}>Couleur fond</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="color" value={content.bg_color || accent} onChange={e => updateContent('bg_color', e.target.value)} style={{ width: 44, height: 44, borderRadius: 10, border: '1.5px solid #E5E5EA', cursor: 'pointer', padding: 2 }} />
            <input style={{ ...inputS, flex: 1 }} value={content.bg_color || accent} onChange={e => updateContent('bg_color', e.target.value)} />
          </div>
        </div>
      </div>
    )

    if (type === 'temoignages') return (
      <div>
        <div style={rowS}><label style={labelS}>Titre section</label><input style={inputS} type="text" value={content.title || ''} onChange={e => updateContent('title', e.target.value)} /></div>
        {(content.items || []).map((item: any, i: number) => (
          <div key={i} style={{ border: '1px solid #E5E5EA', borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <input style={{ ...inputS, marginBottom: 8 }} type="text" value={item.name} placeholder="Nom client" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], name: e.target.value }; updateContent('items', items) }} />
            <textarea value={item.text} placeholder="Avis..." onChange={e => { const items = [...content.items]; items[i] = { ...items[i], text: e.target.value }; updateContent('items', items) }} style={{ ...inputS, height: 'auto', padding: '10px 12px', resize: 'none' }} rows={2} />
          </div>
        ))}
        <button onClick={() => updateContent('items', [...(content.items || []), { name: '', text: '', rating: 5 }])} style={{ fontSize: 13, color: accent, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>+ Ajouter un témoignage</button>
      </div>
    )

    if (type === 'mini_banniere') return (
      <div>
        <div style={rowS}>
          <label style={labelS}>Couleur fond</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="color" value={content.bg_color || '#1a1a2e'} onChange={e => updateContent('bg_color', e.target.value)} style={{ width: 44, height: 44, borderRadius: 10, border: '1.5px solid #E5E5EA', cursor: 'pointer', padding: 2 }} />
            <input style={{ ...inputS, flex: 1 }} value={content.bg_color || '#1a1a2e'} onChange={e => updateContent('bg_color', e.target.value)} />
          </div>
        </div>
        <div style={rowS}>
          <label style={labelS}>Couleur texte</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="color" value={content.text_color || '#ffffff'} onChange={e => updateContent('text_color', e.target.value)} style={{ width: 44, height: 44, borderRadius: 10, border: '1.5px solid #E5E5EA', cursor: 'pointer', padding: 2 }} />
            <input style={{ ...inputS, flex: 1 }} value={content.text_color || '#ffffff'} onChange={e => updateContent('text_color', e.target.value)} />
          </div>
        </div>
        <div style={rowS}>
          <label style={labelS}>Éléments du bandeau</label>
          {(content.items || []).map((item: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input style={{ ...inputS, width: 56, textAlign: 'center' }} type="text" value={item.icon || ''} placeholder="⚡" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], icon: e.target.value }; updateContent('items', items) }} />
              <input style={{ ...inputS, flex: 1 }} type="text" value={item.text || ''} placeholder="Texte..." onChange={e => { const items = [...content.items]; items[i] = { ...items[i], text: e.target.value }; updateContent('items', items) }} />
              <button onClick={() => updateContent('items', content.items.filter((_: any, j: number) => j !== i))} style={{ width: 36, height: 44, borderRadius: 10, background: '#FFF0F0', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 18, fontWeight: 900, flexShrink: 0 }}>×</button>
            </div>
          ))}
          <button onClick={() => updateContent('items', [...(content.items || []), { icon: '', text: '' }])} style={{ width: '100%', height: 44, border: '2px dashed #E5E5EA', borderRadius: 12, background: 'none', color: '#AEAEB2', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>+ Ajouter un élément</button>
        </div>
      </div>
    )

    if (type === 'produits_horizontal') return (
      <div>
        <div style={rowS}><label style={labelS}>Titre de la section</label><input style={inputS} type="text" value={content.title || ''} onChange={e => updateContent('title', e.target.value)} /></div>
        <div style={rowS}>
          <label style={labelS}>Filtre produits</label>
          <select style={{ ...inputS, cursor: 'pointer' }} value={content.filter || 'all'} onChange={e => updateContent('filter', e.target.value)}>
            <option value="all">Tous les produits</option>
            <option value="promo">Promotions</option>
            <option value="best_seller">Meilleures ventes</option>
            <option value="nouveau">Nouveautés</option>
            <option value="livraison_gratuite">Livraison gratuite</option>
          </select>
        </div>
        <div style={rowS}>
          <label style={labelS}>Nombre de produits : {content.limit || 6}</label>
          <input type="range" min="2" max="12" step="1" value={content.limit || 6} onChange={e => updateContent('limit', parseInt(e.target.value))} style={{ width: '100%', accentColor: accent }} />
        </div>
        <div style={rowS}>
          <label style={labelS}>Couleur fond</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="color" value={content.bg_color || '#FAFAF8'} onChange={e => updateContent('bg_color', e.target.value)} style={{ width: 44, height: 44, borderRadius: 10, border: '1.5px solid #E5E5EA', cursor: 'pointer', padding: 2 }} />
            <input style={{ ...inputS, flex: 1 }} value={content.bg_color || '#FAFAF8'} onChange={e => updateContent('bg_color', e.target.value)} />
          </div>
        </div>
      </div>
    )

    if (type === 'categories_slide') return (
      <div>
        <div style={{ fontSize: 11, color: '#AEAEB2', marginBottom: 12 }}>Les boutons apparaissent en slide horizontal sous le Hero</div>
        {(content.items || []).map((item: any, i: number) => (
          <div key={i} style={{ border: '1px solid #E5E5EA', borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input style={{ ...inputS, width: 56, textAlign: 'center' }} type="text" value={item.icon || ''} placeholder="🔥" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], icon: e.target.value }; updateContent('items', items) }} />
              <input style={{ ...inputS, flex: 1 }} type="text" value={item.label || ''} placeholder="Électronique" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], label: e.target.value }; updateContent('items', items) }} />
              <button onClick={() => updateContent('items', content.items.filter((_: any, j: number) => j !== i))} style={{ width: 36, height: 44, borderRadius: 10, background: '#FFF0F0', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 18, fontWeight: 900, flexShrink: 0 }}>×</button>
            </div>
            <input style={inputS} type="text" value={item.slug || ''} placeholder="slug-categorie" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], slug: e.target.value }; updateContent('items', items) }} />
          </div>
        ))}
        <button onClick={() => updateContent('items', [...(content.items || []), { icon: '', label: '', slug: '' }])} style={{ width: '100%', height: 44, border: '2px dashed #E5E5EA', borderRadius: 12, background: 'none', color: '#AEAEB2', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Ajouter une catégorie</button>
      </div>
    )

    if (type === 'avis_clients') return (
      <div>
        <div style={rowS}><label style={labelS}>Titre section</label><input style={inputS} type="text" value={content.title || ''} onChange={e => updateContent('title', e.target.value)} /></div>
        <div style={rowS}>
          <label style={labelS}>Couleur fond</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="color" value={content.bg_color || '#FAFAF8'} onChange={e => updateContent('bg_color', e.target.value)} style={{ width: 44, height: 44, borderRadius: 10, border: '1.5px solid #E5E5EA', cursor: 'pointer', padding: 2 }} />
            <input style={{ ...inputS, flex: 1 }} value={content.bg_color || '#FAFAF8'} onChange={e => updateContent('bg_color', e.target.value)} />
          </div>
        </div>
        <div style={rowS}>
          <label style={labelS}>Avis clients</label>
          {(content.items || []).map((item: any, i: number) => (
            <div key={i} style={{ border: '1px solid #E5E5EA', borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input style={{ ...inputS, flex: 1 }} type="text" value={item.name || ''} placeholder="Nom client" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], name: e.target.value }; updateContent('items', items) }} />
                <button onClick={() => updateContent('items', content.items.filter((_: any, j: number) => j !== i))} style={{ width: 36, height: 44, borderRadius: 10, background: '#FFF0F0', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 18, fontWeight: 900, flexShrink: 0 }}>×</button>
              </div>
              <textarea value={item.text || ''} placeholder="Avis..." onChange={e => { const items = [...content.items]; items[i] = { ...items[i], text: e.target.value }; updateContent('items', items) }} style={{ ...inputS, height: 'auto', padding: '10px 12px', resize: 'none', marginBottom: 8 }} rows={2} />
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {[1,2,3,4,5].map(star => (
                  <button key={star} onClick={() => { const items = [...content.items]; items[i] = { ...items[i], rating: star }; updateContent('items', items) }} style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: star <= (item.rating || 5) ? '#FF9500' : '#E5E5EA' }}>★</button>
                ))}
              </div>
              <input style={inputS} type="text" value={item.photo || ''} placeholder="URL photo client (optionnel)" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], photo: e.target.value }; updateContent('items', items) }} />
            </div>
          ))}
          <button onClick={() => updateContent('items', [...(content.items || []), { name: '', text: '', rating: 5, photo: '' }])} style={{ width: '100%', height: 44, border: '2px dashed #E5E5EA', borderRadius: 12, background: 'none', color: '#AEAEB2', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Ajouter un avis</button>
        </div>
      </div>
    )

    if (type === 'standard_qualite') return (
      <div>
        <div style={rowS}><label style={labelS}>Titre section</label><input style={inputS} type="text" value={content.title || ''} onChange={e => updateContent('title', e.target.value)} /></div>
        <div style={rowS}>
          <label style={labelS}>Couleur fond</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="color" value={content.bg_color || '#1a1a2e'} onChange={e => updateContent('bg_color', e.target.value)} style={{ width: 44, height: 44, borderRadius: 10, border: '1.5px solid #E5E5EA', cursor: 'pointer', padding: 2 }} />
            <input style={{ ...inputS, flex: 1 }} value={content.bg_color || '#1a1a2e'} onChange={e => updateContent('bg_color', e.target.value)} />
          </div>
        </div>
        <div style={rowS}>
          <label style={labelS}>Points qualité</label>
          {(content.items || []).map((item: any, i: number) => (
            <div key={i} style={{ border: '1px solid #E5E5EA', borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input style={{ ...inputS, width: 56, textAlign: 'center' }} type="text" value={item.icon || ''} placeholder="🏆" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], icon: e.target.value }; updateContent('items', items) }} />
                <input style={{ ...inputS, flex: 1 }} type="text" value={item.title || ''} placeholder="Titre" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], title: e.target.value }; updateContent('items', items) }} />
                <button onClick={() => updateContent('items', content.items.filter((_: any, j: number) => j !== i))} style={{ width: 36, height: 44, borderRadius: 10, background: '#FFF0F0', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 18, fontWeight: 900, flexShrink: 0 }}>×</button>
              </div>
              <input style={inputS} type="text" value={item.desc || ''} placeholder="Description" onChange={e => { const items = [...content.items]; items[i] = { ...items[i], desc: e.target.value }; updateContent('items', items) }} />
            </div>
          ))}
          <button onClick={() => updateContent('items', [...(content.items || []), { icon: '', title: '', desc: '' }])} style={{ width: '100%', height: 44, border: '2px dashed #E5E5EA', borderRadius: 12, background: 'none', color: '#AEAEB2', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Ajouter un point</button>
        </div>
      </div>
    )

    if (type === 'custom') return (
      <div>
        <div style={rowS}><label style={labelS}>Titre</label><input style={inputS} type="text" value={content.title || ''} onChange={e => updateContent('title', e.target.value)} /></div>
        <div style={rowS}><label style={labelS}>Texte</label><textarea value={content.text || ''} onChange={e => updateContent('text', e.target.value)} rows={4} style={{ ...inputS, height: 'auto', padding: '10px 12px', resize: 'none' }} /></div>
        <div style={rowS}><label style={labelS}>Image URL</label><input style={inputS} type="text" value={content.image_url || ''} onChange={e => updateContent('image_url', e.target.value)} placeholder="https://..." /></div>
        <div style={rowS}>
          <label style={labelS}>Alignement</label>
          <select style={{ ...inputS, cursor: 'pointer' }} value={content.align || 'center'} onChange={e => updateContent('align', e.target.value)}>
            <option value="left">Gauche</option><option value="center">Centre</option><option value="right">Droite</option>
          </select>
        </div>
        <div style={rowS}>
          <label style={labelS}>Couleur fond</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="color" value={content.bg_color || '#ffffff'} onChange={e => updateContent('bg_color', e.target.value)} style={{ width: 44, height: 44, borderRadius: 10, border: '1.5px solid #E5E5EA', cursor: 'pointer', padding: 2 }} />
            <input style={{ ...inputS, flex: 1 }} value={content.bg_color || '#ffffff'} onChange={e => updateContent('bg_color', e.target.value)} />
          </div>
        </div>
        <div style={rowS}>
          <label style={labelS}>Couleur texte</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="color" value={content.text_color || '#333333'} onChange={e => updateContent('text_color', e.target.value)} style={{ width: 44, height: 44, borderRadius: 10, border: '1.5px solid #E5E5EA', cursor: 'pointer', padding: 2 }} />
            <input style={{ ...inputS, flex: 1 }} value={content.text_color || '#333333'} onChange={e => updateContent('text_color', e.target.value)} />
          </div>
        </div>
        <div style={rowS}><label style={labelS}>Texte bouton CTA</label><input style={inputS} type="text" value={content.cta_text || ''} onChange={e => updateContent('cta_text', e.target.value)} placeholder="Texte du bouton" /></div>
        <div style={rowS}><label style={labelS}>Lien bouton CTA</label><input style={inputS} type="text" value={content.cta_link || ''} onChange={e => updateContent('cta_link', e.target.value)} placeholder="Lien du bouton" /></div>
      </div>
    )

    if (type === 'newsletter') return (
      <div>
        <div style={rowS}><label style={labelS}>Titre</label><input style={inputS} type="text" value={content.title || ''} onChange={e => updateContent('title', e.target.value)} /></div>
        <div style={rowS}><label style={labelS}>Sous-titre</label><input style={inputS} type="text" value={content.subtitle || ''} onChange={e => updateContent('subtitle', e.target.value)} /></div>
      </div>
    )

    return <div style={{ color: '#AEAEB2', fontSize: 13 }}>Pas d'éditeur pour ce type de section.</div>
  }

  // ── VUE ÉDITEUR ──
  if (editingSection) {
    const info = sectionLabels[editingSection.type] || { label: editingSection.type, icon: '📄' }
    return (
      <>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }`}</style>
        {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#0D0D0D', color: '#fff', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 700, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>}

        <div style={{ maxWidth: 480, margin: '0 auto', background: '#F2F2F7', minHeight: '100dvh', paddingBottom: 32 }}>
          <div style={{ background: '#fff', borderBottom: '1px solid #E5E5EA', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 40 }}>
            <button onClick={() => setEditingSection(null)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
            </button>
            <span style={{ fontSize: 20 }}>{info.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 900 }}>{info.label}</div>
              <div style={{ fontSize: 11, color: '#AEAEB2' }}>Position {editingSection.position}</div>
            </div>
            <button onClick={() => { toggleSection(editingSection.id, editingSection.is_active); setEditingSection({ ...editingSection, is_active: !editingSection.is_active }) }}
              style={{ height: 28, padding: '0 12px', borderRadius: 20, border: 'none', background: editingSection.is_active ? '#ECFDF5' : '#F2F2F7', color: editingSection.is_active ? '#059669' : '#AEAEB2', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {editingSection.is_active ? '✓ Visible' : 'Caché'}
            </button>
          </div>

          <div style={{ padding: '12px' }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 14 }}>
              {renderEditor(editingSection)}
            </div>
            <button onClick={saveContent} disabled={saving} style={{ width: '100%', height: 50, borderRadius: 16, background: `linear-gradient(135deg,${accent},${accent}cc)`, border: 'none', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? .7 : 1 }}>
              {saving ? 'Sauvegarde…' : saved ? '✅ Sauvegardé !' : '💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </>
    )
  }

  // ── VUE LISTE ──
  return (
    <>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }`}</style>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#0D0D0D', color: '#fff', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 700, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>}

      <div style={{ maxWidth: 480, margin: '0 auto', background: '#F2F2F7', minHeight: '100dvh', paddingBottom: 32 }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #E5E5EA', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 40 }}>
          <button onClick={() => router.push('/admin')} style={{ width: 36, height: 36, borderRadius: '50%', background: '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900 }}>Page d'accueil</div>
            <div style={{ fontSize: 11, color: '#AEAEB2' }}>Gérez les sections</div>
          </div>
          <button onClick={addCustomSection} style={{ height: 36, padding: '0 14px', borderRadius: 12, background: accent, border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>+ Section</button>
        </div>

        <div style={{ padding: '12px 12px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#AEAEB2' }}>Chargement…</div>
          ) : sections.map((section, i) => {
            const info = sectionLabels[section.type] || { label: section.type, icon: '📄' }
            return (
              <div key={section.id} onClick={() => setEditingSection(section)} style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', border: `2px solid ${section.is_active ? 'transparent' : '#E5E5EA'}`, opacity: section.is_active ? 1 : .6 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{info.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0D0D0D' }}>{info.label}</div>
                  <div style={{ fontSize: 11, color: '#AEAEB2', marginTop: 2 }}>Position {section.position}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={e => { e.stopPropagation(); moveSection(section.id, 'up') }} style={{ width: 28, height: 28, borderRadius: 8, background: '#F2F2F7', border: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</button>
                  <button onClick={e => { e.stopPropagation(); moveSection(section.id, 'down') }} style={{ width: 28, height: 28, borderRadius: 8, background: '#F2F2F7', border: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↓</button>
                  <button onClick={e => { e.stopPropagation(); toggleSection(section.id, section.is_active) }} style={{ height: 26, padding: '0 10px', borderRadius: 20, border: 'none', background: section.is_active ? '#ECFDF5' : '#F2F2F7', color: section.is_active ? '#059669' : '#AEAEB2', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    {section.is_active ? '✓' : '×'}
                  </button>
                  {section.type === 'custom' && (
                    <button onClick={e => { e.stopPropagation(); deleteSection(section.id) }} style={{ width: 28, height: 28, borderRadius: 8, background: '#FFF0F0', border: 'none', color: '#FF3B30', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round"><polyline points="3,6 5,6 21,6" /><path d="M19 6l-1 14H6L5 6" /></svg>
                    </button>
                  )}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2.5" strokeLinecap="round"><polyline points="9,18 15,12 9,6" /></svg>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}