import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMetaSocialService } from '@/lib/meta-social-service'

// Configura·ß·£o do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ========================================
// üïê POST /api/cron/meta-social-collect
// Endpoint para execu·ß·£o autom·°tica via cron
// ========================================
export async function POST(request: NextRequest) {
  const executionId = `meta-collect-${Date.now()}`
  
  try {
    console.log(`üïê [${executionId}] Iniciando coleta autom·°tica de m·©tricas sociais...`)

    // Verificar autoriza·ß·£o do cron (Vercel Cron ou token interno)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error(`ùå [${executionId}] Acesso n·£o autorizado ao cron`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar todas as configura·ß·µes ativas
    const { data: configuracoes, error: configError } = await supabase
      .from('api_credentials')
      .select('bar_id, configuracoes')
      .eq('ativo', true)
      .eq('sistema', 'meta')

    if (configError) {
      console.error(`ùå [${executionId}] Erro ao buscar configura·ß·µes:`, configError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!configuracoes || configuracoes.length === 0) {
      console.log(`ÑπÔ∏è [${executionId}] Nenhuma configura·ß·£o ativa encontrada`)
      return NextResponse.json({ 
        message: 'Nenhuma configura·ß·£o ativa encontrada',
        processed: 0 
      })
    }

    console.log(`üìä [${executionId}] Encontradas ${configuracoes.length} configura·ß·µes ativas`)

    const results = {
      total_configs: configuracoes.length,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    }

    const now = new Date()

    // Processar cada configura·ß·£o
    for (const config of configuracoes) {
      const barId = config.bar_id
      const resultDetail = {
        bar_id: barId,
        status: 'pending',
        error: null,
        collections: []
      }

      try {
        console.log(`üîç [${executionId}] Processando bar ${barId}...`)

        // Verificar se ·© hora de coletar
        const proximaColeta = new Date(config.proxima_coleta)
        
        if (proximaColeta > now) {
          console.log(`è≠Ô∏è [${executionId}] Bar ${barId}: Pr·≥xima coleta em ${proximaColeta.toISOString()}`)
          resultDetail.status = 'skipped'
          resultDetail.reason = 'N·£o ·© hora de coletar ainda'
          results.skipped++
          results.details.push(resultDetail)
          continue
        }

        // Verificar se n·£o coletou muito recentemente (evitar duplicatas)
        if (config.ultima_coleta) {
          const ultimaColeta = new Date(config.ultima_coleta)
          const diffHours = (now.getTime() - ultimaColeta.getTime()) / (1000 * 60 * 60)
          
          if (diffHours < (config.frequencia_coleta_horas - 0.5)) {
            console.log(`è≠Ô∏è [${executionId}] Bar ${barId}: Coleta recente h·° ${diffHours.toFixed(1)}h`)
            resultDetail.status = 'skipped'
            resultDetail.reason = 'Coleta muito recente'
            results.skipped++
            results.details.push(resultDetail)
            continue
          }
        }

        // Criar servi·ßo de coleta
        const metaService = await createMetaSocialService(barId)
        if (!metaService) {
          console.error(`ùå [${executionId}] Bar ${barId}: N·£o foi poss·≠vel criar servi·ßo Meta`)
          resultDetail.status = 'failed'
          resultDetail.error = 'Configura·ß·£o inv·°lida'
          results.failed++
          results.details.push(resultDetail)
          continue
        }

        console.log(`üöÄ [${executionId}] Bar ${barId}: Iniciando coleta...`)

        // Executar coleta completa
        const collectResult = await metaService.collectAllMetrics()

        if (collectResult) {
          console.log(`úÖ [${executionId}] Bar ${barId}: Coleta realizada com sucesso`)
          
          // Atualizar timestamps da configura·ß·£o
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
          console.error(`ùå [${executionId}] Bar ${barId}: Falha na coleta`)
          resultDetail.status = 'failed'
          resultDetail.error = 'Falha na coleta de m·©tricas'
          results.failed++
        }

        results.processed++

      } catch (error) {
        console.error(`ùå [${executionId}] Bar ${barId}: Erro durante coleta:`, error)
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
    console.log(`üèÅ [${executionId}] Coleta autom·°tica finalizada:`, {
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
      message: `Processadas ${results.processed} configura·ß·µes. ${results.successful} sucessos, ${results.failed} falhas, ${results.skipped} ignoradas.`
    })

  } catch (error) {
    console.error(`ùå [${executionId}] Erro cr·≠tico na coleta autom·°tica:`, error)
    
    return NextResponse.json({
      success: false,
      execution_id: executionId,
      error: 'Erro cr·≠tico durante execu·ß·£o',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// ========================================
// üìã GET /api/cron/meta-social-collect
// Status das pr·≥ximas execu·ß·µes agendadas
// ========================================
export async function GET(request: NextRequest) {
  try {
    console.log('üìã Consultando status das coletas agendadas...')

    // Buscar configura·ß·µes com pr·≥ximas coletas
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
      console.error('ùå Erro ao buscar configura·ß·µes:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const now = new Date()
    const agendamentos = configuracoes?.map((config) => {
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

    // Calcular estat·≠sticas
    const stats = {
      total_configuracoes: agendamentos.length,
      ativas: agendamentos.filter((a) => a.status === 'ativo').length,
      em_atraso: agendamentos.filter((a) => a.em_atraso).length,
      proxima_execucao: agendamentos.find((a) => !a.em_atraso)?.proxima_coleta || null
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      stats,
      agendamentos: agendamentos.slice(0, 20) // Limitar retorno
    })

  } catch (error) {
    console.error('ùå Erro ao consultar agendamentos:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 
