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

﻿import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// ConfiguraÃ¡Â§Ã¡Â£o do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schema de validaÃ¡Â§Ã¡Â£o para filtros
const FilterMetricsSchema = z.object({
  nome_metrica: z.string().optional(),
  categoria: z.enum(['produtividade', 'qualidade', 'eficiencia', 'engagement']).optional(),
  performance: z.enum(['excelente', 'bom', 'regular', 'ruim', 'critico']).optional(),
  tendencia: z.enum(['crescente', 'estavel', 'decrescente']).optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  ativa: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  order_by: z.enum(['data_referencia', 'valor', 'variacao_percentual']).default('data_referencia'),
  order_direction: z.enum(['asc', 'desc']).default('desc')
});

// ========================================
// Ã°Å¸â€œÅ  GET /api/ai/metrics
// ========================================
export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'UsuÃ¡Â¡rio nÃ¡Â£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData) as unknown;

    // Verificar permissÃ¡Âµes
    if (!['funcionario', 'financeiro', 'admin'].includes(permissao)) {
      return NextResponse.json({ error: 'Sem permissÃ¡Â£o para acessar mÃ¡Â©tricas' }, { status: 403 });
    }

    // Parse dos parÃ¡Â¢metros de query
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    
    // Converter tipos
    const processedParams: unknown = { ...rawParams };
    if (processedParams.page !== undefined && processedParams.page !== '') processedParams.page = Number(processedParams.page);
    if (processedParams.limit !== undefined && processedParams.limit !== '') processedParams.limit = Number(processedParams.limit);
    if (processedParams.ativa !== undefined && processedParams.ativa !== '') processedParams.ativa = processedParams.ativa === 'true';

    const params = FilterMetricsSchema.parse(processedParams);

    // Construir query base
    let query = supabase
      .from('ai_metrics')
      .select(`
        id,
        nome_metrica,
        categoria,
        tipo_calculo,
        valor,
        valor_anterior,
        variacao_absoluta,
        variacao_percentual,
        meta_valor,
        benchmark_interno,
        benchmark_mercado,
        performance,
        tendencia,
        alerta_ativado,
        data_referencia,
        periodo_inicio,
        periodo_fim,
        detalhamento,
        fatores_influencia,
        comparativo_historico,
        created_at,
        proximo_calculo
      `)
      .eq('bar_id', bar_id)
      .order(params.order_by, { ascending: params.order_direction === 'asc' });

    // Aplicar filtros
    if (params.nome_metrica) {
      query = query.eq('nome_metrica', params.nome_metrica);
    }
    if (params.categoria) {
      query = query.eq('categoria', params.categoria);
    }
    if (params.performance) {
      query = query.eq('performance', params.performance);
    }
    if (params.tendencia) {
      query = query.eq('tendencia', params.tendencia);
    }
    if (params.data_inicio) {
      query = query.gte('data_referencia', params.data_inicio);
    }
    if (params.data_fim) {
      query = query.lte('data_referencia', params.data_fim);
    }
    if (params.ativa !== undefined) {
      query = query.eq('ativa', params.ativa);
    }

    // PaginaÃ¡Â§Ã¡Â£o
    const offset = (params.page - 1) * params.limit;
    query = query.range(offset, offset + params.limit - 1);

    const { data: metrics, error } = await query;

    if (error) {
      console.error('Erro ao buscar mÃ¡Â©tricas:', error);
      return NextResponse.json({ error: 'Erro ao buscar mÃ¡Â©tricas' }, { status: 500 });
    }

    // Buscar estatÃ¡Â­sticas gerais
    const { data: stats } = await supabase
      .from('ai_metrics')
      .select('nome_metrica, categoria, performance, tendencia, alerta_ativado, valor')
      .eq('bar_id', bar_id)
      .eq('ativa', true);

    const estatisticas = {
      total_metricas: stats?.length || 0,
      alertas_ativos: stats?.filter((s: unknown) => s.alerta_ativado).length || 0,
      por_categoria: stats?.reduce((acc: Record<string, number>, s: unknown) => {
        acc[s.categoria] = (acc[s.categoria] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      por_performance: {
        excelente: stats?.filter((s: unknown) => s.performance === 'excelente').length || 0,
        bom: stats?.filter((s: unknown) => s.performance === 'bom').length || 0,
        regular: stats?.filter((s: unknown) => s.performance === 'regular').length || 0,
        ruim: stats?.filter((s: unknown) => s.performance === 'ruim').length || 0,
        critico: stats?.filter((s: unknown) => s.performance === 'critico').length || 0
      },
      por_tendencia: {
        crescente: stats?.filter((s: unknown) => s.tendencia === 'crescente').length || 0,
        estavel: stats?.filter((s: unknown) => s.tendencia === 'estavel').length || 0,
        decrescente: stats?.filter((s: unknown) => s.tendencia === 'decrescente').length || 0
      }
    };

    // Buscar mÃ¡Â©tricas com alertas crÃ¡Â­ticos
    const { data: alertas } = await supabase
      .from('ai_metrics')
      .select('nome_metrica, valor, meta_valor, performance')
      .eq('bar_id', bar_id)
      .eq('alerta_ativado', true)
      .in('performance', ['ruim', 'critico'])
      .order('data_referencia', { ascending: false })
      .limit(5);

    // Calcular KPIs principais (mÃ¡Â©tricas mais recentes)
    const kpiMap = {
      'taxa_conclusao_checklists': 'Taxa de ConclusÃ¡Â£o',
      'tempo_medio_execucao': 'Tempo MÃ¡Â©dio',
      'score_medio_qualidade': 'Score de Qualidade',
      'whatsapp_engagement': 'Engagement WhatsApp',
      'produtividade_funcionarios': 'Produtividade'
    };

    const kpisPromises = Object.keys(kpiMap).map(async (metrica) => {
      const { data } = await supabase
        .from('ai_metrics')
        .select('nome_metrica, valor, meta_valor, variacao_percentual, performance, tendencia')
        .eq('bar_id', bar_id)
        .eq('nome_metrica', metrica)
        .eq('ativa', true)
        .order('data_referencia', { ascending: false })
        .limit(1)
        .single();

      return data ? {
        nome: kpiMap[metrica as keyof typeof kpiMap],
        valor: data.valor,
        meta: data.meta_valor,
        variacao: data.variacao_percentual,
        performance: data.performance,
        tendencia: data.tendencia
      } : null;
    });

    const kpis = (await Promise.all(kpisPromises)).filter((kpi) => kpi !== null);

    return NextResponse.json({
      success: true,
      data: metrics,
      estatisticas,
      kpis_principais: kpis,
      alertas_criticos: alertas || [],
      pagination: {
        page: params.page,
        limit: params.limit,
        total: metrics?.length || 0,
        hasNext: metrics?.length === params.limit
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'ParÃ¡Â¢metros invÃ¡Â¡lidos',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Erro na API de mÃ¡Â©tricas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// Ã°Å¸â€œÅ  GET /api/ai/metrics/trends (TendÃ¡Âªncias histÃ¡Â³ricas)
// ========================================
export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'UsuÃ¡Â¡rio nÃ¡Â£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData) as unknown;

    if (!['funcionario', 'financeiro', 'admin'].includes(permissao)) {
      return NextResponse.json({ error: 'Sem permissÃ¡Â£o para acessar tendÃ¡Âªncias' }, { status: 403 });
    }

    const body = await request.json();
    const { metrica, periodo_dias = 30, granularidade = 'daily' } = body;

    if (!metrica) {
      return NextResponse.json({ error: 'Nome da mÃ¡Â©trica Ã¡Â© obrigatÃ¡Â³rio' }, { status: 400 });
    }

    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - periodo_dias);
    const dataInicioStr = dataInicio.toISOString().split('T')[0];

    // Buscar dados históricos
    const { data: historico, error } = await supabase
      .from('ai_metrics')
      .select('data_referencia, valor')
      .eq('bar_id', bar_id)
      .eq('nome_metrica', metrica)
      .eq('ativa', true)
      .gte('data_referencia', dataInicioStr)
      .order('data_referencia', { ascending: true });

    // Calcular estatísticas da série
    if (!historico || historico.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        estatisticas: {}
      });
    }

    // Série de valores
    const valores = historico.map((h: unknown) => h.valor);
    const datas = historico.map((h: unknown) => h.data_referencia);
    const valorAtual = valores[valores.length - 1];
    const valorAnterior = valores[0];
    const valorMaximo = Math.max(...valores);
    const valorMinimo = Math.min(...valores);
    // Calcular média
    const media = valores.reduce((a: unknown, b: unknown) => a + b, 0) / valores.length;
    // Calcular desvio padrão
    const variance = valores.reduce((a: unknown, b: unknown) => a + Math.pow(b - media, 2), 0) / valores.length;
    const desvioPadrao = Math.sqrt(variance);
    // Determinar tendência geral
    const variacaoTotal = ((valorAtual - valorAnterior) / valorAnterior) * 100;
    let tendenciaGeral = 'estavel';
    if (variacaoTotal > 5) tendenciaGeral = 'crescente';
    else if (variacaoTotal < -5) tendenciaGeral = 'decrescente';
    // Calcular quantas vezes atingiu a meta (se meta_valor existir)
    const atingiuMeta = historico.filter((h: unknown) => h.meta_valor !== undefined && h.valor >= h.meta_valor).length;
    // Preparar dados para gráfico
    let dadosGrafico = historico;
    // Agrupar por semana/mês se granularidade for diferente de daily
    let agrupado: { [key: string]: unknown } = {};
    if (granularidade !== 'daily') {
      agrupado = valores.reduce((acc: { [key: string]: unknown }, v: unknown, idx: number) => {
        const data = new Date(datas[idx]);
        let key = '';
        if (granularidade === 'weekly') {
          const week = Math.ceil(data.getDate() / 7);
          key = `${data.getFullYear()}-W${week}`;
        } else if (granularidade === 'monthly') {
          key = `${data.getFullYear()}-${data.getMonth() + 1}`;
        }
        if (!acc[key]) acc[key] = [];
        acc[key].push(v);
        return acc;
      }, {});
      dadosGrafico = Object.entries(agrupado).map(([key, arr]: [string, any[]]) => ({
        data_referencia: key,
        valor: arr.reduce((a: number, b: number) => a + b, 0) / arr.length
      }));
    }

    return NextResponse.json({
      success: true,
      data: dadosGrafico,
      estatisticas: {
        total_pontos: historico.length,
        valor_atual: valorAtual,
        valor_maximo: valorMaximo,
        valor_minimo: valorMinimo,
        media: parseFloat(media.toFixed(2)),
        desvio_padrao: parseFloat(desvioPadrao.toFixed(2)),
        tendencia_geral: tendenciaGeral,
        atingiu_meta: atingiuMeta,
        variacao_total: parseFloat(variacaoTotal.toFixed(2)),
        performance_distribuicao: historico.reduce((acc: Record<string, number>, h: unknown) => {
          acc[h.performance] = (acc[h.performance] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Erro na API de tendÃªncias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 

