import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'
import { z } from 'zod'

// =====================================================
// SCHEMAS DE VALIDAÃÂ¡Ã¢â¬Â¡ÃÂ¡ÃâO
// =====================================================

const NotificacaoChecklistSchema = z.object({
  checklist_execucao_id: z.string().uuid('ID da execuÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o invÃÂ¡ÃÂ¡lido'),
  tipo_notificacao: z.enum(['completado', 'atrasado', 'iniciado', 'problema']),
  destinatarios_customizados: z.array(z.string()).optional(),
  observacoes_extras: z.string().optional(),
  incluir_fotos: z.boolean().default(false),
  incluir_relatorio: z.boolean().default(true)
})

// =====================================================
// POST - ENVIAR NOTIFICAÃÂ¡Ã¢â¬Â¡ÃÂ¡ÃâO DE CHECKLIST
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('UsuÃÂ¡ÃÂ¡rio nÃÂ¡ÃÂ£o autenticado')
    }

    const body = await request.json()
    const data = NotificacaoChecklistSchema.parse(body)

    const supabase = await getAdminClient()

    // Buscar execuÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o do checklist com dados completos
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
      return NextResponse.json({ error: 'ExecuÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o de checklist nÃÂ¡ÃÂ£o encontrada' }, { status: 404 })
    }

    // Verificar se notificaÃÂ¡ÃÂ§ÃÂ¡ÃÂµes estÃÂ¡ÃÂ£o ativas
    const notificacoesAtivas = execucao.agendamento?.notificacoes_ativas || 
                               execucao.checklist.checklist_schedules?.[0]?.notificacoes_ativas || 
                               true

    if (!notificacoesAtivas) {
      return NextResponse.json({ 
        success: true, 
        message: 'NotificaÃÂ¡ÃÂ§ÃÂ¡ÃÂµes desabilitadas para este checklist' 
      })
    }

    // Determinar destinatÃÂ¡ÃÂ¡rios
    const destinatarios = await determinarDestinatarios(
      supabase, 
      execucao, 
      data.destinatarios_customizados,
      user.bar_id
    )

    if (destinatarios.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Nenhum destinatÃÂ¡ÃÂ¡rio configurado' 
      })
    }

    // Gerar mensagem personalizada
    const mensagem = await gerarMensagemWhatsApp(execucao, data, user.bar_id)

    // Enviar notificaÃÂ¡ÃÂ§ÃÂ¡ÃÂµes
    const resultados = await enviarNotificacoesWhatsApp(
      supabase, 
      destinatarios, 
      mensagem, 
      execucao,
      data.incluir_relatorio
    )

    // Registrar log da notificaÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o
    await registrarLogNotificacao(supabase, {
      checklist_execucao_id: data.checklist_execucao_id,
      tipo_notificacao: data.tipo_notificacao,
      destinatarios_enviados: resultados.sucessos,
      destinatarios_falha: resultados.falhas,
      mensagem_enviada: mensagem,
      enviado_por: user.user_id,
      bar_id: user.bar_id
    })

    console.log(`ÃÂ°ÃÂ¸Ã¢â¬ÅÃÂ± NotificaÃÂ¡ÃÂ§ÃÂ¡ÃÂµes enviadas para checklist ${execucao.checklist.nome}: ${resultados.sucessos.length} sucessos, ${resultados.falhas.length} falhas`)

    return NextResponse.json({
      success: true,
      message: 'NotificaÃÂ¡ÃÂ§ÃÂ¡ÃÂµes processadas',
      resultados: {
        total_enviados: resultados.sucessos.length,
        total_falhas: resultados.falhas.length,
        destinatarios: destinatarios.map((d) => ({ nome: d.nome, numero: d.numero }))
      }
    })

  } catch (error) {
    console.error('Erro na API de notificaÃ§Ãµes:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados invÃ¡lidos',
        details: (error as unknown).errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: (error as unknown).message 
    }, { status: 500 })
  }
}

