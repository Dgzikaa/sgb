import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'
import { z } from 'zod'

// =====================================================
// SCHEMAS DE VALIDAÇÃO
// =====================================================

const IniciarExecucaoSchema = z.object({
  funcionario_responsavel: z.string().uuid().optional(), // Se não informado, usa o usuário logado
  observacoes_iniciais: z.string().optional(),
  agendamento_id: z.string().uuid().optional() // Para execuções agendadas
})

// =====================================================
// POST - INICIAR NOVA EXECUÇÃO
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

    const { id: checklistId } = params
    const body = await request.json()
    const data = IniciarExecucaoSchema.parse(body)
    
    const supabase = await getAdminClient()
    
    // Verificar se checklist existe e está ativo
    const { data: checklist, error: checklistError } = await supabase
      .from('checklists')
      .select('*')
      .eq('id', checklistId)
      .eq('bar_id', user.bar_id)
      .eq('ativo', true)
      .single()

    if (checklistError || !checklist) {
      return NextResponse.json({ 
        error: 'Checklist não encontrado ou inativo' 
      }, { status: 404 })
    }

    // Verificar se funcionário existe (se especificado)
    const funcionarioId = data.funcionario_responsavel || user.user_id
    const { data: funcionario, error: funcionarioError } = await supabase
      .from('usuarios_sistema')
      .select('id, nome, role')
      .eq('id', funcionarioId)
      .eq('bar_id', user.bar_id)
      .single()

    if (funcionarioError || !funcionario) {
      return NextResponse.json({ 
        error: 'Funcionário não encontrado' 
      }, { status: 404 })
    }

    // Verificar se há execução pendente para este checklist e funcionário
    const { data: execucoesPendentes } = await supabase
      .from('checklist_execucoes')
      .select('id, status')
      .eq('checklist_id', checklistId)
      .eq('funcionario_id', funcionarioId)
      .in('status', ['em_andamento', 'pausado'])

    if (execucoesPendentes && execucoesPendentes.length > 0) {
      return NextResponse.json({ 
        error: 'Já existe uma execução pendente para este checklist',
        execucao_pendente: execucoesPendentes[0]
      }, { status: 409 })
    }

    // Gerar estrutura inicial de respostas baseada na estrutura do checklist
    const estruturaRespostas = gerarEstruturaRespostas(checklist.estrutura)

    // Criar nova execução
    const novaExecucao = {
      checklist_id: checklistId,
      funcionario_id: funcionarioId,
      iniciado_por: user.user_id,
      status: 'em_andamento',
      iniciado_em: new Date().toISOString(),
      observacoes_iniciais: data.observacoes_iniciais,
      agendamento_id: data.agendamento_id,
      versao_checklist: checklist.versao,
      estrutura_checklist: checklist.estrutura,
      respostas: estruturaRespostas,
      progresso: {
        total_itens: contarItensTotal(checklist.estrutura),
        itens_respondidos: 0,
        percentual_completo: 0,
        tempo_estimado: checklist.tempo_estimado,
        tempo_decorrido: 0
      }
    }

    const { data: execucao, error: execucaoError } = await supabase
      .from('checklist_execucoes')
      .insert(novaExecucao)
      .select(`
        *,
        checklist:checklists!checklist_id (nome, setor, tipo),
        funcionario:usuarios_sistema!funcionario_id (nome, email),
        iniciado_por_usuario:usuarios_sistema!iniciado_por (nome, email)
      `)
      .single()

    if (execucaoError) {
      console.error('Erro ao criar execução:', execucaoError)
      return NextResponse.json({ 
        error: 'Erro ao iniciar execução do checklist' 
      }, { status: 500 })
    }

    console.log(`✅ Execução iniciada: ${checklist.nome} por ${funcionario.nome}`)

    return NextResponse.json({
      success: true,
      message: 'Execução iniciada com sucesso',
      data: execucao
    })

  } catch (error: any) {
    console.error('Erro na API de iniciar execução:', error)
    
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
// GET - LISTAR EXECUÇÕES DO CHECKLIST
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

    const { id: checklistId } = params
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status') // em_andamento, pausado, completado, cancelado
    const funcionarioId = searchParams.get('funcionario_id')
    const dataInicio = searchParams.get('data_inicio')
    const dataFim = searchParams.get('data_fim')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = (page - 1) * limit
    
    const supabase = await getAdminClient()
    
    // Verificar se checklist existe
    const { data: checklist, error: checklistError } = await supabase
      .from('checklists')
      .select('nome, setor')
      .eq('id', checklistId)
      .eq('bar_id', user.bar_id)
      .single()

    if (checklistError || !checklist) {
      return NextResponse.json({ 
        error: 'Checklist não encontrado' 
      }, { status: 404 })
    }

    // Construir query
    let query = supabase
      .from('checklist_execucoes')
      .select(`
        *,
        checklist:checklists!checklist_id (nome, setor, tipo),
        funcionario:usuarios_sistema!funcionario_id (nome, email),
        iniciado_por_usuario:usuarios_sistema!iniciado_por (nome, email)
      `)
      .eq('checklist_id', checklistId)

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status)
    }

    if (funcionarioId) {
      query = query.eq('funcionario_id', funcionarioId)
    }

    if (dataInicio) {
      query = query.gte('iniciado_em', dataInicio)
    }

    if (dataFim) {
      query = query.lte('iniciado_em', dataFim)
    }

    // Buscar total para paginação
    const { count } = await query

    // Buscar execuções com paginação
    const { data: execucoes, error: execucoesError } = await query
      .order('iniciado_em', { ascending: false })
      .range(offset, offset + limit - 1)

    if (execucoesError) {
      console.error('Erro ao buscar execuções:', execucoesError)
      return NextResponse.json({ 
        error: 'Erro ao buscar execuções' 
      }, { status: 500 })
    }

    // Calcular estatísticas
    const { data: stats } = await supabase
      .from('checklist_execucoes')
      .select('status, finalizado_em, iniciado_em')
      .eq('checklist_id', checklistId)

    const estatisticas = calcularEstatisticas(stats || [])

    return NextResponse.json({
      success: true,
      data: {
        execucoes: execucoes || [],
        checklist: {
          nome: checklist.nome,
          setor: checklist.setor
        },
        estatisticas,
        paginacao: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      }
    })

  } catch (error: any) {
    console.error('Erro na API de listar execuções:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// =====================================================
// FUNÇÕES UTILITÁRIAS
// =====================================================

function gerarEstruturaRespostas(estruturaChecklist: any) {
  const respostas: any = {
    secoes: []
  }

  if (!estruturaChecklist?.secoes) {
    return respostas
  }

  estruturaChecklist.secoes.forEach((secao: any) => {
    const secaoResposta = {
      secao_id: secao.id || `secao_${secao.ordem}`,
      nome: secao.nome,
      itens: [] as any[]
    }

    secao.itens?.forEach((item: any) => {
      const itemResposta = {
        item_id: item.id || `item_${item.ordem}`,
        titulo: item.titulo,
        tipo: item.tipo,
        obrigatorio: item.obrigatorio,
        valor: null,
        anexos: [],
        respondido: false,
        respondido_em: null
      }

      secaoResposta.itens.push(itemResposta)
    })

    respostas.secoes.push(secaoResposta)
  })

  return respostas
}

function contarItensTotal(estrutura: any): number {
  if (!estrutura?.secoes) return 0
  
  return estrutura.secoes.reduce((total: number, secao: any) => {
    return total + (secao.itens?.length || 0)
  }, 0)
}

function calcularEstatisticas(execucoes: any[]) {
  const total = execucoes.length
  const completadas = execucoes.filter(e => e.status === 'completado').length
  const emAndamento = execucoes.filter(e => e.status === 'em_andamento').length
  const canceladas = execucoes.filter(e => e.status === 'cancelado').length

  // Calcular tempo médio das completadas
  const execucoesCompletadas = execucoes.filter(e => 
    e.status === 'completado' && e.finalizado_em && e.iniciado_em
  )

  let tempoMedio = 0
  if (execucoesCompletadas.length > 0) {
    const tempoTotal = execucoesCompletadas.reduce((acc, e) => {
      const inicio = new Date(e.iniciado_em)
      const fim = new Date(e.finalizado_em)
      return acc + (fim.getTime() - inicio.getTime())
    }, 0)
    tempoMedio = Math.round(tempoTotal / execucoesCompletadas.length / 1000 / 60) // em minutos
  }

  return {
    total_execucoes: total,
    completadas,
    em_andamento: emAndamento,
    canceladas,
    taxa_conclusao: total > 0 ? Math.round((completadas / total) * 100) : 0,
    tempo_medio_minutos: tempoMedio
  }
} 