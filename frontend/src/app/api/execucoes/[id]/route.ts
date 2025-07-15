import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'
import { z } from 'zod'

// =====================================================
// SCHEMAS DE VALIDAÇÃO
// =====================================================

const SalvarRespostasSchema = z.object({
  respostas: z.object({
    secoes: z.array(z.object({
      secao_id: z.string(),
      itens: z.array(z.object({
        item_id: z.string(),
        valor: z.any(),
        anexos: z.array(z.object({
          url: z.string(),
          nome: z.string(),
          tipo: z.string(),
          tamanho: z.number().optional()
        })).optional(),
        respondido: z.boolean(),
        respondido_em: z.string().optional()
      }))
    }))
  }),
  observacoes: z.string().optional(),
  auto_save: z.boolean().optional().default(false)
})

const FinalizarExecucaoSchema = z.object({
  observacoes_finais: z.string().optional(),
  assinatura_digital: z.object({
    url: z.string(),
    coordenadas: z.array(z.number()).optional()
  }).optional()
})

// =====================================================
// GET - BUSCAR EXECUÇÃO ESPECÍFICA
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
    
    // Buscar execução completa
    const { data: execucao, error } = await supabase
      .from('checklist_execucoes')
      .select(`
        *,
        checklist:checklists!checklist_id (
          id, nome, setor, tipo, tempo_estimado, estrutura
        ),
        funcionario:usuarios_bar!funcionario_id (id, nome, email),
        iniciado_por_usuario:usuarios_bar!iniciado_por (nome, email)
      `)
      .eq('id', execucaoId)
      .single()

    if (error) {
      console.error('Erro ao buscar execução:', error)
      return NextResponse.json({ 
        error: 'Execução não encontrada' 
      }, { status: 404 })
    }

    // Verificar se o usuário tem acesso a esta execução
    if (!podeAcessarExecucao(user, execucao)) {
      return NextResponse.json({ 
        error: 'Sem permissão para acessar esta execução' 
      }, { status: 403 })
    }

    // Enriquecer dados com validações e progresso
    const execucaoEnriquecida = {
      ...execucao,
      validacao: validarExecucao(execucao),
      progresso_detalhado: calcularProgressoDetalhado(execucao)
    }

    return NextResponse.json({
      success: true,
      data: execucaoEnriquecida
    })

  } catch (error: any) {
    console.error('Erro na API de buscar execução:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// =====================================================
// PUT - SALVAR RESPOSTAS
// =====================================================
export async function PUT(
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
    const data = SalvarRespostasSchema.parse(body)
    
    const supabase = await getAdminClient()
    
    // Buscar execução atual
    const { data: execucao, error: fetchError } = await supabase
      .from('checklist_execucoes')
      .select('*')
      .eq('id', execucaoId)
      .single()

    if (fetchError || !execucao) {
      return NextResponse.json({ 
        error: 'Execução não encontrada' 
      }, { status: 404 })
    }

    // Verificar se o usuário pode editar esta execução
    if (!podeEditarExecucao(user, execucao)) {
      return NextResponse.json({ 
        error: 'Sem permissão para editar esta execução' 
      }, { status: 403 })
    }

    // Verificar se execução pode ser editada
    if (!['em_andamento', 'pausado'].includes(execucao.status)) {
      return NextResponse.json({ 
        error: 'Esta execução não pode mais ser editada' 
      }, { status: 400 })
    }

    // Validar respostas
    const validacao = validarRespostas(data.respostas, execucao.estrutura_checklist)
    if (!validacao.valido) {
      return NextResponse.json({ 
        error: 'Respostas inválidas',
        detalhes: validacao.erros 
      }, { status: 400 })
    }

    // Calcular novo progresso
    const novoProgresso = calcularProgresso(data.respostas, execucao.progresso?.tempo_estimado || 30)

    // Atualizar execução
    const dadosAtualizacao: any = {
      respostas: data.respostas,
      observacoes: data.observacoes,
      progresso: novoProgresso,
      atualizado_em: new Date().toISOString(),
      atualizado_por: user.user_id
    }

    // Se não é auto-save, atualizar também o campo de última modificação manual
    if (!data.auto_save) {
      dadosAtualizacao.ultima_edicao_manual = new Date().toISOString()
    }

    const { data: execucaoAtualizada, error: updateError } = await supabase
      .from('checklist_execucoes')
      .update(dadosAtualizacao)
      .eq('id', execucaoId)
      .select(`
        *,
        checklist:checklists!checklist_id (nome, setor, tipo),
        funcionario:usuarios_bar!funcionario_id (nome, email)
      `)
      .single()

    if (updateError) {
      console.error('Erro ao salvar respostas:', updateError)
      return NextResponse.json({ 
        error: 'Erro ao salvar respostas' 
      }, { status: 500 })
    }

    const tipoSave = data.auto_save ? 'automático' : 'manual'
    console.log(`💾 Respostas salvas (${tipoSave}): ${execucaoAtualizada.checklist.nome} - ${novoProgresso.percentual_completo}%`)

    return NextResponse.json({
      success: true,
      message: `Respostas salvas com sucesso (${tipoSave})`,
      data: {
        execucao: execucaoAtualizada,
        progresso: novoProgresso,
        validacao: validacao
      }
    })

  } catch (error: any) {
    console.error('Erro na API de salvar respostas:', error)
    
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
// DELETE - CANCELAR EXECUÇÃO
// =====================================================
export async function DELETE(
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
    const { searchParams } = new URL(request.url)
    const motivo = searchParams.get('motivo') || 'Cancelado pelo usuário'
    
    const supabase = await getAdminClient()
    
    // Buscar execução
    const { data: execucao, error: fetchError } = await supabase
      .from('checklist_execucoes')
      .select('*')
      .eq('id', execucaoId)
      .single()

    if (fetchError || !execucao) {
      return NextResponse.json({ 
        error: 'Execução não encontrada' 
      }, { status: 404 })
    }

    // Verificar permissões
    if (!podeEditarExecucao(user, execucao)) {
      return NextResponse.json({ 
        error: 'Sem permissão para cancelar esta execução' 
      }, { status: 403 })
    }

    // Verificar se pode ser cancelada
    if (!['em_andamento', 'pausado'].includes(execucao.status)) {
      return NextResponse.json({ 
        error: 'Esta execução não pode ser cancelada' 
      }, { status: 400 })
    }

    // Cancelar execução
    const { error: cancelError } = await supabase
      .from('checklist_execucoes')
      .update({
        status: 'cancelado',
        cancelado_em: new Date().toISOString(),
        cancelado_por: user.user_id,
        motivo_cancelamento: motivo,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', execucaoId)

    if (cancelError) {
      console.error('Erro ao cancelar execução:', cancelError)
      return NextResponse.json({ 
        error: 'Erro ao cancelar execução' 
      }, { status: 500 })
    }

    console.log(`❌ Execução cancelada: ${execucaoId} - Motivo: ${motivo}`)

    return NextResponse.json({
      success: true,
      message: 'Execução cancelada com sucesso'
    })

  } catch (error: any) {
    console.error('Erro na API de cancelar execução:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// =====================================================
// FUNÇÕES UTILITÁRIAS
// =====================================================

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

function podeEditarExecucao(user: any, execucao: any): boolean {
  // Admin e financeiro podem editar
  if (['admin', 'financeiro'].includes(user.role)) return true
  
  // Funcionário só pode editar suas próprias execuções
  if (user.role === 'funcionario') {
    return execucao.funcionario_id === user.user_id
  }
  
  return false
}

function validarRespostas(respostas: any, estruturaChecklist: any) {
  const erros: string[] = []
  let camposObrigatoriosVazios = 0

  if (!respostas?.secoes || !estruturaChecklist?.secoes) {
    erros.push('Estrutura de respostas inválida')
    return { valido: false, erros }
  }

  respostas.secoes.forEach((secaoResposta: any, secaoIndex: number) => {
    const secaoOriginal = estruturaChecklist.secoes[secaoIndex]
    
    if (!secaoOriginal) {
      erros.push(`Seção ${secaoIndex + 1} não encontrada na estrutura original`)
      return
    }

    secaoResposta.itens.forEach((itemResposta: any, itemIndex: number) => {
      const itemOriginal = secaoOriginal.itens[itemIndex]
      
      if (!itemOriginal) {
        erros.push(`Item ${itemIndex + 1} da seção "${secaoOriginal.nome}" não encontrado`)
        return
      }

      // Validar campo obrigatório
      if (itemOriginal.obrigatorio && !itemResposta.respondido) {
        erros.push(`Campo obrigatório "${itemOriginal.titulo}" não foi respondido`)
        camposObrigatoriosVazios++
        return
      }

      // Validar tipo de dado se foi respondido
      if (itemResposta.respondido && itemResposta.valor !== null) {
        const validacaoTipo = validarTipoCampo(itemResposta.valor, itemOriginal.tipo, itemOriginal.titulo)
        if (!validacaoTipo.valido) {
          erros.push(validacaoTipo.erro!)
        }
      }

      // Validar anexos obrigatórios
      if (itemOriginal.obrigatorio && ['foto_camera', 'foto_upload', 'assinatura'].includes(itemOriginal.tipo)) {
        if (!itemResposta.anexos || itemResposta.anexos.length === 0) {
          erros.push(`Anexo obrigatório "${itemOriginal.titulo}" não foi fornecido`)
        }
      }
    })
  })

  return {
    valido: erros.length === 0,
    erros,
    campos_obrigatorios_vazios: camposObrigatoriosVazios
  }
}

function validarTipoCampo(valor: any, tipo: string, titulo: string): { valido: boolean; erro?: string } {
  switch (tipo) {
    case 'numero':
      if (isNaN(Number(valor))) {
        return { valido: false, erro: `"${titulo}" deve ser um número válido` }
      }
      break
      
    case 'data':
      if (!valor || isNaN(Date.parse(valor))) {
        return { valido: false, erro: `"${titulo}" deve ser uma data válida` }
      }
      break
      
    case 'sim_nao':
      if (typeof valor !== 'boolean') {
        return { valido: false, erro: `"${titulo}" deve ser verdadeiro ou falso` }
      }
      break
      
    case 'avaliacao':
      const avaliacaoNum = Number(valor)
      if (isNaN(avaliacaoNum) || avaliacaoNum < 1 || avaliacaoNum > 5) {
        return { valido: false, erro: `"${titulo}" deve ser uma avaliação entre 1 e 5` }
      }
      break
      
    case 'texto':
      if (typeof valor !== 'string' || valor.trim().length === 0) {
        return { valido: false, erro: `"${titulo}" deve ser um texto válido` }
      }
      break
  }
  
  return { valido: true }
}

function calcularProgresso(respostas: any, tempoEstimado: number = 30) {
  let totalItens = 0
  let itensRespondidos = 0
  let camposObrigatoriosRespondidos = 0
  let totalCamposObrigatorios = 0

  respostas.secoes?.forEach((secao: any) => {
    secao.itens?.forEach((item: any) => {
      totalItens++
      
      if (item.respondido) {
        itensRespondidos++
      }

      // Assumir que campos obrigatórios são marcados na estrutura original
      // Aqui simplificamos assumindo que sabemos se é obrigatório
      if (item.obrigatorio) {
        totalCamposObrigatorios++
        if (item.respondido) {
          camposObrigatoriosRespondidos++
        }
      }
    })
  })

  const percentualCompleto = totalItens > 0 ? Math.round((itensRespondidos / totalItens) * 100) : 0
  const percentualObrigatorios = totalCamposObrigatorios > 0 ? Math.round((camposObrigatoriosRespondidos / totalCamposObrigatorios) * 100) : 100

  const podeSerFinalizado = percentualObrigatorios === 100

  return {
    total_itens: totalItens,
    itens_respondidos: itensRespondidos,
    percentual_completo: percentualCompleto,
    campos_obrigatorios_total: totalCamposObrigatorios,
    campos_obrigatorios_respondidos: camposObrigatoriosRespondidos,
    percentual_obrigatorios: percentualObrigatorios,
    pode_ser_finalizado: podeSerFinalizado,
    tempo_estimado: tempoEstimado,
    tempo_decorrido: 0 // Será calculado pelo frontend
  }
}

function validarExecucao(execucao: any) {
  const validacaoRespostas = validarRespostas(execucao.respostas, execucao.estrutura_checklist)
  
  return {
    ...validacaoRespostas,
    pode_continuar: ['em_andamento', 'pausado'].includes(execucao.status),
    pode_finalizar: validacaoRespostas.campos_obrigatorios_vazios === 0 && execucao.status === 'em_andamento'
  }
}

function calcularProgressoDetalhado(execucao: any) {
  const progressoBasico = execucao.progresso || {}
  const validacao = validarRespostas(execucao.respostas, execucao.estrutura_checklist)
  
  // Calcular tempo decorrido
  const iniciadoEm = new Date(execucao.iniciado_em)
  const agora = new Date()
  const tempoDecorridoMinutos = Math.round((agora.getTime() - iniciadoEm.getTime()) / 1000 / 60)
  
  return {
    ...progressoBasico,
    tempo_decorrido: tempoDecorridoMinutos,
    campos_obrigatorios_pendentes: validacao.campos_obrigatorios_vazios || 0,
    pode_finalizar: validacao.campos_obrigatorios_vazios === 0,
    status_descricao: getStatusDescricao(execucao.status),
    percentual_tempo: progressoBasico.tempo_estimado > 0 ? 
      Math.round((tempoDecorridoMinutos / progressoBasico.tempo_estimado) * 100) : 0
  }
}

function getStatusDescricao(status: string): string {
  const descricoes: Record<string, string> = {
    'em_andamento': 'Em andamento',
    'pausado': 'Pausado',
    'completado': 'Completado',
    'cancelado': 'Cancelado'
  }
  
  return descricoes[status] || status
} 