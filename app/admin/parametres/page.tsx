'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Settings = Record<string, string>

const HERO_TYPES = [
  { id: 'color', label: '🎨 Couleur unie', desc: 'Fond coloré simple' },
  { id: 'image', label: '🖼️ Image',        desc: 'Photo de fond' },
  { id: 'video', label: '🎬 Vidéo',        desc: 'Vidéo en boucle' },
  { id: 'gif',   label: '✨ GIF',          desc: 'Animation GIF' },
]

const COLOR_PRESETS = [
  '#FF2D55', '#FF6B00', '#007AFF', '#34C759', '#9333EA', '#0D0D0D', '#1A1A2E', '#E11D48'
]

function Toast({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#0D0D0D', color: '#fff', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 700, zIndex: 999, whiteSpace: 'nowrap' }}>
      {msg}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F2F2F7' }}>{title}</div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, borderRadius: 10, border: '1.5px solid #E5E5EA',
  padding: '0 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  background: '#FAFAFA', boxSizing: 'border-box'
}

function UploadButton({ label, accept, folder, currentUrl, onUploaded, accent }: {
  label: string; accept: string; folder: string; currentUrl: string
  onUploaded: (url: string) => void; accent: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${folder}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('colioo-assets').upload(path, file, { upsert: true })
    if (error) { alert('Erreur upload : ' + error.message); setUploading(false); return }
    const { data } = supabase.storage.from('colioo-assets').getPublicUrl(path)
    onUploaded(data.publicUrl)
    setUploading(false)
  }

  return (
    <div>
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {currentUrl && (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {accept.includes('video') ? (
              <video src={currentUrl} style={{ height: 60, borderRadius: 8, border: '1px solid #E5E5EA', objectFit: 'cover' }} />
            ) : (
              <img src={currentUrl} alt="" style={{ height: 60, borderRadius: 8, border: '1px solid #E5E5EA', objectFit: 'cover', maxWidth: 120 }} />
            )}
            <button
              onClick={() => onUploaded('')}
              style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#FF3B30', color: '#fff', border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, lineHeight: 1 }}
            >✕</button>
          </div>
        )}
        <button onClick={() => ref.current?.click()} disabled={uploading} style={{ height: 42, padding: '0 16px', borderRadius: 10, background: uploading ? '#F2F2F7' : accent + '15', border: `1.5px solid ${accent}44`, color: accent, fontSize: 13, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
          {uploading ? '⏳ Upload…' : `📁 ${label}`}
        </button>
      </div>
      {currentUrl && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#AEAEB2', wordBreak: 'break-all' }}>{currentUrl.split('/').pop()}</div>
      )}
    </div>
  )
}

export default function ParametresPage() {
  const router = useRouter()
  const [s, setS] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [tab, setTab] = useState<'identite' | 'hero' | 'design'>('identite')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('settings').select('key, value')
      if (data) {
        const map: Settings = {}
        for (const row of data as { key: string; value: unknown }[]) {
          const raw = row.value
          if (typeof raw === 'string') map[row.key] = raw.replace(/^"|"$/g, '')
          else map[row.key] = JSON.stringify(raw)
        }
        setS(map)
      }
      setLoading(false)
    }
    load()
  }, [])

  const set = (key: string, value: string) => setS(prev => ({ ...prev, [key]: value }))

  const save = async () => {
    setSaving(true)
    for (const [key, value] of Object.entries(s)) {
      await supabase.from('settings').upsert({ key, value: JSON.stringify(value) })
    }
    setSaving(false)
    showToast('✅ Réglages enregistrés !')
  }

  const accent = s.primary_color || '#FF2D55'

  const tabs = [
    { id: 'identite', label: '🏷️ Identité' },
    { id: 'hero',     label: '🖼️ Hero' },
    { id: 'design',   label: '🎨 Design' },
  ] as const

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#AEAEB2', fontFamily: 'system-ui' }}>
      Chargement…
    </div>
  )

  return (
    <>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F2F2F7; } input, textarea, select { font-family: inherit; }`}</style>
      <Toast msg={toast} />

      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 40 }}>

        <div style={{ background: '#fff', borderBottom: '1px solid #E5E5EA', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 40 }}>
          <button onClick={() => router.push('/admin')} style={{ width: 34, height: 34, borderRadius: '50%', background: '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900 }}>Paramètres du site</div>
            <div style={{ fontSize: 11, color: '#AEAEB2' }}>Design system & identité</div>
          </div>
          <button onClick={save} disabled={saving} style={{ height: 36, padding: '0 18px', borderRadius: 12, background: `linear-gradient(135deg,${accent},${accent}cc)`, border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? .7 : 1 }}>
            {saving ? 'Enreg…' : 'Enregistrer'}
          </button>
        </div>

        <div style={{ background: s.dark_color || '#1A1A2E', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {s.logo_url
            ? <img src={s.logo_url} alt="logo" style={{ height: 28, objectFit: 'contain' }} />
            : <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: 1 }}>{s.site_name || 'COLIOO'}</div>
          }
          <div style={{ fontSize: 10, color: accent, fontWeight: 700 }}>{s.site_tagline || 'MODE PREMIUM · COD'}</div>
          <div style={{ marginLeft: 'auto', width: 24, height: 24, borderRadius: '50%', background: accent }} />
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '12px 12px 0' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, height: 36, borderRadius: 10, border: 'none', background: tab === t.id ? accent : '#fff', color: tab === t.id ? '#fff' : '#6B6B6B', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '12px 12px 0' }}>

          {tab === 'identite' && (
            <>
              <Section title="🏷️ Identité de la marque">
                <Field label="Nom du site">
                  <input style={inputStyle} value={s.site_name || ''} onChange={e => set('site_name', e.target.value)} placeholder="COLIOO" />
                </Field>
                <Field label="Slogan (sous le logo)">
                  <input style={inputStyle} value={s.site_tagline || ''} onChange={e => set('site_tagline', e.target.value)} placeholder="MODE PREMIUM · COD" />
                </Field>
                <Field label="Logo du site">
                  <UploadButton label="Uploader le logo" accept="image/*" folder="logo" currentUrl={s.logo_url || ''} onUploaded={url => set('logo_url', url)} accent={accent} />
                </Field>
                <Field label="Favicon (icône onglet navigateur)">
                  <UploadButton label="Uploader le favicon" accept="image/*" folder="favicon" currentUrl={s.favicon_url || ''} onUploaded={url => set('favicon_url', url)} accent={accent} />
                </Field>
                <Field label="Numéro WhatsApp (avec indicatif)">
                  <input style={inputStyle} value={s.whatsapp || ''} onChange={e => set('whatsapp', e.target.value)} placeholder="2250700000000" />
                </Field>
              </Section>
            </>
          )}

          {tab === 'hero' && (
            <>
              <Section title="🖼️ Type de fond du Hero">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {HERO_TYPES.map(t => (
                    <button key={t.id} onClick={() => set('hero_type', t.id)} style={{ padding: '12px', borderRadius: 12, border: s.hero_type === t.id ? `2px solid ${accent}` : '1.5px solid #E5E5EA', background: s.hero_type === t.id ? accent + '10' : '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all .2s' }}>
                      <div style={{ fontSize: 15, marginBottom: 4 }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: '#AEAEB2' }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </Section>

              {s.hero_type === 'color' && (
                <Section title="🎨 Couleur de fond">
                  <Field label="Couleur hex">
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="color" value={s.hero_bg_color || '#1A1A2E'} onChange={e => set('hero_bg_color', e.target.value)} style={{ width: 42, height: 42, borderRadius: 10, border: '1.5px solid #E5E5EA', cursor: 'pointer', padding: 2 }} />
                      <input style={{ ...inputStyle, flex: 1 }} value={s.hero_bg_color || ''} onChange={e => set('hero_bg_color', e.target.value)} placeholder="#1A1A2E" />
                    </div>
                  </Field>
                </Section>
              )}

              {s.hero_type === 'image' && (
                <Section title="🖼️ Image de fond">
                  <Field label="Upload une image">
                    <UploadButton label="Uploader l'image" accept="image/*" folder="hero" currentUrl={s.hero_bg_url || ''} onUploaded={url => set('hero_bg_url', url)} accent={accent} />
                  </Field>
                  {s.hero_bg_url && (
                    <Field label={`Opacité du filtre sombre — ${s.hero_overlay || '0.5'}`}>
                      <input type="range" min="0" max="1" step="0.05" value={s.hero_overlay || '0.5'} onChange={e => set('hero_overlay', e.target.value)} style={{ width: '100%' }} />
                    </Field>
                  )}
                </Section>
              )}

              {s.hero_type === 'video' && (
                <Section title="🎬 Vidéo de fond">
                  <Field label="Upload une vidéo (MP4 recommandé)">
                    <UploadButton label="Uploader la vidéo" accept="video/*" folder="hero" currentUrl={s.hero_bg_url || ''} onUploaded={url => set('hero_bg_url', url)} accent={accent} />
                  </Field>
                  {s.hero_bg_url && (
                    <Field label={`Opacité du filtre sombre — ${s.hero_overlay || '0.5'}`}>
                      <input type="range" min="0" max="1" step="0.05" value={s.hero_overlay || '0.5'} onChange={e => set('hero_overlay', e.target.value)} style={{ width: '100%' }} />
                    </Field>
                  )}
                </Section>
              )}

              {s.hero_type === 'gif' && (
                <Section title="✨ GIF de fond">
                  <Field label="Upload un GIF">
                    <UploadButton label="Uploader le GIF" accept="image/gif" folder="hero" currentUrl={s.hero_bg_url || ''} onUploaded={url => set('hero_bg_url', url)} accent={accent} />
                  </Field>
                  {s.hero_bg_url && (
                    <Field label={`Opacité du filtre sombre — ${s.hero_overlay || '0.5'}`}>
                      <input type="range" min="0" max="1" step="0.05" value={s.hero_overlay || '0.5'} onChange={e => set('hero_overlay', e.target.value)} style={{ width: '100%' }} />
                    </Field>
                  )}
                </Section>
              )}

              <Section title="✏️ Textes du Hero">
                <Field label="Badge">
                  <input style={inputStyle} value={s.hero_badge || ''} onChange={e => set('hero_badge', e.target.value)} placeholder="🔥 Nouvelle Collection 2026" />
                </Field>
                <Field label="Titre principal (↵ pour saut de ligne)">
                  <textarea value={s.hero_title || ''} onChange={e => set('hero_title', e.target.value)} rows={3} style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'none', lineHeight: 1.5 }} />
                </Field>
                <Field label="Texte du bouton CTA">
                  <input style={inputStyle} value={s.hero_cta_text || ''} onChange={e => set('hero_cta_text', e.target.value)} placeholder="Commander Maintenant" />
                </Field>
                <Field label="Lien du bouton CTA">
                  <input style={inputStyle} value={s.hero_cta_url || ''} onChange={e => set('hero_cta_url', e.target.value)} placeholder="/catalogue" />
                </Field>
                <Field label="Couleur du texte">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={s.hero_text_color || '#FFFFFF'} onChange={e => set('hero_text_color', e.target.value)} style={{ width: 42, height: 42, borderRadius: 10, border: '1.5px solid #E5E5EA', cursor: 'pointer', padding: 2 }} />
                    <input style={{ ...inputStyle, flex: 1 }} value={s.hero_text_color || ''} onChange={e => set('hero_text_color', e.target.value)} placeholder="#FFFFFF" />
                  </div>
                </Field>
              </Section>
            </>
          )}

          {tab === 'design' && (
            <>
              <Section title="🎨 Couleur principale">
                <Field label="Couleur primaire (boutons, accents)">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {COLOR_PRESETS.map(c => (
                      <button key={c} onClick={() => set('primary_color', c)} style={{ width: 34, height: 34, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: s.primary_color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 3, transition: 'outline .2s', boxShadow: '0 2px 8px rgba(0,0,0,.2)' }} />
                    ))}
                    <input type="color" value={s.primary_color || '#FF2D55'} onChange={e => set('primary_color', e.target.value)} style={{ width: 34, height: 34, borderRadius: '50%', border: '2px dashed #E5E5EA', cursor: 'pointer', padding: 2 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: accent }} />
                    <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#6B6B6B' }}>{accent}</span>
                  </div>
                </Field>
              </Section>

              <Section title="🌗 Couleurs de fond">
                <Field label="Fond général du site">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={s.bg_color || '#F2F2F7'} onChange={e => set('bg_color', e.target.value)} style={{ width: 42, height: 42, borderRadius: 10, border: '1.5px solid #E5E5EA', cursor: 'pointer', padding: 2 }} />
                    <input style={{ ...inputStyle, flex: 1 }} value={s.bg_color || ''} onChange={e => set('bg_color', e.target.value)} placeholder="#F2F2F7" />
                  </div>
                </Field>
                <Field label="Couleur sombre (sections dark)">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={s.dark_color || '#1A1A2E'} onChange={e => set('dark_color', e.target.value)} style={{ width: 42, height: 42, borderRadius: 10, border: '1.5px solid #E5E5EA', cursor: 'pointer', padding: 2 }} />
                    <input style={{ ...inputStyle, flex: 1 }} value={s.dark_color || ''} onChange={e => set('dark_color', e.target.value)} placeholder="#1A1A2E" />
                  </div>
                </Field>
              </Section>

              <Section title="⭕ Bordures & Rayons">
                <Field label={`Cards & sections — ${s.border_radius || '16px'}`}>
                  <input type="range" min="0" max="32" step="2" value={parseInt(s.border_radius || '16')} onChange={e => set('border_radius', e.target.value + 'px')} style={{ width: '100%' }} />
                  <div style={{ display: 'flex', marginTop: 8 }}>
                    <div style={{ width: 60, height: 40, background: accent + '22', border: `2px solid ${accent}`, borderRadius: s.border_radius || '16px' }} />
                  </div>
                </Field>
                <Field label={`Boutons — ${s.border_radius_btn || '50px'}`}>
                  <input type="range" min="0" max="50" step="2" value={parseInt(s.border_radius_btn || '50')} onChange={e => set('border_radius_btn', e.target.value + 'px')} style={{ width: '100%' }} />
                  <div style={{ display: 'flex', marginTop: 8 }}>
                    <div style={{ height: 36, padding: '0 20px', background: accent, borderRadius: s.border_radius_btn || '50px', display: 'flex', alignItems: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>Commander</div>
                  </div>
                </Field>
              </Section>

              <Section title="🔤 Polices">
                <Field label="Police des titres">
                  <select value={s.font_heading || 'Poppins'} onChange={e => set('font_heading', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {['Poppins', 'Inter', 'Montserrat', 'Raleway', 'Nunito', 'DM Sans', 'Outfit'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="Police du corps de texte">
                  <select value={s.font_body || 'Inter'} onChange={e => set('font_body', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {['Inter', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'DM Sans', 'Outfit'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
              </Section>
            </>
          )}

          <button onClick={save} disabled={saving} style={{ width: '100%', height: 50, borderRadius: 16, background: `linear-gradient(135deg,${accent},${accent}cc)`, border: 'none', color: '#fff', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4, opacity: saving ? .7 : 1 }}>
            {saving ? 'Enregistrement…' : '✅ Enregistrer tous les réglages'}
          </button>
        </div>
      </div>
    </>
  )
}