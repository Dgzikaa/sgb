import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export const dynamic = 'force-dynamic'

// =====================================================
// GET - DASHBOARD DE PRODUTIVIDADE
// =====================================================
export async function GET(request: NextRequest) {
  try {
    // Ã°Å¸â€Â AUTENTICAÃ¡â€¡Ã¡Æ’O
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('UsuÃ¡Â¡rio nÃ¡Â£o autenticado')
    }

    const { searchParams } = new URL(request.url)
    
    const periodo = searchParams.get('periodo') || '30' // dias
    const funcionarioId = searchParams.get('funcionario_id')
    const setor = searchParams.get('setor')
    const cargo = searchParams.get('cargo')
    
    const supabase = await getAdminClient()
    
    // Calcular data de inÃ¡Â­cio baseada no perÃ¡Â­odo
    const dataFim = new Date()
    const dataInicio = new Date()
    dataInicio.setDate(dataFim.getDate() - parseInt(periodo))

    // Buscar mÃ¡Â©tricas gerais
    const metricas = await calcularMetricasGerais(supabase, user.bar_id.toString(), dataInicio, dataFim)

    // Buscar ranking de funcionÃ¡Â¡rios
    const ranking = await calcularRankingFuncionarios(
      supabase, 
      user.bar_id.toString(), 
      dataInicio, 
      dataFim,
      funcionarioId || undefined,
      setor || undefined,
      cargo || undefined
    )

    // Buscar evoluÃ¡Â§Ã¡Â£o temporal
    const evolucao = await calcularEvolucaoTemporal(supabase, user.bar_id.toString(), dataInicio, dataFim)

    // Buscar alertas e pendÃ¡Âªncias
    const alertas = await buscarAlertas(supabase, user.bar_id.toString())

    // Buscar estatÃ¡Â­sticas por setor/cargo
    const estatisticasPorSetor = await calcularEstatisticasPorSetor(supabase, user.bar_id.toString(), dataInicio, dataFim)
    const estatisticasPorCargo = await calcularEstatisticasPorCargo(supabase, user.bar_id.toString(), dataInicio, dataFim)

    // Buscar top checklists
    const topChecklists = await buscarTopChecklists(supabase, user.bar_id.toString(), dataInicio, dataFim)

    const dashboard = {
      periodo: {
        inicio: dataInicio.toISOString(),
        fim: dataFim.toISOString(),
        dias: parseInt(periodo)
      },
      metricas_gerais: metricas,
      ranking_funcionarios: ranking,
      evolucao_temporal: evolucao,
      alertas,
      estatisticas: {
        por_setor: estatisticasPorSetor,
        por_cargo: estatisticasPorCargo
      },
      top_checklists: topChecklists
    }

    return NextResponse.json({
      success: true,
      data: dashboard
    })

  } catch (error) {
    console.error('Erro na API de dashboard de produtividade:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: (error as any).message 
    }, { status: 500 })
  }
}

// =====================================================
// FUNÃ¡â€¡Ã¡â€¢ES DE CÃ¡ÂLCULO
// =====================================================

async function calcularMetricasGerais(supabase: any, barId: string, dataInicio: Date, dataFim: Date) {
  // Buscar execuÃ¡Â§Ã¡Âµes do perÃ¡Â­odo
  const { data: execucoes } = await supabase
    .from('checklist_execucoes')
    .select(`
      *,
      checklist:checklists!checklist_id (nome, setor, tipo),
              funcionario:usuarios_bar!funcionario_id (nome, cargo)
    `)
    .gte('iniciado_em', dataInicio.toISOString())
    .lte('iniciado_em', dataFim.toISOString())

  if (!execucoes) {
    return {
      total_execucoes: 0,
      execucoes_concluidas: 0,
      execucoes_pendentes: 0,
      taxa_conclusao: 0,
      score_medio: 0,
      tempo_medio: 0,
      funcionarios_ativos: 0
    }
  }

  const concluidas = execucoes.filter((e: any) => e.status === 'completado')
  const pendentes = execucoes.filter((e: any) => ['em_andamento', 'pausado'].includes(e.status))
  
  const scoreTotal = concluidas
    .filter((e: any) => e.score_final != null)
    .reduce((acc: any, e: any) => acc + e.score_final, 0)
  
  const tempoTotal = concluidas
    .filter((e: any) => e.tempo_total_minutos != null)
    .reduce((acc: any, e: any) => acc + e.tempo_total_minutos, 0)

  const funcionariosUnicos = new Set(execucoes.map((e: any) => e.funcionario_id)).size

  return {
    total_execucoes: execucoes.length,
    execucoes_concluidas: concluidas.length,
    execucoes_pendentes: pendentes.length,
    taxa_conclusao: execucoes.length > 0 ? Math.round((concluidas.length / execucoes.length) * 100) : 0,
    score_medio: concluidas.length > 0 ? Math.round((scoreTotal / concluidas.length) * 10) / 10 : 0,
    tempo_medio: concluidas.length > 0 ? Math.round(tempoTotal / concluidas.length) : 0,
    funcionarios_ativos: funcionariosUnicos
  }
}

