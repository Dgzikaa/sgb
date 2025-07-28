import { createClient } from '@supabase/supabase-js';
import { createEnhancedNotificationService } from './notifications-enhanced';
import {
  sgbDiscordService,
  isHorarioRelatorioMatinal,
} from './discord-service';
import { notifyMarketingUpdate } from './discord-marketing-service';
import DiscordChecklistService from './discord-checklist-service';
import { getAdminClient } from '@/lib/supabase-admin';
import { DiscordService } from '@/lib/discord-service';

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ========================================
// 🤖 AI INTELLIGENT AGENT - BACKGROUND SERVICE
// ========================================

// Interfaces para tipagem
interface ChecklistExecution {
  executado_por: string;
  status: string;
  pontuacao_final?: number;
  tempo_execucao_minutos?: number;
  usuarios_bar: {
    nome: string;
  };
}

interface ChecklistExecutionRaw {
  executado_por: any;
  status: any;
  pontuacao_final: any;
  tempo_execucao_minutos: any;
  usuarios_bar: { nome: any; }[];
}

interface FuncionarioProdutividade {
  nome: string;
  total: number;
  concluidos: number;
  score_total: number;
  tempo_total: number;
}

interface SocialMetrics {
  total_followers: number;
  total_engagement: number;
}

interface AlertData {
  nivel: string;
}

// Type guards
function isChecklistExecution(obj: unknown): obj is ChecklistExecution {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'executado_por' in obj &&
    'status' in obj &&
    'usuarios_bar' in obj
  );
}

function isFuncionarioProdutividade(
  obj: unknown
): obj is FuncionarioProdutividade {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'nome' in obj &&
    'total' in obj &&
    'concluidos' in obj
  );
}

export interface AIAgentConfig {
  bar_id: number;
  agente_ativo: boolean;
  frequencia_analise_minutos: number;
  gerar_insights: boolean;
  detectar_anomalias: boolean;
  gerar_predicoes: boolean;
  gerar_recomendacoes: boolean;
  confianca_minima_insights: number;
  sensibilidade_anomalias: number;
  notificar_insights: boolean;
  notificar_anomalias: boolean;
  horario_analise_inicio: string;
  horario_analise_fim: string;
}

export interface AIInsight {
  tipo_insight: string;
  categoria: string;
  titulo: string;
  descricao: string;
  confianca: number;
  impacto: string;
  urgencia: string;
  metricas_base: Record<string, unknown>;
  evidencias: Record<string, unknown>;
  acoes_sugeridas: string[];
  periodo_analise_inicio: string;
  periodo_analise_fim: string;
}

export interface AIAnomaly {
  tipo_anomalia: string;
  subtipo: string;
  severidade: string;
  titulo: string;
  descricao: string;
  objeto_id?: number;
  objeto_tipo?: string;
  objeto_nome?: string;
  valor_esperado: number;
  valor_observado: number;
  desvio_percentual: number;
  confianca_deteccao: number;
  possivel_causa: string;
  impacto_estimado: string;
  acoes_sugeridas: string[];
  metricas_anomala: Record<string, unknown>;
}

export interface AIRecommendation {
  tipo_recomendacao: string;
  categoria: string;
  titulo: string;
  descricao: string;
  impacto_estimado: number;
  impacto_unidade: string;
  roi_estimado: number;
  esforco_implementacao: string;
  tempo_implementacao_dias: number;
  justificativa: string;
  evidencias: Record<string, unknown>;
  prioridade: number;
  urgencia: string;
  complexidade: string;
  passos_implementacao: string[];
}

export class AIIntelligentAgent {
  private barId: number;
  private config: AIAgentConfig | null = null;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(barId: number) {
    this.barId = barId;
  }

  // ========================================
  // 🔧 INICIALIZAÇÃO E CONFIGURAÇÃO
  // ========================================

  /**
   * Inicializa o agente IA
   */
  async initialize(): Promise<boolean> {
    try {
      const { data: config } = await supabase
        .from('ai_agent_config')
        .select('*')
        .eq('bar_id', this.barId)
        .single();

      if (config && config.agente_ativo) {
        this.config = config;
        await this.logProcess(
          'inicializacao',
          'Agente IA inicializado',
          'concluido'
        );
        return true;
      }

      return false;
    } catch (error: unknown) {
      console.error('Erro ao inicializar agente IA:', error);
      await this.logProcess(
        'inicializacao',
        'Erro na inicialização',
        'erro',
        (error instanceof Error ? error.message : String(error))
      );
      return false;
    }
  }

  /**
   * Inicia o agente em background
   */
  async startAgent(): Promise<void> {
    if (!this.config || this.isRunning) {
      return;
    }

    this.isRunning = true;
    console.log(
      `🤖 Agente IA iniciado para bar ${this.barId} - Executando a cada ${this.config.frequencia_analise_minutos} minutos`
    );

    // Execução inicial
    await this.runAnalysisLoop();

    // Configurar execução periódica
    this.intervalId = setInterval(
      async () => {
        await this.runAnalysisLoop();
      },
      this.config.frequencia_analise_minutos * 60 * 1000
    );
  }

  /**
   * Para o agente
   */
  stopAgent(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log(`🤖 Agente IA parado para bar ${this.barId}`);
  }

  // ========================================
  // 🔄 LOOP PRINCIPAL DE ANÁLISE
  // ========================================

