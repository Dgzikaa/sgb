import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase-admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema para filtros do dashboard
const DashboardFiltersSchema = z.object({
  periodo_dias: z.number().int().min(1).max(365).default(30),
  incluir_insights: z.boolean().default(true),
  incluir_anomalias: z.boolean().default(true),
  incluir_metricas: z.boolean().default(true),
  incluir_recomendacoes: z.boolean().default(true),
  incluir_predicoes: z.boolean().default(true),
});

// ========================================
// 📊 INTERFACES TYPESCRIPT
// ========================================

interface ProcessedParams {
  periodo_dias?: string | number;
  incluir_insights?: string | boolean;
  incluir_anomalias?: string | boolean;
  incluir_metricas?: string | boolean;
  incluir_recomendacoes?: string | boolean;
  incluir_predicoes?: string | boolean;
  [key: string]: unknown;
}

interface KpiData {
  valor: number;
  meta: number;
  variacao: number;
  performance: string;
  unidade: string;
}

interface InsightsResumo {
  total: number;
  criticos_pendentes: number;
  por_status: Record<string, number>;
  por_impacto: Record<string, number>;
  criticos_detalhes: Array<{
    id: string;
    titulo: string;
    impacto: string;
    confianca: number;
  }>;
  recentes: Array<{
    id: string;
    titulo: string;
    categoria: string;
    impacto: string;
    confianca: number;
    created_at: string;
  }>;
}

interface AnomaliasResumo {
  total: number;
  ativas: number;
  criticas_ativas: number;
  por_severidade: Record<string, number>;
  por_status: Record<string, number>;
  criticas_detalhes: Array<{
    id: string;
    titulo: string;
    severidade: string;
    tipo_anomalia: string;
    confianca_deteccao: number;
  }>;
  recentes: Array<{
    id: string;
    titulo: string;
    tipo_anomalia: string;
    severidade: string;
    data_inicio: string;
  }>;
}

interface TendenciaMetrica {
  metrica: string;
  dados: Array<{
    valor: number;
    data_referencia: string;
  }>;
  variacao_periodo: number;
  tendencia: string;
}

interface RecomendacoesResumo {
  total: number;
  alta_prioridade: number;
  roi_potencial_total: number;
  por_status: Record<string, number>;
  alta_prioridade_detalhes: Array<{
    id: string;
    titulo: string;
    roi_estimado: number;
    esforco_implementacao: string;
    prioridade: number;
  }>;
  recentes: Array<{
    id: string;
    titulo: string;
    tipo_recomendacao: string;
    roi_estimado: number;
    created_at: string;
  }>;
}

interface PredicoesResumo {
  total: number;
  criticas: number;
  proximas_semana: number;
  por_tipo: Record<string, number>;
  confianca_media: number;
  criticas_detalhes: Array<{
    id: string;
    tipo_predicao: string;
    valor_predito: number;
    confianca: number;
    data_alvo: string;
    gerar_alerta: boolean;
    modelo_nome: string;
  }>;
  proximas_detalhes: Array<{
    id: string;
    tipo_predicao: string;
    valor_predito: number;
    confianca: number;
    data_alvo: string;
    gerar_alerta: boolean;
    modelo_nome: string;
  }>;
}

interface AgenteStatus {
  ativo: boolean;
  ultima_execucao: string | null;
  proxima_execucao: Date | null;
  execucoes_recentes: number;
  sucesso_rate: number;
  tempo_medio_execucao: number;
}

interface ResumoExecutivo {
  score_saude_geral: number;
  status_geral: string;
  principais_problemas: string[];
  oportunidades: string[];
  periodo_analise: string;
  ultima_atualizacao: string;
}