async function calcularRankingFuncionarios(
  supabase: any, 
  barId: string, 
  dataInicio: Date, 
  dataFim: Date,
  funcionarioIdFiltro?: string,
  setorFiltro?: string,
  cargoFiltro?: string
) {
  // Buscar execuÃ¡Â§Ã¡Âµes por funcionÃ¡Â¡rio
  const query = supabase
    .from('checklist_execucoes')
    .select(`
      funcionario_id,
      status,
      score_final,
      tempo_total_minutos,
      iniciado_em,
      finalizado_em,
              funcionario:usuarios_bar!funcionario_id (nome, email, cargo, setor)
    `)
    .gte('iniciado_em', dataInicio.toISOString())
    .lte('iniciado_em', dataFim.toISOString())

  const { data: execucoes } = await query

  if (!execucoes) return []

  // Filtrar funcionÃ¡Â¡rios
  let execucoesFiltradas = execucoes
  
  if (funcionarioIdFiltro) {
    execucoesFiltradas = execucoes.filter((e: any) => e.funcionario_id === funcionarioIdFiltro)
  }

  if (setorFiltro) {
    execucoesFiltradas = execucoes.filter((e: any) => e.funcionario?.setor === setorFiltro)
  }

  if (cargoFiltro) {
    execucoesFiltradas = execucoes.filter((e: any) => e.funcionario?.cargo === cargoFiltro)
  }

  // Agrupar por funcionÃ¡Â¡rio
  const funcionarios = new Map()

  execucoesFiltradas.forEach((execucao: any) => {
    const funcionarioId = execucao.funcionario_id
    
    if (!funcionarios.has(funcionarioId)) {
      funcionarios.set(funcionarioId, {
        funcionario_id: funcionarioId,
        funcionario: execucao.funcionario,
        total_execucoes: 0,
        execucoes_concluidas: 0,
        score_total: 0,
        tempo_total: 0,
        execucoes_com_score: 0,
        execucoes_com_tempo: 0,
        dias_ativos: new Set()
      })
    }

    const funcionario = funcionarios.get(funcionarioId)
    funcionario.total_execucoes++
    
    // Adicionar dia ativo
    const diaExecucao = execucao.iniciado_em.split('T')[0]
    funcionario.dias_ativos.add(diaExecucao)

    if (execucao.status === 'completado') {
      funcionario.execucoes_concluidas++
      
      if (execucao.score_final != null) {
        funcionario.score_total += execucao.score_final
        funcionario.execucoes_com_score++
      }
      
      if (execucao.tempo_total_minutos != null) {
        funcionario.tempo_total += execucao.tempo_total_minutos
        funcionario.execucoes_com_tempo++
      }
    }
  })

  // Calcular mÃ¡Â©tricas finais e ordenar
  const ranking = Array.from(funcionarios.values()).map((funcionario: any) => {
    const taxa_conclusao = funcionario.total_execucoes > 0 ? 
      Math.round((funcionario.execucoes_concluidas / funcionario.total_execucoes) * 100) : 0
    
    const score_medio = funcionario.execucoes_com_score > 0 ? 
      Math.round((funcionario.score_total / funcionario.execucoes_com_score) * 10) / 10 : 0
    
    const tempo_medio = funcionario.execucoes_com_tempo > 0 ? 
      Math.round(funcionario.tempo_total / funcionario.execucoes_com_tempo) : 0

    // Calcular score de produtividade (mÃ¡Â©dia ponderada)
    const score_produtividade = Math.round(
      (taxa_conclusao * 0.4) + 
      (score_medio * 2) +  // Score 0-100 -> peso 0.2
      (Math.max(0, 100 - (tempo_medio / 60) * 10) * 0.4) // Tempo menor = melhor
    )

    return {
      ...funcionario,
      taxa_conclusao,
      score_medio,
      tempo_medio,
      dias_ativos: funcionario.dias_ativos.size,
      score_produtividade,
      // ClassificaÃ¡Â§Ã¡Â£o qualitativa
      classificacao: getClassificacaoDesempenho(score_produtividade, taxa_conclusao)
    }
  }).sort((a: any, b: any) => b.score_produtividade - a.score_produtividade)

  // Adicionar posiÃ¡Â§Ã¡Â£o no ranking
  return ranking.map((funcionario: any, index: number) => ({
    ...funcionario,
    posicao: index + 1,
    dias_ativos: funcionario.dias_ativos // Manter apenas o nÃ¡Âºmero
  }))
}