  /**
   * Loop principal de análise do agente
   */
  private async runAnalysisLoop(): Promise<void> {
    if (!this.config) return;

    const startTime = new Date();
    let logId: number | null = null;

    try {
      // Verificar se está no horário de funcionamento
      if (!this.isWithinWorkingHours()) {
        return;
      }

      logId = await this.startProcessLog('analise_completa');

      console.log(
        `🤖 [${new Date().toISOString()}] Iniciando análise IA para bar ${this.barId}`
      );

      const results = {
        insights: 0,
        anomalias: 0,
        predicoes: 0,
        recomendacoes: 0,
        metricas: 0,
      };

      // 1. Calcular métricas automaticamente
      if (this.config.gerar_insights) {
        results.metricas = await this.calculateAutomaticMetrics();
      }

      // 2. Detectar anomalias
      if (this.config.detectar_anomalias) {
        results.anomalias = await this.detectAnomalies();
      }

      // 3. Gerar insights
      if (this.config.gerar_insights) {
        results.insights = await this.generateInsights();
      }

      // 4. Fazer previsões
      if (this.config.gerar_predicoes) {
        results.predicoes = await this.generatePredictions();
      }

      // 5. Gerar recomendações
      if (this.config.gerar_recomendacoes) {
        results.recomendacoes = await this.generateRecommendations();
      }

      // 6. Enviar notificações se necessário
      await this.sendAINotifications();

      // 7. 🌅 VERIFICAR SE É HORA DO RELATÓRIO MATINAL (8H)
      if (isHorarioRelatorioMatinal()) {
        await this.enviarRelatorioMatinal();
        await this.enviarRelatorioMarketingMatinal();
        await this.enviarRelatorioChecklistMatinal();
      }

      const endTime = new Date();
      const duration = Math.round(
        (endTime.getTime() - startTime.getTime()) / 1000
      );

      await this.completeProcessLog(logId, 'concluido', {
        duracao_segundos: duration,
        total_insights_gerados: results.insights,
        total_anomalias_detectadas: results.anomalias,
        total_predicoes_feitas: results.predicoes,
        total_recomendacoes_criadas: results.recomendacoes,
        resultado_resumo: `Análise concluída: ${results.insights} insights, ${results.anomalias} anomalias, ${results.predicoes} previsões, ${results.recomendacoes} recomendações`,
      });

      console.log(
        `✅ Análise IA concluída em ${duration}s: ${results.insights} insights, ${results.anomalias} anomalias`
      );
    } catch (error: unknown) {
      console.error('Erro no loop de análise IA:', error);
      if (logId) {
        await this.completeProcessLog(logId, 'erro', {
          erro_detalhes: (error instanceof Error ? error.message : String(error)),
        });
      }
    }
  }

  // ========================================
  // 📊 CÁLCULO DE MÉTRICAS AUTOMÁTICAS
  // ========================================

  /**
   * Calcula métricas automaticamente
   */
  private async calculateAutomaticMetrics(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const metricsCalculated: Array<string> = [];

    try {
      // Métrica 1: Taxa de conclusão de checklists
      const checklistMetric =
        await this.calculateChecklistCompletionRate(today);
      if (checklistMetric) {
        await this.saveMetric(checklistMetric);
        metricsCalculated.push('checklist_completion_rate');
      }

      // Métrica 2: Tempo médio de execução
      const timeMetric = await this.calculateAverageExecutionTime(today);
      if (timeMetric) {
        await this.saveMetric(timeMetric);
        metricsCalculated.push('average_execution_time');
      }

      // Métrica 3: Score médio de qualidade
      const qualityMetric = await this.calculateAverageQualityScore(today);
      if (qualityMetric) {
        await this.saveMetric(qualityMetric);
        metricsCalculated.push('average_quality_score');
      }

      // Métrica 4: Engagement WhatsApp
      const whatsappMetric = await this.calculateWhatsAppEngagement(today);
      if (whatsappMetric) {
        await this.saveMetric(whatsappMetric);
        metricsCalculated.push('whatsapp_engagement');
      }

      // Métrica 5: Produtividade por funcionário
      const productivityMetric =
        await this.calculateEmployeeProductivity(today);
      if (productivityMetric) {
        await this.saveMetric(productivityMetric);
        metricsCalculated.push('employee_productivity');
      }

      // Métrica 6: Engajamento das Redes Sociais
      const socialMetric = await this.calculateSocialMediaEngagement(today);
      if (socialMetric) {
        await this.saveMetric(socialMetric);
        metricsCalculated.push('social_media_engagement');
      }

      // Métrica 7: Crescimento de Seguidores
      const growthMetric = await this.calculateFollowersGrowth(today);
      if (growthMetric) {
        await this.saveMetric(growthMetric);
        metricsCalculated.push('followers_growth');
      }

      return metricsCalculated.length;
    } catch (error) {
      console.error('Erro ao calcular métricas automáticas:', error);
      return 0;
    }
  }

  /**
   * Calcula taxa de conclusão de checklists
   */
  private async calculateChecklistCompletionRate(
    date: string
  ): Promise<Record<string, unknown> | null> {
    const { data: executions } = await supabase
      .from('checklist_execucoes')
      .select('status')
      .eq('bar_id', this.barId)
      .gte('created_at', `${date}T00:00:00Z`)
      .lt('created_at', `${date}T23:59:59Z`);

    if (!executions || executions.length === 0) return null;

    const total = executions.length;
    const concluidas = executions.filter(e => e.status === 'concluido').length;
    const taxa = (concluidas / total) * 100;

    return {
      nome_metrica: 'taxa_conclusao_checklists',
      categoria: 'produtividade',
      tipo_calculo: 'percentual',
      valor: taxa,
      data_referencia: date,
      periodo_inicio: date,
      periodo_fim: date,
      meta_valor: 85, // Meta de 85%
      detalhamento: {
        total_execucoes: total,
        concluidas: concluidas,
        pendentes: total - concluidas,
      },
    };
  }

  /**
   * Calcula tempo médio de execução
   */
  private async calculateAverageExecutionTime(
    date: string
  ): Promise<Record<string, unknown> | null> {
    const { data: executions } = await supabase
      .from('checklist_execucoes')
      .select('tempo_execucao_minutos')
      .eq('bar_id', this.barId)
      .eq('status', 'concluido')
      .gte('created_at', `${date}T00:00:00Z`)
      .lt('created_at', `${date}T23:59:59Z`)
      .not('tempo_execucao_minutos', 'is', null);

    if (!executions || executions.length === 0) return null;

    const tempos = executions.map(e => e.tempo_execucao_minutos);
    const tempoMedio = tempos.reduce((a, b) => a + b, 0) / tempos.length;

    return {
      nome_metrica: 'tempo_medio_execucao',
      categoria: 'eficiencia',
      tipo_calculo: 'media',
      valor: tempoMedio,
      data_referencia: date,
      periodo_inicio: date,
      periodo_fim: date,
      meta_valor: 30, // Meta de 30 minutos
      detalhamento: {
        total_execucoes: executions.length,
        tempo_minimo: Math.min(...tempos),
        tempo_maximo: Math.max(...tempos),
        tempo_mediano: tempos.sort()[Math.floor(tempos.length / 2)],
      },
    };
  }

