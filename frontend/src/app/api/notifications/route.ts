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
import { SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// SCHEMAS DE VALIDAÃ¡â€¡Ã¡Æ’O
// =====================================================

const CriarNotificacaoSchema = z.object({
  modulo: z.enum(['checklists', 'metas', 'contaazul', 'relatorios', 'dashboard', 'sistema']),
  tipo: z.enum(['info', 'alerta', 'erro', 'sucesso']),
  prioridade: z.enum(['baixa', 'media', 'alta', 'critica']).default('media'),
  categoria: z.string().optional(),
  titulo: z.string().min(1).max(255),
  mensagem: z.string().min(1),
  dados_extras: z.record(z.any()).optional(),
  acoes: z.array(z.object({
    label: z.string(),
    action: z.enum(['redirect', 'callback', 'download']),
    url: z.string().optional(),
    callback: z.string().optional()
  })).optional(),
  canais: z.array(z.enum(['browser', 'whatsapp', 'email'])).default(['browser']),
  usuario_id: z.string().uuid().optional(),
  role_alvo: z.enum(['admin', 'financeiro', 'funcionario']).optional(),
  enviar_em: z.string().datetime().optional(),
  referencia_tipo: z.string().optional(),
  referencia_id: z.string().uuid().optional(),
  chave_duplicacao: z.string().optional()
})

const CriarNotificacaoTemplateSchema = z.object({
  template_nome: z.string(),
  template_modulo: z.string(),
  template_categoria: z.string(),
  variaveis: z.record(z.any()),
  usuario_id: z.string().uuid().optional(),
  role_alvo: z.enum(['admin', 'financeiro', 'funcionario']).optional(),
  enviar_em: z.string().datetime().optional()
})

const FiltrosSchema = z.object({
  status: z.enum(['pendente', 'enviada', 'lida', 'descartada']).optional(),
  modulo: z.string().optional(),
  tipo: z.string().optional(),
  prioridade: z.string().optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  usuario_id: z.string().uuid().optional(),
  apenas_nao_lidas: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
})

// =====================================================
// POST - CRIAR NOTIFICAÃ¡â€¡Ã¡Æ’O
// =====================================================
export async function POST(request: NextRequest) {
  try {
    // Ã°Å¸â€Â AUTENTICAÃ¡â€¡Ã¡Æ’O
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('UsuÃ¡Â¡rio nÃ¡Â£o autenticado')
    }

    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const modo = searchParams.get('modo') // 'direta' ou 'template'

    const supabase = await getAdminClient()

    if (modo === 'template') {
      // Criar notificaÃ¡Â§Ã¡Â£o usando template
      const data = CriarNotificacaoTemplateSchema.parse(body)
      
      const { data: notificacao, error } = await supabase
        .rpc('criar_notificacao_template', {
          p_bar_id: user.bar_id.toString(),
          p_template_nome: data.template_nome,
          p_template_modulo: data.template_modulo,
          p_template_categoria: data.template_categoria,
          p_variaveis: data.variaveis,
          p_usuario_id: data.usuario_id,
          p_role_alvo: data.role_alvo,
          p_enviar_em: data.enviar_em ? new Date(data.enviar_em).toISOString() : null
        })

      if (error) {
        console.error('Erro ao criar notificaÃ¡Â§Ã¡Â£o via template:', error)
        return NextResponse.json({ 
          error: 'Erro ao criar notificaÃ¡Â§Ã¡Â£o via template',
          details: error.message 
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'NotificaÃ¡Â§Ã¡Â£o criada via template',
        notificacao_id: notificacao
      })

    } else {
      // Criar notificaÃ¡Â§Ã¡Â£o direta
      const data = CriarNotificacaoSchema.parse(body)
      
      // Validar permissÃ¡Âµes baseadas no mÃ¡Â³dulo
      const permiteAcesso = validarPermissaoModulo(user.role, data.modulo)
      if (!permiteAcesso) {
        return NextResponse.json({ 
          error: 'Sem permissÃ¡Â£o para criar notificaÃ¡Â§Ã¡Âµes neste mÃ¡Â³dulo' 
        }, { status: 403 })
      }

      // Verificar duplicaÃ¡Â§Ã¡Â£o se especificado
      if (data.chave_duplicacao) {
        const { data: existente } = await supabase
          .from('notificacoes')
          .select('id')
          .eq('bar_id', user.bar_id.toString())
          .eq('chave_duplicacao', data.chave_duplicacao)
          .eq('status', 'pendente')
          .single()

        if (existente) {
          return NextResponse.json({
            success: true,
            message: 'NotificaÃ¡Â§Ã¡Â£o jÃ¡Â¡ existe (duplicaÃ¡Â§Ã¡Â£o evitada)',
            notificacao_id: existente.id
          })
        }
      }

      // Criar notificaÃ¡Â§Ã¡Â£o
      const novaNotificacao = {
        bar_id: user.bar_id.toString(),
        usuario_id: data.usuario_id,
        role_alvo: data.role_alvo,
        modulo: data.modulo,
        tipo: data.tipo,
        prioridade: data.prioridade,
        categoria: data.categoria,
        titulo: data.titulo,
        mensagem: data.mensagem,
        dados_extras: data.dados_extras,
        acoes: data.acoes,
        canais: data.canais,
        enviar_em: data.enviar_em ? new Date(data.enviar_em).toISOString() : new Date().toISOString(),
        referencia_tipo: data.referencia_tipo,
        referencia_id: data.referencia_id,
        chave_duplicacao: data.chave_duplicacao,
        criada_por: user.user_id,
        status: 'pendente'
      }

      const { data: notificacao, error: createError } = await supabase
        .from('notificacoes')
        .insert(novaNotificacao)
        .select()
        .single()

      if (createError) {
        console.error('Erro ao criar notificaÃ¡Â§Ã¡Â£o:', createError)
        return NextResponse.json({ 
          error: 'Erro ao criar notificaÃ¡Â§Ã¡Â£o' 
        }, { status: 500 })
      }

      // Processar envio imediato se necessÃ¡Â¡rio
      if (data.canais.includes('browser')) {
        await processarEnvioBrowser(supabase, notificacao)
      }

      console.log(`Ã°Å¸â€œÂ¢ NotificaÃ¡Â§Ã¡Â£o criada: ${data.modulo}/${data.categoria} - ${data.titulo}`)

      return NextResponse.json({
        success: true,
        message: 'NotificaÃ¡Â§Ã¡Â£o criada com sucesso',
        data: notificacao
      })
    }

  } catch (error) {
    console.error('Erro na API de criar notificaÃ¡Â§Ã¡Â£o:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados invÃ¡Â¡lidos',
        details: error.errors 
      }, { status: 400 })
    }
    
    const errorMsg = (typeof error === 'object' && error !== null && 'message' in error) ? (error as { message: string }).message : String(error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: errorMsg
    }, { status: 500 });
  }
}

