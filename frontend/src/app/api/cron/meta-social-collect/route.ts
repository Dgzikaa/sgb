import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMetaSocialService } from '@/lib/meta-social-service'

// ConfiguraÃ§Ã£o do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ========================================
// ðŸ• POST /api/cron/meta-social-collect
// Endpoint para execuÃ§Ã£o automÃ¡tica via cron
// ========================================
export async function POST(request: NextRequest) {
  const executionId = `meta-collect-${Date.now()}`
  
  try {
    console.log(`ðŸ• [${executionId}] Iniciando coleta automÃ¡tica de mÃ©tricas sociais...`)

    // Verificar autorizaÃ§Ã£o do cron (Vercel Cron ou token interno)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error(`âŒ [${executionId}] Acesso nÃ£o autorizado ao cron`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar todas as configuraÃ§Ãµes ativas
    const { data: configuracoes, error: configError } = await supabase
      .from('api_credentials')
      .select('bar_id, configuracoes')
      .eq('ativo', true)
      .eq('sistema', 'meta')

    if (configError) {
      console.error(`âŒ [${executionId}] Erro ao buscar configuraÃ§Ãµes:`, configError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!configuracoes || configuracoes.length === 0) {
      console.log(`â„¹ï¸ [${executionId}] Nenhuma configuraÃ§Ã£o ativa encontrada`)
      return NextResponse.json({ 
        message: 'Nenhuma configuraÃ§Ã£o ativa encontrada',
        processed: 0 
      })
    }

    console.log(`ðŸ“Š [${executionId}] Encontradas ${configuracoes.length} configuraÃ§Ãµes ativas`)

    const results = {
      total_configs: configuracoes.length,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    }

    const now = new Date()

    // Processar cada configuraÃ§Ã£o
    for (const config of configuracoes) {
      const barId = config.bar_id
      const resultDetail: any = {
        bar_id: barId,
        status: 'pending',
        error: null,
        collections: []
      }

      try {
        console.log(`ðŸ” [${executionId}] Processando bar ${barId}...`)

        // Verificar se Ã© hora de coletar
        const proximaColeta = new Date(config.proxima_coleta)
        
        if (proximaColeta > now) {
          console.log(`â­ï¸ [${executionId}] Bar ${barId}: PrÃ³xima coleta em ${proximaColeta.toISOString()}`)
          resultDetail.status = 'skipped'
          resultDetail.reason = 'NÃ£o Ã© hora de coletar ainda'
          results.skipped++
          results.details.push(resultDetail)
          continue
        }

        // Verificar se nÃ£o coletou muito recentemente (evitar duplicatas)
        if (config.ultima_coleta) {
          const ultimaColeta = new Date(config.ultima_coleta)
          const diffHours = (now.getTime() - ultimaColeta.getTime()) / (1000 * 60 * 60)
          
          if (diffHours < (config.frequencia_coleta_horas - 0.5)) {
            console.log(`â­ï¸ [${executionId}] Bar ${barId}: Coleta recente hÃ¡ ${diffHours.toFixed(1)}h`)
            resultDetail.status = 'skipped'
            resultDetail.reason = 'Coleta muito recente'
            results.skipped++
            results.details.push(resultDetail)
            continue
          }
        }

        // Criar serviÃ§o de coleta
        const metaService = await createMetaSocialService(barId)
        if (!metaService) {
          console.error(`âŒ [${executionId}] Bar ${barId}: NÃ£o foi possÃ­vel criar serviÃ§o Meta`)
          resultDetail.status = 'failed'
          resultDetail.error = 'ConfiguraÃ§Ã£o invÃ¡lida'
          results.failed++
          results.details.push(resultDetail)
          continue
        }

        console.log(`ðŸš€ [${executionId}] Bar ${barId}: Iniciando coleta...`)

        // Executar coleta completa
        const collectResult = await metaService.collectAllMetrics()

        if (collectResult) {
          console.log(`âœ… [${executionId}] Bar ${barId}: Coleta realizada com sucesso`)
          
          // Atualizar timestamps da configuraÃ§Ã£o
          const proximaColetaFutura = new Date(now)
          proximaColetaFutura.setHours(proximaColetaFutura.getHours() + config.frequencia_coleta_horas)

          await supabase
            .from('api_credentials')
            .update({
              configuracoes: {
                ...config.configuracoes,
                ultima_coleta: now.toISOString(),
                proxima_coleta: proximaColetaFutura.toISOString()
              }
            })
            .eq('bar_id', barId)
            .eq('sistema', 'meta')

          resultDetail.status = 'success'
          resultDetail.collections = ['facebook_metrics', 'instagram_metrics', 'posts', 'consolidated']
          results.successful++

        } else {
          console.error(`âŒ [${executionId}] Bar ${barId}: Falha na coleta`)
          resultDetail.status = 'failed'
          resultDetail.error = 'Falha na coleta de mÃ©tricas'
          results.failed++
        }

        results.processed++

      } catch (error: any) {
        console.error(`âŒ [${executionId}] Bar ${barId}: Erro durante coleta:`, error)
        resultDetail.status = 'failed'
        resultDetail.error = error.message
        results.failed++
        results.processed++
      }

      results.details.push(resultDetail)

      // Pequena pausa entre coletas para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // Log final
    console.log(`ðŸ [${executionId}] Coleta automÃ¡tica finalizada:`, {
      processed: results.processed,
      successful: results.successful,
      failed: results.failed,
      skipped: results.skipped
    })

    // Retornar resultado
    return NextResponse.json({
      success: true,
      execution_id: executionId,
      timestamp: now.toISOString(),
      summary: results,
      message: `Processadas ${results.processed} configuraÃ§Ãµes. ${results.successful} sucessos, ${results.failed} falhas, ${results.skipped} ignoradas.`
    })

  } catch (error: any) {
    console.error(`âŒ [${executionId}] Erro crÃ­tico na coleta automÃ¡tica:`, error)
    
    return NextResponse.json({
      success: false,
      execution_id: executionId,
      error: 'Erro crÃ­tico durante execuÃ§Ã£o',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// ========================================
// ðŸ“‹ GET /api/cron/meta-social-collect
// Status das prÃ³ximas execuÃ§Ãµes agendadas
// ========================================
export async function GET(request: NextRequest) {
  try {
    console.log('ðŸ“‹ Consultando status das coletas agendadas...')

    // Buscar configuraÃ§Ãµes com prÃ³ximas coletas
    const { data: configuracoes, error } = await supabase
      .from('api_credentials')
      .select(`
        bar_id,
        ativo,
        configuracoes
      `)
      .eq('ativo', true)
      .eq('sistema', 'meta')

    if (error) {
      console.error('âŒ Erro ao buscar configuraÃ§Ãµes:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const now = new Date()
    const agendamentos = configuracoes?.map((config: any) => {
      const proximaColeta = new Date(config.proxima_coleta)
      const minutosRestantes = Math.round((proximaColeta.getTime() - now.getTime()) / (1000 * 60))
      
      return {
        bar_id: config.bar_id,
        proxima_coleta: config.proxima_coleta,
        minutos_restantes: minutosRestantes,
        em_atraso: minutosRestantes < 0,
        frequencia_horas: config.frequencia_coleta_horas,
        ultima_coleta: config.ultima_coleta,
        status: config.coleta_automatica ? 'ativo' : 'pausado'
      }
    }) || []

    // Calcular estatÃ­sticas
    const stats = {
      total_configuracoes: agendamentos.length,
      ativas: agendamentos.filter((a: any) => a.status === 'ativo').length,
      em_atraso: agendamentos.filter((a: any) => a.em_atraso).length,
      proxima_execucao: agendamentos.find((a: any) => !a.em_atraso)?.proxima_coleta || null
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      stats,
      agendamentos: agendamentos.slice(0, 20) // Limitar retorno
    })

  } catch (error: any) {
    console.error('âŒ Erro ao consultar agendamentos:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 
