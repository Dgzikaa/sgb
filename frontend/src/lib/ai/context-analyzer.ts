// Sistema de Análise Contextual de Dados para Zykor AI
export interface BusinessContext {
  barInfo: {
    id: string;
    name: string;
    type: 'bar' | 'restaurant' | 'nightclub' | 'pub' | 'brewery';
    location: string;
    capacity: number;
    openingDays: string[];
    peakHours: { start: string; end: string };
  };
  currentPeriod: {
    date: Date;
    dayOfWeek: string;
    isWeekend: boolean;
    isHoliday: boolean;
    season: 'summer' | 'autumn' | 'winter' | 'spring';
    isEventDay: boolean;
  };
  historicalBaseline: {
    averageDailySales: number;
    averageCustomerCount: number;
    averageTicket: number;
    seasonalityFactors: Record<string, number>;
    eventImpactFactors: Record<string, number>;
  };
}

export interface DataPoint {
  timestamp: Date;
  metric: string;
  value: number;
  category: string;
  metadata?: Record<string, any>;
}

export interface AnalysisInsight {
  type: 'trend' | 'anomaly' | 'pattern' | 'correlation' | 'forecast';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  recommendation?: string;
  data: {
    current: number;
    baseline: number;
    change: number;
    changePercent: number;
  };
  timeframe: string;
}

export interface ContextualAnalysis {
  insights: AnalysisInsight[];
  summary: string;
  kpis: {
    performance: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
    trend: 'improving' | 'stable' | 'declining';
    predictedOutcome: string;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  riskFactors: string[];
  opportunities: string[];
}

export class ContextAnalyzer {
  private businessContext: BusinessContext | null = null;
  private dataHistory: DataPoint[] = [];
  private patterns: Map<string, any> = new Map();

  // Configurar contexto de negócio
  setBusinessContext(context: BusinessContext): void {
    this.businessContext = context;
    console.log(`📊 Contexto definido para: ${context.barInfo.name}`);
  }

  // Adicionar dados históricos
  addDataPoints(dataPoints: DataPoint[]): void {
    this.dataHistory.push(...dataPoints);
    this.dataHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Limitar histórico (manter últimos 90 dias)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    this.dataHistory = this.dataHistory.filter(
      point => point.timestamp >= ninetyDaysAgo
    );

    console.log(`📈 ${dataPoints.length} pontos de dados adicionados. Total: ${this.dataHistory.length}`);
  }

  // Análise contextual completa
  analyzeWithContext(
    query: string,
    requestedMetrics: string[] = [],
    timeRange?: { start: Date; end: Date }
  ): ContextualAnalysis {
    if (!this.businessContext) {
      throw new Error('Contexto de negócio não configurado');
    }

    // Filtrar dados relevantes
    const relevantData = this.getRelevantData(requestedMetrics, timeRange);
    
    // Detectar padrões
    this.detectPatterns(relevantData);
    
    // Gerar insights
    const insights = this.generateInsights(relevantData, query);
    
    // Calcular KPIs
    const kpis = this.calculateKPIs(relevantData);
    
    // Gerar recomendações
    const recommendations = this.generateRecommendations(insights, kpis);
    
    // Identificar riscos e oportunidades
    const riskFactors = this.identifyRiskFactors(insights);
    const opportunities = this.identifyOpportunities(insights);
    
    // Criar resumo
    const summary = this.generateSummary(insights, kpis);

    return {
      insights,
      summary,
      kpis,
      recommendations,
      riskFactors,
      opportunities
    };
  }

  // Obter dados relevantes para análise
  private getRelevantData(metrics: string[], timeRange?: { start: Date; end: Date }): DataPoint[] {
    let filteredData = this.dataHistory;

    // Filtrar por período
    if (timeRange) {
      filteredData = filteredData.filter(
        point => point.timestamp >= timeRange.start && point.timestamp <= timeRange.end
      );
    }

    // Filtrar por métricas se especificadas
    if (metrics.length > 0) {
      filteredData = filteredData.filter(
        point => metrics.includes(point.metric)
      );
    }

    return filteredData;
  }

  // Detectar padrões nos dados
  private detectPatterns(data: DataPoint[]): void {
    // Agrupar por métrica
    const groupedData = this.groupByMetric(data);

    for (const [metric, points] of Object.entries(groupedData)) {
      // Detectar sazonalidade
      const seasonality = this.detectSeasonality(points);
      
      // Detectar tendências
      const trend = this.detectTrend(points);
      
      // Detectar anomalias
      const anomalies = this.detectAnomalies(points);
      
      // Detectar correlações
      const correlations = this.detectCorrelations(metric, groupedData);

      this.patterns.set(metric, {
        seasonality,
        trend,
        anomalies,
        correlations
      });
    }
  }

