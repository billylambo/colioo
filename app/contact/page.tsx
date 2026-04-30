import { supabase } from '@/lib/supabase'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default async function Contact() {
  const { data } = await supabase.from('settings').select('value').eq('key', 'contact').single()
  const content = data?.value || {
    title: 'Contactez-nous',
    subtitle: 'On est disponibles 7j/7',
    whatsapp: '2250000000000',
    email: 'contact@colioo.ci',
    horaires: []
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#25D36620', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>💬</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#333', fontFamily: 'Poppins, sans-serif', marginBottom: '4px' }}>WhatsApp</h3>
              <p style={{ fontSize: '14px', color: '#666', fontFamily: 'Inter, sans-serif' }}>Réponse en moins de 30 minutes</p>
            </div>
            <a href={`https://wa.me/${content.whatsapp}`} target="_blank" rel="noopener noreferrer"
              style={{ backgroundColor: '#25D366', color: 'white', fontFamily: 'Inter, sans-serif', fontWeight: '600', fontSize: '13px', padding: '8px 16px', borderRadius: '50px', textDecoration: 'none' }}>
              Écrire
            </a>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FF6B0020', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>📧</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#333', fontFamily: 'Poppins, sans-serif', marginBottom: '4px' }}>Email</h3>
              <p style={{ fontSize: '14px', color: '#666', fontFamily: 'Inter, sans-serif' }}>{content.email}</p>
            </div>
            <a href={`mailto:${content.email}`}
              style={{ backgroundColor: '#FF6B00', color: 'white', fontFamily: 'Inter, sans-serif', fontWeight: '600', fontSize: '13px', padding: '8px 16px', borderRadius: '50px', textDecoration: 'none' }}>
              Envoyer
            </a>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#3b82f620', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>📍</div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#333', fontFamily: 'Poppins, sans-serif', marginBottom: '4px' }}>Localisation</h3>
              <p style={{ fontSize: '14px', color: '#666', fontFamily: 'Inter, sans-serif' }}>Abidjan, Côte d'Ivoire</p>
            </div>
          </div>
        </div>

        {content.horaires?.length > 0 && (
          <div style={{ backgroundColor: '#1a1a2e', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'white', fontFamily: 'Poppins, sans-serif', marginBottom: '16px' }}>
              🕐 Horaires de disponibilité
            </h2>
            {content.horaires.map((h: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < content.horaires.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                <span style={{ color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>{h.jour}</span>
                <span style={{ color: '#FF6B00', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '600' }}>{h.heure}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <PublicFooter />
    </div>
  )
}