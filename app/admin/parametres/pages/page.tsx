'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const accent = '#FF6B00'

const inputS: React.CSSProperties = {
  width: '100%', height: 46, borderRadius: 12, border: '1.5px solid #E5E5EA',
  padding: '0 14px', fontSize: 16, fontFamily: 'inherit', outline: 'none',
  background: '#FAFAFA', boxSizing: 'border-box',
}
const labelS: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#6B6B6B', marginBottom: 6, display: 'block' }
const rowS: React.CSSProperties = { marginBottom: 14 }
const cardS: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: 16, marginBottom: 14 }

export default function PagesAdmin() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'apropos' | 'contact' | 'mentions' | 'footer'>('apropos')
  const [apropos, setApropos] = useState<any>(null)
  const [contact, setContact] = useState<any>(null)
  const [mentions, setMentions] = useState<any>({ contenu: '', societe: '', adresse: '', email: '', telephone: '' })
  const [footer, setFooter] = useState<any>({ slogan: 'La boutique premium pour l\'Afrique', copyright: '© 2026 COLIOO — Tous droits réservés.', liens: [{ label: 'Catalogue', href: '/catalogue' }, { label: 'À propos', href: '/a-propos' }, { label: 'Contact', href: '/contact' }, { label: 'Mentions légales', href: '/mentions-legales' }] })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    const { data } = await supabase.from('settings').select('*')
    if (data) {
      data.forEach((s: any) => {
        if (s.key === 'apropos') setApropos(typeof s.value === 'string' ? JSON.parse(s.value) : s.value)
        if (s.key === 'contact') setContact(typeof s.value === 'string' ? JSON.parse(s.value) : s.value)
        if (s.key === 'mentions') setMentions(typeof s.value === 'string' ? JSON.parse(s.value) : s.value)
        if (s.key === 'footer') setFooter(typeof s.value === 'string' ? JSON.parse(s.value) : s.value)  
      })
    }
  }

  const saveSettings = async (key: string, value: any) => {
    setSaving(true)
    await supabase.from('settings').upsert({ key, value: JSON.stringify(value) })
    setSaving(false)
    showToast('✅ Sauvegardé !')
  }

  const updateValeur = (index: number, field: string, value: string) => {
    if (!apropos) return
    const newValeurs = [...apropos.valeurs]
    newValeurs[index] = { ...newValeurs[index], [field]: value }
    setApropos({ ...apropos, valeurs: newValeurs })
  }

  const updateHoraire = (index: number, field: string, value: string) => {
    if (!contact) return
    const newHoraires = [...contact.horaires]
    newHoraires[index] = { ...newHoraires[index], [field]: value }
    setContact({ ...contact, horaires: newHoraires })
  }

  const tabs = [
    { id: 'apropos', label: '📄 À propos' },
    { id: 'contact', label: '📞 Contact' },
    { id: 'mentions', label: '⚖️ Mentions' },
    { id: 'footer', label: '🦶 Footer' },
  ] as const

  return (
    <>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }`}</style>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#0D0D0D', color: '#fff', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 700, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>}

      <div style={{ maxWidth: 480, margin: '0 auto', background: '#F2F2F7', minHeight: '100dvh', paddingBottom: 32 }}>

        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E5E5EA', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 40 }}>
          <button onClick={() => router.push('/admin')} style={{ width: 36, height: 36, borderRadius: '50%', background: '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900 }}>Pages du site</div>
            <div style={{ fontSize: 11, color: '#AEAEB2' }}>À propos, Contact, Mentions légales</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, background: '#fff', borderBottom: '1px solid #E5E5EA' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, height: 44, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: activeTab === t.id ? accent : '#AEAEB2', borderBottom: activeTab === t.id ? `2.5px solid ${accent}` : '2.5px solid transparent', fontFamily: 'inherit' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '12px 12px 0' }}>

          {/* ── À PROPOS ── */}
          {activeTab === 'apropos' && apropos && (
            <div>
              <div style={cardS}>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F2F2F7' }}>📄 Page À propos</div>
                <div style={rowS}><label style={labelS}>Titre</label><input style={inputS} value={apropos.title || ''} onChange={e => setApropos({ ...apropos, title: e.target.value })} /></div>
                <div style={rowS}><label style={labelS}>Sous-titre</label><input style={inputS} value={apropos.subtitle || ''} onChange={e => setApropos({ ...apropos, subtitle: e.target.value })} /></div>
                <div style={rowS}>
                  <label style={labelS}>Notre histoire</label>
                  <textarea value={apropos.histoire || ''} rows={4} onChange={e => setApropos({ ...apropos, histoire: e.target.value })} style={{ ...inputS, height: 'auto', padding: '12px 14px', resize: 'none', lineHeight: 1.6 }} />
                </div>
                <div style={rowS}>
                  <label style={labelS}>Valeurs</label>
                  {(apropos.valeurs || []).map((val: any, i: number) => (
                    <div key={i} style={{ border: '1px solid #E5E5EA', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input style={{ ...inputS, width: 56, textAlign: 'center' }} value={val.icon || ''} placeholder="✅" onChange={e => updateValeur(i, 'icon', e.target.value)} />
                        <input style={{ ...inputS, flex: 1 }} value={val.title || ''} placeholder="Titre" onChange={e => updateValeur(i, 'title', e.target.value)} />
                      </div>
                      <input style={inputS} value={val.desc || ''} placeholder="Description" onChange={e => updateValeur(i, 'desc', e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => saveSettings('apropos', apropos)} disabled={saving} style={{ width: '100%', height: 50, borderRadius: 16, background: `linear-gradient(135deg,${accent},${accent}cc)`, border: 'none', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? .7 : 1 }}>
                {saving ? 'Sauvegarde…' : '💾 Sauvegarder'}
              </button>
            </div>
          )}

          {/* ── CONTACT ── */}
          {activeTab === 'contact' && contact && (
            <div>
              <div style={cardS}>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F2F2F7' }}>📞 Page Contact</div>
                <div style={rowS}><label style={labelS}>Titre</label><input style={inputS} value={contact.title || ''} onChange={e => setContact({ ...contact, title: e.target.value })} /></div>
                <div style={rowS}><label style={labelS}>Sous-titre</label><input style={inputS} value={contact.subtitle || ''} onChange={e => setContact({ ...contact, subtitle: e.target.value })} /></div>
                <div style={rowS}><label style={labelS}>WhatsApp</label><input style={inputS} value={contact.whatsapp || ''} onChange={e => setContact({ ...contact, whatsapp: e.target.value })} placeholder="2250000000000" /></div>
                <div style={rowS}><label style={labelS}>Email</label><input style={inputS} value={contact.email || ''} onChange={e => setContact({ ...contact, email: e.target.value })} /></div>
                <div style={rowS}>
                  <label style={labelS}>Horaires</label>
                  {(contact.horaires || []).map((h: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input style={{ ...inputS, flex: 1 }} value={h.jour || ''} onChange={e => updateHoraire(i, 'jour', e.target.value)} placeholder="Lundi - Vendredi" />
                      <input style={{ ...inputS, width: 130 }} value={h.heure || ''} onChange={e => updateHoraire(i, 'heure', e.target.value)} placeholder="8h - 18h" />
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => saveSettings('contact', contact)} disabled={saving} style={{ width: '100%', height: 50, borderRadius: 16, background: `linear-gradient(135deg,${accent},${accent}cc)`, border: 'none', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? .7 : 1 }}>
                {saving ? 'Sauvegarde…' : '💾 Sauvegarder'}
              </button>
            </div>
          )}

          {/* ── MENTIONS LÉGALES ── */}
          {activeTab === 'mentions' && (
            <div>
              <div style={cardS}>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F2F2F7' }}>⚖️ Mentions légales</div>
                <div style={rowS}><label style={labelS}>Nom de la société</label><input style={inputS} value={mentions.societe || ''} onChange={e => setMentions({ ...mentions, societe: e.target.value })} placeholder="COLIOO SARL" /></div>
                <div style={rowS}><label style={labelS}>Adresse</label><input style={inputS} value={mentions.adresse || ''} onChange={e => setMentions({ ...mentions, adresse: e.target.value })} placeholder="Abidjan, Côte d'Ivoire" /></div>
                <div style={rowS}><label style={labelS}>Email</label><input style={inputS} value={mentions.email || ''} onChange={e => setMentions({ ...mentions, email: e.target.value })} placeholder="contact@colioo.ci" /></div>
                <div style={rowS}><label style={labelS}>Téléphone</label><input style={inputS} value={mentions.telephone || ''} onChange={e => setMentions({ ...mentions, telephone: e.target.value })} placeholder="+225 07 00 00 00 00" /></div>
                <div style={rowS}>
                  <label style={labelS}>Contenu des mentions (optionnel)</label>
                  <textarea value={mentions.contenu || ''} rows={6} onChange={e => setMentions({ ...mentions, contenu: e.target.value })} style={{ ...inputS, height: 'auto', padding: '12px 14px', resize: 'none', lineHeight: 1.6 }} placeholder="Politique de confidentialité, CGV..." />
                </div>
              </div>
              <button onClick={() => saveSettings('mentions', mentions)} disabled={saving} style={{ width: '100%', height: 50, borderRadius: 16, background: `linear-gradient(135deg,${accent},${accent}cc)`, border: 'none', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? .7 : 1 }}>
                {saving ? 'Sauvegarde…' : '💾 Sauvegarder'}
              </button>
            </div>
          )}

          {/* ── FOOTER ── */}
          {activeTab === 'footer' && (
            <div>
              <div style={cardS}>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F2F2F7' }}>🦶 Pied de page</div>
                <div style={rowS}><label style={labelS}>Slogan sous le nom</label><input style={inputS} value={footer.slogan || ''} onChange={e => setFooter({ ...footer, slogan: e.target.value })} placeholder="La boutique premium pour l'Afrique" /></div>
                <div style={rowS}><label style={labelS}>Texte copyright</label><input style={inputS} value={footer.copyright || ''} onChange={e => setFooter({ ...footer, copyright: e.target.value })} placeholder="© 2026 COLIOO — Tous droits réservés." /></div>
                <div style={rowS}>
                  <label style={labelS}>Liens du footer</label>
                  {(footer.liens || []).map((lien: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input style={{ ...inputS, flex: 1 }} value={lien.label || ''} placeholder="Libellé" onChange={e => { const l = [...footer.liens]; l[i] = { ...l[i], label: e.target.value }; setFooter({ ...footer, liens: l }) }} />
                      <input style={{ ...inputS, flex: 1 }} value={lien.href || ''} placeholder="/page" onChange={e => { const l = [...footer.liens]; l[i] = { ...l[i], href: e.target.value }; setFooter({ ...footer, liens: l }) }} />
                      <button onClick={() => setFooter({ ...footer, liens: footer.liens.filter((_: any, j: number) => j !== i) })} style={{ width: 36, height: 46, borderRadius: 12, background: '#FFF0F0', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 18, fontWeight: 900, flexShrink: 0 }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => setFooter({ ...footer, liens: [...(footer.liens || []), { label: '', href: '/' }] })} style={{ fontSize: 13, color: accent, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>+ Ajouter un lien</button>
                </div>
              </div>
              <button onClick={() => saveSettings('footer', footer)} disabled={saving} style={{ width: '100%', height: 50, borderRadius: 16, background: `linear-gradient(135deg,${accent},${accent}cc)`, border: 'none', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? .7 : 1 }}>
                {saving ? 'Sauvegarde…' : '💾 Sauvegarder'}
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  )
}