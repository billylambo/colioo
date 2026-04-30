import { supabase } from '@/lib/supabase'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'
import Link from 'next/link'

export default async function APropos() {
  const { data } = await supabase.from('settings').select('value').eq('key', 'apropos').single()
  const content = data?.value || {
    title: 'À propos de COLIOO',
    subtitle: 'La marketplace ivoirienne',
    histoire: 'COLIOO est née pour permettre aux Ivoiriens d accéder à des produits importés.',
    valeurs: []
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAFAF8' }}>
      <PublicHeader />

      <section style={{ backgroundColor: '#1a1a2e', padding: '80px 24px 60px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: 'white', fontFamily: 'Poppins, sans-serif', marginBottom: '16px' }}>
            {content.title}
          </h1>
          <p style={{ fontSize: '17px', color: '#9ca3af', fontFamily: 'Inter, sans-serif', lineHeight: '1.6' }}>
            {content.subtitle}
          </p>
        </div>
      </section>

      <section style={{ maxWidth: '600px', margin: '0 auto', padding: '48px 24px', flex: 1 }}>
        
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#333', fontFamily: 'Poppins, sans-serif', marginBottom: '16px' }}>
            Notre histoire 🚀
          </h2>
          <p style={{ color: '#555', fontFamily: 'Inter, sans-serif', lineHeight: '1.8', fontSize: '15px' }}>
            {content.histoire}
          </p>
        </div>

        {content.valeurs?.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#333', fontFamily: 'Poppins, sans-serif', marginBottom: '16px' }}>
              Nos valeurs
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {content.valeurs.map((item: any, i: number) => (
                <div key={i} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', display: 'flex', gap: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <span style={{ fontSize: '28px' }}>{item.icon}</span>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#333', fontFamily: 'Poppins, sans-serif', marginBottom: '4px' }}>{item.title}</h3>
                    <p style={{ fontSize: '14px', color: '#666', fontFamily: 'Inter, sans-serif' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ backgroundColor: '#1a1a2e', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'white', fontFamily: 'Poppins, sans-serif', marginBottom: '8px' }}>
            Contactez-nous
          </h2>
          <p style={{ color: '#9ca3af', fontFamily: 'Inter, sans-serif', marginBottom: '20px', fontSize: '14px' }}>
            Une question ? On est disponibles sur WhatsApp !
          </p>
          <a href="https://wa.me/2250000000000" target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', backgroundColor: '#25D366', color: 'white', fontFamily: 'Inter, sans-serif', fontWeight: '700', fontSize: '15px', padding: '12px 28px', borderRadius: '50px', textDecoration: 'none' }}>
            💬 Nous contacter sur WhatsApp
          </a>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}