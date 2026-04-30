'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PagesAdmin() {
  const [activeTab, setActiveTab] = useState<'apropos' | 'contact'>('apropos')
  const [apropos, setApropos] = useState<any>(null)
  const [contact, setContact] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    const { data } = await supabase.from('settings').select('*')
    if (data) {
      data.forEach(s => {
        if (s.key === 'apropos') setApropos(s.value)
        if (s.key === 'contact') setContact(s.value)
      })
    }
  }

  const saveSettings = async (key: string, value: any) => {
    setSaving(true)
    await supabase.from('settings').update({ value }).eq('key', key)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updateValeur = (index: number, field: string, value: string) => {
    const newValeurs = [...apropos.valeurs]
    newValeurs[index] = { ...newValeurs[index], [field]: value }
    setApropos({ ...apropos, valeurs: newValeurs })
  }

  const updateHoraire = (index: number, field: string, value: string) => {
    const newHoraires = [...contact.horaires]
    newHoraires[index] = { ...newHoraires[index], [field]: value }
    setContact({ ...contact, horaires: newHoraires })
  }

    return (
    <div className="max-w-4xl mx-auto">
      {/* Bouton retour vers Réglages */}
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 mb-5 text-[#FF6B00] font-inter font-semibold text-sm"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15,18 9,12 15,6" />
        </svg>
        Retour aux réglages
      </button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal font-poppins">Page d'accueil</h1>
        <p className="text-gray-600 font-inter mt-1">Gérez les sections de votre page d'accueil</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['apropos', 'contact'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full font-inter font-medium text-sm transition-colors ${activeTab === tab ? 'bg-[#FF6B00] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tab === 'apropos' ? '📄 À propos' : '📞 Contact'}
          </button>
        ))}
      </div>

      {/* À propos */}
      {activeTab === 'apropos' && apropos && (
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Titre</label>
            <input type="text" value={apropos.title}
              onChange={e => setApropos({ ...apropos, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Sous-titre</label>
            <input type="text" value={apropos.subtitle}
              onChange={e => setApropos({ ...apropos, subtitle: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Notre histoire</label>
            <textarea value={apropos.histoire} rows={4}
              onChange={e => setApropos({ ...apropos, histoire: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 font-inter block mb-3">Valeurs</label>
            <div className="space-y-3">
              {(apropos.valeurs || []).map((val: any, i: number) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="flex gap-2">
                    <input type="text" value={val.icon} placeholder="✅"
                      onChange={e => updateValeur(i, 'icon', e.target.value)}
                      className="w-14 px-2 py-2 border border-gray-200 rounded-lg font-inter text-center focus:border-[#FF6B00] focus:outline-none" />
                    <input type="text" value={val.title} placeholder="Titre"
                      onChange={e => updateValeur(i, 'title', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-inter focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <input type="text" value={val.desc} placeholder="Description"
                    onChange={e => updateValeur(i, 'desc', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg font-inter focus:border-[#FF6B00] focus:outline-none" />
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => saveSettings('apropos', apropos)} disabled={saving}
            className="w-full bg-[#FF6B00] text-white font-inter font-bold py-3 rounded-full hover:bg-[#e55f00] transition-colors">
            {saving ? 'Sauvegarde...' : saved ? '✅ Sauvegardé !' : 'Sauvegarder'}
          </button>
        </div>
      )}

      {/* Contact */}
      {activeTab === 'contact' && contact && (
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Titre</label>
            <input type="text" value={contact.title}
              onChange={e => setContact({ ...contact, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Sous-titre</label>
            <input type="text" value={contact.subtitle}
              onChange={e => setContact({ ...contact, subtitle: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 font-inter block mb-1">WhatsApp</label>
            <input type="text" value={contact.whatsapp}
              onChange={e => setContact({ ...contact, whatsapp: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none"
              placeholder="2250000000000" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 font-inter block mb-1">Email</label>
            <input type="text" value={contact.email}
              onChange={e => setContact({ ...contact, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 font-inter block mb-3">Horaires</label>
            <div className="space-y-2">
              {(contact.horaires || []).map((h: any, i: number) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={h.jour}
                    onChange={e => updateHoraire(i, 'jour', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-inter focus:border-[#FF6B00] focus:outline-none" />
                  <input type="text" value={h.heure}
                    onChange={e => updateHoraire(i, 'heure', e.target.value)}
                    className="w-36 px-3 py-2 border border-gray-200 rounded-lg font-inter focus:border-[#FF6B00] focus:outline-none" />
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => saveSettings('contact', contact)} disabled={saving}
            className="w-full bg-[#FF6B00] text-white font-inter font-bold py-3 rounded-full hover:bg-[#e55f00] transition-colors">
            {saving ? 'Sauvegarde...' : saved ? '✅ Sauvegardé !' : 'Sauvegarder'}
          </button>
        </div>
      )}
    </div>
  )
}