import { createClient } from '@supabase/supabase-js';
import { createEnhancedNotificationService } from './notifications-enhanced';
import { sgbDiscordService, isHorarioRelatorioMatinal } from './discord-service';
import { notifyMarketingUpdate } from './discord-marketing-service';
import DiscordChecklistService from './discord-checklist-service';

// Configuraá§á£o do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ========================================
// ðŸ¤– AI INTELLIGENT AGENT - BACKGROUND SERVICE
// ========================================

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
  metricas_base: any;
  evidencias: any;
  acoes_sugeridas: any[];
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
  acoes_sugeridas: any[];
  metricas_anomala: any;
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
  evidencias: any;
  prioridade: number;
  urgencia: string;
  complexidade: string;
  passos_implementacao: any[];
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
  // ðŸ”§ INICIALIZAá‡áƒO E CONFIGURAá‡áƒO
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
        await this.logProcess('inicializacao', 'Agente IA inicializado', 'concluido');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Erro ao inicializar agente IA:', error);
      await this.logProcess('inicializacao', 'Erro na inicializaá§á£o', 'erro', error.message || String(error));
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
    console.log(`ðŸ¤– Agente IA iniciado para bar ${this.barId} - Executando a cada ${this.config.frequencia_analise_minutos} minutos`);

    // Execuá§á£o inicial
    await this.runAnalysisLoop();

    // Configurar execuá§á£o periá³dica
    this.intervalId = setInterval(async () => {
      await this.runAnalysisLoop();
    }, this.config.frequencia_analise_minutos * 60 * 1000);
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
    console.log(`ðŸ¤– Agente IA parado para bar ${this.barId}`);
  }

  // ========================================
  // ðŸ”„ LOOP PRINCIPAL DE ANáLISE
  // ========================================

  /**
   * Loop principal de aná¡lise do agente
   */
  private async runAnalysisLoop(): Promise<void> {
    if (!this.config) return;

    const startTime = new Date();
    let logId: number | null = null;

    try {
      // Verificar se está¡ no horá¡rio de funcionamento
      if (!this.isWithinWorkingHours()) {
        return;
      }

      logId = await this.startProcessLog('analise_completa');

      console.log(`ðŸ¤– [${new Date().toISOString()}] Iniciando aná¡lise IA para bar ${this.barId}`);

      const results = {
        insights: 0,
        anomalias: 0,
        predicoes: 0,
        recomendacoes: 0,
        metricas: 0
      };

      // 1. Calcular má©tricas automaticamente
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

      // 4. Fazer previsáµes
      if (this.config.gerar_predicoes) {
        results.predicoes = await this.generatePredictions();
      }

      // 5. Gerar recomendaá§áµes
      if (this.config.gerar_recomendacoes) {
        results.recomendacoes = await this.generateRecommendations();
      }

      // 6. Enviar notificaá§áµes se necessá¡rio
      await this.sendAINotifications();

      // 7. ðŸŒ… VERIFICAR SE á‰ HORA DO RELATá“RIO MATINAL (8H)
      if (isHorarioRelatorioMatinal()) {
        await this.enviarRelatorioMatinal();
        await this.enviarRelatorioMarketingMatinal();
        await this.enviarRelatorioChecklistMatinal();
      }

      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

      await this.completeProcessLog(logId, 'concluido', {
        duracao_segundos: duration,
        total_insights_gerados: results.insights,
        total_anomalias_detectadas: results.anomalias,
        total_predicoes_feitas: results.predicoes,
        total_recomendacoes_criadas: results.recomendacoes,
        resultado_resumo: `Aná¡lise concluá­da: ${results.insights} insights, ${results.anomalias} anomalias, ${results.predicoes} previsáµes, ${results.recomendacoes} recomendaá§áµes`
      });

      console.log(`œ… Aná¡lise IA concluá­da em ${duration}s: ${results.insights} insights, ${results.anomalias} anomalias`);

    } catch (error: any) {
      console.error('Erro no loop de aná¡lise IA:', error);
      if (logId) {
        await this.completeProcessLog(logId, 'erro', { erro_detalhes: error.message || String(error) });
      }
    }
  }

  // ========================================
  // ðŸ“Š CáLCULO DE Má‰TRICAS AUTOMáTICAS
  // ========================================

  /**
   * Calcula má©tricas automaticamente
   */
  private async calculateAutomaticMetrics(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const metricsCalculated = [];

    try {
      // Má©trica 1: Taxa de conclusá£o de checklists
      const checklistMetric = await this.calculateChecklistCompletionRate(today);
      if (checklistMetric) {
        await this.saveMetric(checklistMetric);
        metricsCalculated.push('checklist_completion_rate');
      }

      // Má©trica 2: Tempo má©dio de execuá§á£o
      const timeMetric = await this.calculateAverageExecutionTime(today);
      if (timeMetric) {
        await this.saveMetric(timeMetric);
        metricsCalculated.push('average_execution_time');
      }

      // Má©trica 3: Score má©dio de qualidade
      const qualityMetric = await this.calculateAverageQualityScore(today);
      if (qualityMetric) {
        await this.saveMetric(qualityMetric);
        metricsCalculated.push('average_quality_score');
      }

      // Má©trica 4: Engagement WhatsApp
      const whatsappMetric = await this.calculateWhatsAppEngagement(today);
      if (whatsappMetric) {
        await this.saveMetric(whatsappMetric);
        metricsCalculated.push('whatsapp_engagement');
      }

      // Má©trica 5: Produtividade por funcioná¡rio
      const productivityMetric = await this.calculateEmployeeProductivity(today);
      if (productivityMetric) {
        await this.saveMetric(productivityMetric);
        metricsCalculated.push('employee_productivity');
      }

      // Má©trica 6: Engajamento das Redes Sociais
      const socialMetric = await this.calculateSocialMediaEngagement(today);
      if (socialMetric) {
        await this.saveMetric(socialMetric);
        metricsCalculated.push('social_media_engagement');
      }

      // Má©trica 7: Crescimento de Seguidores
      const growthMetric = await this.calculateFollowersGrowth(today);
      if (growthMetric) {
        await this.saveMetric(growthMetric);
        metricsCalculated.push('followers_growth');
      }

      return metricsCalculated.length;

    } catch (error) {
      console.error('Erro ao calcular má©tricas automá¡ticas:', error);
      return 0;
    }
  }

  /**
   * Calcula taxa de conclusá£o de checklists
   */
  private async calculateChecklistCompletionRate(date: string): Promise<any> {
    const { data: executions } = await supabase
      .from('checklist_execucoes')
      .select('status')
      .eq('bar_id', this.barId)
      .gte('created_at', `${date}T00:00:00Z`)
      .lt('created_at', `${date}T23:59:59Z`);

    if (!executions || executions.length === 0) return null;

    const total = executions.length;
    const concluidas = executions.filter((e: any) => e.status === 'concluido').length;
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
        pendentes: total - concluidas
      }
    };
  }

  /**
   * Calcula tempo má©dio de execuá§á£o
   */
  private async calculateAverageExecutionTime(date: string): Promise<any> {
    const { data: executions } = await supabase
      .from('checklist_execucoes')
      .select('tempo_execucao_minutos')
      .eq('bar_id', this.barId)
      .eq('status', 'concluido')
      .gte('created_at', `${date}T00:00:00Z`)
      .lt('created_at', `${date}T23:59:59Z`)
      .not('tempo_execucao_minutos', 'is', null);

    if (!executions || executions.length === 0) return null;

    const tempos = executions.map((e: any) => e.tempo_execucao_minutos);
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
        tempo_mediano: tempos.sort()[Math.floor(tempos.length / 2)]
      }
    };
  }

  /**
   * Calcula score má©dio de qualidade
   */
  private async calculateAverageQualityScore(date: string): Promise<any> {
    const { data: executions } = await supabase
      .from('checklist_execucoes')
      .select('pontuacao_final')
      .eq('bar_id', this.barId)
      .eq('status', 'concluido')
      .gte('created_at', `${date}T00:00:00Z`)
      .lt('created_at', `${date}T23:59:59Z`)
      .not('pontuacao_final', 'is', null);

    if (!executions || executions.length === 0) return null;

    const scores = executions.map((e: any) => e.pontuacao_final);
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
        scores_acima_90: scores.filter((s: any) => s >= 90).length,
        scores_abaixo_70: scores.filter((s: any) => s < 70).length
      }
    };
  }

  /**
   * Calcula engagement do WhatsApp
   */
  private async calculateWhatsAppEngagement(date: string): Promise<any> {
    const { data: messages } = await supabase
      .from('whatsapp_mensagens')
      .select('status')
      .eq('bar_id', this.barId)
      .gte('created_at', `${date}T00:00:00Z`)
      .lt('created_at', `${date}T23:59:59Z`);

    if (!messages || messages.length === 0) return null;

    const total = messages.length;
    const lidas = messages.filter((m: any) => m.status === 'read').length;
    const entregues = messages.filter((m: any) => ['delivered', 'read'].includes(m.status)).length;
    
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
        taxa_entrega: taxaEntrega
      }
    };
  }

  /**
   * Calcula produtividade por funcioná¡rio
   */
  private async calculateEmployeeProductivity(date: string): Promise<any> {
    const { data: executions } = await supabase
      .from('checklist_execucoes')
      .select(`
        executado_por,
        status,
        pontuacao_final,
        tempo_execucao_minutos,
        usuarios_bar!inner(nome)
      `)
      .eq('bar_id', this.barId)
      .gte('created_at', `${date}T00:00:00Z`)
      .lt('created_at', `${date}T23:59:59Z`);

    if (!executions || executions.length === 0) return null;

    // Agrupar por funcioná¡rio
    const funcionarios: Record<string, any> = {};
    executions.forEach((exec: any) => {
      const id = exec.executado_por;
      if (!funcionarios[id]) {
        funcionarios[id] = {
          nome: exec.usuarios_bar.nome,
          total: 0,
          concluidos: 0,
          score_total: 0,
          tempo_total: 0
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

    // Calcular produtividade má©dia
    let produtividadeTotal = 0;
    let funcionariosAtivos = 0;

    Object.values(funcionarios).forEach((func: any) => {
      if (func.total > 0) {
        const taxaConclusao = (func.concluidos / func.total) * 100;
        const scoreMedia = func.concluidos > 0 ? func.score_total / func.concluidos : 0;
        const tempoMedio = func.concluidos > 0 ? func.tempo_total / func.concluidos : 0;
        
        // Fá³rmula de produtividade: (Taxa de Conclusá£o * Score Má©dio) / Tempo Má©dio
        const produtividade = tempoMedio > 0 ? (taxaConclusao * scoreMedia) / tempoMedio : 0;
        produtividadeTotal += produtividade;
        funcionariosAtivos++;
      }
    });

    const produtividadeMedia = funcionariosAtivos > 0 ? produtividadeTotal / funcionariosAtivos : 0;

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
        breakdown_funcionarios: funcionarios
      }
    };
  }

  /**
   * Calcula engajamento das redes sociais
   */
  private async calculateSocialMediaEngagement(date: string): Promise<any> {
    try {
      // Buscar má©tricas consolidadas do dia
      const { data: socialMetrics } = await supabase
        .from('social_metrics_consolidated')
        .select('*')
        .eq('bar_id', this.barId)
        .eq('data_referencia', date)
        .eq('periodo', 'daily')
        .single();

      if (!socialMetrics) return null;

      // Calcular taxa de engajamento geral
      const engagementRate = socialMetrics.total_followers > 0 
        ? (socialMetrics.total_engagement / socialMetrics.total_followers) * 100 
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
          melhor_plataforma: socialMetrics.facebook_engagement > socialMetrics.instagram_engagement ? 'Facebook' : 'Instagram'
        }
      };
    } catch (error) {
      console.error('Erro ao calcular engajamento das redes sociais:', error);
      return null;
    }
  }

  /**
   * Calcula crescimento de seguidores
   */
  private async calculateFollowersGrowth(date: string): Promise<any> {
    try {
      // Buscar má©tricas de hoje
      const { data: today } = await supabase
        .from('social_metrics_consolidated')
        .select('total_followers')
        .eq('bar_id', this.barId)
        .eq('data_referencia', date)
        .eq('periodo', 'daily')
        .single();

      if (!today) return null;

      // Buscar má©tricas de ontem
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

      const seguidoresOntem = yesterdayData?.total_followers || today.total_followers;
      const seguidoresHoje = today.total_followers;
      const crescimento = seguidoresHoje - seguidoresOntem;
      const crescimentoPercent = seguidoresOntem > 0 ? (crescimento / seguidoresOntem) * 100 : 0;

      return {
        nome_metrica: 'crescimento_seguidores',
        categoria: 'marketing',
        tipo_calculo: 'crescimento',
        valor: crescimentoPercent,
        data_referencia: date,
        periodo_inicio: yesterdayStr,
        periodo_fim: date,
        meta_valor: 1.0, // Meta de 1% de crescimento diá¡rio
        detalhamento: {
          seguidores_hoje: seguidoresHoje,
          seguidores_ontem: seguidoresOntem,
          crescimento_absoluto: crescimento,
          crescimento_percentual: crescimentoPercent,
          meta_diaria: Math.ceil(seguidoresOntem * 0.01), // 1% da base anterior
          status: crescimento > 0 ? 'crescimento' : crescimento < 0 ? 'decrescimento' : 'estagnado'
        }
      };
    } catch (error) {
      console.error('Erro ao calcular crescimento de seguidores:', error);
      return null;
    }
  }

  // ========================================
  // ðŸš¨ DETECá‡áƒO DE ANOMALIAS
  // ========================================

  /**
   * Detecta anomalias nos dados
   */
  private async detectAnomalies(): Promise<number> {
    let anomaliasDetectadas = 0;

    try {
      // Anomalia 1: Queda abrupta na taxa de conclusá£o
      const anomaliaCompletionRate = await this.detectCompletionRateAnomaly();
      if (anomaliaCompletionRate) {
        await this.saveAnomaly(anomaliaCompletionRate);
        anomaliasDetectadas++;
      }

      // Anomalia 2: Pico no tempo de execuá§á£o
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

      // Anomalia 4: Comportamento atá­pico de funcioná¡rio
      const anomaliaEmployee = await this.detectEmployeeBehaviorAnomaly();
      if (anomaliaEmployee) {
        await this.saveAnomaly(anomaliaEmployee);
        anomaliasDetectadas++;
      }

      return anomaliasDetectadas;

    } catch (error) {
      console.error('Erro na detecá§á£o de anomalias:', error);
      return 0;
    }
  }

  /**
   * Detecta anomalia na taxa de conclusá£o
   */
  private async detectCompletionRateAnomaly(): Promise<AIAnomaly | null> {
    if (!this.config) return null;

    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Buscar má©tricas dos áºltimos 7 dias
    const { data: metrics } = await supabase
      .from('ai_metrics')
      .select('valor, data_referencia')
      .eq('bar_id', this.barId)
      .eq('nome_metrica', 'taxa_conclusao_checklists')
      .gte('data_referencia', sevenDaysAgo.toISOString().split('T')[0])
      .order('data_referencia', { ascending: true });

    if (!metrics || metrics.length < 3) return null;

    // Calcular má©dia e desvio padrá£o histá³rico
    const valores = metrics.slice(0, -1).map((m: any) => m.valor); // Excluir hoje
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const variance = valores.reduce((a, b) => a + Math.pow(b - media, 2), 0) / valores.length;
    const desvio = Math.sqrt(variance);

    const valorHoje = metrics[metrics.length - 1].valor;
    const limiteInferior = media - (this.config.sensibilidade_anomalias * desvio);

    // Se valor de hoje estiver muito abaixo da má©dia
    if (valorHoje < limiteInferior && desvio > 0) {
      const desvioPercentual = ((media - valorHoje) / media) * 100;

      return {
        tipo_anomalia: 'performance',
        subtipo: 'queda_produtividade',
        severidade: desvioPercentual > 30 ? 'alta' : 'media',
        titulo: 'Queda na Taxa de Conclusá£o de Checklists',
        descricao: `A taxa de conclusá£o hoje (${valorHoje.toFixed(1)}%) está¡ significativamente abaixo da má©dia histá³rica (${media.toFixed(1)}%)`,
        valor_esperado: media,
        valor_observado: valorHoje,
        desvio_percentual: desvioPercentual,
        confianca_deteccao: 85,
        possivel_causa: 'Possá­veis causas: sobrecarga de trabalho, problemas tá©cnicos, falta de treinamento ou desmotivaá§á£o da equipe',
        impacto_estimado: 'Pode impactar negativamente a qualidade do serviá§o e satisfaá§á£o dos clientes',
        acoes_sugeridas: [
          'Verificar carga de trabalho dos funcioná¡rios',
          'Revisar processos e identificar gargalos',
          'Providenciar treinamento adicional se necessá¡rio',
          'Investigar problemas tá©cnicos no sistema'
        ],
        metricas_anomala: {
          valor_atual: valorHoje,
          media_historica: media,
          desvio_padrao: desvio,
          limite_inferior: limiteInferior,
          dias_analisados: valores.length
        }
      };
    }

    return null;
  }

  /**
   * Detecta anomalia no tempo de execuá§á£o
   */
  private async detectExecutionTimeAnomaly(): Promise<AIAnomaly | null> {
    if (!this.config) return null;

    const { data: metrics } = await supabase
      .from('ai_metrics')
      .select('valor, data_referencia')
      .eq('bar_id', this.barId)
      .eq('nome_metrica', 'tempo_medio_execucao')
      .gte('data_referencia', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('data_referencia', { ascending: true });

    if (!metrics || metrics.length < 3) return null;

    const valores = metrics.slice(0, -1).map((m: any) => m.valor);
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const variance = valores.reduce((a, b) => a + Math.pow(b - media, 2), 0) / valores.length;
    const desvio = Math.sqrt(variance);

    const valorHoje = metrics[metrics.length - 1].valor;
    const limiteSuperior = media + (this.config.sensibilidade_anomalias * desvio);

    if (valorHoje > limiteSuperior && desvio > 0) {
      const desvioPercentual = ((valorHoje - media) / media) * 100;

      return {
        tipo_anomalia: 'performance',
        subtipo: 'aumento_tempo_execucao',
        severidade: desvioPercentual > 50 ? 'alta' : 'media',
        titulo: 'Aumento no Tempo de Execuá§á£o',
        descricao: `O tempo má©dio de execuá§á£o hoje (${valorHoje.toFixed(1)} min) está¡ muito acima da má©dia histá³rica (${media.toFixed(1)} min)`,
        valor_esperado: media,
        valor_observado: valorHoje,
        desvio_percentual: desvioPercentual,
        confianca_deteccao: 80,
        possivel_causa: 'Possá­veis causas: processos complexos, falta de treinamento, problemas tá©cnicos ou procedimentos inadequados',
        impacto_estimado: 'Reduá§á£o da eficiáªncia operacional e possá­vel impacto na experiáªncia do cliente',
        acoes_sugeridas: [
          'Revisar e simplificar processos complexos',
          'Verificar se há¡ gargalos tá©cnicos',
          'Providenciar treinamento para acelerar execuá§á£o',
          'Analisar checklists com maior tempo de execuá§á£o'
        ],
        metricas_anomala: {
          valor_atual: valorHoje,
          media_historica: media,
          desvio_padrao: desvio,
          limite_superior: limiteSuperior,
          dias_analisados: valores.length
        }
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
      .gte('data_referencia', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('data_referencia', { ascending: true });

    if (!metrics || metrics.length < 3) return null;

    const valores = metrics.slice(0, -1).map((m: any) => m.valor);
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const variance = valores.reduce((a, b) => a + Math.pow(b - media, 2), 0) / valores.length;
    const desvio = Math.sqrt(variance);

    const valorHoje = metrics[metrics.length - 1].valor;
    const limiteInferior = media - (this.config.sensibilidade_anomalias * desvio);

    if (valorHoje < limiteInferior && desvio > 0) {
      const desvioPercentual = ((media - valorHoje) / media) * 100;

      return {
        tipo_anomalia: 'qualidade',
        subtipo: 'queda_qualidade',
        severidade: valorHoje < 70 ? 'critica' : (desvioPercentual > 15 ? 'alta' : 'media'),
        titulo: 'Queda na Qualidade dos Checklists',
        descricao: `O score má©dio de qualidade hoje (${valorHoje.toFixed(1)}%) está¡ abaixo da má©dia histá³rica (${media.toFixed(1)}%)`,
        valor_esperado: media,
        valor_observado: valorHoje,
        desvio_percentual: desvioPercentual,
        confianca_deteccao: 90,
        possivel_causa: 'Possá­veis causas: pressa na execuá§á£o, falta de atená§á£o, treinamento inadequado ou problemas nos processos',
        impacto_estimado: 'Impacto direto na qualidade do serviá§o e satisfaá§á£o dos clientes',
        acoes_sugeridas: [
          'Revisar execuá§áµes com baixo score',
          'Providenciar feedback individual aos funcioná¡rios',
          'Reforá§ar treinamento em pontos crá­ticos',
          'Investigar se há¡ problemas nos checklists'
        ],
        metricas_anomala: {
          valor_atual: valorHoje,
          media_historica: media,
          desvio_padrao: desvio,
          limite_inferior: limiteInferior,
          dias_analisados: valores.length
        }
      };
    }

    return null;
  }

  /**
   * Detecta comportamento atá­pico de funcioná¡rio
   */
  private async detectEmployeeBehaviorAnomaly(): Promise<AIAnomaly | null> {
    const today = new Date().toISOString().split('T')[0];
    
    // Buscar produtividade por funcioná¡rio hoje
    const { data: todayMetric } = await supabase
      .from('ai_metrics')
      .select('detalhamento')
      .eq('bar_id', this.barId)
      .eq('nome_metrica', 'produtividade_funcionarios')
      .eq('data_referencia', today)
      .single();

    if (!todayMetric?.detalhamento?.breakdown_funcionarios) return null;

    const funcionariosHoje = todayMetric.detalhamento.breakdown_funcionarios;

    // Buscar histá³rico para comparaá§á£o
    const { data: historicMetrics } = await supabase
      .from('ai_metrics')
      .select('detalhamento')
      .eq('bar_id', this.barId)
      .eq('nome_metrica', 'produtividade_funcionarios')
      .gte('data_referencia', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .neq('data_referencia', today);

    if (!historicMetrics || historicMetrics.length < 3) return null;

    // Analisar cada funcioná¡rio
    for (const [funcionarioId, dadosHoje] of Object.entries(funcionariosHoje)) {
      const func = dadosHoje as any;
      
      if (func.total < 3) continue; // Pular funcioná¡rios com poucas execuá§áµes

      const taxaConclusaoHoje = (func.concluidos / func.total) * 100;
      const scoreHoje = func.concluidos > 0 ? func.score_total / func.concluidos : 0;

      // Calcular má©dias histá³ricas
      let taxasHistoricas: number[] = [];
      let scoresHistoricos: number[] = [];

      historicMetrics.forEach(metric => {
        const breakdown = metric.detalhamento?.breakdown_funcionarios;
        if (breakdown && breakdown[funcionarioId]) {
          const dadosHistoricos = breakdown[funcionarioId];
          if (dadosHistoricos.total >= 2) {
            taxasHistoricas.push((dadosHistoricos.concluidos / dadosHistoricos.total) * 100);
            if (dadosHistoricos.concluidos > 0) {
              scoresHistoricos.push(dadosHistoricos.score_total / dadosHistoricos.concluidos);
            }
          }
        }
      });

      if (taxasHistoricas.length < 3) continue;

      const mediaTaxa = taxasHistoricas.reduce((a, b) => a + b, 0) / taxasHistoricas.length;
      const mediaScore = scoresHistoricos.length > 0 ? scoresHistoricos.reduce((a, b) => a + b, 0) / scoresHistoricos.length : 0;

      // Detectar anomalias significativas
      const quedaTaxa = mediaTaxa - taxaConclusaoHoje;
      const quedaScore = mediaScore - scoreHoje;

      if (quedaTaxa > 30 || (quedaScore > 20 && scoreHoje < 70)) {
        return {
          tipo_anomalia: 'comportamento',
          subtipo: 'performance_funcionario',
          severidade: (quedaTaxa > 50 || scoreHoje < 60) ? 'alta' : 'media',
          objeto_id: parseInt(funcionarioId),
          objeto_tipo: 'funcionario',
          objeto_nome: func.nome,
          titulo: `Queda de Performance: ${func.nome}`,
          descricao: `${func.nome} apresenta queda significativa na performance: taxa de conclusá£o hoje ${taxaConclusaoHoje.toFixed(1)}% vs má©dia ${mediaTaxa.toFixed(1)}%`,
          valor_esperado: mediaTaxa,
          valor_observado: taxaConclusaoHoje,
          desvio_percentual: (quedaTaxa / mediaTaxa) * 100,
          confianca_deteccao: 75,
          possivel_causa: 'Possá­veis causas: problemas pessoais, desmotivaá§á£o, sobrecarga, falta de treinamento ou questáµes tá©cnicas',
          impacto_estimado: 'Impacto na produtividade da equipe e qualidade do serviá§o',
          acoes_sugeridas: [
            'Conversar individualmente com o funcioná¡rio',
            'Verificar carga de trabalho e distribuiá§á£o de tarefas',
            'Oferecer suporte ou treinamento adicional',
            'Investigar possá­veis problemas pessoais ou tá©cnicos'
          ],
          metricas_anomala: {
            taxa_conclusao_hoje: taxaConclusaoHoje,
            taxa_conclusao_media: mediaTaxa,
            score_hoje: scoreHoje,
            score_medio: mediaScore,
            total_execucoes_hoje: func.total,
            total_concluidas_hoje: func.concluidos,
            dias_analisados: taxasHistoricas.length
          }
        };
      }
    }

    return null;
  }

  // ========================================
  // ðŸ”§ Má‰TODOS AUXILIARES
  // ========================================

  /**
   * Verifica se está¡ no horá¡rio de funcionamento
   */
  private isWithinWorkingHours(): boolean {
    if (!this.config) return false;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    return currentTime >= this.config.horario_analise_inicio && 
           currentTime <= this.config.horario_analise_fim;
  }

  /**
   * Salva má©trica no banco
   */
  private async saveMetric(metric: any): Promise<void> {
    await supabase
      .from('ai_metrics')
      .insert({
        bar_id: this.barId,
        ...metric,
        frequencia_calculo: 'diaria',
        ativa: true
      });
  }

  /**
   * Salva anomalia no banco
   */
  private async saveAnomaly(anomaly: AIAnomaly): Promise<void> {
    await supabase
      .from('ai_anomalies')
      .insert({
        bar_id: this.barId,
        data_inicio: new Date().toISOString(),
        ...anomaly
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
        nome_processo: `Aná¡lise IA Automá¡tica - ${tipo}`,
        status: 'processando'
      })
      .select('id')
      .single();

    return data?.id;
  }

  /**
   * Completa log de processo
   */
  private async completeProcessLog(logId: number, status: string, dados: any = {}): Promise<void> {
    await supabase
      .from('ai_agent_logs')
      .update({
        status,
        data_fim: new Date().toISOString(),
        ...dados
      })
      .eq('id', logId);
  }

  /**
   * Log simples de processo
   */
  private async logProcess(tipo: string, nome: string, status: string, erro?: string): Promise<void> {
    await supabase
      .from('ai_agent_logs')
      .insert({
        bar_id: this.barId,
        tipo_processamento: tipo,
        nome_processo: nome,
        status,
        data_inicio: new Date().toISOString(),
        data_fim: new Date().toISOString(),
        erro_detalhes: erro
      });
  }

  /**
   * Envia notificaá§áµes de IA
   */
  private async sendAINotifications(): Promise<void> {
    if (!this.config?.notificar_insights && !this.config?.notificar_anomalias) {
      return;
    }

    // Buscar anomalias crá­ticas ná£o notificadas
    if (this.config.notificar_anomalias) {
      const { data: anomalias } = await supabase
        .from('ai_anomalies')
        .select('*')
        .eq('bar_id', this.barId)
        .eq('severidade', 'critica')
        .eq('ainda_ativa', true)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // ášltima hora

      if (anomalias && anomalias.length > 0) {
        const notificationService = createEnhancedNotificationService(this.barId);
        
        for (const anomalia of anomalias) {
          // ðŸŽ® ENVIAR PARA DISCORD
          try {
            await sgbDiscordService.enviarAlertaAnomalia(anomalia);
            console.log(`ðŸ“¨ Anomalia crá­tica enviada para Discord: ${anomalia.titulo}`);
          } catch (error) {
            console.error('Erro ao enviar anomalia para Discord:', error);
          }

          // Notificar admins sobre anomalias crá­ticas
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
                titulo: `ðŸš¨ Anomalia Crá­tica Detectada`,
                conteudo: anomalia.descricao,
                tipo: 'anomalia_critica',
                modulo: 'ai_analytics',
                prioridade: 'alta',
                canais: {
                  browser: true,
                  whatsapp: true,
                  email: false,
                  sms: false
                },
                url_acao: `/admin/analytics/anomalias/${anomalia.id}`
              });
            }
          }
        }
      }
    }
  }

  /**
   * ðŸŒ… Enviar relatá³rio matinal á s 8h
   */
  private async enviarRelatorioMatinal(): Promise<void> {
    try {
      console.log('ðŸŒ… Enviando relatá³rio matinal para Discord...');

      // Buscar dados do dashboard
      const { data: dashboardData } = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/dashboard?periodo_dias=1`, {
        headers: {
          'x-user-data': JSON.stringify({
            bar_id: this.barId,
            permissao: 'admin',
            usuario_id: 1
          })
        }
      }).then(res => res.json());

      if (dashboardData && dashboardData.success) {
        // Enviar para Discord
        const sucesso = await sgbDiscordService.enviarRelatorioMatinal(dashboardData.data);
        
        if (sucesso) {
          console.log('œ… Relatá³rio matinal enviado com sucesso para Discord!');
          
          // Log da aá§á£o
          await this.logProcess(
            'relatorio_discord',
            'Relatá³rio Matinal Enviado',
            'concluido'
          );
        } else {
          console.error('Œ Erro ao enviar relatá³rio matinal para Discord');
        }
      }

    } catch (error: any) {
      console.error('Erro ao enviar relatá³rio matinal:', error);
      await this.logProcess(
        'relatorio_discord',
        'Erro no Relatá³rio Matinal',
        'erro',
        error.message || String(error)
      );
    }
  }

  /**
   * ðŸ“‹ Enviar relatá³rio matinal de checklists á s 8h
   */
  private async enviarRelatorioChecklistMatinal(): Promise<void> {
    try {
      console.log('ðŸ“‹ Gerando relatá³rio matinal de checklists...')

      // Buscar estatá­sticas de ontem
      const ontem = new Date()
      ontem.setDate(ontem.getDate() - 1)
      const dataOntem = ontem.toISOString().split('T')[0]

      // Buscar execuá§áµes de ontem
      const { data: execucoes } = await supabase
        .from('checklist_execucoes')
        .select('status, tempo_execucao_minutos, score_final')
        .eq('bar_id', this.barId)
        .gte('created_at', `${dataOntem}T00:00:00Z`)
        .lt('created_at', `${dataOntem}T23:59:59Z`)

      // Buscar alertas ativos agora
      const { data: alertasData } = await fetch('/api/checklists/alerts')
        .then(res => res.json())
        .catch(() => ({ alerts: [] }))

      const totalExecucoes = execucoes?.length || 0
      const execucoesConcluidas = execucoes?.filter((e: any) => e.status === 'concluido').length || 0
      const execucoesPendentes = totalExecucoes - execucoesConcluidas

      const temposExecucao = execucoes?.filter((e: any) => e.tempo_execucao_minutos).map((e: any) => e.tempo_execucao_minutos) || []
      const tempoMedio = temposExecucao.length > 0 ? temposExecucao.reduce((a, b) => a + b, 0) / temposExecucao.length : 0

      const scores = execucoes?.filter((e: any) => e.score_final).map((e: any) => e.score_final) || []
      const scoreMedio = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

      const alertasAtivos = alertasData?.alerts?.length || 0
      const alertasCriticos = alertasData?.alerts?.filter((a: any) => a.nivel === 'critico').length || 0

      const checklistStats = {
        total_execucoes: totalExecucoes,
        execucoes_concluidas: execucoesConcluidas,
        execucoes_pendentes: execucoesPendentes,
        tempo_medio_execucao: tempoMedio,
        score_medio: scoreMedio,
        alertas_ativos: alertasAtivos,
        alertas_criticos: alertasCriticos
      }

      // Enviar para Discord
      await DiscordChecklistService.sendDailyReport(checklistStats)
      console.log('œ… Relatá³rio matinal de checklists enviado para Discord')

      // Log da aá§á£o
      await this.logProcess(
        'relatorio_checklist',
        'Relatá³rio Checklist Matinal Enviado',
        'concluido'
      )

    } catch (error: any) {
      console.error('Œ Erro ao enviar relatá³rio matinal de checklists:', error)
      await this.logProcess(
        'relatorio_checklist',
        'Erro no Relatá³rio Checklist Matinal',
        'erro',
        error.message || String(error)
      )
    }
  }

  /**
   * ðŸ“± Enviar relatá³rio matinal de marketing á s 8h
   */
  private async enviarRelatorioMarketingMatinal(): Promise<void> {
    try {
      console.log('ðŸ“± Enviando relatá³rio matinal de marketing...');

      // Buscar má©tricas sociais de hoje
      const today = new Date().toISOString().split('T')[0];
      
      const { data: socialMetrics } = await supabase
        .from('social_metrics_consolidated')
        .select('*')
        .eq('bar_id', this.barId)
        .eq('data_referencia', today)
        .eq('periodo', 'daily')
        .single();

      // Buscar má©tricas de ontem para comparaá§á£o
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
          ? ((socialMetrics.facebook_followers - yesterdayMetrics.facebook_followers) / yesterdayMetrics.facebook_followers) * 100
          : 0;
        
        const instagramGrowth = yesterdayMetrics
          ? ((socialMetrics.instagram_followers - yesterdayMetrics.instagram_followers) / yesterdayMetrics.instagram_followers) * 100
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

        // Preparar dados para o relatá³rio
        const marketingData = {
          facebook: {
            followers: socialMetrics.facebook_followers,
            reach: socialMetrics.facebook_reach,
            engagement: socialMetrics.facebook_engagement,
            posts_today: facebookPosts?.length || 0,
            growth_rate: facebookGrowth,
            best_post_reach: facebookPosts?.[0]?.reach || 0
          },
          instagram: {
            followers: socialMetrics.instagram_followers,
            reach: socialMetrics.instagram_reach,
            engagement: socialMetrics.instagram_engagement,
            posts_today: instagramPosts?.length || 0,
            growth_rate: instagramGrowth,
            best_post_reach: instagramPosts?.[0]?.reach || 0
          },
          overall: {
            total_followers: socialMetrics.total_followers,
            total_reach: socialMetrics.total_reach,
            total_engagement: socialMetrics.total_engagement,
            engagement_rate: socialMetrics.engagement_rate_geral,
            best_performing_platform: socialMetrics.facebook_engagement > socialMetrics.instagram_engagement ? 'facebook' : 'instagram'
          }
        };

        // Enviar para Discord Marketing
        const sucesso = await notifyMarketingUpdate('relatorio', { metrics: marketingData });
        
        if (sucesso) {
          console.log('œ… Relatá³rio matinal de marketing enviado com sucesso!');
          
          // Log da aá§á£o
          await this.logProcess(
            'relatorio_marketing',
            'Relatá³rio Marketing Matinal Enviado',
            'concluido'
          );
        } else {
          console.error('Œ Erro ao enviar relatá³rio matinal de marketing');
        }
      } else {
        console.log('ðŸ“± Nenhuma má©trica social encontrada para hoje - pulando relatá³rio marketing');
      }

    } catch (error: any) {
      console.error('Erro ao enviar relatá³rio matinal de marketing:', error);
      await this.logProcess(
        'relatorio_marketing',
        'Erro no Relatá³rio Marketing Matinal',
        'erro',
        error.message || String(error)
      );
    }
  }

  // ========================================
  // ðŸ’¡ GERAá‡áƒO DE INSIGHTS (PLACEHOLDER)
  // ========================================

  private async generateInsights(): Promise<number> {
    // TODO: Implementar geraá§á£o de insights inteligentes
    return 0;
  }

  private async generatePredictions(): Promise<number> {
    // TODO: Implementar previsáµes de ML
    return 0;
  }

  private async generateRecommendations(): Promise<number> {
    // TODO: Implementar recomendaá§áµes inteligentes
    return 0;
  }
}

// ========================================
// ðŸš€ FACTORY E MANAGER DE AGENTES
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
      return true; // Já¡ está¡ rodando
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
      running: true
    }));
  }
}

// Instá¢ncia global do manager
export const aiAgentManager = new AIAgentManager();

/**
 * Funá§á£o para iniciar agente IA
 */
export async function startAIAgent(barId: number): Promise<boolean> {
  return aiAgentManager.startAgent(barId);
}

/**
 * Funá§á£o para parar agente IA
 */
export function stopAIAgent(barId: number): void {
  aiAgentManager.stopAgent(barId);
} 
