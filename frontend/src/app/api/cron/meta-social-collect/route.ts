import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMetaSocialService } from '@/lib/meta-social-service'

// Configuraá§á£o do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ========================================
// ðŸ• POST /api/cron/meta-social-collect
// Endpoint para execuá§á£o automá¡tica via cron
// ========================================
export async function POST(request: NextRequest) {
  const executionId = `meta-collect-${Date.now()}`
  
  try {
    console.log(`ðŸ• [${executionId}] Iniciando coleta automá¡tica de má©tricas sociais...`)

    // Verificar autorizaá§á£o do cron (Vercel Cron ou token interno)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error(`Œ [${executionId}] Acesso ná£o autorizado ao cron`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar todas as configuraá§áµes ativas
    const { data: configuracoes, error: configError } = await supabase
      .from('api_credentials')
      .select('bar_id, configuracoes')
      .eq('ativo', true)
      .eq('sistema', 'meta')

    if (configError) {
      console.error(`Œ [${executionId}] Erro ao buscar configuraá§áµes:`, configError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!configuracoes || configuracoes.length === 0) {
      console.log(`„¹ï¸ [${executionId}] Nenhuma configuraá§á£o ativa encontrada`)
      return NextResponse.json({ 
        message: 'Nenhuma configuraá§á£o ativa encontrada',
        processed: 0 
      })
    }

    console.log(`ðŸ“Š [${executionId}] Encontradas ${configuracoes.length} configuraá§áµes ativas`)

    const results = {
      total_configs: configuracoes.length,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    }

    const now = new Date()

    // Processar cada configuraá§á£o
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

        // Verificar se á© hora de coletar
        const proximaColeta = new Date(config.proxima_coleta)
        
        if (proximaColeta > now) {
          console.log(`­ï¸ [${executionId}] Bar ${barId}: Prá³xima coleta em ${proximaColeta.toISOString()}`)
          resultDetail.status = 'skipped'
          resultDetail.reason = 'Ná£o á© hora de coletar ainda'
          results.skipped++
          results.details.push(resultDetail)
          continue
        }

        // Verificar se ná£o coletou muito recentemente (evitar duplicatas)
        if (config.ultima_coleta) {
          const ultimaColeta = new Date(config.ultima_coleta)
          const diffHours = (now.getTime() - ultimaColeta.getTime()) / (1000 * 60 * 60)
          
          if (diffHours < (config.frequencia_coleta_horas - 0.5)) {
            console.log(`­ï¸ [${executionId}] Bar ${barId}: Coleta recente há¡ ${diffHours.toFixed(1)}h`)
            resultDetail.status = 'skipped'
            resultDetail.reason = 'Coleta muito recente'
            results.skipped++
            results.details.push(resultDetail)
            continue
          }
        }

        // Criar serviá§o de coleta
        const metaService = await createMetaSocialService(barId)
        if (!metaService) {
          console.error(`Œ [${executionId}] Bar ${barId}: Ná£o foi possá­vel criar serviá§o Meta`)
          resultDetail.status = 'failed'
          resultDetail.error = 'Configuraá§á£o invá¡lida'
          results.failed++
          results.details.push(resultDetail)
          continue
        }

        console.log(`ðŸš€ [${executionId}] Bar ${barId}: Iniciando coleta...`)

        // Executar coleta completa
        const collectResult = await metaService.collectAllMetrics()

        if (collectResult) {
          console.log(`œ… [${executionId}] Bar ${barId}: Coleta realizada com sucesso`)
          
          // Atualizar timestamps da configuraá§á£o
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
          console.error(`Œ [${executionId}] Bar ${barId}: Falha na coleta`)
          resultDetail.status = 'failed'
          resultDetail.error = 'Falha na coleta de má©tricas'
          results.failed++
        }

        results.processed++

      } catch (error: any) {
        console.error(`Œ [${executionId}] Bar ${barId}: Erro durante coleta:`, error)
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
    console.log(`ðŸ [${executionId}] Coleta automá¡tica finalizada:`, {
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
      message: `Processadas ${results.processed} configuraá§áµes. ${results.successful} sucessos, ${results.failed} falhas, ${results.skipped} ignoradas.`
    })

  } catch (error: any) {
    console.error(`Œ [${executionId}] Erro crá­tico na coleta automá¡tica:`, error)
    
    return NextResponse.json({
      success: false,
      execution_id: executionId,
      error: 'Erro crá­tico durante execuá§á£o',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// ========================================
// ðŸ“‹ GET /api/cron/meta-social-collect
// Status das prá³ximas execuá§áµes agendadas
// ========================================
export async function GET(request: NextRequest) {
  try {
    console.log('ðŸ“‹ Consultando status das coletas agendadas...')

    // Buscar configuraá§áµes com prá³ximas coletas
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
      console.error('Œ Erro ao buscar configuraá§áµes:', error)
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

    // Calcular estatá­sticas
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
    console.error('Œ Erro ao consultar agendamentos:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 
