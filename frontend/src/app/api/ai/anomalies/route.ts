import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase-admin';
import { z } from 'zod';

// ========================================
// 🚨 API PARA ANOMALIAS DE IA
// ========================================

// Schema para filtros de anomalias
const FilterAnomaliesSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  tipo_anomalia: z.string().optional(),
  severidade: z.string().optional(),
  status: z.string().optional(),
  ainda_ativa: z.boolean().optional(),
  objeto_tipo: z.string().optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  confianca_minima: z.number().min(0).max(100).optional(),
  order_by: z.string().default('created_at'),
  order_direction: z.enum(['asc', 'desc']).default('desc'),
});

interface ProcessedParams {
  page?: string | number;
  limit?: string | number;
  confianca_minima?: string | number;
  ainda_ativa?: string | boolean;
  [key: string]: unknown;
}

interface AnomalyStats {
  severidade: string;
  status: string;
  tipo_anomalia: string;
  ainda_ativa: boolean;
  confianca_deteccao: number;
  falso_positivo?: boolean;
}

interface StatsAccumulator {
  [key: string]: number;
}

interface UpdatePayload {
  status?: string;
  causa_real?: string;
  acao_tomada?: string;
  falso_positivo?: boolean;
  feedback_deteccao?: string;
  melhorar_modelo?: boolean;
  data_fim?: string;
  investigada_por?: string;
  investigada_em?: string;
  resolvida_em?: string;
  ainda_ativa?: boolean;
  duracao_minutos?: number;
  [key: string]: unknown;
}

interface BatchUpdateData {
  status?: string;
  investigada_por?: string;
  investigada_em?: string;
  resolvida_em?: string;
  ainda_ativa?: boolean;
  data_fim?: string;
  falso_positivo?: boolean;
  [key: string]: unknown;
}

interface Anomaly {
  id: string;
  tipo_anomalia: string;
  subtipo: string;
  severidade: string;
  titulo: string;
  descricao: string;
  objeto_id: string;
  objeto_tipo: string;
  objeto_nome: string;
  valor_esperado: number;
  valor_observado: number;
  desvio_percentual: number;
  data_inicio: string;
  data_fim?: string;
  duracao_minutos?: number;
  ainda_ativa: boolean;
  possivel_causa?: string;
  impacto_estimado?: string;
  acoes_sugeridas?: string;
  confianca_deteccao: number;
  status: string;
  investigada_por?: string;
  investigada_em?: string;
  causa_real?: string;
  acao_tomada?: string;
  resolvida_em?: string;
  falso_positivo?: boolean;
  created_at: string;
  usuarios_bar?: {
    nome: string;
  } | null;
}

interface AnomalyCritical {
  id: string;
  titulo: string;
  severidade: string;
  data_inicio: string;
}

interface UserData {
  bar_id: string;
  permissao: string;
}

interface EstatisticasGerais {
  total: number;
  ativas: number;
  resolvidas: number;
  falsos_positivos: number;
  por_severidade: StatsAccumulator;
  por_tipo: StatsAccumulator;
  por_status: StatsAccumulator;
  confianca_media: number;
}

interface Tendencia {
  ultimos_7_dias: number;
  periodo_anterior: number;
  variacao: number;
  percentual_variacao: number;
}

