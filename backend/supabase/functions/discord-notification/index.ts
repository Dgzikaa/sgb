import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface DiscordMessage {
  title: string
  message?: string
  processed_records?: number
  bar_id: number
  execution_time?: string
  webhook_type: 'nibo' | 'contahub' | 'eventos'
  custom_message?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, message, processed_records, bar_id, execution_time, webhook_type, custom_message }: DiscordMessage = await req.json()

    // Buscar webhook baseado no tipo
    let webhookUrl: string | undefined
    
    switch (webhook_type) {
      case 'nibo':
        webhookUrl = Deno.env.get('DISCORD_NIBO_WEBHOOK')
        break
      case 'contahub':
        webhookUrl = Deno.env.get('DISCORD_CONTAHUB_WEBHOOK')
        break
      case 'eventos':
        webhookUrl = Deno.env.get('DISCORD_EVENTOS_WEBHOOK')
        break
      default:
        throw new Error(`Tipo de webhook inválido: ${webhook_type}`)
    }
    
    if (!webhookUrl) {
      throw new Error(`DISCORD_${webhook_type.toUpperCase()}_WEBHOOK não configurado`)
    }

    // Criar mensagem baseada no tipo
    let defaultMessage = ''
    let footerText = ''
    let color = 3066993 // Verde padrão

    switch (webhook_type) {
      case 'nibo':
        defaultMessage = `🎉 **Processamento NIBO finalizado com sucesso!**

📊 **Resumo:**
• **Total processados:** ${processed_records || 0} agendamentos
• **Bar ID:** ${bar_id}
• **Tempo total:** ${execution_time || 'N/A'}

💾 **Dados atualizados:**
• Agendamentos sincronizados com API NIBO
• C.Art e C.Prod recalculados
• Status e valores atualizados

⏰ **Concluído:** ${new Date().toLocaleString('pt-BR')}
🚀 **Próxima execução:** Automática via pg_cron`
        footerText = 'SGB NIBO Automation'
        break

      case 'contahub':
        defaultMessage = `🎉 **Processamento ContaHub finalizado com sucesso!**

📊 **Resumo:**
• **Total processados:** ${processed_records || 0} registros
• **Bar ID:** ${bar_id}
• **Tempo total:** ${execution_time || 'N/A'}

💾 **Dados atualizados:**
• Analítico, FatPorHora, Pagamentos, Período e Tempo
• Métricas e indicadores recalculados

⏰ **Concluído:** ${new Date().toLocaleString('pt-BR')}
🚀 **Próxima execução:** Automática via pg_cron`
        footerText = 'SGB ContaHub Automation'
        color = 3447003 // Azul
        break

      case 'eventos':
        defaultMessage = `🎉 **Sincronização de eventos finalizada!**

📊 **Resumo:**
• **Dados processados:** ${processed_records || 0} registros
• **Bar ID:** ${bar_id}
• **Tempo total:** ${execution_time || 'N/A'}

💾 **Atualizações:**
• Sympla, Yuzer e eventos sincronizados
• Métricas de vendas e participantes
• Indicadores de performance

⏰ **Concluído:** ${new Date().toLocaleString('pt-BR')}
🚀 **Sistema:** Automático`
        footerText = 'SGB Eventos Automation'
        color = 15105570 // Laranja
        break
    }

    // Criar payload do Discord
    const discordPayload = {
      embeds: [{
        title: title,
        description: custom_message || message || defaultMessage,
        color: color,
        timestamp: new Date().toISOString(),
        footer: {
          text: footerText
        }
      }]
    }

    // Enviar para Discord
    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload)
    })

    if (!discordResponse.ok) {
      throw new Error(`Discord webhook failed: ${discordResponse.status}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notificação Discord enviada com sucesso',
        webhook_type,
        processed_records,
        bar_id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro ao enviar Discord:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})