  /**
   * Calcula score médio de qualidade
   */
  private async calculateAverageQualityScore(
    date: string
  ): Promise<Record<string, unknown> | null> {
    const { data: executions } = await supabase
      .from('checklist_execucoes')
      .select('pontuacao_final')
      .eq('bar_id', this.barId)
      .eq('status', 'concluido')
      .gte('created_at', `${date}T00:00:00Z`)
      .lt('created_at', `${date}T23:59:59Z`)
      .not('pontuacao_final', 'is', null);

    if (!executions || executions.length === 0) return null;

    const scores = executions.map(e => e.pontuacao_final);
    const scoreMedio = scores.reduce((a, b) => a + b, 0) / scores.length;

    return {
      nome_metrica: 'score_medio_qualidade',
      categoria: 'qualidade',
      tipo_calculo: 'media',
      valor: scoreMedio,
      data_referencia: date,
      periodo_inicio: date,
      periodo_fim: date,
      meta_valor: 90, // Meta de 90%
      detalhamento: {
        total_execucoes: executions.length,
        score_minimo: Math.min(...scores),
        score_maximo: Math.max(...scores),
        scores_acima_90: scores.filter(s => s >= 90).length,
        scores_abaixo_70: scores.filter(s => s < 70).length,
      },
    };
  }

  /**
   * Calcula engagement do WhatsApp
   */
  private async calculateWhatsAppEngagement(
    date: string
  ): Promise<Record<string, unknown> | null> {
    const { data: messages } = await supabase
      .from('whatsapp_mensagens')
      .select('status')
      .eq('bar_id', this.barId)
      .gte('created_at', `${date}T00:00:00Z`)
      .lt('created_at', `${date}T23:59:59Z`);

    if (!messages || messages.length === 0) return null;

    const total = messages.length;
    const lidas = messages.filter(m => m.status === 'read').length;
    const entregues = messages.filter(m =>
      ['delivered', 'read'].includes(m.status)
    ).length;

    const taxaLeitura = (lidas / total) * 100;
    const taxaEntrega = (entregues / total) * 100;
    const engagement = (taxaLeitura + taxaEntrega) / 2;

    return {
      nome_metrica: 'whatsapp_engagement',
      categoria: 'engagement',
      tipo_calculo: 'percentual',
      valor: engagement,
      data_referencia: date,
      periodo_inicio: date,
      periodo_fim: date,
      meta_valor: 85, // Meta de 85%
      detalhamento: {
        total_mensagens: total,
        mensagens_lidas: lidas,
        mensagens_entregues: entregues,
        taxa_leitura: taxaLeitura,
        taxa_entrega: taxaEntrega,
      },
    };
  }

  /**
   * Calcula produtividade por funcionário
   */
  private async calculateEmployeeProductivity(
    date: string
  ): Promise<Record<string, unknown> | null> {
    const { data: executions } = await supabase
      .from('checklist_execucoes')
      .select(
        `
        executado_por,
        status,
        pontuacao_final,
        tempo_execucao_minutos,
        usuarios_bar!inner(nome)
      `
      )
      .eq('bar_id', this.barId)
      .gte('created_at', `${date}T00:00:00Z`)
      .lt('created_at', `${date}T23:59:59Z`);

    if (!executions || executions.length === 0) return null;

    // Agrupar por funcionário
    const funcionarios: Record<string, FuncionarioProdutividade> = {};
    executions.forEach((exec: ChecklistExecutionRaw) => {
      const id = exec.executado_por;
      if (!funcionarios[id]) {
        funcionarios[id] = {
          nome: exec.usuarios_bar[0]?.nome || 'Funcionário',
          total: 0,
          concluidos: 0,
          score_total: 0,
          tempo_total: 0,
        };
      }

      funcionarios[id].total++;
      if (exec.status === 'concluido') {
        funcionarios[id].concluidos++;
        if (exec.pontuacao_final) {
          funcionarios[id].score_total += exec.pontuacao_final;
        }
        if (exec.tempo_execucao_minutos) {
          funcionarios[id].tempo_total += exec.tempo_execucao_minutos;
        }
      }
    });

    // Calcular produtividade média
    let produtividadeTotal = 0;
    let funcionariosAtivos = 0;

    Object.values(funcionarios).forEach((func: FuncionarioProdutividade) => {
      if (func.total > 0) {
        const taxaConclusao = (func.concluidos / func.total) * 100;
        const scoreMedia =
          func.concluidos > 0 ? func.score_total / func.concluidos : 0;
        const tempoMedio =
          func.concluidos > 0 ? func.tempo_total / func.concluidos : 0;

        // Fórmula de produtividade: (Taxa de Conclusão * Score Médio) / Tempo Médio
        const produtividade =
          tempoMedio > 0 ? (taxaConclusao * scoreMedia) / tempoMedio : 0;
        produtividadeTotal += produtividade;
        funcionariosAtivos++;
      }
    });

    const produtividadeMedia =
      funcionariosAtivos > 0 ? produtividadeTotal / funcionariosAtivos : 0;

    return {
      nome_metrica: 'produtividade_funcionarios',
      categoria: 'produtividade',
      tipo_calculo: 'media',
      valor: produtividadeMedia,
      data_referencia: date,
      periodo_inicio: date,
      periodo_fim: date,
      meta_valor: 100, // Meta de 100 pontos
      detalhamento: {
        funcionarios_ativos: funcionariosAtivos,
        total_execucoes: executions.length,
        breakdown_funcionarios: funcionarios,
      },
    };
  }