  // Gerar insights baseados nos dados e contexto
  private generateInsights(data: DataPoint[], query: string): AnalysisInsight[] {
    const insights: AnalysisInsight[] = [];
    const groupedData = this.groupByMetric(data);

    for (const [metric, points] of Object.entries(groupedData)) {
      const pattern = this.patterns.get(metric);
      if (!pattern) continue;

      // Insight de tendência
      if (pattern.trend.significance > 0.5) {
        insights.push(this.createTrendInsight(metric, points, pattern.trend));
      }

      // Insight de anomalia
      for (const anomaly of pattern.anomalies) {
        insights.push(this.createAnomalyInsight(metric, anomaly));
      }

      // Insight de sazonalidade
      if (pattern.seasonality.strength > 0.3) {
        insights.push(this.createSeasonalityInsight(metric, pattern.seasonality));
      }

      // Insight de correlação
      for (const correlation of pattern.correlations) {
        if (Math.abs(correlation.coefficient) > 0.6) {
          insights.push(this.createCorrelationInsight(metric, correlation));
        }
      }
    }

    // Adicionar insights contextuais baseados no tipo de negócio
    insights.push(...this.generateBusinessSpecificInsights(groupedData));

    // Ordenar por relevância
    return insights.sort((a, b) => {
      const scoreA = a.confidence * (a.severity === 'critical' ? 4 : a.severity === 'high' ? 3 : a.severity === 'medium' ? 2 : 1);
      const scoreB = b.confidence * (b.severity === 'critical' ? 4 : b.severity === 'high' ? 3 : b.severity === 'medium' ? 2 : 1);
      return scoreB - scoreA;
    }).slice(0, 10); // Top 10 insights
  }

  // Calcular KPIs contextuais
  private calculateKPIs(data: DataPoint[]): ContextualAnalysis['kpis'] {
    const groupedData = this.groupByMetric(data);
    const context = this.businessContext!;

    // Calcular performance geral
    let performanceScore = 0;
    let trendScore = 0;
    let dataPointsCount = 0;

    for (const [metric, points] of Object.entries(groupedData)) {
      if (points.length < 2) continue;

      const latest = points[points.length - 1];
      const baseline = this.getBaselineForMetric(metric);
      
      if (baseline > 0) {
        const performance = latest.value / baseline;
        performanceScore += performance;
        dataPointsCount++;

        // Calcular tendência (últimos 7 dias vs anteriores)
        const recentAvg = this.calculateAverage(points.slice(-7));
        const previousAvg = this.calculateAverage(points.slice(-14, -7));
        if (previousAvg > 0) {
          trendScore += (recentAvg - previousAvg) / previousAvg;
        }
      }
    }

    const avgPerformance = dataPointsCount > 0 ? performanceScore / dataPointsCount : 1;
    const avgTrend = dataPointsCount > 0 ? trendScore / dataPointsCount : 0;

    // Determinar performance
    let performance: ContextualAnalysis['kpis']['performance'];
    if (avgPerformance >= 1.2) performance = 'excellent';
    else if (avgPerformance >= 1.1) performance = 'good';
    else if (avgPerformance >= 0.9) performance = 'average';
    else if (avgPerformance >= 0.7) performance = 'poor';
    else performance = 'critical';

    // Determinar tendência
    let trend: ContextualAnalysis['kpis']['trend'];
    if (avgTrend > 0.05) trend = 'improving';
    else if (avgTrend > -0.05) trend = 'stable';
    else trend = 'declining';

    // Previsão baseada na tendência
    const predictedOutcome = this.generatePrediction(avgTrend, performance);

    return {
      performance,
      trend,
      predictedOutcome
    };
  }

  // Gerar recomendações baseadas nos insights
  private generateRecommendations(
    insights: AnalysisInsight[], 
    kpis: ContextualAnalysis['kpis']
  ): ContextualAnalysis['recommendations'] {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Recomendações baseadas em KPIs
    if (kpis.performance === 'critical' || kpis.performance === 'poor') {
      immediate.push('Revisar operações imediatamente - performance abaixo do esperado');
      immediate.push('Analisar custos e identificar desperdícios');
    }

    if (kpis.trend === 'declining') {
      immediate.push('Implementar estratégias de retenção de clientes');
      shortTerm.push('Revisar estratégia de marketing e promoções');
    }

    // Recomendações baseadas em insights específicos
    for (const insight of insights) {
      if (insight.recommendation) {
        if (insight.severity === 'critical') {
          immediate.push(insight.recommendation);
        } else if (insight.severity === 'high') {
          shortTerm.push(insight.recommendation);
        } else {
          longTerm.push(insight.recommendation);
        }
      }
    }

    // Recomendações específicas do tipo de negócio
    const businessSpecific = this.generateBusinessSpecificRecommendations(insights, kpis);
    immediate.push(...businessSpecific.immediate);
    shortTerm.push(...businessSpecific.shortTerm);
    longTerm.push(...businessSpecific.longTerm);

    return {
      immediate: [...new Set(immediate)].slice(0, 5),
      shortTerm: [...new Set(shortTerm)].slice(0, 5),
      longTerm: [...new Set(longTerm)].slice(0, 5)
    };
  }

