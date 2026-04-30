import { sendTelegram } from '@/lib/telegram'

export async function POST(req: Request) {
  try {
    const { orderNum, customerName, customerPhone, productName, ville, quartier, total } = await req.json()
    await sendTelegram(
      `🛒 <b>Nouvelle commande !</b>\n\n` +
      `📋 Réf : <b>${orderNum}</b>\n` +
      `👤 Client : <b>${customerName}</b>\n` +
      `📱 Tél : ${customerPhone}\n` +
      `📦 Produit : ${productName}\n` +
      `📍 Lieu : ${ville} — ${quartier}\n` +
      `💰 Total : <b>${Number(total).toLocaleString('fr-FR')} FCFA</b>`
    )
    return Response.json({ ok: true })
  } catch (e) {
    console.error('Telegram notify error:', e)
    return Response.json({ ok: false }, { status: 500 })
  }
}