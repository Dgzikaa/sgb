import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Token de autenticaÃ§Ã£o para pgcron
const CRON_TOKEN = 'sgb-meta-cron-2025'

// FunÃ§Ã£o para buscar webhook da tabela api_credentials
async function getWebhookUrl(barId: number, webhookType = 'meta') {
  const { data: webhookConfig, error } = await supabase
    .from('api_credentials')
    .select('configuracoes')
    .eq('bar_id', barId)
    .eq('sistema', 'meta')
    .eq('ambiente', 'producao')
    .eq('ativo', true)
    .single()

  if (error || !webhookConfig) {
    console.warn(`Å¡Â Ã¯Â¸Â Webhook config nÃ£o encontrada para bar ${barId}, erro:`, error)
    // Usar webhook Meta como fallback
    return 'https://discord.com/api/webhooks/1391538130737303674/V6WiwfJodQT3C7WqdJTpmyaOLJByuKR8KZwtxW9ATmEqo0N4Msh73pF7PmOEVc12hx75'
  }

  const webhook = webhookConfig.configuracoes?.webhook_url
  
  if (!webhook || webhook.trim() === '') {
    console.warn(`Å¡Â Ã¯Â¸Â Webhook ${webhookType} nÃ£o configurado para bar ${barId}`)
    // Usar webhook Meta como fallback
    return 'https://discord.com/api/webhooks/1391538130737303674/V6WiwfJodQT3C7WqdJTpmyaOLJByuKR8KZwtxW9ATmEqo0N4Msh73pF7PmOEVc12hx75'
  }

  return webhook
}