  // Identificar fatores de risco
  private identifyRiskFactors(insights: AnalysisInsight[]): string[] {
    const risks: string[] = [];

    for (const insight of insights) {
      if (insight.impact === 'negative' && insight.severity === 'high') {
        risks.push(`${insight.title}: ${insight.description}`);
      }
    }

    // Riscos contextuais
    const context = this.businessContext!;
    if (context.currentPeriod.isWeekend && context.currentPeriod.isEventDay) {
      risks.push('Sobrecarga operacional - fim de semana com evento');
    }

    return risks.slice(0, 5);
  }

  // Identificar oportunidades
  private identifyOpportunities(insights: AnalysisInsight[]): string[] {
    const opportunities: string[] = [];

    for (const insight of insights) {
      if (insight.impact === 'positive' && insight.confidence > 0.7) {
        opportunities.push(`${insight.title}: Potencial de crescimento identificado`);
      }
    }

    // Oportunidades contextuais
    const context = this.businessContext!;
    if (context.currentPeriod.season === 'summer' && context.barInfo.type === 'bar') {
      opportunities.push('Temporada de verão: Oportunidade para eventos ao ar livre');
    }

    return opportunities.slice(0, 5);
  }

  // Gerar resumo da análise
  private generateSummary(insights: AnalysisInsight[], kpis: ContextualAnalysis['kpis']): string {
    const context = this.businessContext!;
    const criticalInsights = insights.filter(i => i.severity === 'critical');
    const positiveInsights = insights.filter(i => i.impact === 'positive');

    let summary = `Análise para ${context.barInfo.name}: `;

    // Status geral
    summary += `Performance ${kpis.performance} com tendência ${kpis.trend}. `;

    // Insights críticos
    if (criticalInsights.length > 0) {
      summary += `${criticalInsights.length} pontos críticos identificados. `;
    }

    // Oportunidades
    if (positiveInsights.length > 0) {
      summary += `${positiveInsights.length} oportunidades de melhoria detectadas. `;
    }

    // Previsão
    summary += kpis.predictedOutcome;

    return summary;
  }

  // Métodos auxiliares
  private groupByMetric(data: DataPoint[]): Record<string, DataPoint[]> {
    return data.reduce((groups, point) => {
      if (!groups[point.metric]) {
        groups[point.metric] = [];
      }
      groups[point.metric].push(point);
      return groups;
    }, {} as Record<string, DataPoint[]>);
  }

  private detectSeasonality(points: DataPoint[]): { strength: number; pattern: string } {
    // Implementação simplificada de detecção de sazonalidade
    return { strength: 0.5, pattern: 'weekly' };
  }

  private detectTrend(points: DataPoint[]): { direction: 'up' | 'down' | 'stable'; significance: number } {
    if (points.length < 2) return { direction: 'stable', significance: 0 };
    
    const first = points[0].value;
    const last = points[points.length - 1].value;
    const change = (last - first) / first;
    
    return {
      direction: change > 0.05 ? 'up' : change < -0.05 ? 'down' : 'stable',
      significance: Math.abs(change)
    };
  }

  private detectAnomalies(points: DataPoint[]): Array<{ point: DataPoint; severity: number }> {
    // Implementação simplificada de detecção de anomalias
    return [];
  }

  private detectCorrelations(metric: string, allData: Record<string, DataPoint[]>): Array<{ metric: string; coefficient: number }> {
    // Implementação simplificada de detecção de correlações
    return [];
  }

  private createTrendInsight(metric: string, points: DataPoint[], trend: any): AnalysisInsight {
    const latest = points[points.length - 1];
    const baseline = this.getBaselineForMetric(metric);
    const change = latest.value - baseline;
    const changePercent = (change / baseline) * 100;

    return {
      type: 'trend',
      severity: Math.abs(changePercent) > 20 ? 'high' : 'medium',
      confidence: trend.significance,
      title: `Tendência ${trend.direction === 'up' ? 'crescente' : trend.direction === 'down' ? 'decrescente' : 'estável'} em ${metric}`,
      description: `${metric} mostra tendência ${trend.direction} com ${changePercent.toFixed(1)}% de variação`,
      impact: trend.direction === 'up' ? 'positive' : trend.direction === 'down' ? 'negative' : 'neutral',
      recommendation: trend.direction === 'down' ? `Investigar causas da queda em ${metric}` : undefined,
      data: {
        current: latest.value,
        baseline,
        change,
        changePercent
      },
      timeframe: 'últimos 30 dias'
    };
  }

