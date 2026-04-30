'use client'

import { useEffect, useState } from 'react'

const PRENOMS = [
  'Adjoua', 'Koffi', 'Aminata', 'Mamadou', 'Fatoumata', 'Konan', 'Aya', 'Ibrahim',
  'Mariam', 'Seydou', 'Aissatou', 'Moussa', 'Kadiatou', 'Yaya', 'Bintou', 'Lansana',
  'Nathalie', 'Olivier', 'Sandrine', 'Patrick', 'Marie', 'Jean', 'Sylvie', 'François',
  'Abou', 'Sali', 'Diallo', 'Oumar', 'Ramatou', 'Cheikh', 'Djeneba', 'Modibo',
  'Akissi', 'Kouame', 'N\'Goran', 'Affoué', 'Tanoh', 'Yao', 'Amoin', 'Kra',
]

const VILLES = [
  'Abidjan', 'Cocody', 'Yopougon', 'Abobo', 'Adjamé', 'Plateau', 'Marcory',
  'Treichville', 'Koumassi', 'Port-Bouët', 'Bouaké', 'Yamoussoukro', 'San-Pédro',
  'Korhogo', 'Daloa', 'Man', 'Gagnoa', 'Grand-Bassam',
]

const ACTIONS = [
  (produit: string, ville: string, prenom: string) =>
    `🛍️ ${prenom} de ${ville} vient de commander`,
  (produit: string, ville: string, prenom: string) =>
    `👀 ${prenom} consulte cette fiche en ce moment`,
  (produit: string, ville: string, prenom: string) =>
    `✅ ${prenom} de ${ville} a reçu sa commande`,
  (produit: string, ville: string, prenom: string) =>
    `🔥 ${prenom} de ${ville} vient d'ajouter au panier`,
  (produit: string, ville: string, prenom: string) =>
    `⭐ ${prenom} a laissé un avis 5 étoiles`,
  (produit: string, ville: string, prenom: string) =>
    `📦 Livraison confirmée pour ${prenom} à ${ville}`,
  (produit: string, ville: string, prenom: string) =>
    `💬 ${prenom} de ${ville} vient de commander`,
  (produit: string, ville: string, prenom: string) =>
    `🎉 ${prenom} vient de recevoir son colis à ${ville}`,
]

const TEMPS = [
  'il y a 2 min', 'il y a 5 min', 'il y a 8 min', 'il y a 12 min',
  'il y a 15 min', 'il y a 23 min', 'il y a 31 min', 'à l\'instant',
  'il y a 1 min', 'il y a 3 min',
]

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateNotif() {
  const prenom = getRandom(PRENOMS)
  const ville = getRandom(VILLES)
  const actionFn = getRandom(ACTIONS)
  const temps = getRandom(TEMPS)
  return {
    id: Date.now(),
    text: actionFn('', ville, prenom),
    temps,
    emoji: ['🛍️', '📦', '✅', '🔥', '⭐', '💬'][Math.floor(Math.random() * 6)],
  }
}

export default function SocialProof() {
  const [notif, setNotif] = useState<ReturnType<typeof generateNotif> | null>(null)
  const [visible, setVisible] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Visiteurs actifs simulés
    setCount(Math.floor(Math.random() * 12) + 4)

    const show = () => {
      const n = generateNotif()
      setNotif(n)
      setVisible(true)
      setTimeout(() => setVisible(false), 4500)
    }

    // Première notif après 4 secondes
    const first = setTimeout(show, 4000)

    // Ensuite toutes les 12-20 secondes
    const interval = setInterval(() => {
      const delay = Math.random() * 8000 + 12000
      setTimeout(show, delay)
    }, 20000)

    // Mise à jour visiteurs actifs
    const countInterval = setInterval(() => {
      setCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1
        return Math.max(3, Math.min(25, prev + change))
      })
    }, 15000)

    return () => {
      clearTimeout(first)
      clearInterval(interval)
      clearInterval(countInterval)
    }
  }, [])

  return (
    <>
      {/* Compteur visiteurs actifs */}
      <div style={{
        position: 'fixed',
        top: 70,
        right: 12,
        zIndex: 40,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 20,
        padding: '5px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#34C759',
          animation: 'pulse-green 2s infinite',
        }} />
        <span style={{
          fontSize: 12, fontWeight: 700,
          color: '#0D0D0D',
          fontFamily: 'Inter, sans-serif',
        }}>
          {count} en ligne
        </span>
        <style>{`
          @keyframes pulse-green {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.3); }
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes slideDown {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(20px); opacity: 0; }
          }
        `}</style>
      </div>

      {/* Notification pop-up */}
      {notif && (
        <div style={{
          position: 'fixed',
          bottom: 90,
          left: 12,
          zIndex: 50,
          maxWidth: 280,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(16px)',
          borderRadius: 16,
          padding: '12px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          animation: visible ? 'slideUp 0.4s ease forwards' : 'slideDown 0.4s ease forwards',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {/* Avatar */}
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF6B00, #FF6B00bb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>
            🛍️
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: '#0D0D0D',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.4,
              marginBottom: 3,
            }}>
              {notif.text}
            </div>
            <div style={{
              fontSize: 11, color: '#AEAEB2',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
            }}>
              {notif.temps} • COLIOO
            </div>
          </div>
          {/* Barre de progression */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0,
            height: 3,
            background: '#FF6B00',
            borderRadius: '0 0 16px 16px',
            animation: visible ? 'progress 4.5s linear forwards' : 'none',
          }} />
          <style>{`
            @keyframes progress {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>
        </div>
      )}
    </>
  )
}