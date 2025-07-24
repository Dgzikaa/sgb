import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  bar_id: string // Obrigatório para buscar webhook
  webhook_type?: 'sistema' | 'meta' | 'checklists' | 'contahub' | 'vendas' | 'reservas' // Tipo do webhook
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para buscar webhook da tabela
async function getWebhookUrl(barId: string, webhookType: string = 'sistema') {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  // Mapear webhook type para sistema
  const webhookMapping = {
    sistema: 'sistema',
    contaazul: 'contaazul',
    meta: 'meta',
    checklists: 'checklists',
    contahub: 'contahub',
    sympla: 'sympla',
    yuzer: 'yuzer',
    reservas: 'getin'
  }

  const sistema = webhookMapping[webhookType as keyof typeof webhookMapping] || 'sistema'

  const { data: webhookConfig, error } = await supabaseClient
    .from('api_credentials')
    .select('configuracoes')
    .eq('bar_id', barId)
    .eq('sistema', sistema)
    .eq('ambiente', 'producao')
    .single()

  if (error || !webhookConfig) {
    console.warn(`⚠️ Webhook config não encontrada para bar ${barId} sistema ${sistema}, usando fallback`)
    // Fallback para webhook padrão se não encontrar configuração
    return 'https://discord.com/api/webhooks/1391531226246021261/kxCJKKT7h7EnpVvNQj7oeJ3slqJOCAiXxB16SSOpuTn8EkmYDz3wIAAZpjpkUY3bnoWJ'
  }

  const webhook = webhookConfig.configuracoes?.webhook_url
  
  if (!webhook || webhook.trim() === '') {
    console.warn(`⚠️ Webhook ${webhookType} não configurado para bar ${barId}, usando fallback`)
    // Fallback para webhook padrão
    return 'https://discord.com/api/webhooks/1391531226246021261/kxCJKKT7h7EnpVvNQj7oeJ3slqJOCAiXxB16SSOpuTn8EkmYDz3wIAAZpjpkUY3bnoWJ'
  }

  console.log(`✅ Webhook ${webhookType} encontrado para bar ${barId}`)
  return webhook
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const notification: DiscordNotification = await req.json()
    
    if (!notification.bar_id) {
      throw new Error('bar_id é obrigatório')
    }

    console.log(`📢 Enviando notificação para Discord (Bar: ${notification.bar_id}, Tipo: ${notification.webhook_type || 'sistema'}):`, notification.title)

    // Buscar webhook da tabela baseado no bar_id e tipo
    const webhookUrl = await getWebhookUrl(notification.bar_id, notification.webhook_type || 'sistema')

    // Estrutura do embed do Discord
    const embed = {
      title: notification.title,
      description: notification.description,
      color: notification.color || 0x00ff00, // Verde por padrão
      fields: notification.fields || [],
      footer: notification.footer || {
        text: `SGB v2 • Bar: ${notification.bar_id} • ${new Date().toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo'
        })}`
      },
      timestamp: new Date().toISOString()
    }

    // Payload do Discord
    const discordPayload = {
      username: `SGB ${notification.webhook_type?.toUpperCase() || 'SISTEMA'} Bot`,
      avatar_url: 'https://cdn.discordapp.com/icons/YOUR_GUILD_ID/YOUR_ICON.png', // Opcional
      embeds: [embed]
    }

    // Enviar para Discord
    const response = await fetch(webhookUrl, {
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
      message: 'Notificação enviada para Discord',
      webhook_type: notification.webhook_type || 'sistema',
      bar_id: notification.bar_id
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