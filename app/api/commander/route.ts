import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendTelegram } from '@/lib/telegram'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const productId = formData.get('productId') as string
    const productName = formData.get('productName') as string
    const productPrice = parseInt(formData.get('productPrice') as string)
    const whatsappNumber = formData.get('whatsappNumber') as string
    const customerName = formData.get('customerName') as string
    const customerPhone = formData.get('customerPhone') as string
    const customerVille = formData.get('customerVille') as string
    const customerDistrict = formData.get('customerDistrict') as string

    // Collect options
    const options: { type: string; value: string }[] = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('option_')) {
        const index = parseInt(key.replace('option_', ''))
        options.push({ type: `Option ${index + 1}`, value: value as string })
      }
    }

    // Save order to Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        product_id: productId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_district: customerDistrict,
        options_chosen: options,
        status: 'nouveau',
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order error:', orderError)
    }

    // ── Notification Telegram ──────────────────────────────────────
    try {
      const orderNum = order?.order_number || order?.id?.slice(0, 8).toUpperCase() || 'N/A'
      await sendTelegram(
        `🛒 <b>Nouvelle commande !</b>\n\n` +
        `📋 Réf : <b>${orderNum}</b>\n` +
        `👤 Client : <b>${customerName}</b>\n` +
        `📱 Tél : ${customerPhone}\n` +
        `📦 Produit : ${productName}\n` +
        `📍 Lieu : ${customerVille} — ${customerDistrict}\n` +
        `💰 Total : <b>${productPrice.toLocaleString('fr-FR')} FCFA</b>`
      )
    } catch (e) {
      console.error('Telegram error:', e)
    }
    // ──────────────────────────────────────────────────────────────

    // Log whatsapp_redirect event
    await supabase.from('events').insert({
      event_type: 'whatsapp_redirect',
      product_id: productId,
      metadata: {
        name: customerName,
        phone: customerPhone,
        district: customerDistrict,
        order_id: order?.id,
      },
    })

    // Build WhatsApp message
    const optionsText = options.length > 0
      ? options.map(o => `${o.type} : ${o.value}`).join('\n')
      : ''

    const message = `Bonjour COLIOO ! 👋

Je souhaite commander :
🛍️ *${productName}*
${optionsText}
💰 Prix : ${productPrice.toLocaleString()} FCFA

📋 Mes informations :
Nom : ${customerName}
Téléphone : ${customerPhone}
Ville : ${customerVille}
Quartier : ${customerDistrict}

Merci !`

    const encodedMessage = encodeURIComponent(message)
    const waUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`

    return NextResponse.redirect(waUrl, 302)
  } catch (error) {
    console.error('Commander API error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}