// =====================================================
// GET - HISTÃÂ¡Ã¢â¬ÅRICO DE NOTIFICAÃÂ¡Ã¢â¬Â¡ÃÂ¡Ã¢â¬Â¢ES
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('UsuÃÂ¡ÃÂ¡rio nÃÂ¡ÃÂ£o autenticado')
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
      console.error('Erro ao buscar logs de notificaÃ§Ãµes:', error)
      return NextResponse.json({ error: 'Erro ao buscar histÃ³rico' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: logs || [],
      pagination: { page, limit }
    })

  } catch (error) {
    console.error('Erro na API de histÃ³rico de notificaÃ§Ãµes:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: (error as unknown).message 
    }, { status: 500 })
  }
}

// =====================================================
// FUNÃÂ¡Ã¢â¬Â¡ÃÂ¡Ã¢â¬Â¢ES AUXILIARES
// =====================================================

async function determinarDestinatarios(supabase: unknown, execucao: unknown, customizados?: string[], barId?: number) {
  const destinatarios = [];

  // 1. DestinatÃÂ¡ÃÂ¡rios do agendamento
  if (execucao.agendamento?.responsaveis_whatsapp) {
    destinatarios.push(...execucao.agendamento.responsaveis_whatsapp)
  }

  // 2. DestinatÃÂ¡ÃÂ¡rios customizados (nÃÂ¡ÃÂºmeros diretos)
  if (customizados && customizados.length > 0) {
    customizados.forEach((numero: unknown) => {
      destinatarios.push({
        nome: 'DestinatÃ¡rio customizado',
        numero: numero,
        cargo: 'N/A'
      })
    })
  }

  // 3. DestinatÃÂ¡ÃÂ¡rios padrÃÂ¡ÃÂ£o do sistema (administradores)
  if (destinatarios.length === 0 && barId) {
    const { data: admins } = await supabase
              .from('usuarios_bar')
      .select('nome, telefone')
      .eq('bar_id', barId)
      .eq('role', 'admin')
      .not('telefone', 'is', null)

    if (admins) {
      admins.forEach((admin: unknown) => {
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

  // Remover duplicatas por nÃÂ¡ÃÂºmero
  const numerosUnicos = new Set()
  return destinatarios.filter((dest: unknown) => {
    if (numerosUnicos.has(dest.numero)) {
      return false
    }
    numerosUnicos.add(dest.numero)
    return true
  })
}

async function gerarMensagemWhatsApp(execucao: unknown, dados: unknown, barId: number) {
  const checklist = execucao.checklist
  const funcionario = execucao.funcionario
  
  // Calcular estatÃÂ¡ÃÂ­sticas da execuÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o
  const stats = calcularEstatisticasExecucao(execucao)
  
  const emojis = {
    completado: 'Ãâ€œÃ¢â‚¬Â¦',
    atrasado: 'ÃÂ°ÃÂ¸ÃÂ¡Ã¢â€“Â¬', 
    iniciado: 'ÃÂ°ÃÂ¸ÃÂ¡Ã¢â€“Â¬',
    problema: 'ÃÂ¡Ã¢â€“Â Ã¢â‚¬Â¸Ã¢â‚¬Â¹'
  }

  const emoji = emojis[dados.tipo_notificacao as keyof typeof emojis] || 'ÃÂ°ÃÂ¸Ã¢â‚¬Â¦Ã¢â‚¬Â¹'

  let mensagem = `${emoji} *SGB - Checklist ${dados.tipo_notificacao.toUpperCase()}*

ÃÂ°ÃÂ¸Ã¢â‚¬Â¦Ã¢â‚¬Â¹ *Checklist:* ${checklist.nome}
ÃÂ°ÃÂ¸Ã¢â€“Â¢ *Setor:* ${checklist.setor}
ÃÂ°ÃÂ¸Ã¢â‚¬Â¬Ã¢â€“Â¤ *Executado por:* ${funcionario?.nome || 'N/A'}
Ã¢â€“Â° *Data/Hora:* ${new Date(execucao.iniciado_em).toLocaleString('pt-BR')}

ÃÂ°ÃÂ¸Ã¢â‚¬Â¦Ã¢â‚¬Â¹Ã¢â‚¬Â  *Resultados:*`

  if (dados.tipo_notificacao === 'completado') {
    mensagem += `
Ãâ€œÃ¢â‚¬Â¦ *Status:* ConcluÃ­do com sucesso
ÃÂ°ÃÂ¸Ã¢â‚¬Â¦Ã¢â‚¬Â¹Ã¢â‚¬Â  *Progresso:* ${stats.percentual_completo}%
Ã¢â€“Â±Ã¢â‚¬Â¯Ã¢â‚¬Â¹Ã¢â‚¬Â  *Tempo total:* ${stats.tempo_execucao}
Ã¢â€“Â Ã¢â€“Â  *Score:* ${stats.score_qualidade}/100`

    if (stats.problemas_encontrados > 0) {
      mensagem += `
ÃÂ¡Ã¢â€“Â Ã¢â‚¬Â¯Ã¢â‚¬Â¹Ã¢â‚¬Â  *Problemas:* ${stats.problemas_encontrados} item(s) com observaÃ§Ãµes`
    }
  } else if (dados.tipo_notificacao === 'atrasado') {
    const horasAtraso = Math.round(
      (new Date().getTime() - new Date(execucao.prazo_conclusao).getTime()) / (1000 * 60 * 60)
    )
    mensagem += `
ÃÂ°ÃÂ¸Ã¢â‚¬ÂÃ¢â€“Â¥ *SituaÃ§Ã£o:* Atrasado hÃ¢â€“Â¡ ${horasAtraso}h
Ã¢â€“Â° *Prazo era:* ${new Date(execucao.prazo_conclusao).toLocaleString('pt-BR')}
ÃÂ°ÃÂ¸Ã¢â‚¬Â¦Ã¢â‚¬Â¹Ã¢â‚¬Â  *Progresso:* ${stats.percentual_completo}%`
  }

  if (dados.observacoes_extras) {
    mensagem += `

ÃÂ°ÃÂ¸Ã¢â‚¬â€šÃ¢â‚¬Â¬ *ObservaÃ§Ãµes:*
${dados.observacoes_extras}`
  }

  mensagem += `

_Sistema de GestÃ£o de Bares_`

  return mensagem
}

async function enviarNotificacoesWhatsApp(supabase: unknown, destinatarios: unknown[], mensagem: string, execucao: unknown, incluirRelatorio: boolean) {
  const sucessos = [];
  const falhas = [];

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
        falhas.push({ destinatario, erro: (error as unknown).message })
      } else {
        sucessos.push({ destinatario, resultado })
        
        // Se incluir relatÃ³rio, enviar link adicional
        if (incluirRelatorio) {
          const linkRelatorio = `${process.env.NEXT_PUBLIC_APP_URL}/relatorios/checklist/${execucao.id}`
          await supabase.functions.invoke('whatsapp-send', {
            body: {
              to: destinatario.numero,
              message: `ÃÂ°ÃÂ¸Ã¢â‚¬Â¦Ã¢â‚¬Â¦ *RelatÃ³rio Completo:* ${linkRelatorio}`,
              type: 'text',
              modulo: 'checklists'
            }
          })
        }
      }
    } catch (error) {
      falhas.push({ destinatario, erro: (error as unknown).message })
    }
  }

  return { sucessos, falhas }
}

function calcularEstatisticasExecucao(execucao: unknown) {
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
    respostas.secoes.forEach((secao: unknown) => {
      secao.itens?.forEach((item: unknown) => {
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

async function registrarLogNotificacao(supabase: unknown, dados: unknown) {
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
