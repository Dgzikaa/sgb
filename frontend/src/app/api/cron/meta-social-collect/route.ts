import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMetaSocialService } from '@/lib/meta-social-service'

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ========================================
// 🕐 POST /api/cron/meta-social-collect
// Endpoint para execução automática via cron
// ========================================
export async function POST(request: NextRequest) {
  const executionId = `meta-collect-${Date.now()}`
  
  try {
    console.log(`🕐 [${executionId}] Iniciando coleta automática de métricas sociais...`)

    // Verificar autorização do cron (Vercel Cron ou token interno)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error(`❌ [${executionId}] Acesso não autorizado ao cron`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar todas as configurações ativas
    const { data: configuracoes, error: configError } = await supabase
      .from('api_credentials')
      .select('bar_id, configuracoes')
      .eq('ativo', true)
      .eq('sistema', 'meta')

    if (configError) {
      console.error(`❌ [${executionId}] Erro ao buscar configurações:`, configError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!configuracoes || configuracoes.length === 0) {
      console.log(`ℹ️ [${executionId}] Nenhuma configuração ativa encontrada`)
      return NextResponse.json({ 
        message: 'Nenhuma configuração ativa encontrada',
        processed: 0 
      })
    }

    console.log(`📊 [${executionId}] Encontradas ${configuracoes.length} configurações ativas`)

    const results = {
      total_configs: configuracoes.length,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    }

    const now = new Date()

    // Processar cada configuração
    for (const config of configuracoes) {
      const barId = config.bar_id
      const resultDetail: any = {
        bar_id: barId,
        status: 'pending',
        error: null,
        collections: []
      }

      try {
        console.log(`🔍 [${executionId}] Processando bar ${barId}...`)

        // Verificar se é hora de coletar
        const proximaColeta = new Date(config.proxima_coleta)
        
        if (proximaColeta > now) {
          console.log(`⏭️ [${executionId}] Bar ${barId}: Próxima coleta em ${proximaColeta.toISOString()}`)
          resultDetail.status = 'skipped'
          resultDetail.reason = 'Não é hora de coletar ainda'
          results.skipped++
          results.details.push(resultDetail)
          continue
        }

        // Verificar se não coletou muito recentemente (evitar duplicatas)
        if (config.ultima_coleta) {
          const ultimaColeta = new Date(config.ultima_coleta)
          const diffHours = (now.getTime() - ultimaColeta.getTime()) / (1000 * 60 * 60)
          
          if (diffHours < (config.frequencia_coleta_horas - 0.5)) {
            console.log(`⏭️ [${executionId}] Bar ${barId}: Coleta recente há ${diffHours.toFixed(1)}h`)
            resultDetail.status = 'skipped'
            resultDetail.reason = 'Coleta muito recente'
            results.skipped++
            results.details.push(resultDetail)
            continue
          }
        }

        // Criar serviço de coleta
        const metaService = await createMetaSocialService(barId)
        if (!metaService) {
          console.error(`❌ [${executionId}] Bar ${barId}: Não foi possível criar serviço Meta`)
          resultDetail.status = 'failed'
          resultDetail.error = 'Configuração inválida'
          results.failed++
          results.details.push(resultDetail)
          continue
        }

        console.log(`🚀 [${executionId}] Bar ${barId}: Iniciando coleta...`)

        // Executar coleta completa
        const collectResult = await metaService.collectAllMetrics()

        if (collectResult) {
          console.log(`✅ [${executionId}] Bar ${barId}: Coleta realizada com sucesso`)
          
          // Atualizar timestamps da configuração
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
          console.error(`❌ [${executionId}] Bar ${barId}: Falha na coleta`)
          resultDetail.status = 'failed'
          resultDetail.error = 'Falha na coleta de métricas'
          results.failed++
        }

        results.processed++

      } catch (error: any) {
        console.error(`❌ [${executionId}] Bar ${barId}: Erro durante coleta:`, error)
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
    console.log(`🏁 [${executionId}] Coleta automática finalizada:`, {
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
      message: `Processadas ${results.processed} configurações. ${results.successful} sucessos, ${results.failed} falhas, ${results.skipped} ignoradas.`
    })

  } catch (error: any) {
    console.error(`❌ [${executionId}] Erro crítico na coleta automática:`, error)
    
    return NextResponse.json({
      success: false,
      execution_id: executionId,
      error: 'Erro crítico durante execução',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// ========================================
// 📋 GET /api/cron/meta-social-collect
// Status das próximas execuções agendadas
// ========================================
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Consultando status das coletas agendadas...')

    // Buscar configurações com próximas coletas
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
      console.error('❌ Erro ao buscar configurações:', error)
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

    // Calcular estatísticas
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
    console.error('❌ Erro ao consultar agendamentos:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 
