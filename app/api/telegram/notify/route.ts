import { sendTelegram } from '@/lib/telegram'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('📨 Telegram notify reçu:', body)

    const { orderNum, customerName, customerPhone, productName, ville, quartier, total } = body

    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    console.log('🔑 Token présent:', !!token)
    console.log('💬 ChatId présent:', !!chatId)

    await sendTelegram(
      `🛒 <b>Nouvelle commande !</b>\n\n` +
      `📋 Réf : <b>${orderNum}</b>\n` +
      `👤 Client : <b>${customerName}</b>\n` +
      `📱 Tél : ${customerPhone}\n` +
      `📦 Produit : ${productName}\n` +
      `📍 Lieu : ${ville} — ${quartier}\n` +
      `💰 Total : <b>${Number(total).toLocaleString('fr-FR')} FCFA</b>`
    )

    console.log('✅ Telegram envoyé')
    return Response.json({ ok: true })
  } catch (e) {
    console.error('❌ Telegram notify error:', e)
    return Response.json({ ok: false }, { status: 500 })
  }
}