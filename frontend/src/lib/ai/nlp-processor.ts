// Sistema de Processamento de Linguagem Natural para Zykor AI
import { zykorAI, type AIResponse, type AIAnalysisResult } from './setup';

// Tipos para análise de consultas
export interface QueryAnalysis {
  intent: QueryIntent;
  entities: ExtractedEntity[];
  timeRange: TimeRange | null;
  metrics: string[];
  confidence: number;
  complexity: 'simple' | 'medium' | 'complex';
  requiresData: boolean;
}

export interface QueryIntent {
  type: 'analysis' | 'comparison' | 'trend' | 'forecast' | 'summary' | 'recommendation' | 'question';
  category: 'sales' | 'customers' | 'events' | 'employees' | 'financial' | 'general' | 'operations';
  action: string;
  confidence: number;
}

export interface ExtractedEntity {
  type: 'date' | 'metric' | 'location' | 'person' | 'product' | 'event' | 'number';
  value: string;
  normalized: any;
  position: [number, number];
  confidence: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  relative: boolean; // ex: "semana passada" vs "01/01/2024"
}

// Padrões de consulta em português
const INTENT_PATTERNS = {
  analysis: [
    /como (está|estão|foi|foram) (o|a|os|as) (.+)/i,
    /qual (é|foi|são|foram) (o|a|os|as) (.+)/i,
    /analise? (.+)/i,
    /mostre? (.+)/i,
    /veja? (.+)/i
  ],
  comparison: [
    /compar(e|a|ar) (.+) com (.+)/i,
    /diferença entre (.+) e (.+)/i,
    /(.+) versus (.+)/i,
    /(.+) vs (.+)/i,
    /(.+) comparado com (.+)/i
  ],
  trend: [
    /tendência d(e|o|a|os|as) (.+)/i,
    /crescimento d(e|o|a|os|as) (.+)/i,
    /evolução d(e|o|a|os|as) (.+)/i,
    /como (.+) evoluiu/i,
    /(.+) ao longo do? (.+)/i
  ],
  forecast: [
    /previsão d(e|o|a|os|as) (.+)/i,
    /projeção d(e|o|a|os|as) (.+)/i,
    /estimativa d(e|o|a|os|as) (.+)/i,
    /quanto (.+) vai ser/i,
    /prever (.+)/i
  ],
  summary: [
    /resumo d(e|o|a|os|as) (.+)/i,
    /sumário d(e|o|a|os|as) (.+)/i,
    /visão geral d(e|o|a|os|as) (.+)/i,
    /panorama d(e|o|a|os|as) (.+)/i
  ],
  recommendation: [
    /recomend(e|a|ação|ações) (.+)/i,
    /sugest(ão|ões) (.+)/i,
    /o que devo (.+)/i,
    /como melhorar (.+)/i,
    /estratégia para (.+)/i
  ]
};

const CATEGORY_PATTERNS = {
  sales: [
    /venda(s)?/i, /faturamento/i, /receita/i, /ticket médio/i, /vendeu/i,
    /facturamento/i, /arrecadação/i, /lucro/i, /margem/i
  ],
  customers: [
    /cliente(s)?/i, /consumidor(es)?/i, /público/i, /frequentador(es)?/i,
    /visitante(s)?/i, /pessoa(s)?/i, /fidelização/i, /retenção/i
  ],
  events: [
    /evento(s)?/i, /festa(s)?/i, /show(s)?/i, /apresentação/i, /noite(s)?/i,
    /balada/i, /programação/i, /atração/i, /espetáculo/i
  ],
  employees: [
    /funcionário(s)?/i, /colaborador(es)?/i, /equipe/i, /staff/i, /pessoal/i,
    /empregado(s)?/i, /trabalhador(es)?/i, /garçom/i, /bartender/i
  ],
  financial: [
    /financeiro/i, /custo(s)?/i, /despesa(s)?/i, /gasto(s)?/i, /orçamento/i,
    /balanço/i, /fluxo de caixa/i, /pagamento(s)?/i, /conta(s)?/i
  ],
  operations: [
    /operação/i, /operacional/i, /processo(s)?/i, /checklist/i, /rotina/i,
    /procedimento(s)?/i, /tarefa(s)?/i, /atividade(s)?/i
  ]
};