  /**
   * Calcula engajamento das redes sociais
   */
  private async calculateSocialMediaEngagement(
    date: string
  ): Promise<Record<string, unknown> | null> {
    try {
      // Buscar métricas consolidadas do dia
      const { data: socialMetrics } = await supabase
        .from('social_metrics_consolidated')
        .select('*')
        .eq('bar_id', this.barId)
        .eq('data_referencia', date)
        .eq('periodo', 'daily')
        .single();

      if (!socialMetrics) return null;

      // Calcular taxa de engajamento geral
      const engagementRate =
        socialMetrics.total_followers > 0
          ? (socialMetrics.total_engagement / socialMetrics.total_followers) *
            100
          : 0;

      return {
        nome_metrica: 'engajamento_redes_sociais',
        categoria: 'marketing',
        tipo_calculo: 'percentual',
        valor: engagementRate,
        data_referencia: date,
        periodo_inicio: date,
        periodo_fim: date,
        meta_valor: 5.0, // Meta de 5% de engajamento
        detalhamento: {
          total_seguidores: socialMetrics.total_followers,
          total_engajamento: socialMetrics.total_engagement,
          alcance_total: socialMetrics.total_reach,
          impressoes_total: socialMetrics.total_impressions,
          facebook_engajamento: socialMetrics.facebook_engagement,
          instagram_engajamento: socialMetrics.instagram_engagement,
          melhor_plataforma:
            socialMetrics.facebook_engagement >
            socialMetrics.instagram_engagement
              ? 'Facebook'
              : 'Instagram',
        },
      };
    } catch (error) {
      console.error('Erro ao calcular engajamento das redes sociais:', error);
      return null;
    }
  }

  /**
   * Calcula crescimento de seguidores
   */
  private async calculateFollowersGrowth(
    date: string
  ): Promise<Record<string, unknown> | null> {
    try {
      // Buscar métricas de hoje
      const { data: today } = await supabase
        .from('social_metrics_consolidated')
        .select('total_followers')
        .eq('bar_id', this.barId)
        .eq('data_referencia', date)
        .eq('periodo', 'daily')
        .single();

      if (!today) return null;

      // Buscar métricas de ontem
      const yesterday = new Date(date);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { data: yesterdayData } = await supabase
        .from('social_metrics_consolidated')
        .select('total_followers')
        .eq('bar_id', this.barId)
        .eq('data_referencia', yesterdayStr)
        .eq('periodo', 'daily')
        .single();

      const seguidoresOntem =
        yesterdayData?.total_followers || today.total_followers;
      const seguidoresHoje = today.total_followers;
      const crescimento = seguidoresHoje - seguidoresOntem;
      const crescimentoPercent =
        seguidoresOntem > 0 ? (crescimento / seguidoresOntem) * 100 : 0;

      return {
        nome_metrica: 'crescimento_seguidores',
        categoria: 'marketing',
        tipo_calculo: 'crescimento',
        valor: crescimentoPercent,
        data_referencia: date,
        periodo_inicio: yesterdayStr,
        periodo_fim: date,
        meta_valor: 1.0, // Meta de 1% de crescimento diário
        detalhamento: {
          seguidores_hoje: seguidoresHoje,
          seguidores_ontem: seguidoresOntem,
          crescimento_absoluto: crescimento,
          crescimento_percentual: crescimentoPercent,
          meta_diaria: Math.ceil(seguidoresOntem * 0.01), // 1% da base anterior
          status:
            crescimento > 0
              ? 'crescimento'
              : crescimento < 0
                ? 'decrescimento'
                : 'estagnado',
        },
      };
    } catch (error) {
      console.error('Erro ao calcular crescimento de seguidores:', error);
      return null;
    }
  }

  // ========================================
  // 🚨 DETECÇÃO DE ANOMALIAS
  // ========================================

  /**
   * Detecta anomalias nos dados
   */
  private async detectAnomalies(): Promise<number> {
    let anomaliasDetectadas = 0;

    try {
      // Anomalia 1: Queda abrupta na taxa de conclusão
      const anomaliaCompletionRate = await this.detectCompletionRateAnomaly();
      if (anomaliaCompletionRate) {
        await this.saveAnomaly(anomaliaCompletionRate);
        anomaliasDetectadas++;
      }

      // Anomalia 2: Pico no tempo de execução
      const anomaliaExecutionTime = await this.detectExecutionTimeAnomaly();
      if (anomaliaExecutionTime) {
        await this.saveAnomaly(anomaliaExecutionTime);
        anomaliasDetectadas++;
      }

      // Anomalia 3: Queda no score de qualidade
      const anomaliaQualityScore = await this.detectQualityScoreAnomaly();
      if (anomaliaQualityScore) {
        await this.saveAnomaly(anomaliaQualityScore);
        anomaliasDetectadas++;
      }

      // Anomalia 4: Comportamento atípico de funcionário
      const anomaliaEmployee = await this.detectEmployeeBehaviorAnomaly();
      if (anomaliaEmployee) {
        await this.saveAnomaly(anomaliaEmployee);
        anomaliasDetectadas++;
      }

      return anomaliasDetectadas;
    } catch (error) {
      console.error('Erro na detecção de anomalias:', error);
      return 0;
    }
  }

