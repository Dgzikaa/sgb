import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'
import { z } from 'zod'

// =====================================================
// SCHEMAS DE VALIDAÃ‡ÃƒO
// =====================================================

const NotificacaoChecklistSchema = z.object({
  checklist_execucao_id: z.string().uuid('ID da execuÃ§Ã£o invÃ¡lido'),
  tipo_notificacao: z.enum(['completado', 'atrasado', 'iniciado', 'problema']),
  destinatarios_customizados: z.array(z.string()).optional(),
  observacoes_extras: z.string().optional(),
  incluir_fotos: z.boolean().default(false),
  incluir_relatorio: z.boolean().default(true)
})

// =====================================================
// POST - ENVIAR NOTIFICAÃ‡ÃƒO DE CHECKLIST
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('UsuÃ¡rio nÃ£o autenticado')
    }

    const body = await request.json()
    const data = NotificacaoChecklistSchema.parse(body)

    const supabase = await getAdminClient()

    // Buscar execuÃ§Ã£o do checklist com dados completos
    const { data: execucao, error: execucaoError } = await supabase
      .from('checklist_execucoes')
      .select(`
        *,
        checklist:checklists (
          id, nome, setor, tipo,
          checklist_schedules (
            titulo, responsaveis_whatsapp, notificacoes_ativas
          )
        ),
        funcionario:usuarios_bar!funcionario_id (
          nome, email, telefone
        ),
        agendamento:checklist_schedules (
          titulo, responsaveis_whatsapp, notificacoes_ativas
        )
      `)
      .eq('id', data.checklist_execucao_id)
      .eq('bar_id', user.bar_id)
      .single()

    if (execucaoError || !execucao) {
      return NextResponse.json({ error: 'ExecuÃ§Ã£o de checklist nÃ£o encontrada' }, { status: 404 })
    }

    // Verificar se notificaÃ§Ãµes estÃ£o ativas
    const notificacoesAtivas = execucao.agendamento?.notificacoes_ativas || 
                               execucao.checklist.checklist_schedules?.[0]?.notificacoes_ativas || 
                               true

    if (!notificacoesAtivas) {
      return NextResponse.json({ 
        success: true, 
        message: 'NotificaÃ§Ãµes desabilitadas para este checklist' 
      })
    }

    // Determinar destinatÃ¡rios
    const destinatarios = await determinarDestinatarios(
      supabase, 
      execucao, 
      data.destinatarios_customizados,
      user.bar_id
    )

    if (destinatarios.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Nenhum destinatÃ¡rio configurado' 
      })
    }

    // Gerar mensagem personalizada
    const mensagem = await gerarMensagemWhatsApp(execucao, data, user.bar_id)

    // Enviar notificaÃ§Ãµes
    const resultados = await enviarNotificacoesWhatsApp(
      supabase, 
      destinatarios, 
      mensagem, 
      execucao,
      data.incluir_relatorio
    )

    // Registrar log da notificaÃ§Ã£o
    await registrarLogNotificacao(supabase, {
      checklist_execucao_id: data.checklist_execucao_id,
      tipo_notificacao: data.tipo_notificacao,
      destinatarios_enviados: resultados.sucessos,
      destinatarios_falha: resultados.falhas,
      mensagem_enviada: mensagem,
      enviado_por: user.user_id,
      bar_id: user.bar_id
    })

    console.log(`ðŸ“± NotificaÃ§Ãµes enviadas para checklist ${execucao.checklist.nome}: ${resultados.sucessos.length} sucessos, ${resultados.falhas.length} falhas`)

    return NextResponse.json({
      success: true,
      message: 'NotificaÃ§Ãµes processadas',
      resultados: {
        total_enviados: resultados.sucessos.length,
        total_falhas: resultados.falhas.length,
        destinatarios: destinatarios.map((d: any) => ({ nome: d.nome, numero: d.numero }))
      }
    })

  } catch (error: any) {
    console.error('Erro na API de notificaÃ§Ãµes:', error)
    
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
// GET - HISTÃ“RICO DE NOTIFICAÃ‡Ã•ES
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('UsuÃ¡rio nÃ£o autenticado')
    }

    const { searchParams } = new URL(request.url)
    const checklistId = searchParams.get('checklist_id')
    const execucaoId = searchParams.get('execucao_id')
    const tipoNotificacao = searchParams.get('tipo_notificacao')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    const supabase = await getAdminClient()

    let query = supabase
      .from('checklist_notification_logs')
      .select(`
        *,
        checklist_execucao:checklist_execucoes (
          checklist:checklists (nome, setor)
        ),
        enviado_por_usuario:usuarios_bar!enviado_por (nome, email)
      `)
      .eq('bar_id', user.bar_id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    // Aplicar filtros
    if (checklistId) {
      query = query.eq('checklist_execucao.checklist_id', checklistId)
    }
    if (execucaoId) {
      query = query.eq('checklist_execucao_id', execucaoId)
    }
    if (tipoNotificacao) {
      query = query.eq('tipo_notificacao', tipoNotificacao)
    }

    const { data: logs, error } = await query

    if (error) {
      console.error('Erro ao buscar logs de notificaÃ§Ã£o:', error)
      return NextResponse.json({ error: 'Erro ao buscar histÃ³rico' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: logs || [],
      pagination: { page, limit }
    })

  } catch (error: any) {
    console.error('Erro na API de histÃ³rico de notificaÃ§Ãµes:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// =====================================================
// FUNÃ‡Ã•ES AUXILIARES
// =====================================================

async function determinarDestinatarios(supabase: any, execucao: any, customizados?: string[], barId?: number) {
  const destinatarios: any[] = []

  // 1. DestinatÃ¡rios do agendamento
  if (execucao.agendamento?.responsaveis_whatsapp) {
    destinatarios.push(...execucao.agendamento.responsaveis_whatsapp)
  }

  // 2. DestinatÃ¡rios customizados (nÃºmeros diretos)
  if (customizados && customizados.length > 0) {
    customizados.forEach(numero => {
      destinatarios.push({
        nome: 'DestinatÃ¡rio customizado',
        numero: numero,
        cargo: 'N/A'
      })
    })
  }

  // 3. DestinatÃ¡rios padrÃ£o do sistema (administradores)
  if (destinatarios.length === 0 && barId) {
    const { data: admins } = await supabase
              .from('usuarios_bar')
      .select('nome, telefone')
      .eq('bar_id', barId)
      .eq('role', 'admin')
      .not('telefone', 'is', null)

    if (admins) {
      admins.forEach((admin: any) => {
        if (admin.telefone) {
          destinatarios.push({
            nome: admin.nome,
            numero: admin.telefone,
            cargo: 'Administrador'
          })
        }
      })
    }
  }

  // Remover duplicatas por nÃºmero
  const numerosUnicos = new Set()
  return destinatarios.filter((dest: any) => {
    if (numerosUnicos.has(dest.numero)) {
      return false
    }
    numerosUnicos.add(dest.numero)
    return true
  })
}

async function gerarMensagemWhatsApp(execucao: any, dados: any, barId: number) {
  const checklist = execucao.checklist
  const funcionario = execucao.funcionario
  
  // Calcular estatÃ­sticas da execuÃ§Ã£o
  const stats = calcularEstatisticasExecucao(execucao)
  
  const emojis = {
    completado: 'âœ…',
    atrasado: 'ðŸš¨', 
    iniciado: 'ðŸš€',
    problema: 'âš ï¸'
  }

  const emoji = emojis[dados.tipo_notificacao as keyof typeof emojis] || 'ðŸ“‹'

  let mensagem = `${emoji} *SGB - Checklist ${dados.tipo_notificacao.toUpperCase()}*

ðŸ“‹ *Checklist:* ${checklist.nome}
ðŸ¢ *Setor:* ${checklist.setor}
ðŸ‘¤ *Executado por:* ${funcionario?.nome || 'N/A'}
â° *Data/Hora:* ${new Date(execucao.iniciado_em).toLocaleString('pt-BR')}

ðŸ“Š *Resultados:*`

  if (dados.tipo_notificacao === 'completado') {
    mensagem += `
âœ… *Status:* ConcluÃ­do com sucesso
ðŸ“ˆ *Progresso:* ${stats.percentual_completo}%
â±ï¸ *Tempo total:* ${stats.tempo_execucao}
â­ *Score:* ${stats.score_qualidade}/100`

    if (stats.problemas_encontrados > 0) {
      mensagem += `
âš ï¸ *Problemas:* ${stats.problemas_encontrados} item(s) com observaÃ§Ãµes`
    }
  } else if (dados.tipo_notificacao === 'atrasado') {
    const horasAtraso = Math.round(
      (new Date().getTime() - new Date(execucao.prazo_conclusao).getTime()) / (1000 * 60 * 60)
    )
    mensagem += `
ðŸ”¥ *SituaÃ§Ã£o:* Atrasado hÃ¡ ${horasAtraso}h
â° *Prazo era:* ${new Date(execucao.prazo_conclusao).toLocaleString('pt-BR')}
ðŸ“ˆ *Progresso:* ${stats.percentual_completo}%`
  }

  if (dados.observacoes_extras) {
    mensagem += `

ðŸ’¬ *ObservaÃ§Ãµes:*
${dados.observacoes_extras}`
  }

  mensagem += `

_Sistema de GestÃ£o de Bares_`

  return mensagem
}

async function enviarNotificacoesWhatsApp(supabase: any, destinatarios: any[], mensagem: string, execucao: any, incluirRelatorio: boolean) {
  const sucessos: any[] = []
  const falhas: any[] = []

  for (const destinatario of destinatarios) {
    try {
      // Usar a API existente de WhatsApp
      const { data: resultado, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          to: destinatario.numero,
          message: mensagem,
          type: 'text',
          modulo: 'checklists',
          checklist_id: execucao.checklist_id,
          checklist_execucao_id: execucao.id,
          prioridade: 'alta'
        }
      })

      if (error) {
        falhas.push({ destinatario, erro: error.message })
      } else {
        sucessos.push({ destinatario, resultado })
        
        // Se incluir relatÃ³rio, enviar link adicional
        if (incluirRelatorio) {
          const linkRelatorio = `${process.env.NEXT_PUBLIC_APP_URL}/relatorios/checklist/${execucao.id}`
          await supabase.functions.invoke('whatsapp-send', {
            body: {
              to: destinatario.numero,
              message: `ðŸ“„ *RelatÃ³rio Completo:* ${linkRelatorio}`,
              type: 'text',
              modulo: 'checklists'
            }
          })
        }
      }
    } catch (error: any) {
      falhas.push({ destinatario, erro: error.message })
    }
  }

  return { sucessos, falhas }
}

function calcularEstatisticasExecucao(execucao: any) {
  const respostas = execucao.respostas || {}
  const totalItens = execucao.progresso?.total_itens || 0
  const itensRespondidos = execucao.progresso?.itens_respondidos || 0
  
  const tempoInicio = new Date(execucao.iniciado_em)
  const tempoFim = execucao.concluido_em ? new Date(execucao.concluido_em) : new Date()
  const tempoExecucao = Math.round((tempoFim.getTime() - tempoInicio.getTime()) / (1000 * 60)) // minutos

  // Calcular score de qualidade baseado nas respostas
  let scoreQualidade = 100
  let problemasEncontrados = 0

  if (respostas.secoes) {
    respostas.secoes.forEach((secao: any) => {
      secao.itens?.forEach((item: any) => {
        if (item.tipo === 'sim_nao' && item.valor === 'nao' && item.obrigatorio) {
          scoreQualidade -= 10
          problemasEncontrados++
        }
        if (item.observacoes && item.observacoes.length > 0) {
          problemasEncontrados++
        }
      })
    })
  }

  return {
    percentual_completo: totalItens > 0 ? Math.round((itensRespondidos / totalItens) * 100) : 0,
    tempo_execucao: `${Math.floor(tempoExecucao / 60)}h ${tempoExecucao % 60}min`,
    score_qualidade: Math.max(scoreQualidade, 0),
    problemas_encontrados: problemasEncontrados
  }
}

async function registrarLogNotificacao(supabase: any, dados: any) {
  const { error } = await supabase
    .from('checklist_notification_logs')
    .insert({
      ...dados,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('Erro ao registrar log de notificaÃ§Ã£o:', error)
  }
} 
