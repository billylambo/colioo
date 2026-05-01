'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MentionsLegales() {
  const router = useRouter()
  const [mentions, setMentions] = useState<any>(null)
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('settings').select('key, value')
      if (data) {
        const map: Record<string, string> = {}
        for (const row of data as { key: string; value: unknown }[]) {
          const raw = row.value
          if (typeof raw === 'string') map[row.key] = raw.replace(/^"|"$/g, '')
          else map[row.key] = JSON.stringify(raw)
        }
        setSettings(map)
        if (map.mentions) {
          try { setMentions(JSON.parse(map.mentions)) } catch { setMentions(null) }
        }
      }
    }
    load()
  }, [])

  const accent = settings.primary_color || '#FF6B00'
  const siteName = settings.site_name || 'COLIOO'

  return (
    <>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #F2F2F7; }`}</style>
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', paddingBottom: 40 }}>

        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E5E5EA', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 40 }}>
          <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: '50%', background: '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900 }}>Mentions légales</div>
            <div style={{ fontSize: 11, color: '#AEAEB2' }}>{siteName}</div>
          </div>
        </div>

        <div style={{ padding: '16px 16px 0' }}>

          {/* Infos société */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0D0D0D', marginBottom: 16 }}>🏢 Éditeur du site</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: '🏷️ Société', value: mentions?.societe || siteName },
                { label: '📍 Adresse', value: mentions?.adresse || "Abidjan, Côte d'Ivoire" },
                { label: '📧 Email', value: mentions?.email || `contact@${siteName.toLowerCase()}.ci` },
                { label: '📱 Téléphone', value: mentions?.telephone || '+225 00 00 00 00 00' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 14, color: '#6B6B6B', minWidth: 90, fontWeight: 600 }}>{item.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0D0D0D', flex: 1 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hébergement */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0D0D0D', marginBottom: 16 }}>☁️ Hébergement</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Vercel Inc.</div>
              <div style={{ fontSize: 13, color: '#6B6B6B' }}>340 Pine Street, Suite 1200, San Francisco, CA 94104, USA</div>
              <div style={{ fontSize: 13, color: '#6B6B6B' }}>vercel.com</div>
            </div>
          </div>

          {/* Contenu personnalisé */}
          {mentions?.contenu && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0D0D0D', marginBottom: 16 }}>📋 Informations complémentaires</h2>
              <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{mentions.contenu}</p>
            </div>
          )}

          {/* Données personnelles */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0D0D0D', marginBottom: 12 }}>🔒 Données personnelles</h2>
            <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.7 }}>
              Les informations collectées lors d'une commande (nom, téléphone, adresse de livraison) sont utilisées uniquement pour le traitement et la livraison de votre commande. Elles ne sont jamais partagées avec des tiers.
            </p>
          </div>

          {/* Cookies */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0D0D0D', marginBottom: 12 }}>🍪 Cookies</h2>
            <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.7 }}>
              Ce site utilise des cookies techniques nécessaires à son fonctionnement. Aucun cookie publicitaire ou de tracking tiers n'est utilisé sans votre consentement.
            </p>
          </div>

          {/* Contact */}
          <div style={{ background: accent + '10', borderRadius: 16, padding: 20, border: `1px solid ${accent}22` }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0D0D0D', marginBottom: 8 }}>✉️ Nous contacter</h2>
            <p style={{ fontSize: 14, color: '#6B6B6B', marginBottom: 16 }}>Pour toute question concernant ces mentions légales :</p>
            <button onClick={() => router.push('/contact')} style={{ width: '100%', height: 46, borderRadius: 14, background: accent, border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              📞 Nous contacter
            </button>
          </div>
        </div>
      </div>
    </>
  )
}