// ========================================
// 📊 GET /api/ai/anomalies
// ========================================
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const userData = headersList.get('x-user-data');

    if (!userData) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const { bar_id, permissao }: UserData = JSON.parse(userData);

    // Verificar permissões
    if (!['financeiro', 'admin'].includes(permissao)) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar anomalias' },
        { status: 403 }
      );
    }

    // Parse dos parâmetros de query
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());

    // Converter tipos
    const processedParams: ProcessedParams = { ...rawParams };
    if (processedParams.page)
      processedParams.page = parseInt(processedParams.page as string);
    if (processedParams.limit)
      processedParams.limit = parseInt(processedParams.limit as string);
    if (processedParams.confianca_minima)
      processedParams.confianca_minima = parseFloat(
        processedParams.confianca_minima as string
      );
    if (processedParams.ainda_ativa)
      processedParams.ainda_ativa = processedParams.ainda_ativa === 'true';

    const params = FilterAnomaliesSchema.parse(processedParams);

    // Criar cliente Supabase
    const supabase = createServiceRoleClient();

    // Construir query base
    let query = supabase
      .from('ai_anomalies')
      .select(
        `
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
      `
      )
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
      return NextResponse.json(
        { error: 'Erro ao buscar anomalias' },
        { status: 500 }
      );
    }

    const anomaliesData = (anomalies as unknown as Anomaly[]) || [];

    // Buscar estatísticas gerais
    const { data: stats } = await supabase
      .from('ai_anomalies')
      .select(
        'severidade, status, tipo_anomalia, ainda_ativa, confianca_deteccao, falso_positivo'
      )
      .eq('bar_id', bar_id);

    const estatisticas: AnomalyStats[] =
      stats?.map((s: Record<string, unknown>) => ({
        severidade: s.severidade as string,
        status: s.status as string,
        tipo_anomalia: s.tipo_anomalia as string,
        ainda_ativa: s.ainda_ativa as boolean,
        confianca_deteccao: s.confianca_deteccao as number,
        falso_positivo: s.falso_positivo as boolean,
      })) || [];

    const totalConfianca = estatisticas.reduce(
      (sum, s) => sum + s.confianca_deteccao,
      0
    );
    const totalAnomalias = estatisticas.length;

    const estatisticasGerais: EstatisticasGerais = {
      total: totalAnomalias,
      ativas: estatisticas.filter(s => s.ainda_ativa).length,
      resolvidas: estatisticas.filter(s => s.status === 'resolvida').length,
      falsos_positivos: estatisticas.filter(s => s.falso_positivo).length,
      por_severidade: estatisticas.reduce((acc: StatsAccumulator, s) => {
        acc[s.severidade] = (acc[s.severidade] || 0) + 1;
        return acc;
      }, {} as StatsAccumulator),
      por_tipo: estatisticas.reduce((acc: StatsAccumulator, s) => {
        acc[s.tipo_anomalia] = (acc[s.tipo_anomalia] || 0) + 1;
        return acc;
      }, {} as StatsAccumulator),
      por_status: estatisticas.reduce((acc: StatsAccumulator, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {} as StatsAccumulator),
      confianca_media: totalAnomalias > 0 ? totalConfianca / totalAnomalias : 0,
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

    const criticasData = (criticas as AnomalyCritical[]) || [];

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

    const ultimos7Count = ultimos7?.length || 0;
    const anteriores7Count = anteriores7?.length || 0;
    const variacao = ultimos7Count - anteriores7Count;
    const percentualVariacao =
      anteriores7Count > 0 ? (variacao / anteriores7Count) * 100 : 0;

    const tendencia: Tendencia = {
      ultimos_7_dias: ultimos7Count,
      periodo_anterior: anteriores7Count,
      variacao,
      percentual_variacao: percentualVariacao,
    };

    return NextResponse.json({
      success: true,
      data: {
        anomalias: anomaliesData,
        estatisticas: estatisticasGerais,
        criticas_ativas: criticasData,
        tendencia,
        paginacao: {
          page: params.page,
          limit: params.limit,
          total: anomaliesData.length,
          has_more: anomaliesData.length === params.limit,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Erro na API de anomalias:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido';

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// ========================================
// 🔄 PUT /api/ai/anomalies
// ========================================
export async function PUT(request: NextRequest) {
  try {
    const headersList = await headers();
    const userData = headersList.get('x-user-data');

    if (!userData) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const { bar_id, permissao }: UserData = JSON.parse(userData);

    // Verificar permissões
    if (!['financeiro', 'admin'].includes(permissao)) {
      return NextResponse.json(
        { error: 'Sem permissão para atualizar anomalias' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { anomalia_id, updates, batch_update } = body;

    const supabase = createServiceRoleClient();

    if (batch_update && Array.isArray(batch_update.ids)) {
      // Atualização em lote
      const batchData: BatchUpdateData = {
        ...batch_update.updates,
        investigada_por: userData,
        investigada_em: new Date().toISOString(),
      };

      if (batch_update.updates.status === 'resolvida') {
        batchData.resolvida_em = new Date().toISOString();
        batchData.ainda_ativa = false;
      }

      const { error: batchError } = await supabase
        .from('ai_anomalies')
        .update(batchData)
        .in('id', batch_update.ids)
        .eq('bar_id', bar_id);

      if (batchError) {
        console.error('Erro na atualização em lote:', batchError);
        return NextResponse.json(
          { error: 'Erro na atualização em lote' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${batch_update.ids.length} anomalias atualizadas com sucesso`,
      });
    } else if (anomalia_id) {
      // Atualização individual
      const updateData: UpdatePayload = {
        ...updates,
        investigada_por: userData,
        investigada_em: new Date().toISOString(),
      };

      if (updates.status === 'resolvida') {
        updateData.resolvida_em = new Date().toISOString();
        updateData.ainda_ativa = false;
        updateData.data_fim = new Date().toISOString();
      }

      const { data: updatedAnomaly, error: updateError } = await supabase
        .from('ai_anomalies')
        .update(updateData)
        .eq('id', anomalia_id)
        .eq('bar_id', bar_id)
        .select()
        .single();

      if (updateError) {
        console.error('Erro ao atualizar anomalia:', updateError);
        return NextResponse.json(
          { error: 'Erro ao atualizar anomalia' },
          { status: 500 }
        );
      }

      const updatedAnomalyData = updatedAnomaly as Anomaly;

      return NextResponse.json({
        success: true,
        message: 'Anomalia atualizada com sucesso',
        data: updatedAnomalyData,
      });
    } else {
      return NextResponse.json(
        { error: 'ID da anomalia não fornecido' },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error('Erro na API de atualização de anomalias:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido';

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// ========================================
// 📝 POST /api/ai/anomalies
// ========================================
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const userData = headersList.get('x-user-data');

    if (!userData) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const { bar_id, permissao }: UserData = JSON.parse(userData);

    // Verificar permissões
    if (!['financeiro', 'admin'].includes(permissao)) {
      return NextResponse.json(
        { error: 'Sem permissão para criar anomalias' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { anomalia_data } = body;

    if (!anomalia_data) {
      return NextResponse.json(
        { error: 'Dados da anomalia não fornecidos' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Adicionar dados do bar e criador
    const novaAnomalia = {
      ...anomalia_data,
      bar_id,
      criada_por: userData,
      created_at: new Date().toISOString(),
    };

    const { data: createdAnomaly, error: createError } = await supabase
      .from('ai_anomalies')
      .insert(novaAnomalia)
      .select()
      .single();

    if (createError) {
      console.error('Erro ao criar anomalia:', createError);
      return NextResponse.json(
        { error: 'Erro ao criar anomalia' },
        { status: 500 }
      );
    }

    const createdAnomalyData = createdAnomaly as Anomaly;

    return NextResponse.json({
      success: true,
      message: 'Anomalia criada com sucesso',
      data: createdAnomalyData,
    });
  } catch (error: unknown) {
    console.error('Erro na API de criação de anomalias:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido';

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
