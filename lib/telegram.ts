export async function sendTelegram(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  console.log('TELEGRAM_BOT_TOKEN:', token ? `présent (${token.slice(0, 10)}...)` : 'ABSENT')
  console.log('TELEGRAM_CHAT_ID:', chatId ? `présent: ${chatId}` : 'ABSENT')

  if (!token || !chatId) {
    console.error('❌ Variables manquantes - abandon')
    return
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })
    const json = await res.json()
    console.log('✅ Telegram response:', JSON.stringify(json))
  } catch (e) {
    console.error('❌ Telegram fetch error:', e)
  }
}