  /**
   * Detecta anomalia na taxa de conclusão
   */
  private async detectCompletionRateAnomaly(): Promise<AIAnomaly | null> {
    if (!this.config) return null;

    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Buscar métricas dos últimos 7 dias
    const { data: metrics } = await supabase
      .from('ai_metrics')
      .select('valor, data_referencia')
      .eq('bar_id', this.barId)
      .eq('nome_metrica', 'taxa_conclusao_checklists')
      .gte('data_referencia', sevenDaysAgo.toISOString().split('T')[0])
      .order('data_referencia', { ascending: true });

    if (!metrics || metrics.length < 3) return null;

    // Calcular média e desvio padrão histórico
    const valores = metrics.slice(0, -1).map(m => m.valor); // Excluir hoje
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const variance =
      valores.reduce((a, b) => a + Math.pow(b - media, 2), 0) / valores.length;
    const desvio = Math.sqrt(variance);

    const valorHoje = metrics[metrics.length - 1].valor;
    const limiteInferior = media - this.config.sensibilidade_anomalias * desvio;

    // Se valor de hoje estiver muito abaixo da média
    if (valorHoje < limiteInferior && desvio > 0) {
      const desvioPercentual = ((media - valorHoje) / media) * 100;

      return {
        tipo_anomalia: 'performance',
        subtipo: 'queda_produtividade',
        severidade: desvioPercentual > 30 ? 'alta' : 'media',
        titulo: 'Queda na Taxa de Conclusão de Checklists',
        descricao: `A taxa de conclusão hoje (${valorHoje.toFixed(1)}%) está significativamente abaixo da média histórica (${media.toFixed(1)}%)`,
        valor_esperado: media,
        valor_observado: valorHoje,
        desvio_percentual: desvioPercentual,
        confianca_deteccao: 85,
        possivel_causa:
          'Possíveis causas: sobrecarga de trabalho, problemas técnicos, falta de treinamento ou desmotivação da equipe',
        impacto_estimado:
          'Pode impactar negativamente a qualidade do serviço e satisfação dos clientes',
        acoes_sugeridas: [
          'Verificar carga de trabalho dos funcionários',
          'Revisar processos e identificar gargalos',
          'Providenciar treinamento adicional se necessário',
          'Investigar problemas técnicos no sistema',
        ],
        metricas_anomala: {
          valor_atual: valorHoje,
          media_historica: media,
          desvio_padrao: desvio,
          limite_inferior: limiteInferior,
          dias_analisados: valores.length,
        },
      };
    }

    return null;
  }

  /**
   * Detecta anomalia no tempo de execução
   */
  private async detectExecutionTimeAnomaly(): Promise<AIAnomaly | null> {
    if (!this.config) return null;

    const { data: metrics } = await supabase
      .from('ai_metrics')
      .select('valor, data_referencia')
      .eq('bar_id', this.barId)
      .eq('nome_metrica', 'tempo_medio_execucao')
      .gte(
        'data_referencia',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
      )
      .order('data_referencia', { ascending: true });

    if (!metrics || metrics.length < 3) return null;

    const valores = metrics.slice(0, -1).map(m => m.valor);
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const variance =
      valores.reduce((a, b) => a + Math.pow(b - media, 2), 0) / valores.length;
    const desvio = Math.sqrt(variance);

    const valorHoje = metrics[metrics.length - 1].valor;
    const limiteSuperior = media + this.config.sensibilidade_anomalias * desvio;

    if (valorHoje > limiteSuperior && desvio > 0) {
      const desvioPercentual = ((valorHoje - media) / media) * 100;

      return {
        tipo_anomalia: 'performance',
        subtipo: 'aumento_tempo_execucao',
        severidade: desvioPercentual > 50 ? 'alta' : 'media',
        titulo: 'Aumento no Tempo de Execução',
        descricao: `O tempo médio de execução hoje (${valorHoje.toFixed(1)} min) está muito acima da média histórica (${media.toFixed(1)} min)`,
        valor_esperado: media,
        valor_observado: valorHoje,
        desvio_percentual: desvioPercentual,
        confianca_deteccao: 80,
        possivel_causa:
          'Possíveis causas: processos complexos, falta de treinamento, problemas técnicos ou procedimentos inadequados',
        impacto_estimado:
          'Redução da eficiência operacional e possível impacto na experiência do cliente',
        acoes_sugeridas: [
          'Revisar e simplificar processos complexos',
          'Verificar se há gargalos técnicos',
          'Providenciar treinamento para acelerar execução',
          'Analisar checklists com maior tempo de execução',
        ],
        metricas_anomala: {
          valor_atual: valorHoje,
          media_historica: media,
          desvio_padrao: desvio,
          limite_superior: limiteSuperior,
          dias_analisados: valores.length,
        },
      };
    }

    return null;
  }

  /**
   * Detecta anomalia no score de qualidade
   */
  private async detectQualityScoreAnomaly(): Promise<AIAnomaly | null> {
    if (!this.config) return null;

    const { data: metrics } = await supabase
      .from('ai_metrics')
      .select('valor, data_referencia')
      .eq('bar_id', this.barId)
      .eq('nome_metrica', 'score_medio_qualidade')
      .gte(
        'data_referencia',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
      )
      .order('data_referencia', { ascending: true });

    if (!metrics || metrics.length < 3) return null;

    const valores = metrics.slice(0, -1).map(m => m.valor);
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const variance =
      valores.reduce((a, b) => a + Math.pow(b - media, 2), 0) / valores.length;
    const desvio = Math.sqrt(variance);

    const valorHoje = metrics[metrics.length - 1].valor;
    const limiteInferior = media - this.config.sensibilidade_anomalias * desvio;

    if (valorHoje < limiteInferior && desvio > 0) {
      const desvioPercentual = ((media - valorHoje) / media) * 100;

      return {
        tipo_anomalia: 'qualidade',
        subtipo: 'queda_qualidade',
        severidade:
          valorHoje < 70 ? 'critica' : desvioPercentual > 15 ? 'alta' : 'media',
        titulo: 'Queda na Qualidade dos Checklists',
        descricao: `O score médio de qualidade hoje (${valorHoje.toFixed(1)}%) está abaixo da média histórica (${media.toFixed(1)}%)`,
        valor_esperado: media,
        valor_observado: valorHoje,
        desvio_percentual: desvioPercentual,
        confianca_deteccao: 90,
        possivel_causa:
          'Possíveis causas: pressa na execução, falta de atenção, treinamento inadequado ou problemas nos processos',
        impacto_estimado:
          'Impacto direto na qualidade do serviço e satisfação dos clientes',
        acoes_sugeridas: [
          'Revisar execuções com baixo score',
          'Providenciar feedback individual aos funcionários',
          'Reforçar treinamento em pontos críticos',
          'Investigar se há problemas nos checklists',
        ],
        metricas_anomala: {
          valor_atual: valorHoje,
          media_historica: media,
          desvio_padrao: desvio,
          limite_inferior: limiteInferior,
          dias_analisados: valores.length,
        },
      };
    }

    return null;
  }