// =====================================================
// GET - LISTAR NOTIFICAÃ¡â€¡Ã¡â€¢ES
// =====================================================
export async function GET(request: NextRequest) {
  try {
    // Ã°Å¸â€Â AUTENTICAÃ¡â€¡Ã¡Æ’O
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('UsuÃ¡Â¡rio nÃ¡Â£o autenticado')
    }

    const { searchParams } = new URL(request.url)
    const filtros: Record<string, string | number | boolean> = {}
    
    // Converter parÃ¡Â¢metros para tipos corretos
    for (const [key, value] of searchParams.entries()) {
      if (key === 'page' || key === 'limit') {
        filtros[key] = parseInt(value)
      } else if (key === 'apenas_nao_lidas') {
        filtros[key] = value === 'true'
      } else {
        filtros[key] = value
      }
    }
    
    const data = FiltrosSchema.parse(filtros)
    
    const supabase = await getAdminClient()
    
    // Construir query base - CORRIGIDO: usar apenas colunas existentes
    let query = supabase
      .from('notificacoes')
      .select(`
        id,
        usuario_id,
        tipo,
        titulo,
        mensagem,
        dados,
        status,
        canais,
        agendada_para,
        enviada_em,
        lida_em,
        criada_em,
        bar_id
      `)
      .eq('bar_id', user.bar_id.toString())

    // Filtrar por usuÃ¡Â¡rio especÃ¡Â­fico
    if (data.usuario_id) {
      query = query.eq('usuario_id', data.usuario_id)
    } else {
      // Mostrar todas as notificaÃ¡Â§Ã¡Âµes do bar (temporariamente)
      // query = query.eq('usuario_id', user.user_id)
    }

    // Aplicar filtros
    if (data.status) {
      query = query.eq('status', data.status)
    }

    if (data.modulo) {
      query = query.eq('dados->modulo', data.modulo)
    }

    if (data.tipo) {
      query = query.eq('tipo', data.tipo)
    }

    if (data.prioridade) {
      query = query.eq('dados->prioridade', data.prioridade)
    }

    if (data.data_inicio) {
      query = query.gte('criada_em', data.data_inicio)
    }

    if (data.data_fim) {
      query = query.lte('criada_em', data.data_fim)
    }

    if (data.apenas_nao_lidas) {
      query = query.in('status', ['pendente', 'enviada'])
    }

    // Buscar total para paginaÃ¡Â§Ã¡Â£o
    const { count } = await query

    // Buscar notificaÃ¡Â§Ã¡Âµes com paginaÃ¡Â§Ã¡Â£o
    const offset = (data.page - 1) * data.limit
    const { data: notificacoes, error } = await query
      .order('criada_em', { ascending: false })
      .range(offset, offset + data.limit - 1)

    if (error) {
      console.error('Erro ao buscar notificaÃ¡Â§Ã¡Âµes:', error);
      const errorMsg = (typeof error === 'object' && error !== null && 'message' in error) ? (error as { message: string }).message : String(error);
      return NextResponse.json({ 
        error: 'Erro ao buscar notificaÃ¡Â§Ã¡Âµes',
        details: errorMsg
      }, { status: 500 });
    }

    // Transformar dados para formato esperado pelo frontend
    const notificacoesTransformadas = (notificacoes || []).map((notificacao: Notificacao) => {
      const dados: Record<string, unknown> = notificacao.dados || {};
      
      return {
        id: notificacao.id,
        usuario_id: notificacao.usuario_id,
        modulo: dados.modulo || 'sistema',
        tipo: notificacao.tipo || 'info',
        prioridade: dados.prioridade || 'media',
        categoria: dados.categoria || '',
        titulo: notificacao.titulo || 'NotificaÃ§Ã£o',
        mensagem: notificacao.mensagem || '',
        dados_extras: dados.dados_extras || {},
        acoes: dados.acoes || [],
        canais: notificacao.canais || ['browser'],
        status: notificacao.status || 'pendente',
        agendada_para: notificacao.agendada_para,
        enviada_em: notificacao.enviada_em,
        lida_em: notificacao.lida_em,
        criada_em: notificacao.criada_em,
        bar_id: notificacao.bar_id
      }
    })

    // Calcular estatÃ¡Â­sticas rÃ¡pidas
    const estatisticas = await calcularEstatisticasRapidas(supabase, user.bar_id.toString(), user.user_id, user.role)

    return NextResponse.json({
      success: true,
      data: {
        notificacoes: notificacoesTransformadas,
        estatisticas,
        paginacao: {
          page: data.page,
          limit: data.limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / data.limit)
        }
      }
    })

  } catch (error: unknown) {
    console.error('Erro na API de listar notificaÃ¡Â§Ã¡Âµes:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'ParÃ¡Â¢metros invÃ¡Â¡lidos',
        details: error.errors 
      }, { status: 400 });
    }
    const errorMsg = (typeof error === 'object' && error !== null && 'message' in error) ? (error as { message: string }).message : String(error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: errorMsg
    }, { status: 500 });
  }
}

