'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AProposPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [content, setContent] = useState<any>(null)
  const [ready, setReady] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const g = (key: string, fallback = '') => settings[key] || fallback

  useEffect(() => {
    const load = async () => {
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
        const aproposRow = rawSettings.find((r: any) => r.key === 'apropos')
        if (aproposRow) {
          const v = aproposRow.value
          setContent(typeof v === 'string' ? JSON.parse(v) : v)
        }
      }
      setReady(true)
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
  const fontHeading  = g('font_heading', 'Poppins')
  const fontBody     = g('font_body', 'Inter')
  const whatsapp     = g('whatsapp', '2250000000000')

  if (!ready) return (
    <div style={{ position: 'fixed', inset: 0, background: '#F2F2F7', zIndex: 999, display: 'flex', flexDirection: 'column', gap: 12, padding: 12 }}>
      <div style={{ height: 52, background: '#fff', borderRadius: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 180, background: '#E5E5EA', borderRadius: 24, animation: 'pulse 1.5s ease-in-out infinite' }} />
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${fontHeading}:wght@700;900&family=${fontBody}:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: '${fontBody}', -apple-system, sans-serif; background: ${bgColor}; }
        h1, h2, h3 { font-family: '${fontHeading}', sans-serif; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>

      {/* Drawer */}
      <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', opacity: menuOpen ? 1 : 0, transition: 'opacity .3s', pointerEvents: menuOpen ? 'all' : 'none' }} />
      <div style={{ position: 'fixed', top: 0, left: 0, transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)', width: '80%', maxWidth: 300, height: '100dvh', background: '#fff', zIndex: 90, transition: 'transform .35s cubic-bezier(.32,.72,0,1)', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 30px rgba(0,0,0,.15)' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0D0D0D' }}>Menu</div>
          <button onClick={() => setMenuOpen(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <button key={i} onClick={() => { setMenuOpen(false); router.push(item.path) }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', borderBottom: '1px solid #F8F8F8' }}>
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{item.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0D0D0D' }}>{item.label}</span>
              <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2.5" strokeLinecap="round"><polyline points="9,18 15,12 9,6" /></svg>
            </button>
          ))}
        </div>
        <div style={{ padding: '16px 20px 32px', borderTop: '1px solid #F2F2F7' }}>
          <button onClick={() => { setMenuOpen(false); router.push('/admin') }} style={{ width: '100%', height: 46, borderRadius: 14, background: `linear-gradient(135deg,${accent},${accent}cc)`, border: 'none', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            🔐 Connexion Admin
          </button>
        </div>
      </div>

      <div style={{ background: bgColor, minHeight: '100dvh', paddingBottom: 40 }}>

        {/* Header */}
        <div style={{ background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(20px)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(0,0,0,.06)', position: 'sticky', top: 0, zIndex: 40 }}>
          <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, background: '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
          </button>
          <div style={{ flex: 1 }}>
            {logoUrl ? <img src={logoUrl} alt={siteName} style={{ height: 28, objectFit: 'contain' }} /> : <div style={{ fontSize: 16, fontWeight: 900, color: '#0D0D0D', letterSpacing: .5 }}>{siteName}</div>}
            <div style={{ fontSize: 10, color: accent, fontWeight: 700, letterSpacing: .3 }}>{siteTagline}</div>
          </div>
          <button onClick={() => setMenuOpen(true)} style={{ width: 36, height: 36, borderRadius: 12, background: '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <div style={{ width: 16, height: 2, borderRadius: 1, background: '#0D0D0D' }} />
            <div style={{ width: 16, height: 2, borderRadius: 1, background: '#0D0D0D' }} />
            <div style={{ width: 12, height: 2, borderRadius: 1, background: '#0D0D0D' }} />
          </button>
        </div>

        {/* Hero banner */}
        <div style={{ position: 'relative', margin: '12px 12px 0', borderRadius: 24, overflow: 'hidden', height: 190 }}>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(145deg,${darkColor},#16213E)` }} />
          <div style={{ position: 'absolute', top: -40, right: -30, width: 200, height: 200, borderRadius: '50%', background: `${accent}1A` }} />
          <div style={{ position: 'absolute', bottom: -40, left: -20, width: 140, height: 140, borderRadius: '50%', background: `${accent}0D` }} />
          <div style={{ position: 'relative', zIndex: 2, padding: '28px 20px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '4px 12px', marginBottom: 12, border: '1px solid rgba(255,255,255,.18)' }}>
              <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>🇨🇮 Marketplace Ivoirienne</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 8 }}>
              {content?.title || 'À propos de ' + siteName}
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.5 }}>
              {content?.subtitle || 'La marketplace ivoirienne de confiance'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ margin: '12px 12px 0', background: '#fff', borderRadius: borderRadius, padding: '14px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', boxShadow: '0 2px 14px rgba(0,0,0,.06)' }}>
          {[
            { icon: '🛍️', val: '1 247+', label: 'Commandes' },
            { icon: '⭐', val: '4.8', label: 'Note moy.' },
            { icon: '✅', val: '98%', label: 'Satisfaits' },
          ].map((item, i) => (
            <span key={i} style={{ display: 'contents' }}>
              {i > 0 && <div style={{ width: 1, height: 36, background: '#F2F2F7' }} />}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, marginBottom: 4 }}>{item.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0D0D0D' }}>{item.val}</div>
                <div style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 600 }}>{item.label}</div>
              </div>
            </span>
          ))}
        </div>

        {/* Notre histoire */}
        {content?.histoire && (
          <div style={{ margin: '12px 12px 0', background: '#fff', borderRadius: borderRadius, padding: '20px 16px', boxShadow: '0 2px 14px rgba(0,0,0,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚀</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0D0D0D' }}>Notre histoire</div>
            </div>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8 }}>{content.histoire}</p>
          </div>
        )}

        {/* Valeurs */}
        {content?.valeurs?.length > 0 && (
          <div style={{ padding: '12px 12px 0' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#0D0D0D', marginBottom: 10 }}>Nos valeurs</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {content.valeurs.map((item: any, i: number) => (
                <div key={i} style={{ background: '#fff', borderRadius: borderRadius, padding: '16px', display: 'flex', gap: 14, alignItems: 'flex-start', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0D0D0D', marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.55 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pourquoi nous */}
        <div style={{ margin: '12px 12px 0', borderRadius: borderRadius, background: `linear-gradient(135deg,${darkColor},#16213E)`, padding: '16px 12px' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { icon: '🚚', title: 'Livraison rapide', sub: '24–48h Abidjan' },
              { icon: '💵', title: 'Paiement COD', sub: 'Cash à livraison' },
              { icon: '🔄', title: 'Retours 7j', sub: 'Satisfait garanti' },
            ].map((item, i) => (
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

        {/* CTA final */}
        <div style={{ margin: '12px 12px 0', background: `linear-gradient(135deg,${darkColor},#16213E)`, borderRadius: borderRadius, padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: `${accent}22` }} />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10, animation: 'float 2.5s ease-in-out infinite' }}>🛍️</div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>Prêt(e) à commander ?</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginBottom: 18, lineHeight: 1.6 }}>Rejoignez les <strong style={{ color: '#fff' }}>1 247 clients</strong> satisfaits.</p>
            <button onClick={() => router.push('/catalogue')} style={{ width: '100%', height: 48, borderRadius: borderBtn, background: `linear-gradient(135deg,${accent},${accent}99)`, border: 'none', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 10px 28px ${accent}55`, marginBottom: 12 }}>
              Voir nos produits →
            </button>
            <button onClick={() => window.open(`https://wa.me/${whatsapp}`, '_blank')} style={{ width: '100%', height: 44, borderRadius: borderBtn, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              💬 Nous contacter sur WhatsApp
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: '#111', padding: '22px 16px 40px', marginTop: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: 1, marginBottom: 4 }}>{siteName}</div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>La boutique premium pour l'Afrique</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[['Accueil', '/'], ['Catalogue', '/catalogue'], ['Contact', '/contact'], ['Mentions légales', '/mentions-legales']].map(([label, path], i) => (
              <span key={i} onClick={() => router.push(path)} style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', cursor: 'pointer' }}>{label}</span>
            ))}
          </div>
          <div style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.08)', fontSize: 11, color: 'rgba(255,255,255,.18)' }}>© 2026 {siteName} — Tous droits réservés.</div>
        </div>

      </div>
    </>
  )
}