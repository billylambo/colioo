import Link from 'next/link'

export default function PublicFooter() {
  return (
    <footer style={{ backgroundColor: '#1a1a2e', color: 'white', paddingTop: '40px', paddingBottom: '24px', marginTop: 'auto' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 16px' }}>

        {/* Logo + description */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#FF6B00', fontFamily: 'Poppins, sans-serif', marginBottom: '8px' }}>COLIOO</h2>
          <p style={{ color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>Marketplace Ivoirienne — Import & Livraison Domicile</p>
        </div>

        {/* WhatsApp promo */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', marginBottom: '28px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ color: 'white', fontFamily: 'Poppins, sans-serif', fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>
            📲 Recevez nos promotions sur WhatsApp
          </p>
          <p style={{ color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontSize: '13px', marginBottom: '16px' }}>
            Entrez votre numéro pour ne rien rater !
          </p>
          <div style={{ display: 'flex', gap: '8px', maxWidth: '360px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '50px', padding: '10px 14px', flexShrink: 0 }}>
              <span style={{ color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '14px', whiteSpace: 'nowrap' }}>🇨🇮 +225</span>
            </div>
            <input type="tel" placeholder="XX XX XX XX XX"
              style={{ flex: 1, minWidth: '140px', padding: '10px 16px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none' }} />
            <button style={{ backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '50px', padding: '10px 20px', fontFamily: 'Inter, sans-serif', fontWeight: '700', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', width: '100%' }}>
              S'inscrire sur WhatsApp
            </button>
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '28px' }}>
          {[
            { label: 'Facebook', icon: '📘', href: '#' },
            { label: 'Instagram', icon: '📸', href: '#' },
            { label: 'TikTok', icon: '🎵', href: '#' },
            { label: 'WhatsApp', icon: '💬', href: 'https://wa.me/2250000000000' },
          ].map((social, i) => (
            <a key={i} href={social.href} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '50px', padding: '10px 16px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '16px' }}>{social.icon}</span>
              <span style={{ color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '500' }}>{social.label}</span>
            </a>
          ))}
        </div>

        {/* Liens navigation */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { label: 'Accueil', href: '/' },
            { label: 'Catalogue', href: '/catalogue' },
            { label: 'À propos', href: '/a-propos' },
            { label: 'Contact', href: '/contact' },
            { label: 'Mentions légales', href: '/mentions-legales' },
          ].map((link, i) => (
            <Link key={i} href={link.href} style={{ color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontSize: '13px', textDecoration: 'none' }}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Copyright */}
        <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
          <p style={{ color: '#6b7280', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>
            © 2025 COLIOO. Tous droits réservés. 🇨🇮
          </p>
        </div>

      </div>
    </footer>
  )
}