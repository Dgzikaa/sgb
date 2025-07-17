import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'
import { z } from 'zod'

// =====================================================
// SCHEMAS DE VALIDAÃ‡ÃƒO
// =====================================================

const CriarAtribuicaoSchema = z.object({
  checklist_id: z.string().uuid(),
  tipo_atribuicao: z.enum(['funcionario_especifico', 'cargo', 'setor', 'todos']),
  funcionario_id: z.string().uuid().optional(),
  cargo: z.string().optional(),
  setor: z.string().optional(),
  frequencia: z.enum(['diaria', 'semanal', 'mensal', 'personalizada']),
  configuracao_frequencia: z.object({
    // Para frequÃªncia diÃ¡ria
    horarios: z.array(z.string()).optional(), // ['09:00', '15:00', '21:00']
    dias_semana: z.array(z.number()).optional(), // [1,2,3,4,5] (segunda-sexta)
    
    // Para frequÃªncia personalizada  
    recorrencia_personalizada: z.string().optional(), // Cron expression
    
    // ConfiguraÃ§Ãµes gerais
    tolerancia_minutos: z.number().min(0).max(1440).default(30),
    lembrete_antecipado_minutos: z.number().min(0).max(1440).default(15),
    auto_cancelar_apos_horas: z.number().min(1).max(168).default(24)
  }),
  ativo: z.boolean().default(true),
  observacoes: z.string().optional(),
  data_inicio: z.string(),
  data_fim: z.string().optional()
})

const AtualizarAtribuicaoSchema = CriarAtribuicaoSchema.partial()

