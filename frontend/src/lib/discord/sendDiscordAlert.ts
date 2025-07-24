export async function sendDiscordAlert(content: string) {
  if (!process.env.DISCORD_INTER_WEBHOOK_URL) return

  await fetch(process.env.DISCORD_INTER_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  })
} 