// FunÃ§Ã£o para enviar notificaÃ§Ã£o Discord
async function enviarNotificacaoDiscord(barId: number, message: string, isError = false) {
  try {
    const webhookUrl = await getWebhookUrl(barId, 'meta')  // Corrigido: agora usa 'meta' em vez de 'sistema'
    
    const embed = {
      title: isError ? 'ÂÅ’ Erro na Coleta Meta' : 'Ã°Å¸â€œÅ  Coleta Meta AutomÃ¡Â¡tica',
      description: message,
      color: isError ? 0xff0000 : 0x00ff00,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Ã°Å¸Â¤â€“ Sistema de GestÃ£o de Bares - Meta API'
      }
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [embed]
      })
    })

    console.log('Ã°Å¸â€œÂ± NotificaÃ§Ã£o Discord enviada')
  } catch (error) {
    console.error('ÂÅ’ Erro ao enviar notificaÃ§Ã£o Discord:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Ã°Å¸Â¤â€“ Iniciando coleta automÃ¡Â¡tica Meta via pgcron...')

    // Verificar autenticaÃ§Ã£o do pgcron
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.includes(CRON_TOKEN)) {
      return NextResponse.json({ 
        error: 'Token de autorizaÃ§Ã£o invÃ¡Â¡lido para coleta automÃ¡Â¡tica' 
      }, { status: 401 })
    }

    const startTime = new Date()
    const results = {
      success: true,
      message: 'Coleta automÃ¡Â¡tica Meta executada com sucesso!',
      timestamp: startTime.toISOString(),
      collections: {} as unknown,
      summary: {
        instagram_success: false,
        facebook_success: false,
        total_api_calls: 0,
        total_duration_ms: 0,
        errors: [] as string[]
      }
    }

    console.log('Ã°Å¸â€œÂ± 1. Coletando dados do Instagram...')
    
    // 1. COLETA INSTAGRAM
    try {
      const instagramResponse = await fetch('https://sgbv2.vercel.app/api/meta/collect-instagram-posts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (instagramResponse.ok) {
        const instagramData = await instagramResponse.json()
        results.collections.instagram = {
          success: true,
          data: instagramData.data,
          api_calls: 2 // Account + Posts
        }
        results.summary.instagram_success = true
        results.summary.total_api_calls += 2
        console.log('Å“â€¦ Instagram: Sucesso')
      } else {
        const error = await instagramResponse.text()
        results.collections.instagram = {
          success: false,
          error: error,
          status: instagramResponse.status
        }
        results.summary.errors.push(`Instagram: ${error}`)
        console.log('ÂÅ’ Instagram: Erro')
      }
    } catch (error) {
      results.collections.instagram = {
        success: false,
        error: (error as unknown).message
      }
      results.summary.errors.push(`Instagram: ${(error as unknown).message}`)
      console.log('ÂÅ’ Instagram: Erro crÃ­tico')
    }

    console.log('Ã°Å¸â€œËœ 2. Coletando dados do Facebook...')
    
    // 2. COLETA FACEBOOK
    try {
      const facebookResponse = await fetch('https://sgbv2.vercel.app/api/meta/collect-facebook-full', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (facebookResponse.ok) {
        const facebookData = await facebookResponse.json()
        results.collections.facebook = {
          success: true,
          data: facebookData.data,
          api_calls: 3 // Page + Posts + Insights
        }
        results.summary.facebook_success = true
        results.summary.total_api_calls += 3
        console.log('Å“â€¦ Facebook: Sucesso')
      } else {
        const error = await facebookResponse.text()
        results.collections.facebook = {
          success: false,
          error: error,
          status: facebookResponse.status
        }
        results.summary.errors.push(`Facebook: ${error}`)
        console.log('ÂÅ’ Facebook: Erro')
      }
    } catch (error) {
      results.collections.facebook = {
        success: false,
        error: (error as unknown).message
      }
      results.summary.errors.push(`Facebook: ${(error as unknown).message}`)
      console.log('ÂÅ’ Facebook: Erro crÃ­tico')
    }

    const endTime = new Date()
    results.summary.total_duration_ms = endTime.getTime() - startTime.getTime()

    console.log('Ã°Å¸â€™Â¾ 3. Registrando execuÃ§Ã£o da coleta automÃ¡Â¡tica...')

    // 3. LOG DA EXECUÃ§Ã£O AUTOMÃ¡ÂTICA
    const logStatus = results.summary.instagram_success || results.summary.facebook_success ? 'sucesso' : 'erro'
    const registrosProcessados = (results.summary.instagram_success ? 1 : 0) + (results.summary.facebook_success ? 1 : 0)

    await supabase
      .from('meta_coletas_log')
      .insert({
        bar_id: 3,
        tipo_coleta: 'cron_automatico',
        iniciada_em: startTime.toISOString(),
        finalizada_em: endTime.toISOString(),
        status: logStatus,
        tempo_execucao_ms: results.summary.total_duration_ms,
        registros_processados: registrosProcessados,
        parametros_coleta: {
          automatic: true,
          source: 'pgcron',
          collections_attempted: ['instagram', 'facebook'],
          total_api_calls: results.summary.total_api_calls
        },
        observacoes: results.summary.errors.length > 0 ? 
          `ExecuÃ§Ã£o automÃ¡Â¡tica com ${results.summary.errors.length} erro(s)` : 
          'ExecuÃ§Ã£o automÃ¡Â¡tica bem-sucedida',
        erro_detalhes: results.summary.errors.length > 0 ? results.summary.errors.join('; ') : null
      })

    // 4. DEFINIR STATUS FINAL
    if (results.summary.errors.length > 0) {
      results.success = results.summary.instagram_success || results.summary.facebook_success
      results.message = `Coleta parcialmente bem-sucedida: ${registrosProcessados}/2 plataformas`
    }

    console.log(`Ã°Å¸Å½â€° Coleta automÃ¡Â¡tica concluÃ­da: ${registrosProcessados}/2 plataformas`)

    // 5. NOTIFICAR DISCORD
    const discordMessage = results.success 
      ? `Ã°Å¸Å½Â¯ **Coleta Meta AutomÃ¡Â¡tica ConcluÃ­da!**\n\n` +
        `Ã°Å¸ÂÂ¢ **Bar ID:** ${3}\n` +
        `ÂÂ° **HorÃ¡Â¡rio:** ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n` +
        `Ã°Å¸â€œË† **Plataformas Coletadas:** ${registrosProcessados}/2\n` +
        `Ã°Å¸â€œÅ  **API Calls:** ${results.summary.total_api_calls}\n` +
        `Å¡Â¡ **DuraÃ§Ã£o:** ${Math.round(results.summary.total_duration_ms / 1000)}s\n\n` +
        `Å“â€¦ **Instagram:** ${results.summary.instagram_success ? 'Sucesso' : 'Erro'}\n` +
        `Å“â€¦ **Facebook:** ${results.summary.facebook_success ? 'Sucesso' : 'Erro'}\n\n` +
        `Ã°Å¸â€â€ž **PrÃ³xima coleta:** ${getNextCollectionTime()}`
      : `ÂÅ’ **Erro na Coleta Meta!**\n\n` +
        `Ã°Å¸ÂÂ¢ **Bar ID:** ${3}\n` +
        `ÂÂ° **HorÃ¡Â¡rio:** ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n` +
        `Ã°Å¸Å¡Â¨ **Erros:** ${results.summary.errors.join(', ')}\n\n` +
        `Ã°Å¸â€œÅ  **Tentativas:** ${registrosProcessados}/2 plataformas`
    
    await enviarNotificacaoDiscord(3, discordMessage, !results.success)

    return NextResponse.json({
      ...results,
      results: {
        registros_novos: registrosProcessados,
        plataformas_coletadas: registrosProcessados,
        api_calls_total: results.summary.total_api_calls,
        duracao_segundos: Math.round(results.summary.total_duration_ms / 1000)
      }
    })

  } catch (error) {
    console.error('Ã°Å¸â€™Â¥ Erro crÃ­tico na coleta automÃ¡Â¡tica:', error)
    
    // Notificar Discord sobre erro crÃ­tico
    await enviarNotificacaoDiscord(3, `Ã°Å¸â€™Â¥ **Erro CrÃ­tico na Coleta Meta!**\n\nÃ°Å¸Å¡Â¨ **Erro:** ${(error as unknown).message}\nÂÂ° **HorÃ¡Â¡rio:** ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, true)
    
    // Log de erro crÃ­tico
    await supabase
      .from('meta_coletas_log')
      .insert({
        bar_id: 3,
        tipo_coleta: 'cron_automatico',
        iniciada_em: new Date().toISOString(),
        finalizada_em: new Date().toISOString(),
        status: 'erro_critico',
        erro_detalhes: (error as unknown).message,
        observacoes: 'Erro crÃ­tico na execuÃ§Ã£o automÃ¡Â¡tica'
      })

    return NextResponse.json({ 
      success: false,
      error: 'Erro crÃ­tico na coleta automÃ¡Â¡tica Meta',
      details: (error as unknown).message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// ========================================
// Ã°Å¸â€œâ€¦ GET /api/meta/auto-collect/schedule
// Verificar prÃ³xima coleta agendada
// ========================================
export async function GET(request: NextRequest) {
  try {
    const { data: config } = await supabase
      .from('api_credentials')
      .select('ultima_coleta, proxima_coleta, frequencia_coleta_horas')
      .eq('bar_id', 3)
      .eq('ativo', true)
      .single()

    const schedule = {
      enabled: !!config,
      frequency: 12, // 2x por dia = a cada 12 horas (otimizado)
      frequency_note: 'Otimizado para 2x/dia: manhÃ£ (8h) e noite (20h)',
      last_collection: config?.ultima_coleta,
      next_collection: config?.proxima_coleta || getNextCollectionTime(),
      schedule_hours: [8, 20], // HorÃ¡Â¡rios otimizados
      current_time: new Date().toISOString(),
      next_in_minutes: config?.proxima_coleta 
        ? Math.max(0, Math.round((new Date(config.proxima_coleta).getTime() - Date.now()) / 60000))
        : null,
      optimization_info: {
        api_calls_per_day: 10, // 2 coletas Ã¡â€” 5 calls cada
        rate_limit_usage: 'Muito baixo (~0.02% do limite)',
        benefits: ['Economia de recursos', 'Dados frescos 2x/dia', 'RelatÃ³rios manhÃ£/noite']
      }
    }

    return NextResponse.json(schedule)

  } catch (error) {
    console.error('Erro ao buscar schedule:', error)
    return NextResponse.json({
      enabled: false,
      error: (error as unknown).message
    }, { status: 500 })
  }
}

// ========================================
// Ã°Å¸â€Â§ FUNÃ§ÃµES AUXILIARES
// ========================================

function getNextCollectionTime(): string {
  const agora = new Date()
  const horariosColeta = [8, 20] // 08:00 e 20:00 - FrequÃªncia otimizada
  
  // Encontrar prÃ³ximo horÃ¡Â¡rio hoje
  for (const hora of horariosColeta) {
    const proxima = new Date(agora)
    proxima.setHours(hora, 0, 0, 0)
    
    if (proxima > agora) {
      return proxima.toISOString()
    }
  }
  
  // Se nenhum horÃ¡Â¡rio hoje, prÃ³ximo Ã¡Â© 08:00 de amanhÃ£
  const amanha = new Date(agora)
  amanha.setDate(amanha.getDate() + 1)
  amanha.setHours(8, 0, 0, 0) // PrÃ³xima coleta sempre Ã¡Â s 8h da manhÃ£
  return amanha.toISOString()
} 

