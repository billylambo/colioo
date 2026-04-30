'use client'

import { useState } from 'react'

interface OrderFormProps {
  product: {
    id: string
    name: string
    price: number
    whatsapp_number: string
  }
  options: { type: string; values: string[] }[]
}

export default function OrderForm({ product, options }: OrderFormProps) {
  const [ville, setVille] = useState('')
  const [quartier, setQuartier] = useState('')
  const [quartierLibre, setQuartierLibre] = useState('')
  const [phone, setPhone] = useState('')

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    // If user types digits without +, add +225 prefix
    if (value && !value.startsWith('+') && /^\d/.test(value)) {
      value = '+225 ' + value
    }
    // Keep only digits and + for validation
    const cleaned = value.replace(/[^\d+]/g, '')
    if (cleaned.startsWith('+225')) {
      value = '+225 ' + cleaned.replace('+225', '').trim()
    }
    setPhone(value)
  }

  const villes = [
    'Abidjan', 'Grand Bassam', 'Bingerville', 'Anyama', 'Dabou',
    'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Daloa', 'Korhogo',
    'Man', 'Abengourou', 'Divo', 'Gagnoa', 'Autre'
  ]

  const quartiersAbidjan = [
    'Cocody/Riviera/Angré', 'Plateau', 'Marcory/Zone 4', 'Koumassi',
    'Treichville', 'Adjamé', 'Abobo', 'Yopougon', 'Attécoubé',
    'Port-Bouët/Vridi', 'Autre'
  ]

  return (
    <form
      action="/api/commander"
      method="POST"
      className="space-y-4"
    >
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="productName" value={product.name} />
      <input type="hidden" name="productPrice" value={product.price} />
      <input type="hidden" name="whatsappNumber" value={product.whatsapp_number} />

      {/* Options */}
      {options.length > 0 && options.map((opt: any, index: number) => (
        <div key={index}>
          <label className="block text-sm font-medium text-charcoal font-inter mb-2">
            {opt.type}
          </label>
          <div className="flex flex-wrap gap-2">
            {opt.values.map((value: string, i: number) => (
              <label key={i} className="cursor-pointer">
                <input type="radio" name={`option_${index}`} value={value} className="peer sr-only" />
                <span className="inline-block px-4 py-2 border border-gray-300 rounded-lg font-inter text-sm peer-checked:border-orange-primary peer-checked:bg-orange-primary peer-checked:text-white transition-colors">
                  {value}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-charcoal font-inter mb-2">
          Prénom et Nom *
        </label>
        <input
          type="text"
          name="customerName"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-inter focus:outline-none focus:ring-2 focus:ring-orange-primary"
          placeholder="Votre nom"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal font-inter mb-2">
          Numéro de téléphone *
        </label>
        <input
          type="tel"
          name="customerPhone"
          required
          value={phone}
          onChange={handlePhoneChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-inter focus:outline-none focus:ring-2 focus:ring-orange-primary"
          placeholder="+225 XX XX XX XX"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal font-inter mb-2">
          Ville *
        </label>
        <select
          name="customerVille"
          required
          value={ville}
          onChange={(e) => { setVille(e.target.value); setQuartier(''); setQuartierLibre('') }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-inter focus:outline-none focus:ring-2 focus:ring-orange-primary"
        >
          <option value="">Sélectionner une ville</option>
          {villes.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      {ville && (
        <div>
          <label className="block text-sm font-medium text-charcoal font-inter mb-2">
            Quartier / Zone de livraison *
          </label>
          {ville === 'Abidjan' ? (
            <select
              name="customerDistrict"
              required
              value={quartier}
              onChange={(e) => setQuartier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-inter focus:outline-none focus:ring-2 focus:ring-orange-primary"
            >
              <option value="">Sélectionner un quartier</option>
              {quartiersAbidjan.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              name="customerDistrict"
              required
              value={quartierLibre}
              onChange={(e) => setQuartierLibre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-inter focus:outline-none focus:ring-2 focus:ring-orange-primary"
              placeholder={`Votre quartier à ${ville}`}
            />
          )}
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-orange-primary text-white font-inter font-bold py-4 px-6 rounded-lg hover:bg-orange-600 transition-colors"
      >
        Commander sur WhatsApp
      </button>
    </form>
  )
}