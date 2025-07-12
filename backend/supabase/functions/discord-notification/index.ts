import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface DiscordNotification {
  title: string
  description: string
  color?: number
  fields?: {
    name: string
    value: string
    inline?: boolean
  }[]
  footer?: {
    text: string
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1391531226246021261/kxCJKKT7h7EnpVvNQj7oeJ3slqJOCAiXxB16SSOpuTn8EkmYDz3wIAAZpjpkUY3bnoWJ'

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const notification: DiscordNotification = await req.json()
    
    console.log('📢 Enviando notificação para Discord:', notification.title)

    // Estrutura do embed do Discord
    const embed = {
      title: notification.title,
      description: notification.description,
      color: notification.color || 0x00ff00, // Verde por padrão
      fields: notification.fields || [],
      footer: notification.footer || {
        text: `SGB v2 • ${new Date().toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo'
        })}`
      },
      timestamp: new Date().toISOString()
    }

    // Payload do Discord
    const discordPayload = {
      username: 'SGB ContaAzul Bot',
      avatar_url: 'https://cdn.discordapp.com/icons/YOUR_GUILD_ID/YOUR_ICON.png', // Opcional
      embeds: [embed]
    }

    // Enviar para Discord
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro ao enviar para Discord:', errorText)
      throw new Error(`Discord API erro: ${response.status} - ${errorText}`)
    }

    console.log('✅ Notificação enviada para Discord com sucesso!')

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Notificação enviada para Discord'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Erro na notificação Discord:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: (error as Error).message || 'Erro desconhecido'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 