const METRIC_PATTERNS = {
  revenue: /faturamento|receita|arrecadação|vendas?/i,
  customers: /clientes?|pessoas?|visitantes?/i,
  events: /eventos?|festas?|shows?/i,
  ticket_medio: /ticket médio|valor médio|gasto médio/i,
  growth: /crescimento|aumento|evolução/i,
  conversion: /conversão|taxa de conversão/i,
  retention: /retenção|fidelização|retorno/i,
  satisfaction: /satisfação|avaliação|nota/i
};

const TIME_PATTERNS = {
  today: /hoje|neste dia/i,
  yesterday: /ontem|dia anterior/i,
  this_week: /esta semana|semana atual/i,
  last_week: /semana passada|última semana/i,
  this_month: /este mês|mês atual/i,
  last_month: /mês passado|último mês/i,
  this_quarter: /este trimestre|trimestre atual/i,
  last_quarter: /trimestre passado|último trimestre/i,
  this_year: /este ano|ano atual/i,
  last_year: /ano passado|último ano/i,
  last_7_days: /últimos? 7 dias?|última semana/i,
  last_30_days: /últimos? 30 dias?|último mês/i,
  last_90_days: /últimos? 90 dias?|último trimestre/i,
  // Datas específicas
  date_range: /de (.+) até (.+)|entre (.+) e (.+)/i,
  specific_date: /em (\d{1,2}\/\d{1,2}\/\d{4})/i,
  weekday: /(segunda|terça|quarta|quinta|sexta|sábado|domingo)/i
};

export class NLPProcessor {
  // Analisar consulta do usuário
  analyzeQuery(query: string): QueryAnalysis {
    const normalizedQuery = this.normalizeQuery(query);
    
    // Extrair intenção
    const intent = this.extractIntent(normalizedQuery);
    
    // Extrair entidades
    const entities = this.extractEntities(normalizedQuery);
    
    // Extrair período temporal
    const timeRange = this.extractTimeRange(normalizedQuery);
    
    // Extrair métricas
    const metrics = this.extractMetrics(normalizedQuery);
    
    // Calcular complexidade
    const complexity = this.calculateComplexity(intent, entities, timeRange, metrics);
    
    // Verificar se requer dados
    const requiresData = this.requiresDataAccess(intent, entities);
    
    // Calcular confiança geral
    const confidence = this.calculateOverallConfidence(intent, entities, timeRange);

    return {
      intent,
      entities,
      timeRange,
      metrics,
      confidence,
      complexity,
      requiresData
    };
  }

  // Processar consulta com contexto de dados
  async processQueryWithContext(
    query: string, 
    dataContext: Record<string, any> = {}
  ): Promise<AIAnalysisResult> {
    // Analisar consulta
    const analysis = this.analyzeQuery(query);
    
    // Construir prompt otimizado
    const systemPrompt = this.buildSystemPrompt(analysis);
    
    // Adicionar contexto de dados específicos
    const enhancedContext = {
      ...dataContext,
      queryAnalysis: analysis,
      availableMetrics: this.getAvailableMetrics(),
      businessContext: this.getBusinessContext()
    };

    // Processar com IA
    const aiResponse = await zykorAI.processQuery(
      this.buildOptimizedQuery(query, analysis),
      enhancedContext,
      systemPrompt
    );

    // Estruturar resposta
    return this.structureAnalysisResult(aiResponse, analysis);
  }