  /**
   * Detecta comportamento atípico de funcionário
   */
  private async detectEmployeeBehaviorAnomaly(): Promise<AIAnomaly | null> {
    const today = new Date().toISOString().split('T')[0];

    // Buscar produtividade por funcionário hoje
    const { data: todayMetric } = await supabase
      .from('ai_metrics')
      .select('detalhamento')
      .eq('bar_id', this.barId)
      .eq('nome_metrica', 'produtividade_funcionarios')
      .eq('data_referencia', today)
      .single();

    if (!todayMetric?.detalhamento?.breakdown_funcionarios) return null;

    const funcionariosHoje = todayMetric.detalhamento.breakdown_funcionarios;

    // Buscar histórico para comparação
    const { data: historicMetrics } = await supabase
      .from('ai_metrics')
      .select('detalhamento')
      .eq('bar_id', this.barId)
      .eq('nome_metrica', 'produtividade_funcionarios')
      .gte(
        'data_referencia',
        new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
      )
      .neq('data_referencia', today);

    if (!historicMetrics || historicMetrics.length < 3) return null;

    // Analisar cada funcionário
    for (const [funcionarioId, dadosHoje] of Object.entries(funcionariosHoje)) {
      const func = dadosHoje as FuncionarioProdutividade;

      if (func.total < 3) continue; // Pular funcionários com poucas execuções

      const taxaConclusaoHoje = (func.concluidos / func.total) * 100;
      const scoreHoje =
        func.concluidos > 0 ? func.score_total / func.concluidos : 0;

      // Calcular médias históricas
      const taxasHistoricas: number[] = [];
      const scoresHistoricos: number[] = [];

      historicMetrics.forEach(metric => {
        const breakdown = metric.detalhamento?.breakdown_funcionarios;
        if (breakdown && breakdown[funcionarioId]) {
          const dadosHistoricos = breakdown[funcionarioId];
          if (dadosHistoricos.total >= 2) {
            taxasHistoricas.push(
              (dadosHistoricos.concluidos / dadosHistoricos.total) * 100
            );
            if (dadosHistoricos.concluidos > 0) {
              scoresHistoricos.push(
                dadosHistoricos.score_total / dadosHistoricos.concluidos
              );
            }
          }
        }
      });

      if (taxasHistoricas.length < 3) continue;

      const mediaTaxa =
        taxasHistoricas.reduce((a, b) => a + b, 0) / taxasHistoricas.length;
      const mediaScore =
        scoresHistoricos.length > 0
          ? scoresHistoricos.reduce((a, b) => a + b, 0) /
            scoresHistoricos.length
          : 0;

      // Detectar anomalias significativas
      const quedaTaxa = mediaTaxa - taxaConclusaoHoje;
      const quedaScore = mediaScore - scoreHoje;

      if (quedaTaxa > 30 || (quedaScore > 20 && scoreHoje < 70)) {
        return {
          tipo_anomalia: 'comportamento',
          subtipo: 'performance_funcionario',
          severidade: quedaTaxa > 50 || scoreHoje < 60 ? 'alta' : 'media',
          objeto_id: parseInt(funcionarioId),
          objeto_tipo: 'funcionario',
          objeto_nome: func.nome,
          titulo: `Queda de Performance: ${func.nome}`,
          descricao: `${func.nome} apresenta queda significativa na performance: taxa de conclusão hoje ${taxaConclusaoHoje.toFixed(1)}% vs média ${mediaTaxa.toFixed(1)}%`,
          valor_esperado: mediaTaxa,
          valor_observado: taxaConclusaoHoje,
          desvio_percentual: (quedaTaxa / mediaTaxa) * 100,
          confianca_deteccao: 75,
          possivel_causa:
            'Possíveis causas: problemas pessoais, desmotivação, sobrecarga, falta de treinamento ou questões técnicas',
          impacto_estimado:
            'Impacto na produtividade da equipe e qualidade do serviço',
          acoes_sugeridas: [
            'Conversar individualmente com o funcionário',
            'Verificar carga de trabalho e distribuição de tarefas',
            'Oferecer suporte ou treinamento adicional',
            'Investigar possíveis problemas pessoais ou técnicos',
          ],
          metricas_anomala: {
            taxa_conclusao_hoje: taxaConclusaoHoje,
            taxa_conclusao_media: mediaTaxa,
            score_hoje: scoreHoje,
            score_medio: mediaScore,
            total_execucoes_hoje: func.total,
            total_concluidas_hoje: func.concluidos,
            dias_analisados: taxasHistoricas.length,
          },
        };
      }
    }

    return null;
  }

  // ========================================
  // 🔧 MÉTODOS AUXILIARES
  // ========================================

  /**
   * Verifica se está no horário de funcionamento
   */
  private isWithinWorkingHours(): boolean {
    if (!this.config) return false;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    return (
      currentTime >= this.config.horario_analise_inicio &&
      currentTime <= this.config.horario_analise_fim
    );
  }

  /**
   * Salva métrica no banco
   */
  private async saveMetric(metric: Record<string, unknown>): Promise<void> {
    await supabase.from('ai_metrics').insert({
      bar_id: this.barId,
      ...metric,
      frequencia_calculo: 'diaria',
      ativa: true,
    });
  }

  /**
   * Salva anomalia no banco
   */
  private async saveAnomaly(anomaly: AIAnomaly): Promise<void> {
    await supabase.from('ai_anomalies').insert({
      bar_id: this.barId,
      data_inicio: new Date().toISOString(),
      ...anomaly,
    });
  }

  /**
   * Inicia log de processo
   */
  private async startProcessLog(tipo: string): Promise<number> {
    const { data } = await supabase
      .from('ai_agent_logs')
      .insert({
        bar_id: this.barId,
        tipo_processamento: tipo,
        nome_processo: `Análise IA Automática - ${tipo}`,
        status: 'processando',
      })
      .select('id')
      .single();

    return data?.id;
  }

  /**
   * Completa log de processo
   */
  private async completeProcessLog(
    logId: number,
    status: string,
    dados: Record<string, unknown> = {}
  ): Promise<void> {
    await supabase
      .from('ai_agent_logs')
      .update({
        status,
        data_fim: new Date().toISOString(),
        ...dados,
      })
      .eq('id', logId);
  }