// ========================================
// 📊 GET /api/ai/dashboard
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

    const { bar_id, permissao } = JSON.parse(userData);

    // Verificar permissões
    if (!['admin', 'financeiro', 'gerente'].includes(permissao)) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar dashboard de IA' },
        { status: 403 }
      );
    }

    // Criar cliente Supabase
    const supabase = createServiceRoleClient();

    // Parse dos parâmetros
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const processedParams: ProcessedParams = { ...rawParams };
    if (processedParams.periodo_dias)
      processedParams.periodo_dias = parseInt(
        processedParams.periodo_dias as string
      );
    if (processedParams.incluir_insights)
      processedParams.incluir_insights =
        processedParams.incluir_insights === 'true';
    if (processedParams.incluir_anomalias)
      processedParams.incluir_anomalias =
        processedParams.incluir_anomalias === 'true';
    if (processedParams.incluir_metricas)
      processedParams.incluir_metricas =
        processedParams.incluir_metricas === 'true';
    if (processedParams.incluir_recomendacoes)
      processedParams.incluir_recomendacoes =
        processedParams.incluir_recomendacoes === 'true';
    if (processedParams.incluir_predicoes)
      processedParams.incluir_predicoes =
        processedParams.incluir_predicoes === 'true';

    const filters = DashboardFiltersSchema.parse(processedParams);

    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - filters.periodo_dias);
    const dataInicioStr = dataInicio.toISOString();

    // ========================================
    // 🔢 KPIs PRINCIPAIS
    // ========================================
    const kpisPromises = [
      // Taxa de conclusão de checklists
      supabase
        .from('ai_metrics')
        .select('valor, meta_valor, variacao_percentual, performance')
        .eq('bar_id', bar_id)
        .eq('nome_metrica', 'taxa_conclusao_checklists')
        .order('data_referencia', { ascending: false })
        .limit(1)
        .single(),

      // Score de qualidade
      supabase
        .from('ai_metrics')
        .select('valor, meta_valor, variacao_percentual, performance')
        .eq('bar_id', bar_id)
        .eq('nome_metrica', 'score_medio_qualidade')
        .order('data_referencia', { ascending: false })
        .limit(1)
        .single(),

      // Tempo médio de execução
      supabase
        .from('ai_metrics')
        .select('valor, meta_valor, variacao_percentual, performance')
        .eq('bar_id', bar_id)
        .eq('nome_metrica', 'tempo_medio_execucao')
        .order('data_referencia', { ascending: false })
        .limit(1)
        .single(),

      // Produtividade
      supabase
        .from('ai_metrics')
        .select('valor, meta_valor, variacao_percentual, performance')
        .eq('bar_id', bar_id)
        .eq('nome_metrica', 'produtividade_funcionarios')
        .order('data_referencia', { ascending: false })
        .limit(1)
        .single(),
    ];

    const [taxaConclusao, scoreQualidade, tempoMedio, produtividade] =
      await Promise.all(kpisPromises);

    const kpis: Record<string, KpiData> = {
      taxa_conclusao: {
        valor: taxaConclusao.data?.valor || 0,
        meta: taxaConclusao.data?.meta_valor || 85,
        variacao: taxaConclusao.data?.variacao_percentual || 0,
        performance: taxaConclusao.data?.performance || 'regular',
        unidade: '%',
      },
      score_qualidade: {
        valor: scoreQualidade.data?.valor || 0,
        meta: scoreQualidade.data?.meta_valor || 90,
        variacao: scoreQualidade.data?.variacao_percentual || 0,
        performance: scoreQualidade.data?.performance || 'regular',
        unidade: '%',
      },
      tempo_execucao: {
        valor: tempoMedio.data?.valor || 0,
        meta: tempoMedio.data?.meta_valor || 30,
        variacao: tempoMedio.data?.variacao_percentual || 0,
        performance: tempoMedio.data?.performance || 'regular',
        unidade: 'min',
      },
      produtividade: {
        valor: produtividade.data?.valor || 0,
        meta: produtividade.data?.meta_valor || 100,
        variacao: produtividade.data?.variacao_percentual || 0,
        performance: produtividade.data?.performance || 'regular',
        unidade: 'pts',
      },
    };

    // ========================================
    // 🧠 INSIGHTS RESUMO
    // ========================================
    let insightsResumo: InsightsResumo | null = null;
    if (filters.incluir_insights) {
      const [totalInsights, insightsCriticos, insightsRecentes] =
        await Promise.all([
          supabase
            .from('ai_insights')
            .select('id, impacto, status')
            .eq('bar_id', bar_id)
            .gte('created_at', dataInicioStr),

          supabase
            .from('ai_insights')
            .select('id, titulo, impacto, confianca')
            .eq('bar_id', bar_id)
            .eq('impacto', 'critico')
            .in('status', ['novo', 'lido'])
            .order('created_at', { ascending: false })
            .limit(3),

          supabase
            .from('ai_insights')
            .select('id, titulo, categoria, impacto, confianca, created_at')
            .eq('bar_id', bar_id)
            .gte('created_at', dataInicioStr)
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

      insightsResumo = {
        total: totalInsights.data?.length || 0,
        criticos_pendentes: insightsCriticos.data?.length || 0,
        por_status:
          totalInsights.data?.reduce(
            (acc: Record<string, number>, i) => {
              acc[i.status] = (acc[i.status] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ) || {},
        por_impacto:
          totalInsights.data?.reduce(
            (acc: Record<string, number>, i) => {
              acc[i.impacto] = (acc[i.impacto] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ) || {},
        criticos_detalhes: insightsCriticos.data || [],
        recentes: insightsRecentes.data || [],
      };
    }

    // ========================================
    // 🚨 ANOMALIAS RESUMO
    // ========================================
    let anomaliasResumo: AnomaliasResumo | null = null;
    if (filters.incluir_anomalias) {
      const [totalAnomalias, anomaliasAtivas, anomaliasRecentes] =
        await Promise.all([
          supabase
            .from('ai_anomalies')
            .select('id, severidade, status, ainda_ativa')
            .eq('bar_id', bar_id)
            .gte('data_inicio', dataInicioStr),

          supabase
            .from('ai_anomalies')
            .select('id, titulo, severidade, tipo_anomalia, confianca_deteccao')
            .eq('bar_id', bar_id)
            .eq('ainda_ativa', true)
            .in('severidade', ['alta', 'critica'])
            .order('data_inicio', { ascending: false })
            .limit(3),

          supabase
            .from('ai_anomalies')
            .select('id, titulo, tipo_anomalia, severidade, data_inicio')
            .eq('bar_id', bar_id)
            .gte('data_inicio', dataInicioStr)
            .order('data_inicio', { ascending: false })
            .limit(5),
        ]);

      anomaliasResumo = {
        total: totalAnomalias.data?.length || 0,
        ativas: totalAnomalias.data?.filter(a => a.ainda_ativa).length || 0,
        criticas_ativas: anomaliasAtivas.data?.length || 0,
        por_severidade:
          totalAnomalias.data?.reduce(
            (acc: Record<string, number>, a) => {
              acc[a.severidade] = (acc[a.severidade] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ) || {},
        por_status:
          totalAnomalias.data?.reduce(
            (acc: Record<string, number>, a) => {
              acc[a.status] = (acc[a.status] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ) || {},
        criticas_detalhes: anomaliasAtivas.data || [],
        recentes: anomaliasRecentes.data || [],
      };
    }

    // ========================================
    // 📈 TENDÊNCIAS DE MÉTRICAS
    // ========================================
    let tendenciasMetricas: TendenciaMetrica[] | null = null;
    if (filters.incluir_metricas) {
      const metricasChave = [
        'taxa_conclusao_checklists',
        'score_medio_qualidade',
        'tempo_medio_execucao',
        'produtividade_funcionarios',
      ];

      const tendenciasPromises = metricasChave.map(async metrica => {
        const { data } = await supabase
          .from('ai_metrics')
          .select('valor, data_referencia')
          .eq('bar_id', bar_id)
          .eq('nome_metrica', metrica)
          .gte('data_referencia', dataInicioStr)
          .order('data_referencia', { ascending: true });

        if (!data || data.length === 0) return null;

        // Calcular tendência simples
        const primeira = data[0].valor;
        const ultima = data[data.length - 1].valor;
        const variacao = ((ultima - primeira) / primeira) * 100;

        return {
          metrica,
          dados: data,
          variacao_periodo: variacao,
          tendencia:
            variacao > 5
              ? 'crescente'
              : variacao < -5
                ? 'decrescente'
                : 'estavel',
        };
      });

      const tendencias = await Promise.all(tendenciasPromises);
      tendenciasMetricas = tendencias.filter(
        t => t !== null
      ) as TendenciaMetrica[];
    }

    // ========================================
    // 💡 RECOMENDAÇÕES RESUMO
    // ========================================
    let recomendacoesResumo: RecomendacoesResumo | null = null;
    if (filters.incluir_recomendacoes) {
      const [totalRecomendacoes, recomendacoesAlta, recomendacoesRecentes] =
        await Promise.all([
          supabase
            .from('ai_recommendations')
            .select('id, prioridade, status, roi_estimado')
            .eq('bar_id', bar_id)
            .gte('created_at', dataInicioStr),

          supabase
            .from('ai_recommendations')
            .select(
              'id, titulo, roi_estimado, esforco_implementacao, prioridade'
            )
            .eq('bar_id', bar_id)
            .gte('prioridade', 8)
            .in('status', ['nova', 'aprovada'])
            .order('prioridade', { ascending: false })
            .limit(3),

          supabase
            .from('ai_recommendations')
            .select('id, titulo, tipo_recomendacao, roi_estimado, created_at')
            .eq('bar_id', bar_id)
            .gte('created_at', dataInicioStr)
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

      const roiPotencial =
        totalRecomendacoes.data?.reduce(
          (acc, r) => acc + (r.roi_estimado || 0),
          0
        ) || 0;

      recomendacoesResumo = {
        total: totalRecomendacoes.data?.length || 0,
        alta_prioridade: recomendacoesAlta.data?.length || 0,
        roi_potencial_total: roiPotencial,
        por_status:
          totalRecomendacoes.data?.reduce(
            (acc: Record<string, number>, r) => {
              acc[r.status] = (acc[r.status] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ) || {},
        alta_prioridade_detalhes: recomendacoesAlta.data || [],
        recentes: recomendacoesRecentes.data || [],
      };
    }

    // ========================================
    // 🔮 PREVISÕES RESUMO
    // ========================================
    let predicoesResumo: PredicoesResumo | null = null;
    if (filters.incluir_predicoes) {
      const { data: predicoes } = await supabase
        .from('ai_predictions')
        .select(
          `
          id,
          tipo_predicao,
          valor_predito,
          confianca,
          data_alvo,
          gerar_alerta,
          modelo_nome
        `
        )
        .eq('bar_id', bar_id)
        .gte('data_predicao', dataInicioStr)
        .order('data_predicao', { ascending: false });

      const predicoesCriticas = predicoes?.filter(p => p.gerar_alerta) || [];
      const proximasSemana =
        predicoes?.filter(p => {
          const dataAlvo = new Date(p.data_alvo);
          const umaSemana = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          return dataAlvo <= umaSemana;
        }) || [];

      predicoesResumo = {
        total: predicoes?.length || 0,
        criticas: predicoesCriticas.length,
        proximas_semana: proximasSemana.length,
        por_tipo:
          predicoes?.reduce(
            (acc: Record<string, number>, p) => {
              acc[p.tipo_predicao] = (acc[p.tipo_predicao] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ) || {},
        confianca_media: predicoes?.length
          ? predicoes.reduce((acc, p) => acc + p.confianca, 0) /
            predicoes.length
          : 0,
        criticas_detalhes: predicoesCriticas.slice(0, 3),
        proximas_detalhes: proximasSemana.slice(0, 3),
      };
    }

    // ========================================
    // 🤖 STATUS DO AGENTE
    // ========================================
    const [configAgente, logsRecentes] = await Promise.all([
      supabase
        .from('ai_agent_config')
        .select('agente_ativo, frequencia_analise_minutos')
        .eq('bar_id', bar_id)
        .single(),

      supabase
        .from('ai_agent_logs')
        .select('status, data_inicio, duracao_segundos')
        .eq('bar_id', bar_id)
        .order('data_inicio', { ascending: false })
        .limit(10),
    ]);

    const agenteStatus: AgenteStatus = {
      ativo: configAgente.data?.agente_ativo || false,
      ultima_execucao: logsRecentes.data?.[0]?.data_inicio || null,
      proxima_execucao: configAgente.data?.agente_ativo
        ? new Date(
            Date.now() +
              configAgente.data.frequencia_analise_minutos * 60 * 1000
          )
        : null,
      execucoes_recentes: logsRecentes.data?.length || 0,
      sucesso_rate: logsRecentes.data?.length
        ? ((logsRecentes.data?.filter(
            (l: { status: string }) => l.status === 'concluido'
          ).length || 0) /
            (logsRecentes.data?.length || 1)) *
          100
        : 0,
      tempo_medio_execucao: logsRecentes.data?.length
        ? logsRecentes.data
            .filter(l => l.duracao_segundos)
            .reduce((acc, l) => acc + l.duracao_segundos, 0) /
          logsRecentes.data.filter(l => l.duracao_segundos).length
        : 0,
    };

    // ========================================
    // 📊 SCORE GERAL DE SAÚDE
    // ========================================
    const scoresSaude: number[] = [];

    // Score baseado em KPIs
    Object.values(kpis).forEach(kpi => {
      if (kpi.performance === 'excelente') scoresSaude.push(100);
      else if (kpi.performance === 'bom') scoresSaude.push(80);
      else if (kpi.performance === 'regular') scoresSaude.push(60);
      else if (kpi.performance === 'ruim') scoresSaude.push(40);
      else scoresSaude.push(20);
    });

    // Score baseado em anomalias
    if (anomaliasResumo) {
      const scoreAnomalias = Math.max(
        0,
        100 - anomaliasResumo.criticas_ativas * 20
      );
      scoresSaude.push(scoreAnomalias);
    }

    // Score baseado no agente
    const scoreAgente = agenteStatus.ativo
      ? agenteStatus.sucesso_rate || 0
      : 50;
    scoresSaude.push(scoreAgente);

    const scoreSaudeGeral = scoresSaude.length
      ? Math.round(scoresSaude.reduce((a, b) => a + b, 0) / scoresSaude.length)
      : 70;

    // ========================================
    // 📋 RESUMO EXECUTIVO
    // ========================================
    const resumoExecutivo: ResumoExecutivo = {
      score_saude_geral: scoreSaudeGeral,
      status_geral:
        scoreSaudeGeral >= 90
          ? 'excelente'
          : scoreSaudeGeral >= 75
            ? 'bom'
            : scoreSaudeGeral >= 60
              ? 'regular'
              : scoreSaudeGeral >= 40
                ? 'ruim'
                : 'critico',
      principais_problemas: [
        ...(anomaliasResumo && anomaliasResumo.criticas_ativas > 0
          ? [`${anomaliasResumo.criticas_ativas} anomalias críticas ativas`]
          : []),
        ...(insightsResumo && insightsResumo.criticos_pendentes > 0
          ? [`${insightsResumo.criticos_pendentes} insights críticos pendentes`]
          : []),
        ...(!agenteStatus.ativo ? ['Agente IA desativado'] : []),
        ...Object.values(kpis)
          .filter(kpi => kpi.performance === 'critico')
          .map(() => `KPI crítico detectado`),
      ],
      oportunidades: [
        ...(recomendacoesResumo && recomendacoesResumo.alta_prioridade > 0
          ? [
              `${recomendacoesResumo.alta_prioridade} recomendações de alta prioridade`,
            ]
          : []),
        ...(recomendacoesResumo && recomendacoesResumo.roi_potencial_total > 0
          ? [
              `ROI potencial de ${recomendacoesResumo.roi_potencial_total.toFixed(1)}%`,
            ]
          : []),
      ],
      periodo_analise: `${filters.periodo_dias} dias`,
      ultima_atualizacao: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        resumo_executivo: resumoExecutivo,
        kpis_principais: kpis,
        insights: insightsResumo,
        anomalias: anomaliasResumo,
        tendencias_metricas: tendenciasMetricas,
        recomendacoes: recomendacoesResumo,
        predicoes: predicoesResumo,
        agente_status: agenteStatus,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Parâmetros inválidos',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Erro na API do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