  // Normalizar consulta
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[.,!?;]+/g, ' ')
      .replace(/\s+/g, ' ');
  }

  // Extrair intenção da consulta
  private extractIntent(query: string): QueryIntent {
    let bestMatch: QueryIntent = {
      type: 'question',
      category: 'general',
      action: 'answer',
      confidence: 0.3
    };

    // Verificar padrões de intenção
    for (const [intentType, patterns] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          const confidence = 0.8;
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              type: intentType as any,
              category: this.extractCategory(query),
              action: this.extractAction(query, intentType),
              confidence
            };
          }
        }
      }
    }

    return bestMatch;
  }

  // Extrair categoria
  private extractCategory(query: string): QueryIntent['category'] {
    let bestCategory: QueryIntent['category'] = 'general';
    let bestScore = 0;

    for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          const score = 1;
          if (score > bestScore) {
            bestScore = score;
            bestCategory = category as QueryIntent['category'];
          }
        }
      }
    }

    return bestCategory;
  }

  // Extrair ação
  private extractAction(query: string, intentType: string): string {
    // Simplificado - extrair verbo principal
    const verbs = query.match(/\b(analise?|compare?|mostre?|calcule?|veja?|explique?)\b/i);
    return verbs ? verbs[1] : intentType;
  }

  // Extrair entidades
  private extractEntities(query: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Números
    const numbers = [...query.matchAll(/\b(\d+(?:\.\d+)?)\b/g)];
    for (const match of numbers) {
      entities.push({
        type: 'number',
        value: match[1],
        normalized: parseFloat(match[1]),
        position: [match.index!, match.index! + match[1].length],
        confidence: 0.9
      });
    }

    // Datas
    const dates = [...query.matchAll(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g)];
    for (const match of dates) {
      entities.push({
        type: 'date',
        value: match[1],
        normalized: new Date(match[1].split('/').reverse().join('-')),
        position: [match.index!, match.index! + match[1].length],
        confidence: 0.95
      });
    }

    // Métricas
    for (const [metric, pattern] of Object.entries(METRIC_PATTERNS)) {
      const match = query.match(pattern);
      if (match) {
        entities.push({
          type: 'metric',
          value: match[0],
          normalized: metric,
          position: [match.index!, match.index! + match[0].length],
          confidence: 0.8
        });
      }
    }

    return entities;
  }

  // Extrair período temporal
  private extractTimeRange(query: string): TimeRange | null {
    for (const [period, pattern] of Object.entries(TIME_PATTERNS)) {
      const match = query.match(pattern);
      if (match) {
        return this.convertToTimeRange(period, match);
      }
    }
    return null;
  }

  // Converter padrão temporal para TimeRange
  private convertToTimeRange(period: string, match: RegExpMatchArray): TimeRange {
    const now = new Date();
    let start: Date, end: Date;

    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        return { start, end, period: 'day', relative: true };

      case 'yesterday':
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        return { start, end, period: 'day', relative: true };

      case 'this_week':
        const dayOfWeek = now.getDay();
        start = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
        return { start, end, period: 'week', relative: true };

      case 'last_week':
        const lastWeekEnd = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
        const lastWeekStart = new Date(lastWeekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { start: lastWeekStart, end: lastWeekEnd, period: 'week', relative: true };

      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return { start, end, period: 'month', relative: true };

      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start, end, period: 'month', relative: true };

      default:
        // Período padrão de 30 dias
        end = now;
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { start, end, period: 'month', relative: true };
    }
  }

  // Extrair métricas mencionadas
  private extractMetrics(query: string): string[] {
    const metrics: string[] = [];
    
    for (const [metric, pattern] of Object.entries(METRIC_PATTERNS)) {
      if (pattern.test(query)) {
        metrics.push(metric);
      }
    }

    return metrics;
  }

  // Calcular complexidade da consulta
  private calculateComplexity(
    intent: QueryIntent,
    entities: ExtractedEntity[],
    timeRange: TimeRange | null,
    metrics: string[]
  ): 'simple' | 'medium' | 'complex' {
    let complexity = 0;

    // Tipo de intenção
    if (['comparison', 'trend', 'forecast'].includes(intent.type)) {
      complexity += 2;
    } else if (['analysis', 'recommendation'].includes(intent.type)) {
      complexity += 1;
    }

    // Número de entidades
    complexity += entities.length * 0.5;

    // Múltiplas métricas
    if (metrics.length > 2) complexity += 1;

    // Período temporal complexo
    if (timeRange && !timeRange.relative) complexity += 1;

    if (complexity <= 1) return 'simple';
    if (complexity <= 3) return 'medium';
    return 'complex';
  }

  // Verificar se requer acesso a dados
  private requiresDataAccess(intent: QueryIntent, entities: ExtractedEntity[]): boolean {
    // Análises, comparações e tendências sempre precisam de dados
    if (['analysis', 'comparison', 'trend', 'forecast'].includes(intent.type)) {
      return true;
    }

    // Se menciona métricas específicas
    if (entities.some(e => e.type === 'metric')) {
      return true;
    }

    // Se é sobre categorias específicas de negócio
    if (['sales', 'customers', 'events', 'financial'].includes(intent.category)) {
      return true;
    }

    return false;
  }

  // Calcular confiança geral
  private calculateOverallConfidence(
    intent: QueryIntent,
    entities: ExtractedEntity[],
    timeRange: TimeRange | null
  ): number {
    let confidence = intent.confidence;

    // Entidades identificadas aumentam confiança
    if (entities.length > 0) {
      const avgEntityConfidence = entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
      confidence = (confidence + avgEntityConfidence) / 2;
    }

    // Período temporal identificado aumenta confiança
    if (timeRange) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  // Construir prompt do sistema otimizado
  private buildSystemPrompt(analysis: QueryAnalysis): string {
    const prompts = [];

    prompts.push("Você é o Zykor AI Assistant, especialista em análise de dados para gestão de bares e casas noturnas.");
    
    if (analysis.intent.category !== 'general') {
      prompts.push(`Esta consulta é sobre ${analysis.intent.category}. Foque neste domínio.`);
    }

    if (analysis.intent.type === 'analysis') {
      prompts.push("Forneça uma análise detalhada com insights, números e recomendações práticas.");
    } else if (analysis.intent.type === 'comparison') {
      prompts.push("Compare os dados de forma clara, destacando diferenças e padrões significativos.");
    } else if (analysis.intent.type === 'trend') {
      prompts.push("Identifique tendências, padrões temporais e projeções baseadas nos dados históricos.");
    } else if (analysis.intent.type === 'forecast') {
      prompts.push("Faça previsões baseadas em dados históricos e tendências identificadas.");
    } else if (analysis.intent.type === 'recommendation') {
      prompts.push("Forneça recomendações específicas e acionáveis para melhorar o negócio.");
    }

    prompts.push("Sempre inclua números específicos quando disponíveis.");
    prompts.push("Estruture a resposta de forma clara com insights, métricas e recomendações.");
    prompts.push("Use linguagem direta e profissional, focada em resultados de negócio.");

    return prompts.join(' ');
  }

  // Construir consulta otimizada
  private buildOptimizedQuery(originalQuery: string, analysis: QueryAnalysis): string {
    let optimizedQuery = originalQuery;

    // Adicionar contexto temporal se não especificado
    if (!analysis.timeRange) {
      optimizedQuery += " (considerando os últimos 30 dias)";
    }

    // Adicionar especificação de métricas se vaga
    if (analysis.metrics.length === 0 && analysis.requiresData) {
      optimizedQuery += " incluindo métricas de vendas, clientes e performance";
    }

    return optimizedQuery;
  }

  // Estruturar resultado da análise
  private structureAnalysisResult(aiResponse: AIResponse, analysis: QueryAnalysis): AIAnalysisResult {
    const content = aiResponse.content;
    
    // Extrair summary (primeiro parágrafo)
    const paragraphs = content.split('\n\n');
    const summary = paragraphs[0] || content.substring(0, 200);

    // Extrair insights (procurar por listas ou seções)
    const insights = this.extractBulletPoints(content, ['insight', 'observação', 'destaque']);

    // Extrair recomendações
    const recommendations = this.extractBulletPoints(content, ['recomend', 'sugest', 'deve', 'implement']);

    // Extrair métricas mencionadas
    const metrics = this.extractMetricsFromText(content);

    return {
      summary,
      insights: insights.length > 0 ? insights : [summary],
      recommendations: recommendations.length > 0 ? recommendations : [],
      metrics,
      confidence: (aiResponse.confidence + analysis.confidence) / 2,
      sources: ['zykor_database', 'ai_analysis'],
      charts: this.suggestCharts(analysis, metrics)
    };
  }

  // Extrair pontos de lista do texto
  private extractBulletPoints(text: string, keywords: string[]): string[] {
    const lines = text.split('\n');
    const points: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Linhas que começam com marcadores
      if (/^[-•*]\s/.test(trimmed)) {
        points.push(trimmed.substring(2).trim());
      }
      
      // Linhas numeradas
      else if (/^\d+\.\s/.test(trimmed)) {
        points.push(trimmed.replace(/^\d+\.\s/, '').trim());
      }
      
      // Linhas que contêm palavras-chave
      else if (keywords.some(keyword => trimmed.toLowerCase().includes(keyword))) {
        points.push(trimmed);
      }
    }

    return points;
  }

  // Extrair métricas do texto
  private extractMetricsFromText(text: string): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    // Procurar por padrões de número + unidade/descrição
    const patterns = [
      /(\d+(?:\.\d+)?)\s*%/g, // Percentuais
      /R\$\s*(\d+(?:\.\d+)?)/g, // Valores em reais
      /(\d+(?:\.\d+)?)\s*(clientes?|pessoas?|visitantes?)/gi,
      /(\d+(?:\.\d+)?)\s*(vendas?|eventos?|dias?)/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const value = parseFloat(match[1]);
        const description = match[2] || 'valor';
        metrics[description.toLowerCase()] = value;
      }
    }

    return metrics;
  }

  // Sugerir tipos de gráfico baseado na análise
  private suggestCharts(analysis: QueryAnalysis, metrics: Record<string, number>): AIAnalysisResult['charts'] {
    const charts: NonNullable<AIAnalysisResult['charts']> = [];

    if (analysis.intent.type === 'trend' && analysis.timeRange) {
      charts.push({
        type: 'line',
        data: [],
        labels: ['Tendência temporal']
      });
    }

    if (analysis.intent.type === 'comparison') {
      charts.push({
        type: 'bar',
        data: [],
        labels: ['Comparação']
      });
    }

    if (Object.keys(metrics).length > 3) {
      charts.push({
        type: 'pie',
        data: Object.values(metrics),
        labels: Object.keys(metrics)
      });
    }

    return charts.length > 0 ? charts : undefined;
  }

  // Obter métricas disponíveis
  private getAvailableMetrics(): string[] {
    return [
      'faturamento', 'vendas', 'clientes', 'ticket_medio', 'eventos',
      'crescimento', 'conversao', 'retencao', 'satisfacao'
    ];
  }

  // Obter contexto de negócio
  private getBusinessContext(): Record<string, any> {
    return {
      businessType: 'bar_restaurant',
      industry: 'food_beverage',
      metrics: this.getAvailableMetrics(),
      timezone: 'America/Sao_Paulo',
      currency: 'BRL'
    };
  }
}

// Instância global
export const nlpProcessor = new NLPProcessor();

// Hook para React
export const useNLP = () => {
  return {
    analyzeQuery: nlpProcessor.analyzeQuery.bind(nlpProcessor),
    processQueryWithContext: nlpProcessor.processQueryWithContext.bind(nlpProcessor)
  };
};