async function calcularEvolucaoTemporal(supabase: any, barId: string, dataInicio: Date, dataFim: Date) {
  const { data: execucoes } = await supabase
    .from('checklist_execucoes')
    .select('iniciado_em, status, score_final')
    .gte('iniciado_em', dataInicio.toISOString())
    .lte('iniciado_em', dataFim.toISOString())

  if (!execucoes) return []

  // Agrupar por dia
  const evolucaoPorDia = new Map()
  
  execucoes.forEach((execucao: any) => {
    const dia = execucao.iniciado_em.split('T')[0]
    
    if (!evolucaoPorDia.has(dia)) {
      evolucaoPorDia.set(dia, {
        data: dia,
        total_execucoes: 0,
        execucoes_concluidas: 0,
        score_total: 0,
        execucoes_com_score: 0
      })
    }

    const dadosDia = evolucaoPorDia.get(dia)
    dadosDia.total_execucoes++

    if (execucao.status === 'completado') {
      dadosDia.execucoes_concluidas++
      
      if (execucao.score_final != null) {
        dadosDia.score_total += execucao.score_final
        dadosDia.execucoes_com_score++
      }
    }
  })

  // Converter para array e calcular mÃ¡Â©tricas
  return Array.from(evolucaoPorDia.values())
    .map((dia) => ({
      ...dia,
      taxa_conclusao: dia.total_execucoes > 0 ? 
        Math.round((dia.execucoes_concluidas / dia.total_execucoes) * 100) : 0,
      score_medio: dia.execucoes_com_score > 0 ? 
        Math.round((dia.score_total / dia.execucoes_com_score) * 10) / 10 : 0
    }))
    .sort((a, b) => a.data.localeCompare(b.data))
}

