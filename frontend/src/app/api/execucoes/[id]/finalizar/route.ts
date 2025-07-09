import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'
import { z } from 'zod'

// =====================================================
// SCHEMAS DE VALIDAÇÃO
// =====================================================

const FinalizarExecucaoSchema = z.object({
  observacoes_finais: z.string().optional(),
  assinatura_digital: z.object({
    url: z.string(),
    coordenadas: z.array(z.number()).optional(),
    timestamp: z.string().optional()
  }).optional(),
  confirmacao_finalizacao: z.boolean().default(true)
})

// =====================================================
// POST - FINALIZAR EXECUÇÃO
// =====================================================
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔐 AUTENTICAÇÃO
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }

    const { id: execucaoId } = params
    const body = await request.json()
    const data = FinalizarExecucaoSchema.parse(body)
    
    const supabase = await getAdminClient()
    
    // Buscar execução completa
    const { data: execucao, error: fetchError } = await supabase
      .from('checklist_execucoes')
      .select(`
        *,
        checklist:checklists!checklist_id (nome, setor, tipo, estrutura),
        funcionario:usuarios_sistema!funcionario_id (nome, email)
      `)
      .eq('id', execucaoId)
      .single()

    if (fetchError || !execucao) {
      return NextResponse.json({ 
        error: 'Execução não encontrada' 
      }, { status: 404 })
    }

    // Verificar permissões
    if (!podeFinalizarExecucao(user, execucao)) {
      return NextResponse.json({ 
        error: 'Sem permissão para finalizar esta execução' 
      }, { status: 403 })
    }

    // Verificar se execução pode ser finalizada
    if (execucao.status !== 'em_andamento') {
      return NextResponse.json({ 
        error: `Execução não pode ser finalizada. Status atual: ${execucao.status}` 
      }, { status: 400 })
    }

    // Validar se todos os campos obrigatórios foram preenchidos
    const validacao = validarExecucaoCompleta(execucao)
    if (!validacao.pode_finalizar) {
      return NextResponse.json({ 
        error: 'Execução não pode ser finalizada',
        detalhes: validacao.erros,
        campos_pendentes: validacao.campos_obrigatorios_pendentes
      }, { status: 400 })
    }

    // Calcular score final
    const scoreResult = calcularScoreFinal(execucao)

    // Calcular tempo total decorrido
    const iniciadoEm = new Date(execucao.iniciado_em)
    const finalizadoEm = new Date()
    const tempoTotalMinutos = Math.round((finalizadoEm.getTime() - iniciadoEm.getTime()) / 1000 / 60)

    // Preparar dados de finalização
    const dadosFinalizacao: any = {
      status: 'completado',
      finalizado_em: finalizadoEm.toISOString(),
      finalizado_por: user.user_id,
      observacoes_finais: data.observacoes_finais,
      score_final: scoreResult.score_total,
      score_detalhado: scoreResult,
      tempo_total_minutos: tempoTotalMinutos,
      atualizado_em: finalizadoEm.toISOString()
    }

    // Adicionar assinatura digital se fornecida
    if (data.assinatura_digital) {
      dadosFinalizacao.assinatura_digital = {
        ...data.assinatura_digital,
        assinado_em: finalizadoEm.toISOString(),
        assinado_por: user.user_id
      }
    }

    // Atualizar execução
    const { data: execucaoFinalizada, error: updateError } = await supabase
      .from('checklist_execucoes')
      .update(dadosFinalizacao)
      .eq('id', execucaoId)
      .select(`
        *,
        checklist:checklists!checklist_id (nome, setor, tipo),
        funcionario:usuarios_sistema!funcionario_id (nome, email),
        finalizado_por_usuario:usuarios_sistema!finalizado_por (nome, email)
      `)
      .single()

    if (updateError) {
      console.error('Erro ao finalizar execução:', updateError)
      return NextResponse.json({ 
        error: 'Erro ao finalizar execução' 
      }, { status: 500 })
    }

    // Registrar no histórico de atividades (opcional)
    await registrarAtividade(supabase, {
      execucao_id: execucaoId,
      usuario_id: user.user_id,
      acao: 'finalizacao',
      detalhes: {
        score: scoreResult.score_total,
        tempo_total: tempoTotalMinutos,
        campos_respondidos: scoreResult.total_respondidos
      }
    })

    console.log(`✅ Execução finalizada: ${execucao.checklist.nome} por ${execucao.funcionario.nome} - Score: ${scoreResult.score_total}%`)

    return NextResponse.json({
      success: true,
      message: 'Execução finalizada com sucesso',
      data: {
        execucao: execucaoFinalizada,
        score: scoreResult,
        tempo_total: tempoTotalMinutos,
        resumo: gerarResumoFinalizacao(execucaoFinalizada, scoreResult)
      }
    })

  } catch (error: any) {
    console.error('Erro na API de finalizar execução:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// =====================================================
// GET - OBTER PREVIEW DE FINALIZAÇÃO
// =====================================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔐 AUTENTICAÇÃO
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }

    const { id: execucaoId } = params
    const supabase = await getAdminClient()
    
    // Buscar execução
    const { data: execucao, error } = await supabase
      .from('checklist_execucoes')
      .select(`
        *,
        checklist:checklists!checklist_id (nome, setor, tipo, estrutura)
      `)
      .eq('id', execucaoId)
      .single()

    if (error || !execucao) {
      return NextResponse.json({ 
        error: 'Execução não encontrada' 
      }, { status: 404 })
    }

    // Verificar permissões
    if (!podeAcessarExecucao(user, execucao)) {
      return NextResponse.json({ 
        error: 'Sem permissão para acessar esta execução' 
      }, { status: 403 })
    }

    // Gerar preview de finalização
    const validacao = validarExecucaoCompleta(execucao)
    const scorePreview = calcularScoreFinal(execucao)
    const tempoDecorrido = calcularTempoDecorrido(execucao.iniciado_em)

    const preview = {
      pode_finalizar: validacao.pode_finalizar,
      campos_obrigatorios_pendentes: validacao.campos_obrigatorios_pendentes,
      score_previsto: scorePreview,
      tempo_decorrido: tempoDecorrido,
      resumo_respostas: gerarResumoRespostas(execucao),
      proximos_passos: validacao.pode_finalizar ? 
        ['Revisar respostas', 'Adicionar observações finais', 'Finalizar execução'] :
        ['Completar campos obrigatórios pendentes', 'Revisar respostas incompletas']
    }

    return NextResponse.json({
      success: true,
      data: preview
    })

  } catch (error: any) {
    console.error('Erro na API de preview de finalização:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// =====================================================
// FUNÇÕES UTILITÁRIAS
// =====================================================

function podeFinalizarExecucao(user: any, execucao: any): boolean {
  // Admin e financeiro podem finalizar
  if (['admin', 'financeiro'].includes(user.role)) return true
  
  // Funcionário só pode finalizar suas próprias execuções
  if (user.role === 'funcionario') {
    return execucao.funcionario_id === user.user_id
  }
  
  return false
}

function podeAcessarExecucao(user: any, execucao: any): boolean {
  // Admin pode acessar tudo
  if (user.role === 'admin') return true
  
  // Financeiro pode acessar execuções do mesmo bar
  if (user.role === 'financeiro') return true
  
  // Funcionário só pode acessar suas próprias execuções
  if (user.role === 'funcionario') {
    return execucao.funcionario_id === user.user_id
  }
  
  return false
}

function validarExecucaoCompleta(execucao: any) {
  const respostas = execucao.respostas
  const estrutura = execucao.estrutura_checklist || execucao.checklist?.estrutura
  
  if (!respostas?.secoes || !estrutura?.secoes) {
    return {
      pode_finalizar: false,
      erros: ['Estrutura de respostas inválida'],
      campos_obrigatorios_pendentes: []
    }
  }

  const erros: string[] = []
  const camposPendentes: any[] = []

  estrutura.secoes.forEach((secaoOriginal: any, secaoIndex: number) => {
    const secaoResposta = respostas.secoes[secaoIndex]
    
    if (!secaoResposta) {
      erros.push(`Seção "${secaoOriginal.nome}" não possui respostas`)
      return
    }

    secaoOriginal.itens?.forEach((itemOriginal: any, itemIndex: number) => {
      const itemResposta = secaoResposta.itens[itemIndex]
      
      if (!itemResposta) {
        if (itemOriginal.obrigatorio) {
          erros.push(`Item obrigatório "${itemOriginal.titulo}" não foi respondido`)
          camposPendentes.push({
            secao: secaoOriginal.nome,
            item: itemOriginal.titulo,
            tipo: itemOriginal.tipo
          })
        }
        return
      }

      // Verificar campos obrigatórios
      if (itemOriginal.obrigatorio && !itemResposta.respondido) {
        erros.push(`Campo obrigatório "${itemOriginal.titulo}" não foi preenchido`)
        camposPendentes.push({
          secao: secaoOriginal.nome,
          item: itemOriginal.titulo,
          tipo: itemOriginal.tipo
        })
      }

      // Verificar anexos obrigatórios
      if (itemOriginal.obrigatorio && ['foto_camera', 'foto_upload', 'assinatura'].includes(itemOriginal.tipo)) {
        if (!itemResposta.anexos || itemResposta.anexos.length === 0) {
          erros.push(`Anexo obrigatório "${itemOriginal.titulo}" não foi fornecido`)
          camposPendentes.push({
            secao: secaoOriginal.nome,
            item: itemOriginal.titulo,
            tipo: itemOriginal.tipo,
            requer_anexo: true
          })
        }
      }
    })
  })

  return {
    pode_finalizar: erros.length === 0,
    erros,
    campos_obrigatorios_pendentes: camposPendentes
  }
}

function calcularScoreFinal(execucao: any) {
  const respostas = execucao.respostas
  const estrutura = execucao.estrutura_checklist || execucao.checklist?.estrutura
  
  if (!respostas?.secoes || !estrutura?.secoes) {
    return {
      score_total: 0,
      total_itens: 0,
      total_respondidos: 0,
      score_por_secao: []
    }
  }

  let totalItens = 0
  let totalRespondidos = 0
  let pontuacaoTotal = 0
  let pontuacaoMaxima = 0
  const scoresPorSecao: any[] = []

  estrutura.secoes.forEach((secaoOriginal: any, secaoIndex: number) => {
    const secaoResposta = respostas.secoes[secaoIndex]
    
    let itensSecao = 0
    let respondidosSecao = 0
    let pontuacaoSecao = 0
    let pontuacaoMaximaSecao = 0

    secaoOriginal.itens?.forEach((itemOriginal: any, itemIndex: number) => {
      itensSecao++
      totalItens++
      
      // Cada item vale pontos baseado no tipo e se é obrigatório
      const pesoItem = itemOriginal.obrigatorio ? 2 : 1
      pontuacaoMaxima += pesoItem
      pontuacaoMaximaSecao += pesoItem
      
      const itemResposta = secaoResposta?.itens[itemIndex]
      
      if (itemResposta?.respondido) {
        respondidosSecao++
        totalRespondidos++
        
        // Calcular pontuação baseada no tipo de resposta
        let pontuacaoItem = 0
        
        switch (itemOriginal.tipo) {
          case 'avaliacao':
            // Avaliação de 1-5 vira pontuação proporcional
            const nota = Number(itemResposta.valor) || 0
            pontuacaoItem = (nota / 5) * pesoItem
            break
            
          case 'sim_nao':
            // Sim = pontuação total, Não = 50% da pontuação
            pontuacaoItem = itemResposta.valor === true ? pesoItem : pesoItem * 0.5
            break
            
          default:
            // Outros tipos: respondido = pontuação total
            pontuacaoItem = pesoItem
            break
        }
        
        pontuacaoSecao += pontuacaoItem
        pontuacaoTotal += pontuacaoItem
      }
    })

    const scoreSecao = pontuacaoMaximaSecao > 0 ? 
      Math.round((pontuacaoSecao / pontuacaoMaximaSecao) * 100) : 0

    scoresPorSecao.push({
      nome: secaoOriginal.nome,
      itens_total: itensSecao,
      itens_respondidos: respondidosSecao,
      score: scoreSecao,
      pontuacao: pontuacaoSecao,
      pontuacao_maxima: pontuacaoMaximaSecao
    })
  })

  const scoreTotal = pontuacaoMaxima > 0 ? 
    Math.round((pontuacaoTotal / pontuacaoMaxima) * 100) : 0

  return {
    score_total: scoreTotal,
    total_itens: totalItens,
    total_respondidos: totalRespondidos,
    pontuacao_obtida: pontuacaoTotal,
    pontuacao_maxima: pontuacaoMaxima,
    percentual_conclusao: totalItens > 0 ? Math.round((totalRespondidos / totalItens) * 100) : 0,
    score_por_secao: scoresPorSecao
  }
}

function calcularTempoDecorrido(iniciadoEm: string) {
  const inicio = new Date(iniciadoEm)
  const agora = new Date()
  const tempoMinutos = Math.round((agora.getTime() - inicio.getTime()) / 1000 / 60)
  
  return {
    minutos: tempoMinutos,
    horas: Math.floor(tempoMinutos / 60),
    minutos_restantes: tempoMinutos % 60,
    formatado: formatarTempo(tempoMinutos)
  }
}

function formatarTempo(minutos: number): string {
  if (minutos < 60) {
    return `${minutos}min`
  }
  
  const horas = Math.floor(minutos / 60)
  const mins = minutos % 60
  
  return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`
}

function gerarResumoRespostas(execucao: any) {
  const respostas = execucao.respostas
  
  if (!respostas?.secoes) {
    return { total_secoes: 0, secoes: [] }
  }

  const resumoSecoes = respostas.secoes.map((secao: any) => {
    const totalItens = secao.itens?.length || 0
    const itensRespondidos = secao.itens?.filter((item: any) => item.respondido).length || 0
    
    return {
      nome: secao.nome,
      total_itens: totalItens,
      itens_respondidos: itensRespondidos,
      percentual: totalItens > 0 ? Math.round((itensRespondidos / totalItens) * 100) : 0
    }
  })

  return {
    total_secoes: respostas.secoes.length,
    secoes: resumoSecoes
  }
}

function gerarResumoFinalizacao(execucao: any, score: any) {
  return {
    checklist: execucao.checklist?.nome,
    funcionario: execucao.funcionario?.nome,
    score_final: score.score_total,
    tempo_total: formatarTempo(execucao.tempo_total_minutos),
    itens_completados: `${score.total_respondidos}/${score.total_itens}`,
    finalizado_em: execucao.finalizado_em,
    status: 'Concluído com sucesso'
  }
}

async function registrarAtividade(supabase: any, atividade: any) {
  try {
    await supabase
      .from('checklist_atividades')
      .insert({
        execucao_id: atividade.execucao_id,
        usuario_id: atividade.usuario_id,
        acao: atividade.acao,
        detalhes: atividade.detalhes,
        criado_em: new Date().toISOString()
      })
  } catch (error) {
    console.error('Erro ao registrar atividade:', error)
    // Não falhar a finalização por causa do log
  }
} 