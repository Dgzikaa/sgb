import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

// Datas de início da entrada obrigatória
const DATAS_ENTRADA = {
  quarta: '2025-11-19',
  sexta: '2025-11-14'
}

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await getAdminClient()
    const barId = 3
    
    console.log('🚀 Análise de couvert (RPC otimizada)...')
    const startTime = Date.now()

    // 🚀 USAR RPC OTIMIZADA
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('get_analise_couvert_stats', { 
        p_bar_id: barId,
        p_data_inicio: '2025-09-01',
        p_data_entrada_quarta: DATAS_ENTRADA.quarta,
        p_data_entrada_sexta: DATAS_ENTRADA.sexta
      })
    
    if (rpcError) {
      console.error('Erro na RPC:', rpcError)
      throw new Error(`Erro ao buscar dados: ${rpcError.message}`)
    }

    const tempoMs = Date.now() - startTime
    console.log(`✅ Análise completa em ${tempoMs}ms`)

    // Formatar resposta
    const formatarMetricas = (stats: any, periodo: string) => {
      if (!stats) return { periodo, total_comandas: 0, total_dias: 0, comandas_por_dia: 0, clientes_unicos_total: 0, ticket_medio: 0, desconto_medio: 0, ticket_liquido: 0, faturamento_bruto_total: 0, faturamento_liquido_total: 0 }
      return {
        periodo,
        total_comandas: stats.total_comandas || 0,
        total_dias: stats.total_dias || 0,
        comandas_por_dia: stats.total_dias > 0 ? Math.round((stats.total_comandas / stats.total_dias) * 100) / 100 : 0,
        clientes_unicos_total: stats.clientes_unicos || 0,
        clientes_unicos_por_dia: stats.total_dias > 0 ? Math.round((stats.clientes_unicos / stats.total_dias) * 100) / 100 : 0,
        ticket_medio: stats.ticket_medio || 0,
        desconto_medio: stats.desconto_medio || 0,
        ticket_liquido: (stats.ticket_medio || 0) - (stats.desconto_medio || 0),
        faturamento_bruto_total: stats.faturamento_bruto || 0,
        faturamento_bruto_por_dia: stats.total_dias > 0 ? Math.round((stats.faturamento_bruto / stats.total_dias) * 100) / 100 : 0,
        faturamento_liquido_total: stats.faturamento_liquido || 0,
        faturamento_liquido_por_dia: stats.total_dias > 0 ? Math.round((stats.faturamento_liquido / stats.total_dias) * 100) / 100 : 0
      }
    }

    const formatarRecorrencia = (rec: any) => {
      if (!rec) return { clientes_antes: 0, clientes_depois: 0, retornaram: 0, novos_clientes: 0, deixaram_de_ir: 0 }
      return {
        clientes_antes: rec.clientes_antes || 0,
        clientes_depois: rec.clientes_depois || 0,
        retornaram: rec.retornaram || 0,
        novos_clientes: rec.novos || 0,
        deixaram_de_ir: (rec.clientes_antes || 0) - (rec.retornaram || 0),
        dias_antes: 0,
        dias_depois: 0,
        clientes_recorrentes_depois: 0,
        clientes_uma_vez_depois: 0,
        taxa_recorrencia_depois: 0
      }
    }

    return NextResponse.json({
      success: true,
      datasEntrada: DATAS_ENTRADA,
      quartas: {
        ticket: [
          formatarMetricas(rpcResult?.quartas?.antes, 'antes'),
          formatarMetricas(rpcResult?.quartas?.depois, 'depois')
        ],
        recorrencia: formatarRecorrencia(rpcResult?.quartas?.recorrencia),
        evolucao: rpcResult?.quartas?.evolucao || [],
        baseline: { clientes_setembro: 0, retornaram_outubro: 0 }
      },
      sextas: {
        ticket: [
          formatarMetricas(rpcResult?.sextas?.antes, 'antes'),
          formatarMetricas(rpcResult?.sextas?.depois, 'depois')
        ],
        recorrencia: formatarRecorrencia(rpcResult?.sextas?.recorrencia),
        evolucao: rpcResult?.sextas?.evolucao || [],
        baseline: { clientes_setembro: 0, retornaram_outubro: 0 }
      },
      tempo_processamento_ms: tempoMs
    })

  } catch (error) {
    console.error('Erro na análise de couvert:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao buscar dados de análise' 
    }, { status: 500 })
  }
}