async function buscarAlertas(supabase: any, barId: string) {
  const agora = new Date()
  const alertas = []

  // Agendamentos atrasados
  const { data: agendamentosAtrasados } = await supabase
    .from('checklist_agendamentos')
    .select(`
      *,
      checklist:checklists!checklist_id (nome),
      funcionario:usuarios_bar!funcionario_id (nome)
    `)
    .eq('bar_id', barId)
    .eq('status', 'agendado')
    .lt('data_agendada', agora.toISOString())
    .limit(10)

  if (agendamentosAtrasados && agendamentosAtrasados.length > 0) {
    alertas.push({
      tipo: 'agendamentos_atrasados',
      severidade: 'alta',
      titulo: `${agendamentosAtrasados.length} agendamento(s) atrasado(s)`,
      descricao: 'Existem checklists que deveriam ter sido executados',
      itens: agendamentosAtrasados.map((a: any) => ({
        checklist: a.checklist?.nome,
        funcionario: a.funcionario?.nome,
        data_agendada: a.data_agendada,
        atraso_horas: Math.round((agora.getTime() - new Date(a.data_agendada).getTime()) / (1000 * 60 * 60))
      }))
    })
  }

  // FuncionÃ¡Â¡rios com baixa performance
  const { data: execucoesRecentes } = await supabase
    .from('checklist_execucoes')
    .select(`
      funcionario_id,
      status,
      score_final,
      funcionario:usuarios_bar!funcionario_id (nome)
    `)
    .eq('bar_id', barId)
    .gte('iniciado_em', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  if (execucoesRecentes) {
    const funcionariosBaixaPerformance: any[] = [];
    const funcionarios = new Map()

    execucoesRecentes.forEach((exec: any) => {
      if (!funcionarios.has(exec.funcionario_id)) {
        funcionarios.set(exec.funcionario_id, {
          funcionario: exec.funcionario,
          total: 0,
          scores: []
        })
      }
      
      const func = funcionarios.get(exec.funcionario_id)
      func.total++
      
      if (exec.status === 'completado' && exec.score_final != null) {
        func.scores.push(exec.score_final)
      }
    })

    funcionarios.forEach((dados, funcionarioId) => {
      if (dados.scores.length >= 3) {
        const scoreMedio = dados.scores.reduce((a: number, b: number) => a + b, 0) / dados.scores.length
        
        if (scoreMedio < 70) { // Threshold configurÃ¡Â¡vel
          funcionariosBaixaPerformance.push({
            funcionario: dados.funcionario?.nome,
            score_medio: Math.round(scoreMedio * 10) / 10,
            total_execucoes: dados.scores.length
          })
        }
      }
    })

    if (funcionariosBaixaPerformance.length > 0) {
      alertas.push({
        tipo: 'baixa_performance',
        severidade: 'media',
        titulo: `${funcionariosBaixaPerformance.length} funcionÃ¡Â¡rio(s) com baixa performance`,
        descricao: 'FuncionÃ¡Â¡rios com score mÃ¡Â©dio abaixo de 70% nos Ã¡Âºltimos 7 dias',
        itens: funcionariosBaixaPerformance
      })
    }
  }

  return alertas
}

async function calcularEstatisticasPorSetor(supabase: any, barId: string, dataInicio: Date, dataFim: Date) {
  const { data: execucoes } = await supabase
    .from('checklist_execucoes')
    .select(`
      status,
      score_final,
      checklist:checklists!checklist_id (setor)
    `)
    .gte('iniciado_em', dataInicio.toISOString())
    .lte('iniciado_em', dataFim.toISOString())

  if (!execucoes) return []

  const setores = new Map()

  execucoes.forEach((exec: any) => {
    const setor = exec.checklist?.setor || 'Sem setor'
    
    if (!setores.has(setor)) {
      setores.set(setor, {
        setor,
        total_execucoes: 0,
        execucoes_concluidas: 0,
        score_total: 0,
        execucoes_com_score: 0
      })
    }

    const dadosSetor = setores.get(setor)
    dadosSetor.total_execucoes++

    if (exec.status === 'completado') {
      dadosSetor.execucoes_concluidas++
      
      if (exec.score_final != null) {
        dadosSetor.score_total += exec.score_final
        dadosSetor.execucoes_com_score++
      }
    }
  })

  return Array.from(setores.values())
    .map((setor) => ({
      ...setor,
      taxa_conclusao: setor.total_execucoes > 0 ? 
        Math.round((setor.execucoes_concluidas / setor.total_execucoes) * 100) : 0,
      score_medio: setor.execucoes_com_score > 0 ? 
        Math.round((setor.score_total / setor.execucoes_com_score) * 10) / 10 : 0
    }))
    .sort((a, b) => b.total_execucoes - a.total_execucoes)
}

async function calcularEstatisticasPorCargo(supabase: any, barId: string, dataInicio: Date, dataFim: Date) {
  const { data: execucoes } = await supabase
    .from('checklist_execucoes')
    .select(`
      status,
      score_final,
              funcionario:usuarios_bar!funcionario_id (cargo)
    `)
    .gte('iniciado_em', dataInicio.toISOString())
    .lte('iniciado_em', dataFim.toISOString())

  if (!execucoes) return []

  const cargos = new Map()

  execucoes.forEach((exec: any) => {
    const cargo = exec.funcionario?.cargo || 'Sem cargo'
    
    if (!cargos.has(cargo)) {
      cargos.set(cargo, {
        cargo,
        total_execucoes: 0,
        execucoes_concluidas: 0,
        score_total: 0,
        execucoes_com_score: 0
      })
    }

    const dadosCargo = cargos.get(cargo)
    dadosCargo.total_execucoes++

    if (exec.status === 'completado') {
      dadosCargo.execucoes_concluidas++
      
      if (exec.score_final != null) {
        dadosCargo.score_total += exec.score_final
        dadosCargo.execucoes_com_score++
      }
    }
  })

  return Array.from(cargos.values())
    .map((cargo) => ({
      ...cargo,
      taxa_conclusao: cargo.total_execucoes > 0 ? 
        Math.round((cargo.execucoes_concluidas / cargo.total_execucoes) * 100) : 0,
      score_medio: cargo.execucoes_com_score > 0 ? 
        Math.round((cargo.score_total / cargo.execucoes_com_score) * 10) / 10 : 0
    }))
    .sort((a, b) => b.total_execucoes - a.total_execucoes)
}

async function buscarTopChecklists(supabase: any, barId: string, dataInicio: Date, dataFim: Date) {
  const { data: execucoes } = await supabase
    .from('checklist_execucoes')
    .select(`
      checklist_id,
      status,
      score_final,
      tempo_total_minutos,
      checklist:checklists!checklist_id (nome, setor, tipo)
    `)
    .gte('iniciado_em', dataInicio.toISOString())
    .lte('iniciado_em', dataFim.toISOString())

  if (!execucoes) return []

  const checklists = new Map()

  execucoes.forEach((exec: any) => {
    const checklistId = exec.checklist_id
    
    if (!checklists.has(checklistId)) {
      checklists.set(checklistId, {
        checklist_id: checklistId,
        checklist: exec.checklist,
        total_execucoes: 0,
        execucoes_concluidas: 0,
        score_total: 0,
        tempo_total: 0,
        execucoes_com_score: 0,
        execucoes_com_tempo: 0
      })
    }

    const dadosChecklist = checklists.get(checklistId)
    dadosChecklist.total_execucoes++

    if (exec.status === 'completado') {
      dadosChecklist.execucoes_concluidas++
      
      if (exec.score_final != null) {
        dadosChecklist.score_total += exec.score_final
        dadosChecklist.execucoes_com_score++
      }
      
      if (exec.tempo_total_minutos != null) {
        dadosChecklist.tempo_total += exec.tempo_total_minutos
        dadosChecklist.execucoes_com_tempo++
      }
    }
  })

  return Array.from(checklists.values())
    .map((checklist) => ({
      ...checklist,
      taxa_conclusao: checklist.total_execucoes > 0 ? 
        Math.round((checklist.execucoes_concluidas / checklist.total_execucoes) * 100) : 0,
      score_medio: checklist.execucoes_com_score > 0 ? 
        Math.round((checklist.score_total / checklist.execucoes_com_score) * 10) / 10 : 0,
      tempo_medio: checklist.execucoes_com_tempo > 0 ? 
        Math.round(checklist.tempo_total / checklist.execucoes_com_tempo) : 0
    }))
    .sort((a, b) => b.total_execucoes - a.total_execucoes)
    .slice(0, 10) // Top 10
}

// =====================================================
// FUNÃ¡â€¡Ã¡â€¢ES UTILITÃ¡ÂRIAS
// =====================================================

function getClassificacaoDesempenho(scoreProdutividade: number, taxaConclusao: number) {
  if (scoreProdutividade >= 80 && taxaConclusao >= 90) {
    return { nivel: 'excelente', cor: 'green', emoji: 'Ã°Å¸Ââ€ ' }
  } else if (scoreProdutividade >= 60 && taxaConclusao >= 70) {
    return { nivel: 'bom', cor: 'blue', emoji: 'Ã°Å¸â€˜Â' }
  } else if (scoreProdutividade >= 40 && taxaConclusao >= 50) {
    return { nivel: 'regular', cor: 'yellow', emoji: 'Å¡Â Ã¯Â¸Â' }
  } else {
    return { nivel: 'precisa_melhorar', cor: 'red', emoji: 'Ã°Å¸â€Â´' }
  }
} 

