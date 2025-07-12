import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { headers } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase-admin';

// Schema de validação para filtros
const FilterAnomaliesSchema = z.object({
  tipo_anomalia: z.string().optional(),
  severidade: z.enum(['baixa', 'media', 'alta', 'critica']).optional(),
  status: z.enum(['detectada', 'investigando', 'resolvendo', 'resolvida', 'falso_positivo']).optional(),
  ainda_ativa: z.boolean().optional(),
  objeto_tipo: z.string().optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  confianca_minima: z.number().min(0).max(100).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  order_by: z.enum(['data_inicio', 'severidade', 'confianca_deteccao']).default('data_inicio'),
  order_direction: z.enum(['asc', 'desc']).default('desc')
});

// Schema para atualização de anomalia
const UpdateAnomalySchema = z.object({
  status: z.enum(['detectada', 'investigando', 'resolvendo', 'resolvida', 'falso_positivo']).optional(),
  causa_real: z.string().optional(),
  acao_tomada: z.string().optional(),
  falso_positivo: z.boolean().optional(),
  feedback_deteccao: z.string().optional(),
  melhorar_modelo: z.boolean().optional(),
  data_fim: z.string().optional()
});

// ========================================
// 🚨 GET /api/ai/anomalies
// ========================================
export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    // Verificar permissões
    if (!['financeiro', 'admin'].includes(permissao)) {
      return NextResponse.json({ error: 'Sem permissão para acessar anomalias' }, { status: 403 });
    }

    // Parse dos parâmetros de query
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    
    // Converter tipos
    const processedParams: any = { ...rawParams };
    if (processedParams.page) processedParams.page = parseInt(processedParams.page);
    if (processedParams.limit) processedParams.limit = parseInt(processedParams.limit);
    if (processedParams.confianca_minima) processedParams.confianca_minima = parseFloat(processedParams.confianca_minima);
    if (processedParams.ainda_ativa) processedParams.ainda_ativa = processedParams.ainda_ativa === 'true';

    const params = FilterAnomaliesSchema.parse(processedParams);

    // Criar cliente Supabase
    const supabase = createServiceRoleClient();

    // Construir query base
    let query = supabase
      .from('ai_anomalies')
      .select(`
        id,
        tipo_anomalia,
        subtipo,
        severidade,
        titulo,
        descricao,
        objeto_id,
        objeto_tipo,
        objeto_nome,
        valor_esperado,
        valor_observado,
        desvio_percentual,
        data_inicio,
        data_fim,
        duracao_minutos,
        ainda_ativa,
        possivel_causa,
        impacto_estimado,
        acoes_sugeridas,
        confianca_deteccao,
        status,
        investigada_por,
        investigada_em,
        causa_real,
        acao_tomada,
        resolvida_em,
        falso_positivo,
        created_at,
        usuarios_bar!ai_anomalies_investigada_por_fkey(nome)
      `)
      .eq('bar_id', bar_id)
      .order(params.order_by, { ascending: params.order_direction === 'asc' });

    // Aplicar filtros
    if (params.tipo_anomalia) {
      query = query.eq('tipo_anomalia', params.tipo_anomalia);
    }
    if (params.severidade) {
      query = query.eq('severidade', params.severidade);
    }
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.ainda_ativa !== undefined) {
      query = query.eq('ainda_ativa', params.ainda_ativa);
    }
    if (params.objeto_tipo) {
      query = query.eq('objeto_tipo', params.objeto_tipo);
    }
    if (params.data_inicio) {
      query = query.gte('data_inicio', params.data_inicio);
    }
    if (params.data_fim) {
      query = query.lte('data_inicio', params.data_fim);
    }
    if (params.confianca_minima) {
      query = query.gte('confianca_deteccao', params.confianca_minima);
    }

    // Paginação
    const offset = (params.page - 1) * params.limit;
    query = query.range(offset, offset + params.limit - 1);

    const { data: anomalies, error } = await query;

    if (error) {
      console.error('Erro ao buscar anomalias:', error);
      return NextResponse.json({ error: 'Erro ao buscar anomalias' }, { status: 500 });
    }

    // Buscar estatísticas gerais
    const { data: stats } = await supabase
      .from('ai_anomalies')
      .select('severidade, status, tipo_anomalia, ainda_ativa, confianca_deteccao')
      .eq('bar_id', bar_id);

    const estatisticas = {
      total: stats?.length || 0,
      ativas: stats?.filter((s: any) => s.ainda_ativa).length || 0,
      resolvidas: stats?.filter((s: any) => s.status === 'resolvida').length || 0,
      falsos_positivos: stats?.filter((s: any) => s.falso_positivo).length || 0,
      por_severidade: {
        critica: stats?.filter((s: any) => s.severidade === 'critica').length || 0,
        alta: stats?.filter((s: any) => s.severidade === 'alta').length || 0,
        media: stats?.filter((s: any) => s.severidade === 'media').length || 0,
        baixa: stats?.filter((s: any) => s.severidade === 'baixa').length || 0
      },
      por_tipo: stats?.reduce((acc: any, s: any) => {
        acc[s.tipo_anomalia] = (acc[s.tipo_anomalia] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      por_status: stats?.reduce((acc: any, s: any) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      confianca_media: stats?.length ? 
        stats.reduce((sum: any, s: any) => sum + s.confianca_deteccao, 0) / stats.length : 0
    };

    // Buscar anomalias críticas ativas
    const { data: criticas } = await supabase
      .from('ai_anomalies')
      .select('id, titulo, severidade, data_inicio')
      .eq('bar_id', bar_id)
      .eq('severidade', 'critica')
      .eq('ainda_ativa', true)
      .order('data_inicio', { ascending: false })
      .limit(5);

    // Calcular tendências (últimos 7 vs 7 anteriores)
    const hoje = new Date();
    const setedias = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
    const quatorzeDias = new Date(hoje.getTime() - 14 * 24 * 60 * 60 * 1000);

    const { data: ultimos7 } = await supabase
      .from('ai_anomalies')
      .select('id')
      .eq('bar_id', bar_id)
      .gte('data_inicio', setedias.toISOString());

    const { data: anteriores7 } = await supabase
      .from('ai_anomalies')
      .select('id')
      .eq('bar_id', bar_id)
      .gte('data_inicio', quatorzeDias.toISOString())
      .lt('data_inicio', setedias.toISOString());

    const tendencia = {
      ultimos_7_dias: ultimos7?.length || 0,
      periodo_anterior: anteriores7?.length || 0,
      variacao: (ultimos7?.length || 0) - (anteriores7?.length || 0),
      tendencia_texto: ''
    };

    if (tendencia.variacao > 0) {
      tendencia.tendencia_texto = 'crescente';
    } else if (tendencia.variacao < 0) {
      tendencia.tendencia_texto = 'decrescente';
    } else {
      tendencia.tendencia_texto = 'estavel';
    }

    return NextResponse.json({
      success: true,
      data: anomalies,
      estatisticas,
      anomalias_criticas: criticas || [],
      tendencia,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: anomalies?.length || 0,
        hasNext: anomalies?.length === params.limit
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Parâmetros inválidos',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Erro na API de anomalias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// 🚨 PUT /api/ai/anomalies
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
      return NextResponse.json({ error: 'Sem permissão para atualizar anomalias' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da anomalia é obrigatório' }, { status: 400 });
    }

    const validatedData = UpdateAnomalySchema.parse(updateData);

    // Criar cliente Supabase
    const supabase = createServiceRoleClient();

    // Verificar se anomalia existe e pertence ao bar
    const { data: existing, error: fetchError } = await supabase
      .from('ai_anomalies')
      .select('id, status, ainda_ativa')
      .eq('id', id)
      .eq('bar_id', bar_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Anomalia não encontrada' }, { status: 404 });
    }

    // Preparar dados para atualização
    const updatePayload: any = { ...validatedData };

    // Lógica de status automático
    if (validatedData.status === 'investigando' && existing.status === 'detectada') {
      updatePayload.investigada_por = usuario_id;
      updatePayload.investigada_em = new Date().toISOString();
    }

    if (validatedData.status === 'resolvida') {
      updatePayload.resolvida_em = new Date().toISOString();
      updatePayload.ainda_ativa = false;
      
      // Se não forneceu data_fim, usar agora
      if (!validatedData.data_fim) {
        updatePayload.data_fim = new Date().toISOString();
      }
      
      // Calcular duração se possível
      const { data: original } = await supabase
        .from('ai_anomalies')
        .select('data_inicio')
        .eq('id', id)
        .single();
        
      if (original?.data_inicio) {
        const inicio = new Date(original.data_inicio);
        const fim = new Date(updatePayload.data_fim);
        updatePayload.duracao_minutos = Math.round((fim.getTime() - inicio.getTime()) / 60000);
      }
    }

    if (validatedData.falso_positivo === true) {
      updatePayload.status = 'falso_positivo';
      updatePayload.ainda_ativa = false;
      updatePayload.data_fim = new Date().toISOString();
    }

    // Atualizar anomalia
    const { data: anomaly, error } = await supabase
      .from('ai_anomalies')
      .update(updatePayload)
      .eq('id', id)
      .eq('bar_id', bar_id)
      .select(`
        *,
        usuarios_bar!ai_anomalies_investigada_por_fkey(nome)
      `)
      .single();

    if (error) {
      console.error('Erro ao atualizar anomalia:', error);
      return NextResponse.json({ error: 'Erro ao atualizar anomalia' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: anomaly,
      message: 'Anomalia atualizada com sucesso'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Erro na API de anomalias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// 🚨 POST /api/ai/anomalies (Ações em lote)
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
      return NextResponse.json({ error: 'Sem permissão para atualizar anomalias' }, { status: 403 });
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
      case 'mark_investigating':
        updateData = {
          status: 'investigando',
          investigada_por: usuario_id,
          investigada_em: new Date().toISOString()
        };
        successMessage = 'Anomalias marcadas como em investigação';
        break;
      
      case 'mark_resolved':
        updateData = {
          status: 'resolvida',
          resolvida_em: new Date().toISOString(),
          ainda_ativa: false,
          data_fim: new Date().toISOString()
        };
        successMessage = 'Anomalias marcadas como resolvidas';
        break;
      
      case 'mark_false_positive':
        updateData = {
          status: 'falso_positivo',
          falso_positivo: true,
          ainda_ativa: false,
          data_fim: new Date().toISOString()
        };
        successMessage = 'Anomalias marcadas como falsos positivos';
        break;
      
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    // Criar cliente Supabase
    const supabase = createServiceRoleClient();

    // Atualizar múltiplas anomalias
    const { data, error } = await supabase
      .from('ai_anomalies')
      .update(updateData)
      .in('id', ids)
      .eq('bar_id', bar_id)
      .select('id, titulo, status');

    if (error) {
      console.error('Erro ao atualizar anomalias:', error);
      return NextResponse.json({ error: 'Erro ao atualizar anomalias' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: successMessage,
      updated_count: data?.length || 0
    });

  } catch (error) {
    console.error('Erro na API de anomalias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 