  private createAnomalyInsight(metric: string, anomaly: any): AnalysisInsight {
    return {
      type: 'anomaly',
      severity: 'high',
      confidence: 0.8,
      title: `Anomalia detectada em ${metric}`,
      description: `Valor anômalo identificado`,
      impact: 'negative',
      data: {
        current: 0,
        baseline: 0,
        change: 0,
        changePercent: 0
      },
      timeframe: 'detecção pontual'
    };
  }

  private createSeasonalityInsight(metric: string, seasonality: any): AnalysisInsight {
    return {
      type: 'pattern',
      severity: 'medium',
      confidence: seasonality.strength,
      title: `Padrão sazonal em ${metric}`,
      description: `Padrão ${seasonality.pattern} identificado`,
      impact: 'neutral',
      data: {
        current: 0,
        baseline: 0,
        change: 0,
        changePercent: 0
      },
      timeframe: 'padrão histórico'
    };
  }

  private createCorrelationInsight(metric: string, correlation: any): AnalysisInsight {
    return {
      type: 'correlation',
      severity: 'medium',
      confidence: Math.abs(correlation.coefficient),
      title: `Correlação entre ${metric} e ${correlation.metric}`,
      description: `Correlação ${correlation.coefficient > 0 ? 'positiva' : 'negativa'} detectada`,
      impact: 'neutral',
      data: {
        current: 0,
        baseline: 0,
        change: 0,
        changePercent: 0
      },
      timeframe: 'análise correlacional'
    };
  }

  private generateBusinessSpecificInsights(groupedData: Record<string, DataPoint[]>): AnalysisInsight[] {
    const insights: AnalysisInsight[] = [];
    const context = this.businessContext!;

    // Insights específicos para tipo de estabelecimento
    if (context.barInfo.type === 'nightclub' && context.currentPeriod.isWeekend) {
      insights.push({
        type: 'pattern',
        severity: 'medium',
        confidence: 0.8,
        title: 'Padrão de fim de semana para casa noturna',
        description: 'Movimento típico de casa noturna em fim de semana',
        impact: 'positive',
        data: { current: 0, baseline: 0, change: 0, changePercent: 0 },
        timeframe: 'fim de semana'
      });
    }

    return insights;
  }

  private generateBusinessSpecificRecommendations(
    insights: AnalysisInsight[], 
    kpis: ContextualAnalysis['kpis']
  ): { immediate: string[]; shortTerm: string[]; longTerm: string[] } {
    const context = this.businessContext!;
    const recommendations = { immediate: [], shortTerm: [], longTerm: [] } as any;

    if (context.barInfo.type === 'bar') {
      recommendations.shortTerm.push('Considerar happy hour para atrair mais clientes');
      recommendations.longTerm.push('Expandir cardápio de petiscos');
    }

    return recommendations;
  }

  private getBaselineForMetric(metric: string): number {
    const context = this.businessContext!;
    
    switch (metric) {
      case 'sales': return context.historicalBaseline.averageDailySales;
      case 'customers': return context.historicalBaseline.averageCustomerCount;
      case 'ticket': return context.historicalBaseline.averageTicket;
      default: return 100; // Valor padrão
    }
  }

  private calculateAverage(points: DataPoint[]): number {
    if (points.length === 0) return 0;
    return points.reduce((sum, point) => sum + point.value, 0) / points.length;
  }

  private generatePrediction(trendScore: number, performance: string): string {
    if (trendScore > 0.1) {
      return 'Projeção otimista para o próximo período';
    } else if (trendScore < -0.1) {
      return 'Atenção necessária para reverter tendência negativa';
    } else {
      return 'Estabilidade esperada para o próximo período';
    }
  }
}

// Instância global
export const contextAnalyzer = new ContextAnalyzer();

// Hook para React
export const useContextAnalyzer = () => {
  return {
    setBusinessContext: contextAnalyzer.setBusinessContext.bind(contextAnalyzer),
    addDataPoints: contextAnalyzer.addDataPoints.bind(contextAnalyzer),
    analyzeWithContext: contextAnalyzer.analyzeWithContext.bind(contextAnalyzer)
  };
};
