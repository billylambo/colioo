'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Slide {
  type: 'image' | 'video' | 'gif'
  url: string
}

interface HeroContent {
  title: string
  subtitle: string
  cta_text: string
  cta_link: string
  bg_color: string
  slides: Slide[]
  slide_speed: number
  slide_height: string
  text_color: string
  subtitle_color: string
  font_title: string
  font_size_title: string
  overlay_opacity: number
}

export default function HeroSlide({ content }: { content: HeroContent }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const slides = content.slides || []
  const speed = content.slide_speed || 4000
  const height = content.slide_height || '500px'
  const overlayOpacity = content.overlay_opacity ?? 0.5

  useEffect(() => {
    if (slides.length <= 1) return
    intervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, speed)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [slides.length, speed])

  const goTo = (index: number) => {
    setCurrentSlide(index)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, speed)
  }

  return (
    <section style={{ position: 'relative', height, overflow: 'hidden', backgroundColor: content.bg_color || '#1a1a2e' }}>
      
      {/* Slides */}
      {slides.length > 0 ? (
        <div style={{ position: 'absolute', inset: 0 }}>
          {slides.map((slide, i) => (
            <div key={i} style={{
              position: 'absolute', inset: 0,
              opacity: i === currentSlide ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
            }}>
              {slide.type === 'video' ? (
                <video src={slide.url} autoPlay muted loop playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <img src={slide.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
          ))}
          {/* Overlay sombre */}
          <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />
        </div>
      ) : null}

      {/* Contenu texte */}
      <div style={{
        position: 'relative', zIndex: 10,
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '0 24px',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-block', backgroundColor: '#FF6B00', color: 'white',
          borderRadius: '50px', padding: '6px 16px', fontSize: '13px',
          fontFamily: 'Inter, sans-serif', marginBottom: '20px',
        }}>
          🇨🇮 Marketplace Ivoirienne
        </div>

        {/* Titre */}
        <h1 style={{
          fontSize: content.font_size_title || '42px',
          fontWeight: '800',
          color: content.text_color || '#ffffff',
          fontFamily: `${content.font_title || 'Poppins'}, sans-serif`,
          lineHeight: '1.2',
          marginBottom: '16px',
          maxWidth: '700px',
          textShadow: slides.length > 0 ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
        }}>
          {content.title}
        </h1>

        {/* Sous-titre */}
        <p style={{
          fontSize: '17px',
          color: content.subtitle_color || '#9ca3af',
          fontFamily: 'Inter, sans-serif',
          marginBottom: '32px',
          lineHeight: '1.6',
          maxWidth: '500px',
          textShadow: slides.length > 0 ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
        }}>
          {content.subtitle}
        </p>

        {/* Bouton CTA */}
        <Link href={content.cta_link || '/catalogue'} style={{
          display: 'inline-block',
          backgroundColor: '#FF6B00',
          color: 'white',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '700',
          fontSize: '16px',
          padding: '14px 32px',
          borderRadius: '50px',
          textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(255,107,0,0.4)',
        }}>
          {content.cta_text || 'Découvrir nos produits →'}
        </Link>
      </div>

      {/* Indicateurs slides */}
      {slides.length > 1 && (
        <div style={{
          position: 'absolute', bottom: '20px', left: '50%',
          transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10,
        }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              width: i === currentSlide ? '24px' : '8px',
              height: '8px',
              borderRadius: '50px',
              backgroundColor: i === currentSlide ? '#FF6B00' : 'rgba(255,255,255,0.5)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
            }} />
          ))}
        </div>
      )}

      {/* Flèches navigation */}
      {slides.length > 1 && (
        <>
          <button onClick={() => goTo((currentSlide - 1 + slides.length) % slides.length)}
            style={{
              position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
              backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
              border: 'none', borderRadius: '50%', width: '44px', height: '44px',
              color: 'white', fontSize: '18px', cursor: 'pointer', zIndex: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>←</button>
          <button onClick={() => goTo((currentSlide + 1) % slides.length)}
            style={{
              position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
              backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
              border: 'none', borderRadius: '50%', width: '44px', height: '44px',
              color: 'white', fontSize: '18px', cursor: 'pointer', zIndex: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>→</button>
        </>
      )}
    </section>
  )
}