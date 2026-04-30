'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface TickerSettings {
  enabled: boolean
  messages: string[]
  bg_color: string
  text_color: string
  speed: number
}

export default function TickerBanner() {
  const [settings, setSettings] = useState<TickerSettings | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'ticker_banner').single()
      if (data?.value) {
        try { setSettings(JSON.parse(data.value as string)) } catch {}
      }
    }
    load()
  }, [])

  if (!settings?.enabled || !settings.messages?.length) return null

  const speed = settings.speed || 30
  const allMessages = [...settings.messages, ...settings.messages]
  const text = settings.messages.join('   ✦   ')

  return (
    <div style={{
      background: settings.bg_color || '#1a1a2e',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      height: 36,
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      zIndex: 30,
    }}>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: inline-flex;
          animation: ticker ${speed}s linear infinite;
          will-change: transform;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="ticker-track">
        {[...Array(4)].map((_, repeat) => (
          <span key={repeat} style={{
            color: settings.text_color || '#ffffff',
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0.3,
            paddingRight: 60,
          }}>
            {settings.messages.map((msg, i) => (
              <span key={i}>
                {msg}
                {i < settings.messages.length - 1 && (
                  <span style={{ margin: '0 20px', opacity: 0.5 }}>✦</span>
                )}
              </span>
            ))}
            <span style={{ margin: '0 20px', opacity: 0.5 }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}