  /**
   * Log simples de processo
   */
  private async logProcess(
    tipo: string,
    nome: string,
    status: string,
    erro?: string
  ): Promise<void> {
    await supabase.from('ai_agent_logs').insert({
      bar_id: this.barId,
      tipo_processamento: tipo,
      nome_processo: nome,
      status,
      data_inicio: new Date().toISOString(),
      data_fim: new Date().toISOString(),
      erro_detalhes: erro,
    });
  }

  /**
   * Envia notificações de IA
   */
  private async sendAINotifications(): Promise<void> {
    if (!this.config?.notificar_insights && !this.config?.notificar_anomalias) {
      return;
    }

    // Buscar anomalias críticas não notificadas
    if (this.config.notificar_anomalias) {
      const { data: anomalias } = await supabase
        .from('ai_anomalies')
        .select('*')
        .eq('bar_id', this.barId)
        .eq('severidade', 'critica')
        .eq('ainda_ativa', true)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Última hora

      if (anomalias && anomalias.length > 0) {
        const notificationService = createEnhancedNotificationService(
          this.barId
        );

        for (const anomalia of anomalias) {
          // 🎮 ENVIAR PARA DISCORD
          try {
            await DiscordService.enviarAlertaAnomalia(anomalia);
            console.log(
              `📨 Anomalia crítica enviada para Discord: ${anomalia.titulo}`
            );
          } catch (error) {
            console.error('Erro ao enviar anomalia para Discord:', error);
          }

          // Notificar admins sobre anomalias críticas
          const { data: admins } = await supabase
            .from('usuarios_bar')
            .select('id')
            .eq('bar_id', this.barId)
            .eq('permissao', 'admin');

          if (admins) {
            for (const admin of admins) {
              await notificationService.sendMultiChannelNotification({
                usuario_id: admin.id,
                bar_id: this.barId,
                titulo: `🚨 Anomalia Crítica Detectada`,
                conteudo: anomalia.descricao,
                tipo: 'anomalia_critica',
                modulo: 'ai_analytics',
                prioridade: 'alta',
                canais: {
                  browser: true,
                  whatsapp: true,
                  email: false,
                  sms: false,
                },
                url_acao: `/admin/analytics/anomalias/${anomalia.id}`,
              });
            }
          }
        }
      }
    }
  }

  /**
   * 🌅 Enviar relatório matinal às 8h
   */
  private async enviarRelatorioMatinal(): Promise<void> {
    try {
      console.log('🌅 Enviando relatório matinal para Discord...');

      // Buscar dados do dashboard
      const { data: dashboardData } = await fetch(
        `${process.env.NEXTAUTH_URL}/api/ai/dashboard?periodo_dias=1`,
        {
          headers: {
            'x-user-data': JSON.stringify({
              bar_id: this.barId,
              permissao: 'admin',
              usuario_id: 1,
            }),
          },
        }
      ).then(res => res.json());

      if (dashboardData && dashboardData.success) {
        // Enviar para Discord
        const sucesso = await DiscordService.enviarRelatorioMatinal(
          dashboardData.data
        );

        if (sucesso) {
          console.log('✅ Relatório matinal enviado com sucesso para Discord!');

          // Log da ação
          await this.logProcess(
            'relatorio_discord',
            'Relatório Matinal Enviado',
            'concluido'
          );
        } else {
          console.error('❌ Erro ao enviar relatório matinal para Discord');
        }
      }
    } catch (error: unknown) {
      console.error('Erro ao enviar relatório matinal:', error);
      await this.logProcess(
        'relatorio_discord',
        'Erro no Relatório Matinal',
        'erro',
        (error instanceof Error ? error.message : String(error))
      );
    }
  }

  /**
   * 📋 Enviar relatório matinal de checklists às 8h
   */
  private async enviarRelatorioChecklistMatinal(): Promise<void> {
    try {
      console.log('📋 Gerando relatório matinal de checklists...');

      // Buscar estatísticas de ontem
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const dataOntem = ontem.toISOString().split('T')[0];

      // Buscar execuções de ontem
      const { data: execucoes } = await supabase
        .from('checklist_execucoes')
        .select('status, tempo_execucao_minutos, score_final')
        .eq('bar_id', this.barId)
        .gte('created_at', `${dataOntem}T00:00:00Z`)
        .lt('created_at', `${dataOntem}T23:59:59Z`);

      // Buscar alertas ativos agora
      const { data: alertasData } = await fetch('/api/operacoes/checklists/alerts')
        .then(res => res.json())
        .catch(() => ({ alerts: [] }));

      const totalExecucoes = execucoes?.length || 0;
      const execucoesConcluidas =
        execucoes?.filter(e => e.status === 'concluido').length || 0;
      const execucoesPendentes = totalExecucoes - execucoesConcluidas;

      const temposExecucao =
        execucoes
          ?.filter(e => e.tempo_execucao_minutos)
          .map(e => e.tempo_execucao_minutos) || [];
      const tempoMedio =
        temposExecucao.length > 0
          ? temposExecucao.reduce((a, b) => a + b, 0) / temposExecucao.length
          : 0;

      const scores =
        execucoes?.filter(e => e.score_final).map(e => e.score_final) || [];
      const scoreMedio =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;

      const alertasAtivos = alertasData?.alerts?.length || 0;
      const alertasCriticos =
        alertasData?.alerts?.filter((a: AlertData) => a.nivel === 'critico')
          .length || 0;

      const checklistStats = {
        total_execucoes: totalExecucoes,
        execucoes_concluidas: execucoesConcluidas,
        execucoes_pendentes: execucoesPendentes,
        tempo_medio_execucao: tempoMedio,
        score_medio: scoreMedio,
        alertas_ativos: alertasAtivos,
        alertas_criticos: alertasCriticos,
      };

      // Enviar para Discord
      await DiscordChecklistService.sendDailyReport(checklistStats);
      console.log('✅ Relatório matinal de checklists enviado para Discord');

      // Log da ação
      await this.logProcess(
        'relatorio_checklist',
        'Relatório Checklist Matinal Enviado',
        'concluido'
      );
    } catch (error: unknown) {
      console.error(
        '❌ Erro ao enviar relatório matinal de checklists:',
        error
      );
      await this.logProcess(
        'relatorio_checklist',
        'Erro no Relatório Checklist Matinal',
        'erro',
        (error instanceof Error ? error.message : String(error))
      );
    }
  }