// =====================================================
// POST - CRIAR NOVA ATRIBUIÃ‡ÃƒO
// =====================================================
export async function POST(request: NextRequest) {
  try {
    // ðŸ” AUTENTICAÃ‡ÃƒO
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('UsuÃ¡rio nÃ£o autenticado')
    }

    // Apenas admin e financeiro podem criar atribuiÃ§Ãµes
    if (!['admin', 'financeiro'].includes(user.role)) {
      return NextResponse.json({ 
        error: 'Sem permissÃ£o para criar atribuiÃ§Ãµes' 
      }, { status: 403 })
    }

    const body = await request.json()
    const data = CriarAtribuicaoSchema.parse(body)
    
    const supabase = await getAdminClient()
    
    // Verificar se checklist existe
    const { data: checklist, error: checklistError } = await supabase
      .from('checklists')
      .select('id, nome, setor, tempo_estimado')
      .eq('id', data.checklist_id)
      .eq('bar_id', user.bar_id)
      .eq('ativo', true)
      .single()

    if (checklistError || !checklist) {
      return NextResponse.json({ 
        error: 'Checklist nÃ£o encontrado ou inativo' 
      }, { status: 404 })
    }

    // Validar dados especÃ­ficos por tipo de atribuiÃ§Ã£o
    const validacao = validarDadosAtribuicao(data)
    if (!validacao.valido) {
      return NextResponse.json({ 
        error: 'Dados de atribuiÃ§Ã£o invÃ¡lidos',
        detalhes: validacao.erros 
      }, { status: 400 })
    }

    // Verificar conflitos de atribuiÃ§Ã£o
    const conflitos = await verificarConflitosAtribuicao(supabase, data, user.bar_id.toString())
    if (conflitos.length > 0) {
      return NextResponse.json({ 
        error: 'Conflito com atribuiÃ§Ãµes existentes',
        conflitos 
      }, { status: 409 })
    }

    // Criar nova atribuiÃ§Ã£o
    const novaAtribuicao = {
      checklist_id: data.checklist_id,
      bar_id: user.bar_id,
      tipo_atribuicao: data.tipo_atribuicao,
      funcionario_id: data.funcionario_id,
      cargo: data.cargo,
      setor: data.setor,
      frequencia: data.frequencia,
      configuracao_frequencia: data.configuracao_frequencia,
      ativo: data.ativo,
      observacoes: data.observacoes,
      data_inicio: data.data_inicio,
      data_fim: data.data_fim,
      criado_por: user.user_id,
      criado_em: new Date().toISOString()
    }

    const { data: atribuicao, error: createError } = await supabase
      .from('checklist_atribuicoes')
      .insert(novaAtribuicao)
      .select(`
        *,
        checklist:checklists!checklist_id (nome, setor, tipo),
        funcionario:usuarios_bar!funcionario_id (nome, email, cargo),
        criado_por_usuario:usuarios_bar!criado_por (nome)
      `)
      .single()

    if (createError) {
      console.error('Erro ao criar atribuiÃ§Ã£o:', createError)
      return NextResponse.json({ 
        error: 'Erro ao criar atribuiÃ§Ã£o' 
      }, { status: 500 })
    }

    // Criar agendamentos automÃ¡ticos para esta atribuiÃ§Ã£o
    await criarAgendamentosAutomaticos(supabase, atribuicao)

    console.log(`âœ… AtribuiÃ§Ã£o criada: ${checklist.nome} -> ${data.tipo_atribuicao}`)

    return NextResponse.json({
      success: true,
      message: 'AtribuiÃ§Ã£o criada com sucesso',
      data: atribuicao
    })

  } catch (error: any) {
    console.error('Erro na API de criar atribuiÃ§Ã£o:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados invÃ¡lidos',
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
// GET - LISTAR ATRIBUIÃ‡Ã•ES
// =====================================================
export async function GET(request: NextRequest) {
  try {
    // ðŸ” AUTENTICAÃ‡ÃƒO
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('UsuÃ¡rio nÃ£o autenticado')
    }

    const { searchParams } = new URL(request.url)
    
    const checklistId = searchParams.get('checklist_id')
    const funcionarioId = searchParams.get('funcionario_id')
    const tipo = searchParams.get('tipo')
    const ativo = searchParams.get('ativo')
    const setor = searchParams.get('setor')
    const cargo = searchParams.get('cargo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = (page - 1) * limit
    
    const supabase = await getAdminClient()
    
    // Construir query base
    let query = supabase
      .from('checklist_atribuicoes')
      .select(`
        *,
        checklist:checklists!checklist_id (nome, setor, tipo, tempo_estimado),
        funcionario:usuarios_bar!funcionario_id (nome, email, cargo),
        criado_por_usuario:usuarios_bar!criado_por (nome)
      `)
      .eq('bar_id', user.bar_id)

    // Aplicar filtros
    if (checklistId) {
      query = query.eq('checklist_id', checklistId)
    }

    if (funcionarioId) {
      query = query.eq('funcionario_id', funcionarioId)
    }

    if (tipo) {
      query = query.eq('tipo_atribuicao', tipo)
    }

    if (ativo !== null && ativo !== undefined) {
      query = query.eq('ativo', ativo === 'true')
    }

    if (setor) {
      query = query.eq('setor', setor)
    }

    if (cargo) {
      query = query.eq('cargo', cargo)
    }

    // Buscar total para paginaÃ§Ã£o
    const { count } = await query

    // Buscar atribuiÃ§Ãµes com paginaÃ§Ã£o
    const { data: atribuicoes, error } = await query
      .order('criado_em', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Erro ao buscar atribuiÃ§Ãµes:', error)
      return NextResponse.json({ 
        error: 'Erro ao buscar atribuiÃ§Ãµes' 
      }, { status: 500 })
    }

    // Enriquecer atribuiÃ§Ãµes com estatÃ­sticas
    const atribuicoesEnriquecidas = await Promise.all(
      (atribuicoes || []).map(async (atribuicao: any) => {
        const stats = await calcularEstatisticasAtribuicao(supabase, atribuicao.id)
        return {
          ...atribuicao,
          estatisticas: stats
        }
      })
    )

    // Calcular estatÃ­sticas gerais
    const estatisticasGerais = calcularEstatisticasGerais(atribuicoesEnriquecidas)

    return NextResponse.json({
      success: true,
      data: {
        atribuicoes: atribuicoesEnriquecidas,
        estatisticas: estatisticasGerais,
        paginacao: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      }
    })

  } catch (error: any) {
    console.error('Erro na API de listar atribuiÃ§Ãµes:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// =====================================================
// FUNÃ‡Ã•ES UTILITÃRIAS
// =====================================================

function validarDadosAtribuicao(data: any) {
  const erros: string[] = []

  // Validar tipo especÃ­fico
  switch (data.tipo_atribuicao) {
    case 'funcionario_especifico':
      if (!data.funcionario_id) {
        erros.push('ID do funcionÃ¡rio Ã© obrigatÃ³rio para atribuiÃ§Ã£o especÃ­fica')
      }
      break

    case 'cargo':
      if (!data.cargo) {
        erros.push('Cargo Ã© obrigatÃ³rio para atribuiÃ§Ã£o por cargo')
      }
      break

    case 'setor':
      if (!data.setor) {
        erros.push('Setor Ã© obrigatÃ³rio para atribuiÃ§Ã£o por setor')
      }
      break
  }

  // Validar frequÃªncia
  const config = data.configuracao_frequencia
  switch (data.frequencia) {
    case 'diaria':
      if (!config.horarios || config.horarios.length === 0) {
        erros.push('HorÃ¡rios sÃ£o obrigatÃ³rios para frequÃªncia diÃ¡ria')
      }
      break

    case 'semanal':
      if (!config.dias_semana || config.dias_semana.length === 0) {
        erros.push('Dias da semana sÃ£o obrigatÃ³rios para frequÃªncia semanal')
      }
      if (!config.horarios || config.horarios.length === 0) {
        erros.push('HorÃ¡rios sÃ£o obrigatÃ³rios para frequÃªncia semanal')
      }
      break

    case 'personalizada':
      if (!config.recorrencia_personalizada) {
        erros.push('ExpressÃ£o de recorrÃªncia Ã© obrigatÃ³ria para frequÃªncia personalizada')
      }
      break
  }

  // Validar datas
  if (data.data_fim && new Date(data.data_fim) <= new Date(data.data_inicio)) {
    erros.push('Data de fim deve ser posterior Ã  data de inÃ­cio')
  }

  return {
    valido: erros.length === 0,
    erros
  }
}

async function verificarConflitosAtribuicao(supabase: any, data: any, barId: string) {
  const conflitos: any[] = []

  // Buscar atribuiÃ§Ãµes existentes que possam conflitar
  const { data: atribuicoesExistentes } = await supabase
    .from('checklist_atribuicoes')
    .select('*')
    .eq('bar_id', barId)
    .eq('checklist_id', data.checklist_id)
    .eq('ativo', true)

  if (!atribuicoesExistentes) return conflitos

  atribuicoesExistentes.forEach((existente: any) => {
    // Verificar conflitos por tipo
    let temConflito = false
    let motivo = ''

    if (existente.tipo_atribuicao === data.tipo_atribuicao) {
      switch (data.tipo_atribuicao) {
        case 'funcionario_especifico':
          if (existente.funcionario_id === data.funcionario_id) {
            temConflito = true
            motivo = 'FuncionÃ¡rio jÃ¡ possui atribuiÃ§Ã£o para este checklist'
          }
          break

        case 'cargo':
          if (existente.cargo === data.cargo) {
            temConflito = true
            motivo = 'Cargo jÃ¡ possui atribuiÃ§Ã£o para este checklist'
          }
          break

        case 'setor':
          if (existente.setor === data.setor) {
            temConflito = true
            motivo = 'Setor jÃ¡ possui atribuiÃ§Ã£o para este checklist'
          }
          break

        case 'todos':
          temConflito = true
          motivo = 'JÃ¡ existe atribuiÃ§Ã£o geral para este checklist'
          break
      }
    }

    if (temConflito) {
      conflitos.push({
        atribuicao_id: existente.id,
        motivo,
        data_criacao: existente.criado_em
      })
    }
  })

  return conflitos
}

async function criarAgendamentosAutomaticos(supabase: any, atribuicao: any) {
  try {
    const agendamentos = gerarAgendamentos(atribuicao, 30) // PrÃ³ximos 30 dias

    if (agendamentos.length > 0) {
      const { error } = await supabase
        .from('checklist_agendamentos')
        .insert(agendamentos)

      if (error) {
        console.error('Erro ao criar agendamentos automÃ¡ticos:', error)
      } else {
        console.log(`ðŸ“… ${agendamentos.length} agendamentos criados para atribuiÃ§Ã£o ${atribuicao.id}`)
      }
    }
  } catch (error) {
    console.error('Erro na criaÃ§Ã£o de agendamentos automÃ¡ticos:', error)
  }
}

function gerarAgendamentos(atribuicao: any, dias: number) {
  const agendamentos: any[] = []
  const config = atribuicao.configuracao_frequencia
  const dataInicio = new Date(atribuicao.data_inicio)
  const dataFim = atribuicao.data_fim ? new Date(atribuicao.data_fim) : new Date(Date.now() + dias * 24 * 60 * 60 * 1000)

  switch (atribuicao.frequencia) {
    case 'diaria':
      for (let data = new Date(dataInicio); data <= dataFim; data.setDate(data.getDate() + 1)) {
        if (config.dias_semana && !config.dias_semana.includes(data.getDay())) {
          continue // Pular dias nÃ£o configurados
        }

        config.horarios?.forEach((horario: string) => {
          const [hora, minuto] = horario.split(':').map(Number)
          const dataAgendamento = new Date(data)
          dataAgendamento.setHours(hora, minuto, 0, 0)

          if (dataAgendamento > new Date()) { // SÃ³ agendar para o futuro
            agendamentos.push(criarAgendamento(atribuicao, dataAgendamento))
          }
        })
      }
      break

    case 'semanal':
      for (let data = new Date(dataInicio); data <= dataFim; data.setDate(data.getDate() + 7)) {
        config.dias_semana?.forEach((diaSemana: number) => {
          const dataAgendamento = new Date(data)
          const diasParaAjustar = (diaSemana - data.getDay() + 7) % 7
          dataAgendamento.setDate(data.getDate() + diasParaAjustar)

          if (dataAgendamento <= dataFim) {
            config.horarios?.forEach((horario: string) => {
              const [hora, minuto] = horario.split(':').map(Number)
              const dataHorario = new Date(dataAgendamento)
              dataHorario.setHours(hora, minuto, 0, 0)

              if (dataHorario > new Date()) {
                agendamentos.push(criarAgendamento(atribuicao, dataHorario))
              }
            })
          }
        })
      }
      break

    case 'mensal':
      // ImplementaÃ§Ã£o mensal (primeiro dia Ãºtil do mÃªs, etc.)
      for (let data = new Date(dataInicio); data <= dataFim; data.setMonth(data.getMonth() + 1)) {
        config.horarios?.forEach((horario: string) => {
          const [hora, minuto] = horario.split(':').map(Number)
          const dataAgendamento = new Date(data.getFullYear(), data.getMonth(), 1, hora, minuto)

          if (dataAgendamento > new Date() && dataAgendamento <= dataFim) {
            agendamentos.push(criarAgendamento(atribuicao, dataAgendamento))
          }
        })
      }
      break
  }

  return agendamentos
}

function criarAgendamento(atribuicao: any, dataAgendamento: Date) {
  return {
    atribuicao_id: atribuicao.id,
    checklist_id: atribuicao.checklist_id,
    bar_id: atribuicao.bar_id,
    data_agendada: dataAgendamento.toISOString(),
    status: 'agendado',
    tipo_atribuicao: atribuicao.tipo_atribuicao,
    funcionario_id: atribuicao.funcionario_id,
    cargo: atribuicao.cargo,
    setor: atribuicao.setor,
    configuracao: {
      tolerancia_minutos: atribuicao.configuracao_frequencia.tolerancia_minutos,
      lembrete_antecipado_minutos: atribuicao.configuracao_frequencia.lembrete_antecipado_minutos,
      auto_cancelar_apos_horas: atribuicao.configuracao_frequencia.auto_cancelar_apos_horas
    },
    criado_em: new Date().toISOString()
  }
}

async function calcularEstatisticasAtribuicao(supabase: any, atribuicaoId: string) {
  // Buscar agendamentos desta atribuiÃ§Ã£o
  const { data: agendamentos } = await supabase
    .from('checklist_agendamentos')
    .select('status, data_agendada, execucao_id')
    .eq('atribuicao_id', atribuicaoId)

  if (!agendamentos) {
    return {
      total_agendados: 0,
      concluidos: 0,
      pendentes: 0,
      atrasados: 0,
      taxa_conclusao: 0
    }
  }

  const agora = new Date()
  const concluidos = agendamentos.filter((a: any) => a.status === 'concluido').length
  const pendentes = agendamentos.filter((a: any) => a.status === 'agendado' && new Date(a.data_agendada) > agora).length
  const atrasados = agendamentos.filter((a: any) => a.status === 'agendado' && new Date(a.data_agendada) <= agora).length

  return {
    total_agendados: agendamentos.length,
    concluidos,
    pendentes,
    atrasados,
    taxa_conclusao: agendamentos.length > 0 ? Math.round((concluidos / agendamentos.length) * 100) : 0
  }
}

function calcularEstatisticasGerais(atribuicoes: any[]) {
  const total = atribuicoes.length
  const ativas = atribuicoes.filter((a: any) => a.ativo).length
  const inativas = total - ativas

  const totalAgendados = atribuicoes.reduce((acc: number, a: any) => acc + (a.estatisticas?.total_agendados || 0), 0)
  const totalConcluidos = atribuicoes.reduce((acc: number, a: any) => acc + (a.estatisticas?.concluidos || 0), 0)
  const totalAtrasados = atribuicoes.reduce((acc: number, a: any) => acc + (a.estatisticas?.atrasados || 0), 0)

  return {
    total_atribuicoes: total,
    atribuicoes_ativas: ativas,
    atribuicoes_inativas: inativas,
    total_agendamentos: totalAgendados,
    execucoes_concluidas: totalConcluidos,
    execucoes_atrasadas: totalAtrasados,
    taxa_conclusao_geral: totalAgendados > 0 ? Math.round((totalConcluidos / totalAgendados) * 100) : 0
  }
} 
