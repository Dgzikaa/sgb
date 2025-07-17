import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const barId = searchParams.get('bar_id') || '3'
    const periodo = searchParams.get('periodo') || '7' // dias

    const supabase = await getAdminClient()

    // Calcular datas
    const agora = new Date()
    const dataInicio = new Date(agora.getTime() - parseInt(periodo) * 24 * 60 * 60 * 1000)
    const dataHoje = new Date().toISOString().split('T')[0]

    // 1. BUSCAR MÃ¡â€°TRICAS PRINCIPAIS
    const { data: metricas, error: metricasError } = await supabase
      .from('sistema_metricas')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .gte('periodo_inicio', dataInicio.toISOString())
      .order('coletado_em', { ascending: false })

    // 2. BUSCAR KPIs
    const { data: kpis, error: kpisError } = await supabase
      .from('sistema_kpis')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('data_referencia', dataHoje)

    // 3. BUSCAR EVENTOS DE USUÃ¡ÂRIO (resumo)
    const { data: eventos, error: eventosError } = await supabase
      .from('usuario_eventos')
      .select('evento_tipo, evento_nome, user_id, timestamp_evento, tempo_gasto_segundos, dispositivo_tipo')
      .eq('bar_id', parseInt(barId))
      .gte('timestamp_evento', dataInicio.toISOString())

    // 4. BUSCAR ALERTAS ATIVOS
    const { data: alertas, error: alertasError } = await supabase
      .from('sistema_alertas')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('status_alerta', 'ativo')
      .order('criado_em', { ascending: false })
      .limit(10)

    // 5. BUSCAR PERFORMANCE (Ã¡Âºltimas 24h)
    const { data: performance, error: performanceError } = await supabase
      .from('sistema_performance')
      .select('tempo_resposta_ms, status_code, endpoint_ou_pagina, componente, timestamp_request')
      .eq('bar_id', parseInt(barId))
      .gte('timestamp_request', new Date(agora.getTime() - 24 * 60 * 60 * 1000).toISOString())

    // Verificar erros
    if (metricasError || kpisError || eventosError || alertasError || performanceError) {
      throw new Error(`Erro ao buscar dados: ${metricasError?.message || kpisError?.message || eventosError?.message || alertasError?.message || performanceError?.message}`)
    }

    // PROCESSAR DADOS PARA DASHBOARD

    // === MÃ¡â€°TRICAS RESUMIDAS ===
    const metricasResumo = {
      usuarios_ativos_hoje: eventos?.filter((e: any) => 
        e.timestamp_evento >= new Date().toISOString().split('T')[0] && e.user_id
      ).map((e: any) => e.user_id).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i).length || 0,
      
      sessoes_hoje: eventos?.filter((e: any) => 
        e.timestamp_evento >= new Date().toISOString().split('T')[0]
      ).length || 0,
      
      tempo_medio_sessao: eventos?.length ? 
        Math.round(eventos.reduce((acc: number, e: any) => acc + (e.tempo_gasto_segundos || 0), 0) / eventos.length) : 0,
        
      taxa_mobile: eventos?.length ? 
        Math.round((eventos.filter((e: any) => e.dispositivo_tipo === 'mobile').length / eventos.length) * 100) : 0
    }

    // === KPIs RESUMIDOS ===
    const kpisResumo = {
      total_kpis: kpis?.length || 0,
      kpis_atingidos: kpis?.filter((k: any) => k.status_meta === 'atingido').length || 0,
      kpis_criticos: kpis?.filter((k: any) => k.status_meta === 'critico').length || 0,
      percentual_sucesso: kpis?.length ? 
        Math.round((kpis.filter((k: any) => k.status_meta === 'atingido').length / kpis.length) * 100) : 0
    }

    // === PERFORMANCE RESUMIDA ===
    const performanceResumo = {
      tempo_resposta_medio: performance?.length ? 
        Math.round(performance.reduce((acc: number, p: any) => acc + p.tempo_resposta_ms, 0) / performance.length) : 0,
      
      total_requests: performance?.length || 0,
      taxa_erro: performance?.length ? 
        Math.round((performance.filter((p: any) => p.status_code >= 400).length / performance.length) * 100) : 0,
      
      endpoints_mais_lentos: performance
        ?.sort((a: any, b: any) => b.tempo_resposta_ms - a.tempo_resposta_ms)
        .slice(0, 5)
        .map((p: any) => ({
          endpoint: p.endpoint_ou_pagina,
          tempo_ms: p.tempo_resposta_ms,
          componente: p.componente
        })) || []
    }

    // === EVENTOS POR TIPO ===
    const eventosPorTipo = eventos?.reduce((acc: any, evento: any) => {
      acc[evento.evento_tipo] = (acc[evento.evento_tipo] || 0) + 1
      return acc
    }, {}) || {}

    // === PÃ¡ÂGINAS MAIS VISITADAS ===
    const paginasVisitadas = eventos
      ?.filter((e: any) => e.evento_tipo === 'page_view')
      ?.reduce((acc: any, evento: any) => {
        const pagina = evento.dados_evento?.pagina || 'Desconhecida'
        acc[pagina] = (acc[pagina] || 0) + 1
        return acc
      }, {}) || {}

    const topPaginas = Object.entries(paginasVisitadas)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 10)
      .map(([pagina, visitas]: [any, any]) => ({ pagina, visitas }))

    // === ALERTAS RESUMIDOS ===
    const alertasResumo = {
      total_ativos: alertas?.length || 0,
      criticos: alertas?.filter((a: any) => a.severidade === 'critical').length || 0,
      warnings: alertas?.filter((a: any) => a.severidade === 'warning').length || 0,
      errors: alertas?.filter((a: any) => a.severidade === 'error').length || 0
    }

    // === RESPOSTA FINAL ===
    return NextResponse.json({
      success: true,
      data: {
        periodo_consultado: `${periodo} dias`,
        data_ultima_atualizacao: new Date().toISOString(),
        
        // Resumos principais
        metricas_resumo: metricasResumo,
        kpis_resumo: kpisResumo,
        performance_resumo: performanceResumo,
        alertas_resumo: alertasResumo,
        
        // Dados detalhados
        kpis: kpis?.map((kpi: any) => ({
          id: kpi.id,
          categoria: kpi.categoria_kpi,
          nome: kpi.nome_kpi,
          valor_atual: kpi.valor_atual,
          valor_meta: kpi.valor_meta,
          percentual_atingido: kpi.percentual_atingido,
          status: kpi.status_meta,
          unidade: kpi.unidade,
          descricao: kpi.descricao
        })) || [],
        
        eventos_por_tipo: eventosPorTipo,
        top_paginas: topPaginas,
        
        alertas_criticos: alertas?.filter((a: any) => a.severidade === 'critical').slice(0, 5) || [],
        
        performance_trends: performance?.map((p: any) => ({
          timestamp: p.timestamp_request,
          tempo_resposta: p.tempo_resposta_ms,
          endpoint: p.endpoint_ou_pagina,
          status: p.status_code
        })) || [],
        
        // Dados brutos para grÃ¡Â¡ficos (Ã¡Âºltimos 7 dias)
        metricas_historico: metricas?.slice(0, 50) || []
      }
    })

  } catch (error) {
    console.error('ÂÅ’ Erro ao buscar dashboard analytics:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao carregar dashboard de analytics',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Endpoint para atualizar mÃ¡Â©tricas em tempo real
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bar_id, force_recalculate = false } = body

    const supabase = await getAdminClient()

    // Executar funÃ¡Â§Ã¡Â£o de cÃ¡Â¡lculo de mÃ¡Â©tricas automÃ¡Â¡ticas
    const { data: resultado, error } = await supabase
      .rpc('calcular_metricas_automaticas', { 
        target_bar_id: bar_id ? parseInt(bar_id) : null 
      })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: resultado,
      message: 'MÃ¡Â©tricas atualizadas com sucesso'
    })

  } catch (error) {
    console.error('ÂÅ’ Erro ao atualizar mÃ¡Â©tricas:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao atualizar mÃ¡Â©tricas automÃ¡Â¡ticas',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 