// =====================================================
// FUNÃ¡â€¡Ã¡â€¢ES UTILITÃ¡ÂRIAS
// =====================================================

function validarPermissaoModulo(role: string, modulo: string): boolean {
  const permissoes: Record<string, string[]> = {
    'admin': ['checklists', 'metas', 'contaazul', 'relatorios', 'dashboard', 'sistema'],
    'financeiro': ['checklists', 'metas', 'contaazul', 'relatorios', 'dashboard'],
    'funcionario': ['checklists']
  }

  return permissoes[role]?.includes(modulo) || false
}

// Interfaces para notificaÃ§Ãµes e estatÃ­sticas
interface Notificacao {
  id: string;
  usuario_id?: string;
  tipo?: string;
  titulo?: string;
  mensagem?: string;
  dados?: Record<string, unknown>;
  status?: string;
  canais?: string[];
  agendada_para?: string;
  enviada_em?: string;
  lida_em?: string;
  criada_em?: string;
  bar_id?: string;
  [key: string]: unknown;
}

interface NotificacaoStats {
  status: string;
  tipo: string;
  dados?: { prioridade?: string; modulo?: string };
}

async function processarEnvioBrowser(supabase: SupabaseClient, notificacao: Notificacao) {
  try {
    // Marcar como enviada (browser notifications sÃ¡Â£o "instantÃ¡Â¢neas")
    await supabase
      .from('notificacoes')
      .update({ 
        status: 'enviada', 
        enviada_em: new Date().toISOString() 
      })
      .eq('id', notificacao.id)

    // Log da entrega
    await supabase
      .from('notificacoes_logs')
      .insert({
        notificacao_id: notificacao.id,
        canal: 'browser',
        status: 'sucesso',
        tentativa: 1,
        response_data: { browser_ready: true },
        tempo_resposta_ms: 0
      })

    console.log(`Ã°Å¸â€œÂ± NotificaÃ¡Â§Ã¡Â£o enviada via browser: ${notificacao.id}`)

  } catch (error: unknown) {
    console.error('Erro ao processar envio browser:', error);
    const errorMsg = (typeof error === 'object' && error !== null && 'message' in error) ? (error as { message: string }).message : String(error);
    // Log do erro
    await supabase
      .from('notificacoes_logs')
      .insert({
        notificacao_id: notificacao.id,
        canal: 'browser',
        status: 'falha',
        tentativa: 1,
        erro_detalhes: errorMsg
      });
  }
}

