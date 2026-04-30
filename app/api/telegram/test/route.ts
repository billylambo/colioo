import { sendTelegram } from '@/lib/telegram'

export async function POST() {
  await sendTelegram(
    `🧪 <b>Test COLIOO</b>\n\n` +
    `✅ Connexion Telegram opérationnelle !\n` +
    `🕐 ${new Date().toLocaleString('fr-FR')}`
  )
  return Response.json({ ok: true })
}