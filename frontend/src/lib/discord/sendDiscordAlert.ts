import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function sendDiscordAlert(content: string, barId?: number) {
  try {
    // Se não tiver barId, usar webhook padrão (fallback)
    if (!barId) {
  if (!process.env.DISCORD_INTER_WEBHOOK_URL) return

  await fetch(process.env.DISCORD_INTER_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  })
      return
    }

    // Buscar webhook do Discord da tabela api_credentials
    const { data: credentials, error } = await supabase
      .from('api_credentials')
      .select('configuracoes')
      .eq('bar_id', barId)
      .eq('sistema', 'banco_inter')
      .eq('ativo', true)
      .single()

    if (error || !credentials?.configuracoes?.webhook_url) {
      console.error('❌ Webhook do Discord não encontrado para bar_id:', barId)
      return
    }

    const webhookUrl = credentials.configuracoes.webhook_url

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })

    console.log('✅ Notificação enviada para Discord - Bar ID:', barId)
  } catch (error) {
    console.error('❌ Erro ao enviar notificação Discord:', error)
  }
} 