async function calcularEstatisticasRapidas(supabase: SupabaseClient, barId: string, userId: string, userRole: string) {
  // EstatÃ¡Â­sticas para o usuÃ¡Â¡rio logado
  const { data: minhasStats } = await supabase
    .from('notificacoes')
    .select('status, tipo, dados')
    .eq('bar_id', barId)
    .or(`usuario_id.eq.${userId},dados->role_alvo.eq.${userRole}`)
    .gte('criada_em', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Ã¡Âºltimos 7 dias

  if (!minhasStats) {
    return {
      total_semana: 0,
      nao_lidas: 0,
      alta_prioridade: 0,
      por_tipo: {},
      por_modulo: {}
    }
  }

  type NotificacaoStats = { status: string; tipo: string; dados?: { prioridade?: string; modulo?: string } };
  const naoLidas = minhasStats.filter((n: NotificacaoStats) => ['pendente', 'enviada'].includes(n.status)).length;
  const altaPrioridade = minhasStats.filter((n: NotificacaoStats) => {
    const prioridade = n.dados?.prioridade || 'media';
    return ['alta', 'critica'].includes(prioridade);
  }).length;

  const porTipo = minhasStats.reduce((acc: Record<string, number>, n: NotificacaoStats) => {
    acc[n.tipo] = (acc[n.tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const porModulo = minhasStats.reduce((acc: Record<string, number>, n: NotificacaoStats) => {
    const modulo = n.dados?.modulo || 'sistema';
    acc[modulo] = (acc[modulo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total_semana: minhasStats.length,
    nao_lidas: naoLidas,
    alta_prioridade: altaPrioridade,
    por_tipo: porTipo,
    por_modulo: porModulo
  }
}

// =====================================================
// FUNÃ¡â€¡Ã¡â€¢ES ESPECÃ¡ÂFICAS PARA CHECKLISTS
// =====================================================

async function criarNotificacaoChecklist(
  barId: string,
  categoria: 'lembrete' | 'atraso' | 'conclusao' | 'performance',
  variaveis: Record<string, unknown>,
  usuarioId?: string,
  roleAlvo?: string
) {
  const supabase = await getAdminClient();
  try {
    const { data: notificacaoId, error } = await supabase
      .rpc('criar_notificacao_template', {
        p_bar_id: barId,
        p_template_nome: getTemplateNameByCategory(categoria),
        p_template_modulo: 'checklists',
        p_template_categoria: categoria,
        p_variaveis: variaveis,
        p_usuario_id: usuarioId,
        p_role_alvo: roleAlvo
      });
    if (error) {
      console.error('Erro ao criar notificaÃ¡Â§Ã¡Â£o de checklist:', error);
      return null;
    }
    console.log(`Ã°Å¸â€œâ€¹ NotificaÃ¡Â§Ã¡Â£o de checklist criada: ${categoria}`);
    return notificacaoId;
  } catch (error: unknown) {
    console.error('Erro na funÃ¡Â§Ã¡Â£o criarNotificacaoChecklist:', error);
    return null;
  }
}

function getTemplateNameByCategory(categoria: string): string {
  const templates: Record<string, string> = {
    'lembrete': 'lembrete_agendamento',
    'atraso': 'checklist_atrasado',
    'conclusao': 'checklist_concluido',
    'performance': 'baixa_performance'
  }
  
  return templates[categoria] || 'lembrete_agendamento'
} 

