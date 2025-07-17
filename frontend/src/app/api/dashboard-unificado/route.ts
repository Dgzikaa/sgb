import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface DashboardData {
  resumoExecutivo: {
    receitas: number
    despesas: number
    margem: number
    clientes: number
    tendencia: {
      receitas: number
      despesas: number
      clientes: number
    }
  }
  operacoesCriticas: {
    checklist: {
      total: number
      concluidos: number
      pendentes: number
      problemas: number
    }
    producao: {
      ativo: boolean
      itens: number
      tempo: string
    }
    alertas: Array<{
      tipo: 'critico' | 'importante' | 'info'
      mensagem: string
      timestamp: string
    }>
  }
  metricasChave: {
    contaazul: {
      status: 'ativo' | 'erro' | 'sync'
      ultima_sync: string
      registros: number
    }
    meta: {
      status: 'ativo' | 'erro' | 'sync'
      engagement: number
      impressoes: number
    }
    discord: {
      status: 'ativo' | 'erro'
      mensagens: number
    }
    ia: {
      insights: number
      anomalias: number
      recomendacoes: number
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('barId')

    if (!barId) {
      return NextResponse.json({ error: 'Bar ID Ã¡Â© obrigatÃ¡Â³rio' }, { status: 400 })
    }

    // Buscar dados financeiros (resumo executivo)
    const resumoExecutivo = await buscarResumoExecutivo(barId)
    
    // Buscar dados de operaÃ¡Â§Ã¡Âµes crÃ¡Â­ticas
    const operacoesCriticas = await buscarOperacoesCriticas(barId)
    
    // Buscar mÃ¡Â©tricas chave
    const metricasChave = await buscarMetricasChave(barId)

    const dashboardData: DashboardData = {
      resumoExecutivo,
      operacoesCriticas,
      metricasChave
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Erro na API dashboard-unificado:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

async function buscarResumoExecutivo(barId: string) {
  try {
    // Buscar dados financeiros do hoje
    const hoje = new Date().toISOString().split('T')[0]
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // Dados de hoje
    const { data: dadosHoje } = await supabase
      .from('contaazul_eventos_financeiros')
      .select('valor, tipo')
      .eq('bar_id', barId)
      .gte('data_competencia', hoje)
      .lt('data_competencia', hoje + 'T23:59:59')

    // Dados de ontem (para comparaÃ¡Â§Ã¡Â£o)
    const { data: dadosOntem } = await supabase
      .from('contaazul_eventos_financeiros')
      .select('valor, tipo')
      .eq('bar_id', barId)
      .gte('data_competencia', ontem)
      .lt('data_competencia', ontem + 'T23:59:59')

    // Calcular totais de hoje
    const receitasHoje = dadosHoje?.filter((d: any) => d.tipo === 'receita').reduce((acc: any, curr: any) => acc + curr.valor, 0) || 0
    const despesasHoje = dadosHoje?.filter((d: any) => d.tipo === 'despesa').reduce((acc: any, curr: any) => acc + Math.abs(curr.valor), 0) || 0
    
    // Calcular totais de ontem
    const receitasOntem = dadosOntem?.filter((d: any) => d.tipo === 'receita').reduce((acc: any, curr: any) => acc + curr.valor, 0) || 0
    const despesasOntem = dadosOntem?.filter((d: any) => d.tipo === 'despesa').reduce((acc: any, curr: any) => acc + Math.abs(curr.valor), 0) || 0

    // Calcular margem
    const margem = receitasHoje > 0 ? ((receitasHoje - despesasHoje) / receitasHoje) * 100 : 0

    // Calcular tendÃ¡Âªncias
    const tendenciaReceitas = receitasOntem > 0 ? ((receitasHoje - receitasOntem) / receitasOntem) * 100 : 0
    const tendenciaDespesas = despesasOntem > 0 ? ((despesasHoje - despesasOntem) / despesasOntem) * 100 : 0

    // Buscar dados de clientes (simular ou buscar de outra fonte)
    const clientes = Math.floor(Math.random() * 200) + 50 // Simular por enquanto
    const clientesOntem = Math.floor(Math.random() * 200) + 50
    const tendenciaClientes = clientesOntem > 0 ? ((clientes - clientesOntem) / clientesOntem) * 100 : 0

    return {
      receitas: receitasHoje,
      despesas: despesasHoje,
      margem: Number(margem.toFixed(1)),
      clientes,
      tendencia: {
        receitas: Number(tendenciaReceitas.toFixed(1)),
        despesas: Number(tendenciaDespesas.toFixed(1)),
        clientes: Number(tendenciaClientes.toFixed(1))
      }
    }
  } catch (error) {
    console.error('Erro ao buscar resumo executivo:', error)
    return {
      receitas: 0,
      despesas: 0,
      margem: 0,
      clientes: 0,
      tendencia: { receitas: 0, despesas: 0, clientes: 0 }
    }
  }
}

async function buscarOperacoesCriticas(barId: string) {
  try {
    // Buscar dados de checklists
    const hoje = new Date().toISOString().split('T')[0]
    
    const { data: checklists } = await supabase
      .from('checklist_abertura')
      .select('status')
      .eq('bar_id', barId)
      .gte('data_checklist', hoje)

    const checklistStats = {
      total: checklists?.length || 0,
      concluidos: checklists?.filter((c: any) => c.status === 'completed').length || 0,
      pendentes: checklists?.filter((c: any) => c.status === 'pending').length || 0,
      problemas: checklists?.filter((c: any) => c.status === 'problem').length || 0
    }

    // Buscar dados de produÃ¡Â§Ã¡Â£o (simular por enquanto)
    const producao = {
      ativo: Math.random() > 0.3, // 70% de chance de estar ativo
      itens: Math.floor(Math.random() * 20) + 1,
      tempo: `${Math.floor(Math.random() * 5) + 1}h ${Math.floor(Math.random() * 60)}m`
    }

    // Criar alertas baseados nos dados
    const alertas = []
    
    if (checklistStats.problemas > 0) {
      alertas.push({
        tipo: 'critico' as const,
        mensagem: `${checklistStats.problemas} checklist(s) com problemas`,
        timestamp: new Date().toISOString()
      })
    }

    if (checklistStats.pendentes > 2) {
      alertas.push({
        tipo: 'importante' as const,
        mensagem: `${checklistStats.pendentes} checklist(s) pendentes`,
        timestamp: new Date().toISOString()
      })
    }

    if (!producao.ativo) {
      alertas.push({
        tipo: 'importante' as const,
        mensagem: 'Terminal de produÃ¡Â§Ã¡Â£o inativo',
        timestamp: new Date().toISOString()
      })
    }

    return {
      checklist: checklistStats,
      producao,
      alertas
    }
  } catch (error) {
    console.error('Erro ao buscar operaÃ¡Â§Ã¡Âµes crÃ¡Â­ticas:', error)
    return {
      checklist: { total: 0, concluidos: 0, pendentes: 0, problemas: 0 },
      producao: { ativo: false, itens: 0, tempo: '0h 0m' },
      alertas: []
    }
  }
}

async function buscarMetricasChave(barId: string) {
  try {
    // Buscar status ContaAzul
    const { data: contaazulData } = await supabase
      .from('contaazul_eventos_financeiros')
      .select('created_at')
      .eq('bar_id', barId)
      .order('created_at', { ascending: false })
      .limit(1)

    const { count: contaazulCount } = await supabase
      .from('contaazul_eventos_financeiros')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', barId)

    // Buscar dados Meta (simular por enquanto)
    const metaData = {
      status: 'ativo' as const,
      engagement: Math.floor(Math.random() * 100),
      impressoes: Math.floor(Math.random() * 50000) + 10000
    }

    // Status Discord (simular)
    const discordData = {
      status: 'ativo' as const,
      mensagens: Math.floor(Math.random() * 50) + 1
    }

    // Buscar dados de IA Analytics
    const { count: insightsCount } = await supabase
      .from('ai_insights')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', barId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const { count: anomaliasCount } = await supabase
      .from('ai_anomalies')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', barId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const { count: recomendacoesCount } = await supabase
      .from('ai_recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', barId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    return {
      contaazul: {
        status: contaazulData && contaazulData.length > 0 ? 'ativo' as const : 'erro' as const,
        ultima_sync: contaazulData?.[0]?.created_at || new Date().toISOString(),
        registros: contaazulCount || 0
      },
      meta: metaData,
      discord: discordData,
      ia: {
        insights: insightsCount || 0,
        anomalias: anomaliasCount || 0,
        recomendacoes: recomendacoesCount || 0
      }
    }
  } catch (error) {
    console.error('Erro ao buscar mÃ¡Â©tricas chave:', error)
    return {
      contaazul: { status: 'erro' as const, ultima_sync: new Date().toISOString(), registros: 0 },
      meta: { status: 'erro' as const, engagement: 0, impressoes: 0 },
      discord: { status: 'erro' as const, mensagens: 0 },
      ia: { insights: 0, anomalias: 0, recomendacoes: 0 }
    }
  }
} 

