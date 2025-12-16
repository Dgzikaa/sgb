import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }
    
    const supabase = await getAdminClient()
    const startTime = Date.now()
    
    // Obter bar_id do header
    const barIdHeader = request.headers.get('x-user-data')
    let barId: number | null = null
    if (barIdHeader) {
      try {
        const parsed = JSON.parse(barIdHeader)
        if (parsed?.bar_id) barId = parseInt(String(parsed.bar_id))
      } catch (error) {
        console.warn('Erro ao parsear barIdHeader:', error)
      }
    }
    
    if (!barId) {
      return NextResponse.json({ error: 'bar_id é obrigatório' }, { status: 400 })
    }

    console.log(`📊 Buscando tempo de estadia para bar_id=${barId}...`)

    // 🚀 USAR RPC OTIMIZADA (agregação no banco)
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('get_tempo_estadia_stats', { p_bar_id: barId })
    
    if (rpcError) {
      console.error('Erro na RPC:', rpcError)
      throw new Error(`Erro ao buscar dados: ${rpcError.message}`)
    }
    
    if (!rpcResult) {
      return NextResponse.json({
        estatisticas: {
          total_vendas: 0,
          tempo_medio_geral_minutos: 0,
          tempo_medio_formatado: '0h 0min'
        },
        por_mes: [],
        por_dia_semana: [],
        por_semana: [],
        distribuicao_faixas: [],
        top_clientes_maior_tempo: []
      })
    }

    // Formatar tempo médio
    const tempoMedio = rpcResult.estatisticas?.tempo_medio_geral_minutos || 0
    const tempoFormatado = `${Math.floor(tempoMedio / 60)}h ${Math.round(tempoMedio % 60)}min`

    const tempoMs = Date.now() - startTime
    console.log(`✅ Relatório gerado em ${tempoMs}ms - ${rpcResult.estatisticas?.total_vendas || 0} vendas`)

    return NextResponse.json({
      estatisticas: {
        total_vendas: rpcResult.estatisticas?.total_vendas || 0,
        tempo_medio_geral_minutos: tempoMedio,
        tempo_medio_formatado: tempoFormatado
      },
      por_mes: rpcResult.por_mes || [],
      por_dia_semana: rpcResult.por_dia_semana || [],
      por_semana: [], // Removido por simplicidade (pode adicionar depois se necessário)
      distribuicao_faixas: rpcResult.distribuicao_faixas || [],
      top_clientes_maior_tempo: rpcResult.top_clientes_maior_tempo || []
    })
    
  } catch (error) {
    console.error('Erro na API tempo-estadia:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
