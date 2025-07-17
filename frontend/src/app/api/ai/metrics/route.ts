import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Configuraá§á£o do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schema de validaá§á£o para filtros
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
// ðŸ“Š GET /api/ai/metrics
// ========================================
export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuá¡rio ná£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    // Verificar permissáµes
    if (!['funcionario', 'financeiro', 'admin'].includes(permissao)) {
      return NextResponse.json({ error: 'Sem permissá£o para acessar má©tricas' }, { status: 403 });
    }

    // Parse dos pará¢metros de query
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    
    // Converter tipos
    const processedParams: any = { ...rawParams };
    if (processedParams.page) processedParams.page = parseInt(processedParams.page);
    if (processedParams.limit) processedParams.limit = parseInt(processedParams.limit);
    if (processedParams.ativa) processedParams.ativa = processedParams.ativa === 'true';

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

    // Paginaá§á£o
    const offset = (params.page - 1) * params.limit;
    query = query.range(offset: any, offset + params.limit - 1);

    const { data: metrics, error } = await query;

    if (error) {
      console.error('Erro ao buscar má©tricas:', error);
      return NextResponse.json({ error: 'Erro ao buscar má©tricas' }, { status: 500 });
    }

    // Buscar estatá­sticas gerais
    const { data: stats } = await supabase
      .from('ai_metrics')
      .select('nome_metrica, categoria: any, performance, tendencia: any, alerta_ativado, valor')
      .eq('bar_id', bar_id)
      .eq('ativa', true);

    const estatisticas = {
      total_metricas: stats?.length || 0,
      alertas_ativos: stats?.filter((s: any) => s.alerta_ativado).length || 0,
      por_categoria: stats?.reduce((acc: any, s: any) => {
        acc[s.categoria] = (acc[s.categoria] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      por_performance: {
        excelente: stats?.filter((s: any) => s.performance === 'excelente').length || 0,
        bom: stats?.filter((s: any) => s.performance === 'bom').length || 0,
        regular: stats?.filter((s: any) => s.performance === 'regular').length || 0,
        ruim: stats?.filter((s: any) => s.performance === 'ruim').length || 0,
        critico: stats?.filter((s: any) => s.performance === 'critico').length || 0
      },
      por_tendencia: {
        crescente: stats?.filter((s: any) => s.tendencia === 'crescente').length || 0,
        estavel: stats?.filter((s: any) => s.tendencia === 'estavel').length || 0,
        decrescente: stats?.filter((s: any) => s.tendencia === 'decrescente').length || 0
      }
    };

    // Buscar má©tricas com alertas crá­ticos
    const { data: alertas } = await supabase
      .from('ai_metrics')
      .select('nome_metrica, valor: any, meta_valor, performance')
      .eq('bar_id', bar_id)
      .eq('alerta_ativado', true)
      .in('performance', ['ruim', 'critico'])
      .order('data_referencia', { ascending: false })
      .limit(5);

    // Calcular KPIs principais (má©tricas mais recentes)
    const kpiMap = {
      'taxa_conclusao_checklists': 'Taxa de Conclusá£o',
      'tempo_medio_execucao': 'Tempo Má©dio',
      'score_medio_qualidade': 'Score de Qualidade',
      'whatsapp_engagement': 'Engagement WhatsApp',
      'produtividade_funcionarios': 'Produtividade'
    };

    const kpisPromises = Object.keys(kpiMap).map(async (metrica: any) => {
      const { data } = await supabase
        .from('ai_metrics')
        .select('nome_metrica, valor: any, meta_valor, variacao_percentual: any, performance, tendencia')
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

    const kpis = (await Promise.all(kpisPromises)).filter((kpi: any) => kpi !== null);

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
        error: 'Pará¢metros invá¡lidos',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Erro na API de má©tricas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// ðŸ“Š GET /api/ai/metrics/trends (Tendáªncias histá³ricas)
// ========================================
export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuá¡rio ná£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    if (!['funcionario', 'financeiro', 'admin'].includes(permissao)) {
      return NextResponse.json({ error: 'Sem permissá£o para acessar tendáªncias' }, { status: 403 });
    }

    const body = await request.json();
    const { metrica, periodo_dias = 30, granularidade = 'daily' } = body;

    if (!metrica) {
      return NextResponse.json({ error: 'Nome da má©trica á© obrigatá³rio' }, { status: 400 });
    }

    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - periodo_dias);

    // Buscar dados histá³ricos
    const { data: historico, error } = await supabase
      .from('ai_metrics')
      .select(`
        valor,
        valor_anterior,
        variacao_percentual,
        meta_valor,
        performance,
        data_referencia,
        detalhamento
      `)
      .eq('bar_id', bar_id)
      .eq('nome_metrica', metrica)
      .gte('data_referencia', dataInicio.toISOString().split('T')[0])
      .order('data_referencia', { ascending: true });

    if (error) {
      console.error('Erro ao buscar tendáªncias:', error);
      return NextResponse.json({ error: 'Erro ao buscar tendáªncias' }, { status: 500 });
    }

    // Calcular estatá­sticas da sá©rie
    if (!historico || historico.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        estatisticas: {
          total_pontos: 0,
          valor_atual: null,
          valor_maximo: null,
          valor_minimo: null,
          media: null,
          desvio_padrao: null,
          tendencia_geral: 'estavel',
          atingiu_meta: 0,
          variacao_total: null
        }
      });
    }

    const valores = historico.map((h: any) => h.valor);
    const valorAtual = valores[valores.length - 1];
    const valorAnterior = valores[0];
    const valorMaximo = Math.max(...valores);
    const valorMinimo = Math.min(...valores);
    const media = valores.reduce((a: any, b: any) => a + b, 0) / valores.length;
    
    // Calcular desvio padrá£o
    const variance = valores.reduce((a: any, b: any) => a + Math.pow(b - media, 2), 0) / valores.length;
    const desvioPadrao = Math.sqrt(variance);

    // Determinar tendáªncia geral
    const variacaoTotal = ((valorAtual - valorAnterior) / valorAnterior) * 100;
    let tendenciaGeral = 'estavel';
    if (variacaoTotal > 5) tendenciaGeral = 'crescente';
    else if (variacaoTotal < -5) tendenciaGeral = 'decrescente';

    // Calcular quantas vezes atingiu a meta
    const atingiuMeta = historico.filter((h: any) => h.meta_valor && h.valor >= h.meta_valor).length;

    // Preparar dados para grá¡fico (agrupamento se necessá¡rio)
    let dadosGrafico = historico;
    
    if (granularidade === 'weekly' && historico.length > 7) {
      // Agrupar por semana
      const semanas: any = {};
      historico.forEach(h => {
        const data = new Date(h.data_referencia);
        const inicioSemana = new Date(data.setDate(data.getDate() - data.getDay()));
        const chave = inicioSemana.toISOString().split('T')[0];
        
        if (!semanas[chave]) {
          semanas[chave] = {
            valores: [],
            data_referencia: chave,
            meta_valor: h.meta_valor
          };
        }
        semanas[chave].valores.push(h.valor);
      });

      dadosGrafico = Object.values(semanas).map((s: any) => ({
        ...s,
        valor: s.valores.reduce((a: number, b: number) => a + b, 0) / s.valores.length
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
        performance_distribuicao: historico.reduce((acc: any, h: any) => {
          acc[h.performance] = (acc[h.performance] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Erro na API de tendáªncias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 
