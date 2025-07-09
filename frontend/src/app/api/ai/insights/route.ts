import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schema de validação para filtros
const FilterInsightsSchema = z.object({
  tipo_insight: z.string().optional(),
  categoria: z.string().optional(),
  impacto: z.enum(['baixo', 'medio', 'alto', 'critico']).optional(),
  urgencia: z.enum(['baixa', 'media', 'alta', 'critica']).optional(),
  status: z.enum(['novo', 'lido', 'em_acao', 'resolvido', 'ignorado']).optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  confianca_minima: z.number().min(0).max(100).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  order_by: z.enum(['created_at', 'confianca', 'impacto', 'urgencia']).default('created_at'),
  order_direction: z.enum(['asc', 'desc']).default('desc')
});

// Schema para atualização de insight
const UpdateInsightSchema = z.object({
  status: z.enum(['novo', 'lido', 'em_acao', 'resolvido', 'ignorado']).optional(),
  acao_tomada: z.string().optional(),
  usuario_avaliacao: z.number().min(1).max(5).optional(),
  usuario_feedback: z.string().optional(),
  util: z.boolean().optional()
});

// ========================================
// 🧠 GET /api/ai/insights
// ========================================
export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    // Verificar permissões (admins e financeiros podem ver insights)
    if (!['financeiro', 'admin'].includes(permissao)) {
      return NextResponse.json({ error: 'Sem permissão para acessar insights de IA' }, { status: 403 });
    }

    // Parse dos parâmetros de query
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    
    // Converter tipos numéricos
    const processedParams: any = { ...rawParams };
    if (processedParams.page) processedParams.page = parseInt(processedParams.page);
    if (processedParams.limit) processedParams.limit = parseInt(processedParams.limit);
    if (processedParams.confianca_minima) processedParams.confianca_minima = parseFloat(processedParams.confianca_minima);

    const params = FilterInsightsSchema.parse(processedParams);

    // Construir query base
    let query = supabase
      .from('ai_insights')
      .select(`
        id,
        tipo_insight,
        categoria,
        titulo,
        descricao,
        confianca,
        impacto,
        urgencia,
        status,
        periodo_analise_inicio,
        periodo_analise_fim,
        projecao_impacto_dias,
        acoes_sugeridas,
        acao_tomada,
        usuario_avaliacao,
        util,
        lido_por,
        lido_em,
        created_at,
        expires_at,
        usuarios_bar!ai_insights_lido_por_fkey(nome)
      `)
      .eq('bar_id', bar_id)
      .order(params.order_by, { ascending: params.order_direction === 'asc' });

    // Aplicar filtros
    if (params.tipo_insight) {
      query = query.eq('tipo_insight', params.tipo_insight);
    }
    if (params.categoria) {
      query = query.eq('categoria', params.categoria);
    }
    if (params.impacto) {
      query = query.eq('impacto', params.impacto);
    }
    if (params.urgencia) {
      query = query.eq('urgencia', params.urgencia);
    }
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.data_inicio) {
      query = query.gte('created_at', params.data_inicio);
    }
    if (params.data_fim) {
      query = query.lte('created_at', params.data_fim);
    }
    if (params.confianca_minima) {
      query = query.gte('confianca', params.confianca_minima);
    }

    // Filtrar insights não expirados
    query = query.or('expires_at.is.null,expires_at.gte.' + new Date().toISOString());

    // Paginação
    const offset = (params.page - 1) * params.limit;
    query = query.range(offset, offset + params.limit - 1);

    const { data: insights, error } = await query;

    if (error) {
      console.error('Erro ao buscar insights:', error);
      return NextResponse.json({ error: 'Erro ao buscar insights' }, { status: 500 });
    }

    // Buscar estatísticas gerais
    const { data: stats } = await supabase
      .from('ai_insights')
      .select('status, impacto, categoria, confianca')
      .eq('bar_id', bar_id)
      .or('expires_at.is.null,expires_at.gte.' + new Date().toISOString());

    const estatisticas = {
      total: stats?.length || 0,
      por_status: {
        novo: stats?.filter(s => s.status === 'novo').length || 0,
        lido: stats?.filter(s => s.status === 'lido').length || 0,
        em_acao: stats?.filter(s => s.status === 'em_acao').length || 0,
        resolvido: stats?.filter(s => s.status === 'resolvido').length || 0,
        ignorado: stats?.filter(s => s.status === 'ignorado').length || 0
      },
      por_impacto: {
        critico: stats?.filter(s => s.impacto === 'critico').length || 0,
        alto: stats?.filter(s => s.impacto === 'alto').length || 0,
        medio: stats?.filter(s => s.impacto === 'medio').length || 0,
        baixo: stats?.filter(s => s.impacto === 'baixo').length || 0
      },
      por_categoria: stats?.reduce((acc, s) => {
        acc[s.categoria] = (acc[s.categoria] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      confianca_media: stats?.length ? 
        stats.reduce((sum, s) => sum + s.confianca, 0) / stats.length : 0
    };

    // Buscar insights críticos pendentes
    const { data: criticos } = await supabase
      .from('ai_insights')
      .select('id, titulo, impacto')
      .eq('bar_id', bar_id)
      .eq('impacto', 'critico')
      .in('status', ['novo', 'lido'])
      .or('expires_at.is.null,expires_at.gte.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: insights,
      estatisticas,
      insights_criticos: criticos || [],
      pagination: {
        page: params.page,
        limit: params.limit,
        total: insights?.length || 0,
        hasNext: insights?.length === params.limit
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Parâmetros inválidos',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Erro na API de insights:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// 🧠 PUT /api/ai/insights
// ========================================
export async function PUT(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const { bar_id, permissao, usuario_id } = JSON.parse(userData);

    // Verificar permissões
    if (!['financeiro', 'admin'].includes(permissao)) {
      return NextResponse.json({ error: 'Sem permissão para atualizar insights' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do insight é obrigatório' }, { status: 400 });
    }

    const validatedData = UpdateInsightSchema.parse(updateData);

    // Verificar se insight existe e pertence ao bar
    const { data: existing, error: fetchError } = await supabase
      .from('ai_insights')
      .select('id, status')
      .eq('id', id)
      .eq('bar_id', bar_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Insight não encontrado' }, { status: 404 });
    }

    // Preparar dados para atualização
    const updatePayload: any = { ...validatedData };

    // Se mudando status para 'lido' pela primeira vez
    if (validatedData.status === 'lido' && existing.status === 'novo') {
      updatePayload.lido_por = usuario_id;
      updatePayload.lido_em = new Date().toISOString();
    }

    // Atualizar insight
    const { data: insight, error } = await supabase
      .from('ai_insights')
      .update(updatePayload)
      .eq('id', id)
      .eq('bar_id', bar_id)
      .select(`
        *,
        usuarios_bar!ai_insights_lido_por_fkey(nome)
      `)
      .single();

    if (error) {
      console.error('Erro ao atualizar insight:', error);
      return NextResponse.json({ error: 'Erro ao atualizar insight' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: insight,
      message: 'Insight atualizado com sucesso'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Erro na API de insights:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// 🧠 POST /api/ai/insights (Marcar múltiplos como lidos)
// ========================================
export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const { bar_id, permissao, usuario_id } = JSON.parse(userData);

    // Verificar permissões
    if (!['financeiro', 'admin'].includes(permissao)) {
      return NextResponse.json({ error: 'Sem permissão para atualizar insights' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ids } = body;

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ 
        error: 'Ação e lista de IDs são obrigatórios' 
      }, { status: 400 });
    }

    let updateData: any = {};
    let successMessage = '';

    switch (action) {
      case 'mark_read':
        updateData = {
          status: 'lido',
          lido_por: usuario_id,
          lido_em: new Date().toISOString()
        };
        successMessage = 'Insights marcados como lidos';
        break;
      
      case 'mark_resolved':
        updateData = { status: 'resolvido' };
        successMessage = 'Insights marcados como resolvidos';
        break;
      
      case 'mark_ignored':
        updateData = { status: 'ignorado' };
        successMessage = 'Insights marcados como ignorados';
        break;
      
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    // Atualizar múltiplos insights
    const { data, error } = await supabase
      .from('ai_insights')
      .update(updateData)
      .in('id', ids)
      .eq('bar_id', bar_id)
      .select('id, titulo, status');

    if (error) {
      console.error('Erro ao atualizar insights:', error);
      return NextResponse.json({ error: 'Erro ao atualizar insights' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: successMessage,
      updated_count: data?.length || 0
    });

  } catch (error) {
    console.error('Erro na API de insights:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 