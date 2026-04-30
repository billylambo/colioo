import { sendTelegram } from '@/lib/telegram'

export async function POST(req: Request) {
  const body = await req.json()
  const { customer_name, customer_phone, product_name, total_price, order_number, district } = body

  await sendTelegram(
    `🛒 <b>Nouvelle commande !</b>\n\n` +
    `📋 Réf : <b>${order_number}</b>\n` +
    `👤 Client : <b>${customer_name}</b>\n` +
    `📱 Tél : ${customer_phone}\n` +
    `📦 Produit : ${product_name}\n` +
    `📍 Lieu : ${district}\n` +
    `💰 Total : <b>${Number(total_price).toLocaleString('fr-FR')} FCFA</b>`
  )

  return Response.json({ ok: true })
}