  /**
   * 📱 Enviar relatório matinal de marketing às 8h
   */
  private async enviarRelatorioMarketingMatinal(): Promise<void> {
    try {
      console.log('📱 Enviando relatório matinal de marketing...');

      // Buscar métricas sociais de hoje
      const today = new Date().toISOString().split('T')[0];

      const { data: socialMetrics } = await supabase
        .from('social_metrics_consolidated')
        .select('*')
        .eq('bar_id', this.barId)
        .eq('data_referencia', today)
        .eq('periodo', 'daily')
        .single();

      // Buscar métricas de ontem para comparação
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { data: yesterdayMetrics } = await supabase
        .from('social_metrics_consolidated')
        .select('*')
        .eq('bar_id', this.barId)
        .eq('data_referencia', yesterdayStr)
        .eq('periodo', 'daily')
        .single();

      if (socialMetrics) {
        // Calcular crescimento
        const facebookGrowth = yesterdayMetrics
          ? ((socialMetrics.facebook_followers -
              yesterdayMetrics.facebook_followers) /
              yesterdayMetrics.facebook_followers) *
            100
          : 0;

        const instagramGrowth = yesterdayMetrics
          ? ((socialMetrics.instagram_followers -
              yesterdayMetrics.instagram_followers) /
              yesterdayMetrics.instagram_followers) *
            100
          : 0;

        // Buscar posts de hoje
        const { data: facebookPosts } = await supabase
          .from('facebook_posts')
          .select('*')
          .eq('bar_id', this.barId)
          .gte('created_time', `${today}T00:00:00Z`)
          .order('reach', { ascending: false })
          .limit(1);

        const { data: instagramPosts } = await supabase
          .from('instagram_posts')
          .select('*')
          .eq('bar_id', this.barId)
          .gte('timestamp', `${today}T00:00:00Z`)
          .order('reach', { ascending: false })
          .limit(1);

        // Preparar dados para o relatório
        const marketingData = {
          facebook: {
            followers: socialMetrics.facebook_followers,
            reach: socialMetrics.facebook_reach,
            engagement: socialMetrics.facebook_engagement,
            posts_today: facebookPosts?.length || 0,
            growth_rate: facebookGrowth,
            best_post_reach: facebookPosts?.[0]?.reach || 0,
          },
          instagram: {
            followers: socialMetrics.instagram_followers,
            reach: socialMetrics.instagram_reach,
            engagement: socialMetrics.instagram_engagement,
            posts_today: instagramPosts?.length || 0,
            growth_rate: instagramGrowth,
            best_post_reach: instagramPosts?.[0]?.reach || 0,
          },
          overall: {
            total_followers: socialMetrics.total_followers,
            total_reach: socialMetrics.total_reach,
            total_engagement: socialMetrics.total_engagement,
            engagement_rate: socialMetrics.engagement_rate_geral,
            best_performing_platform:
              socialMetrics.facebook_engagement >
              socialMetrics.instagram_engagement
                ? 'facebook'
                : 'instagram',
          },
        };

        // Enviar para Discord Marketing
        const sucesso = await notifyMarketingUpdate('relatorio', {
          metrics: marketingData,
        });

        if (sucesso) {
          console.log('✅ Relatório matinal de marketing enviado com sucesso!');

          // Log da ação
          await this.logProcess(
            'relatorio_marketing',
            'Relatório Marketing Matinal Enviado',
            'concluido'
          );
        } else {
          console.error('❌ Erro ao enviar relatório matinal de marketing');
        }
      } else {
        console.log(
          '📱 Nenhuma métrica social encontrada para hoje - pulando relatório marketing'
        );
      }
    } catch (error: unknown) {
      console.error('Erro ao enviar relatório matinal de marketing:', error);
      await this.logProcess(
        'relatorio_marketing',
        'Erro no Relatório Marketing Matinal',
        'erro',
        (error instanceof Error ? error.message : String(error))
      );
    }
  }

  // ========================================
  // 💡 GERAÇÃO DE INSIGHTS (PLACEHOLDER)
  // ========================================

  private async generateInsights(): Promise<number> {
    // TODO: Implementar geração de insights inteligentes
    return 0;
  }

  private async generatePredictions(): Promise<number> {
    // TODO: Implementar previsões de ML
    return 0;
  }

  private async generateRecommendations(): Promise<number> {
    // TODO: Implementar recomendações inteligentes
    return 0;
  }
}

// ========================================
// 🚀 FACTORY E MANAGER DE AGENTES
// ========================================

/**
 * Manager global de agentes IA
 */
export class AIAgentManager {
  private agents: Map<number, AIIntelligentAgent> = new Map();

  /**
   * Inicia agente para um bar
   */
  async startAgent(barId: number): Promise<boolean> {
    if (this.agents.has(barId)) {
      return true; // Já está rodando
    }

    const agent = new AIIntelligentAgent(barId);
    const initialized = await agent.initialize();

    if (initialized) {
      this.agents.set(barId, agent);
      await agent.startAgent();
      return true;
    }

    return false;
  }

  /**
   * Para agente de um bar
   */
  stopAgent(barId: number): void {
    const agent = this.agents.get(barId);
    if (agent) {
      agent.stopAgent();
      this.agents.delete(barId);
    }
  }

  /**
   * Para todos os agentes
   */
  stopAllAgents(): void {
    this.agents.forEach((agent, barId) => {
      agent.stopAgent();
    });
    this.agents.clear();
  }

  /**
   * Status dos agentes
   */
  getAgentsStatus(): { barId: number; running: boolean }[] {
    return Array.from(this.agents.entries()).map(([barId, agent]) => ({
      barId,
      running: true,
    }));
  }
}

// Instância global do manager
export const aiAgentManager = new AIAgentManager();

/**
 * Função para iniciar agente IA
 */
export async function startAIAgent(barId: number): Promise<boolean> {
  return aiAgentManager.startAgent(barId);
}

/**
 * Função para parar agente IA
 */
export function stopAIAgent(barId: number): void {
  aiAgentManager.stopAgent(barId);
}
