# 🤖 AGENTE INTELIGENTE ZYKOR - GUIA COMPLETO

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Tipos de Agentes](#tipos-de-agentes)
4. [Módulos Principais](#módulos-principais)
5. [Treinamento e Aprendizado](#treinamento-e-aprendizado)
6. [Vasculhamento de Banco de Dados](#vasculhamento-de-banco-de-dados)
7. [Alertas e Notificações](#alertas-e-notificações)
8. [Implementação Prática](#implementação-prática)
9. [Roadmap de Desenvolvimento](#roadmap-de-desenvolvimento)

---

## 🎯 Visão Geral

### O que é o Agente Inteligente Zykor?

O **Agente Inteligente Zykor** é um sistema autônomo de análise e monitoramento que:

- 🔍 **Vasculha continuamente** o banco de dados
- 📊 **Analisa padrões** e tendências nos dados
- 🚨 **Detecta anomalias** e situações importantes
- 💡 **Gera insights** automáticos para o negócio
- 🎓 **Aprende continuamente** com os dados e feedback
- 📢 **Notifica** stakeholders sobre eventos relevantes
- 🤝 **Interage** com usuários via chat/comandos

### Por que precisamos disso?

**Problemas que resolve:**
- ❌ Informações importantes passam despercebidas
- ❌ Monitoramento manual é lento e ineficiente
- ❌ Relatórios são estáticos e desatualizados
- ❌ Falta de proatividade na gestão
- ❌ Dados espalhados sem conexão

**Benefícios:**
- ✅ Monitoramento 24/7 automático
- ✅ Detecção precoce de problemas
- ✅ Insights acionáveis em tempo real
- ✅ Aprendizado contínuo do negócio
- ✅ Economia de tempo da equipe

---

## 🏗️ Arquitetura do Sistema

### Visão Macro

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENTE INTELIGENTE ZYKOR                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   SCANNER    │     │   ANALYZER   │     │  NOTIFIER    │
│   (Coletor)  │────▶│  (Análise)   │────▶│ (Alertas)    │
└──────────────┘     └──────────────┘     └──────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────────────────────────────────────────────────┐
│                     BANCO DE DADOS                        │
│  • Operacional (Supabase)                                │
│  • Histórico (Time Series)                               │
│  • Knowledge Base (Aprendizado)                          │
└──────────────────────────────────────────────────────────┘
```

### Componentes Principais

#### 1. **Scanner (Coletor de Dados)**
- Varre tabelas do BD periodicamente
- Coleta métricas em tempo real
- Identifica mudanças e eventos
- Armazena snapshots para análise

#### 2. **Analyzer (Motor de Análise)**
- Processa dados coletados
- Aplica regras de negócio
- Detecta padrões e anomalias
- Gera insights e recomendações

#### 3. **Notifier (Sistema de Notificações)**
- Envia alertas via Discord/WhatsApp
- Cria notificações in-app
- Registra eventos importantes
- Prioriza urgências

#### 4. **Learning Engine (Motor de Aprendizado)**
- Aprende com feedback de usuários
- Ajusta thresholds automaticamente
- Identifica novos padrões
- Melhora precisão dos alertas

---

## 🤖 Tipos de Agentes

### 1. **Agente de Monitoramento Operacional**

**Responsabilidade:** Acompanhar operações do dia a dia

**Monitora:**
- ✅ Checklists pendentes/atrasados
- ✅ Eventos próximos sem preparação
- ✅ Estoque baixo de insumos críticos
- ✅ Produção abaixo da meta
- ✅ Falhas em integrações (ContaHub, Yuzer, Sympla)

**Exemplo de Alerta:**
```
🚨 ALERTA OPERACIONAL
Bar: Windsor
Checklist "Abertura" atrasado em 45 minutos
Responsável: João Silva
Ação Sugerida: Notificar gerente imediatamente
```

### 2. **Agente de Análise Financeira**

**Responsabilidade:** Monitorar saúde financeira

**Monitora:**
- 💰 CMV acima da média histórica
- 💰 Receita abaixo do projetado
- 💰 Custos aumentando sem proporcionalidade
- 💰 Fluxo de caixa negativo
- 💰 Pagamentos atrasados

**Exemplo de Alerta:**
```
💰 ALERTA FINANCEIRO
Bar: Pieter
CMV Semanal: 38% (Meta: 32%)
Variação: +6pp vs. semana anterior
Possível Causa: Aumento preço fornecedor X
Ação Sugerida: Revisar receitas e precificação
```

### 3. **Agente de Experiência do Cliente**

**Responsabilidade:** Acompanhar satisfação e feedback

**Monitora:**
- ⭐ NPS abaixo de threshold
- ⭐ Pesquisa de felicidade com notas baixas
- ⭐ Reclamações recorrentes
- ⭐ Taxa de conversão de reservas
- ⭐ Tempo de resposta ao cliente

**Exemplo de Alerta:**
```
⭐ ALERTA EXPERIÊNCIA
Bar: Villa
NPS Semanal: 6.2 (Queda de 8.5)
Reclamações: 5 sobre "demora no atendimento"
Ação Sugerida: Revisar escala de funcionários
```

### 4. **Agente de Performance de Equipe**

**Responsabilidade:** Acompanhar desempenho da equipe

**Monitora:**
- 👥 Checklists não completados por funcionário
- 👥 Tempo médio de execução de tarefas
- 👥 Faltas e atrasos
- 👥 Produtividade por hora
- 👥 Feedback de pesquisas internas

**Exemplo de Alerta:**
```
👥 ALERTA EQUIPE
Bar: Windsor
Funcionário: Maria Santos
Padrão: 3 checklists incompletos nos últimos 5 dias
Ação Sugerida: Reunião de feedback/treinamento
```

### 5. **Agente de Inteligência de Negócio**

**Responsabilidade:** Identificar oportunidades e tendências

**Monitora:**
- 📈 Produtos mais vendidos por período
- 📈 Eventos com melhor ROI
- 📈 Sazonalidades e padrões
- 📈 Benchmarking entre bares
- 📈 Tendências de mercado

**Exemplo de Alerta:**
```
📈 INSIGHT INTELIGENTE
Padrão Identificado: Sextas-feira com evento
Receita média: +45% vs. sextas sem evento
Recomendação: Agendar eventos quinzenais às sextas
ROI Projetado: R$ 12.500/mês
```

---

## 🧩 Módulos Principais

### Módulo 1: Scanner de Banco de Dados

**Função:** Coletar dados continuamente do BD

**Arquitetura:**

```typescript
// backend/supabase/functions/agente-scanner/index.ts

interface ScanJob {
  id: string;
  table: string;
  frequency: 'realtime' | '5min' | '1hour' | '1day';
  query: string;
  lastRun: Date;
  enabled: boolean;
}

interface ScanResult {
  jobId: string;
  timestamp: Date;
  data: any[];
  changes: Change[];
  metrics: Metric[];
}

class DatabaseScanner {
  private jobs: ScanJob[] = [];
  
  constructor(private supabase: SupabaseClient) {}
  
  // Registrar job de scan
  registerScanJob(job: ScanJob) {
    this.jobs.push(job);
  }
  
  // Executar scan
  async runScan(jobId: string): Promise<ScanResult> {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job) throw new Error('Job not found');
    
    const { data, error } = await this.supabase
      .from(job.table)
      .select('*')
      .gte('updated_at', job.lastRun);
    
    if (error) throw error;
    
    const changes = this.detectChanges(data);
    const metrics = this.calculateMetrics(data);
    
    return {
      jobId: job.id,
      timestamp: new Date(),
      data: data || [],
      changes,
      metrics
    };
  }
  
  // Detectar mudanças significativas
  private detectChanges(data: any[]): Change[] {
    // Lógica de detecção de mudanças
    return [];
  }
  
  // Calcular métricas
  private calculateMetrics(data: any[]): Metric[] {
    // Lógica de cálculo de métricas
    return [];
  }
}
```

**Jobs de Scan Configurados:**

```typescript
// Exemplos de jobs
const scanJobs: ScanJob[] = [
  {
    id: 'checklist-monitor',
    table: 'checklist_executions',
    frequency: '5min',
    query: `
      SELECT ce.*, c.nome, b.nome as bar_nome
      FROM checklist_executions ce
      JOIN checklists c ON ce.checklist_id = c.id
      JOIN bars b ON ce.bar_id = b.id
      WHERE ce.status IN ('pendente', 'em_andamento')
      AND ce.data_prevista < NOW()
    `,
    enabled: true
  },
  {
    id: 'estoque-monitor',
    table: 'estoque_insumos',
    frequency: '1hour',
    query: `
      SELECT i.nome, ei.quantidade_atual, i.estoque_minimo, b.nome as bar
      FROM estoque_insumos ei
      JOIN insumos i ON ei.insumo_id = i.id
      JOIN bars b ON ei.bar_id = b.id
      WHERE ei.quantidade_atual <= i.estoque_minimo
    `,
    enabled: true
  },
  {
    id: 'financeiro-monitor',
    table: 'contahub_periodo',
    frequency: '1day',
    query: `
      SELECT bar_id, data, receita_total, cmv, cmv_percentual
      FROM contahub_periodo
      WHERE data >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY data DESC
    `,
    enabled: true
  },
  {
    id: 'nps-monitor',
    table: 'nps',
    frequency: '1hour',
    query: `
      SELECT bar_id, nota, comentario, created_at
      FROM nps
      WHERE nota <= 6
      AND created_at >= NOW() - INTERVAL '24 hours'
    `,
    enabled: true
  }
];
```

### Módulo 2: Analyzer (Motor de Análise)

**Função:** Processar dados e gerar insights

```typescript
// backend/supabase/functions/agente-analyzer/index.ts

interface AnalysisRule {
  id: string;
  name: string;
  type: 'threshold' | 'pattern' | 'anomaly' | 'prediction';
  condition: (data: any) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: (data: any) => Insight;
}

interface Insight {
  id: string;
  timestamp: Date;
  type: string;
  severity: string;
  title: string;
  description: string;
  data: any;
  recommendations: string[];
  priority: number;
}

class IntelligentAnalyzer {
  private rules: AnalysisRule[] = [];
  private historicalData: Map<string, any[]> = new Map();
  
  constructor(private supabase: SupabaseClient) {}
  
  // Registrar regra de análise
  registerRule(rule: AnalysisRule) {
    this.rules.push(rule);
  }
  
  // Analisar dados
  async analyze(scanResult: ScanResult): Promise<Insight[]> {
    const insights: Insight[] = [];
    
    for (const rule of this.rules) {
      try {
        if (rule.condition(scanResult.data)) {
          const insight = rule.action(scanResult.data);
          insights.push(insight);
          
          // Armazenar no BD
          await this.saveInsight(insight);
        }
      } catch (error) {
        console.error(`Error in rule ${rule.id}:`, error);
      }
    }
    
    return insights;
  }
  
  // Detectar anomalias usando ML
  async detectAnomalies(metric: string, value: number): Promise<boolean> {
    const historical = this.historicalData.get(metric) || [];
    
    if (historical.length < 10) {
      // Não temos dados suficientes
      return false;
    }
    
    const mean = historical.reduce((a, b) => a + b, 0) / historical.length;
    const stdDev = Math.sqrt(
      historical.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / historical.length
    );
    
    // Anomalia se valor está 2 desvios padrão acima/abaixo da média
    return Math.abs(value - mean) > (2 * stdDev);
  }
  
  // Prever tendências
  async predictTrend(metric: string, data: number[]): Promise<'up' | 'down' | 'stable'> {
    if (data.length < 3) return 'stable';
    
    // Regressão linear simples
    const n = data.length;
    const x = Array.from({length: n}, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    if (slope > 0.1) return 'up';
    if (slope < -0.1) return 'down';
    return 'stable';
  }
  
  private async saveInsight(insight: Insight) {
    await this.supabase
      .from('agente_insights')
      .insert({
        type: insight.type,
        severity: insight.severity,
        title: insight.title,
        description: insight.description,
        data: insight.data,
        recommendations: insight.recommendations,
        priority: insight.priority,
        created_at: new Date()
      });
  }
}
```

**Exemplos de Regras de Análise:**

```typescript
// Regra: Checklist atrasado
const checklistAtrasadoRule: AnalysisRule = {
  id: 'checklist-atrasado',
  name: 'Checklist Atrasado',
  type: 'threshold',
  condition: (data) => data.length > 0,
  severity: 'high',
  action: (data) => ({
    id: crypto.randomUUID(),
    timestamp: new Date(),
    type: 'operational',
    severity: 'high',
    title: `${data.length} Checklists Atrasados`,
    description: `Existem ${data.length} checklists pendentes além do prazo`,
    data: data,
    recommendations: [
      'Notificar responsáveis imediatamente',
      'Verificar disponibilidade da equipe',
      'Considerar redistribuir tarefas'
    ],
    priority: 8
  })
};

// Regra: CMV Alto
const cmvAltoRule: AnalysisRule = {
  id: 'cmv-alto',
  name: 'CMV Acima da Meta',
  type: 'threshold',
  condition: (data) => {
    return data.some(row => row.cmv_percentual > 35);
  },
  severity: 'high',
  action: (data) => {
    const problematicBars = data.filter(row => row.cmv_percentual > 35);
    
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: 'financial',
      severity: 'high',
      title: 'CMV Acima da Meta',
      description: `${problematicBars.length} bar(es) com CMV acima de 35%`,
      data: problematicBars,
      recommendations: [
        'Revisar receitas e porcionamento',
        'Negociar com fornecedores',
        'Verificar desperdício na produção',
        'Ajustar precificação se necessário'
      ],
      priority: 9
    };
  }
};

// Regra: Estoque Baixo
const estoqueBaixoRule: AnalysisRule = {
  id: 'estoque-baixo',
  name: 'Estoque Abaixo do Mínimo',
  type: 'threshold',
  condition: (data) => data.length > 0,
  severity: 'medium',
  action: (data) => ({
    id: crypto.randomUUID(),
    timestamp: new Date(),
    type: 'operational',
    severity: 'medium',
    title: `${data.length} Insumos com Estoque Baixo`,
    description: `Insumos abaixo do estoque mínimo: ${data.map(i => i.nome).join(', ')}`,
    data: data,
    recommendations: [
      'Realizar pedido de compra urgente',
      'Verificar consumo acima do previsto',
      'Ajustar par stock se necessário'
    ],
    priority: 7
  })
};

// Regra: NPS Baixo
const npsBaixoRule: AnalysisRule = {
  id: 'nps-baixo',
  name: 'Avaliações Negativas NPS',
  type: 'threshold',
  condition: (data) => data.length > 0,
  severity: 'high',
  action: (data) => ({
    id: crypto.randomUUID(),
    timestamp: new Date(),
    type: 'customer',
    severity: 'high',
    title: `${data.length} Avaliações Negativas (NPS ≤ 6)`,
    description: `Clientes insatisfeitos nas últimas 24h`,
    data: data,
    recommendations: [
      'Entrar em contato com clientes para resolver problemas',
      'Identificar padrões de reclamação',
      'Implementar ações corretivas imediatamente'
    ],
    priority: 8
  })
};
```

### Módulo 3: Notifier (Sistema de Notificações)

**Função:** Enviar alertas e notificações

```typescript
// backend/supabase/functions/agente-notifier/index.ts

interface NotificationChannel {
  type: 'discord' | 'whatsapp' | 'in-app' | 'email';
  enabled: boolean;
  config: any;
}

interface NotificationRule {
  insightType: string;
  minSeverity: string;
  channels: NotificationChannel[];
  recipients: string[];
}

class IntelligentNotifier {
  private channels: Map<string, NotificationChannel> = new Map();
  private rules: NotificationRule[] = [];
  
  constructor(private supabase: SupabaseClient) {
    this.setupChannels();
  }
  
  private setupChannels() {
    // Discord
    this.channels.set('discord', {
      type: 'discord',
      enabled: true,
      config: { webhookUrl: Deno.env.get('DISCORD_WEBHOOK_URL') }
    });
    
    // WhatsApp (via Evolution API)
    this.channels.set('whatsapp', {
      type: 'whatsapp',
      enabled: true,
      config: { apiUrl: Deno.env.get('WHATSAPP_API_URL') }
    });
    
    // In-App
    this.channels.set('in-app', {
      type: 'in-app',
      enabled: true,
      config: {}
    });
  }
  
  // Notificar insight
  async notify(insight: Insight) {
    const applicableRules = this.rules.filter(rule => 
      rule.insightType === insight.type &&
      this.isMinSeverityMet(rule.minSeverity, insight.severity)
    );
    
    for (const rule of applicableRules) {
      for (const channel of rule.channels) {
        if (!channel.enabled) continue;
        
        try {
          await this.sendToChannel(channel, insight, rule.recipients);
        } catch (error) {
          console.error(`Error sending to ${channel.type}:`, error);
        }
      }
    }
    
    // Sempre registrar no log
    await this.logNotification(insight);
  }
  
  private async sendToChannel(
    channel: NotificationChannel,
    insight: Insight,
    recipients: string[]
  ) {
    switch (channel.type) {
      case 'discord':
        await this.sendDiscord(channel, insight);
        break;
      case 'whatsapp':
        await this.sendWhatsApp(channel, insight, recipients);
        break;
      case 'in-app':
        await this.sendInApp(insight, recipients);
        break;
    }
  }
  
  private async sendDiscord(channel: NotificationChannel, insight: Insight) {
    const color = this.getSeverityColor(insight.severity);
    const emoji = this.getSeverityEmoji(insight.severity);
    
    const embed = {
      embeds: [{
        title: `${emoji} ${insight.title}`,
        description: insight.description,
        color: color,
        fields: [
          {
            name: 'Severidade',
            value: insight.severity.toUpperCase(),
            inline: true
          },
          {
            name: 'Tipo',
            value: insight.type,
            inline: true
          },
          {
            name: 'Prioridade',
            value: `${insight.priority}/10`,
            inline: true
          },
          {
            name: '💡 Recomendações',
            value: insight.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')
          }
        ],
        timestamp: insight.timestamp.toISOString(),
        footer: {
          text: 'Agente Inteligente Zykor'
        }
      }]
    };
    
    await fetch(channel.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed)
    });
  }
  
  private async sendWhatsApp(
    channel: NotificationChannel,
    insight: Insight,
    recipients: string[]
  ) {
    const message = `
🤖 *AGENTE ZYKOR*

${this.getSeverityEmoji(insight.severity)} *${insight.title}*

${insight.description}

*Recomendações:*
${insight.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

_Prioridade: ${insight.priority}/10_
    `.trim();
    
    for (const recipient of recipients) {
      await fetch(`${channel.config.apiUrl}/message/sendText/${recipient}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      });
    }
  }
  
  private async sendInApp(insight: Insight, recipients: string[]) {
    for (const userId of recipients) {
      await this.supabase
        .from('notificacoes')
        .insert({
          usuario_id: userId,
          tipo: 'agente_insight',
          titulo: insight.title,
          mensagem: insight.description,
          prioridade: insight.severity,
          dados: {
            insightId: insight.id,
            recommendations: insight.recommendations,
            data: insight.data
          },
          lida: false,
          created_at: new Date()
        });
    }
  }
  
  private getSeverityColor(severity: string): number {
    const colors = {
      low: 0x3498db,      // Azul
      medium: 0xf39c12,   // Laranja
      high: 0xe74c3c,     // Vermelho
      critical: 0x8b0000  // Vermelho escuro
    };
    return colors[severity] || colors.medium;
  }
  
  private getSeverityEmoji(severity: string): string {
    const emojis = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🚨',
      critical: '🔴'
    };
    return emojis[severity] || '📊';
  }
  
  private isMinSeverityMet(minSev: string, currentSev: string): boolean {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return levels[currentSev] >= levels[minSev];
  }
  
  private async logNotification(insight: Insight) {
    await this.supabase
      .from('agente_notification_logs')
      .insert({
        insight_id: insight.id,
        sent_at: new Date(),
        channels_used: Array.from(this.channels.keys())
      });
  }
}
```

### Módulo 4: Learning Engine (Motor de Aprendizado)

**Função:** Aprender continuamente e melhorar

```typescript
// backend/supabase/functions/agente-learning/index.ts

interface Feedback {
  insightId: string;
  userId: string;
  rating: 1 | 2 | 3 | 4 | 5; // Útil?
  action_taken: boolean;
  comment?: string;
  timestamp: Date;
}

interface LearningModel {
  ruleId: string;
  accuracy: number; // % de insights úteis
  threshold: number; // Threshold dinâmico
  confidence: number; // Confiança no modelo
  lastUpdated: Date;
}

class LearningEngine {
  private models: Map<string, LearningModel> = new Map();
  
  constructor(private supabase: SupabaseClient) {}
  
  // Processar feedback
  async processFeedback(feedback: Feedback) {
    // Salvar feedback
    await this.supabase
      .from('agente_feedback')
      .insert(feedback);
    
    // Buscar insight relacionado
    const { data: insight } = await this.supabase
      .from('agente_insights')
      .select('*')
      .eq('id', feedback.insightId)
      .single();
    
    if (!insight) return;
    
    // Atualizar modelo
    await this.updateModel(insight.type, feedback);
  }
  
  // Atualizar modelo de aprendizado
  private async updateModel(ruleId: string, feedback: Feedback) {
    let model = this.models.get(ruleId);
    
    if (!model) {
      model = {
        ruleId,
        accuracy: 0,
        threshold: 1.0,
        confidence: 0,
        lastUpdated: new Date()
      };
    }
    
    // Calcular nova accuracy
    const { data: allFeedbacks } = await this.supabase
      .from('agente_feedback')
      .select('rating, action_taken')
      .eq('insight_id', ruleId);
    
    if (allFeedbacks && allFeedbacks.length > 0) {
      const positives = allFeedbacks.filter(f => f.rating >= 4).length;
      model.accuracy = positives / allFeedbacks.length;
      model.confidence = Math.min(allFeedbacks.length / 50, 1); // Max confidence at 50 feedbacks
      
      // Ajustar threshold baseado em accuracy
      if (model.accuracy < 0.5) {
        // Muitos falsos positivos, aumentar threshold
        model.threshold *= 1.1;
      } else if (model.accuracy > 0.8 && model.confidence > 0.7) {
        // Alta accuracy, pode ser mais sensível
        model.threshold *= 0.95;
      }
      
      model.lastUpdated = new Date();
    }
    
    this.models.set(ruleId, model);
    
    // Salvar modelo atualizado
    await this.supabase
      .from('agente_learning_models')
      .upsert({
        rule_id: model.ruleId,
        accuracy: model.accuracy,
        threshold: model.threshold,
        confidence: model.confidence,
        last_updated: model.lastUpdated
      });
  }
  
  // Identificar novos padrões
  async discoverPatterns() {
    // Buscar correlações nos dados históricos
    // Exemplo: CMV alto correlaciona com eventos?
    
    const { data: insights } = await this.supabase
      .from('agente_insights')
      .select('*')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // Últimos 30 dias
    
    if (!insights) return [];
    
    const patterns = [];
    
    // Análise de clustering temporal
    const timeGroups = this.groupByTime(insights);
    for (const [time, group] of timeGroups) {
      if (group.length >= 3) {
        patterns.push({
          type: 'temporal_cluster',
          time,
          insights: group.map(i => i.type),
          frequency: group.length,
          description: `Múltiplos insights ocorrem frequentemente em ${time}`
        });
      }
    }
    
    return patterns;
  }
  
  private groupByTime(insights: any[]): Map<string, any[]> {
    const groups = new Map();
    
    for (const insight of insights) {
      const hour = new Date(insight.created_at).getHours();
      const period = hour < 12 ? 'manhã' : hour < 18 ? 'tarde' : 'noite';
      
      if (!groups.has(period)) {
        groups.set(period, []);
      }
      groups.get(period).push(insight);
    }
    
    return groups;
  }
  
  // Sugerir novas regras baseado em padrões
  async suggestNewRules(): Promise<AnalysisRule[]> {
    const patterns = await this.discoverPatterns();
    const suggestions: AnalysisRule[] = [];
    
    for (const pattern of patterns) {
      if (pattern.type === 'temporal_cluster') {
        suggestions.push({
          id: `auto-${pattern.type}-${Date.now()}`,
          name: `Padrão Descoberto: ${pattern.description}`,
          type: 'pattern',
          condition: () => true, // Definir condição baseada no padrão
          severity: 'medium',
          action: (data) => ({
            id: crypto.randomUUID(),
            timestamp: new Date(),
            type: 'pattern',
            severity: 'medium',
            title: pattern.description,
            description: `Padrão automático detectado`,
            data: pattern,
            recommendations: ['Revisar padrão descoberto', 'Validar relevância'],
            priority: 5
          })
        });
      }
    }
    
    return suggestions;
  }
}
```

---

## 🎓 Treinamento e Aprendizado

### Como Treinar o Agente?

#### 1. **Fase Inicial: Configuração de Regras Base**

**Arquivo:** `backend/supabase/functions/agente-config/rules.ts`

```typescript
export const baseRules: AnalysisRule[] = [
  // OPERACIONAL
  checklistAtrasadoRule,
  estoqueBaixoRule,
  producaoBaixaRule,
  falhaIntegracaoRule,
  
  // FINANCEIRO
  cmvAltoRule,
  receitaBaixaRule,
  custoAltoRule,
  
  // CLIENTE
  npsBaixoRule,
  reclamacaoRecorrenteRule,
  taxaConversaoBaixaRule,
  
  // EQUIPE
  checklistNaoCompletadoRule,
  produtividadeBaixaRule,
  
  // INTELIGÊNCIA
  oportunidadeVendaRule,
  tendenciaPositivaRule,
  benchmarkingRule
];
```

#### 2. **Fase de Calibração: Ajuste de Thresholds**

Durante primeiras 2-4 semanas:

```typescript
// Monitorar feedbacks
const calibrationPeriod = 4 * 7 * 24 * 60 * 60 * 1000; // 4 semanas

if (Date.now() - deployDate < calibrationPeriod) {
  // Modo calibração: mais conservador
  threshold *= 1.2; // 20% mais restritivo
  
  // Solicitar mais feedback
  insight.requestFeedback = true;
}
```

#### 3. **Fase de Aprendizado Contínuo**

```typescript
// Executar semanalmente
async function weeklyLearning() {
  const learningEngine = new LearningEngine(supabase);
  
  // 1. Atualizar modelos com feedback da semana
  await learningEngine.updateAllModels();
  
  // 2. Descobrir novos padrões
  const patterns = await learningEngine.discoverPatterns();
  
  // 3. Sugerir novas regras
  const newRules = await learningEngine.suggestNewRules();
  
  // 4. Notificar admin sobre sugestões
  if (newRules.length > 0) {
    await notifyAdmin({
      title: 'Novas Regras Sugeridas pelo Agente',
      description: `${newRules.length} novas regras foram descobertas`,
      rules: newRules
    });
  }
}
```

### Tipos de Aprendizado

#### **1. Supervised Learning (Aprendizado Supervisionado)**

**Como funciona:**
- Usuário dá feedback sobre cada insight
- Sistema aprende o que é relevante
- Ajusta thresholds automaticamente

**Implementação:**
```typescript
interface FeedbackForm {
  insightId: string;
  wasUseful: boolean;
  actionTaken: boolean;
  rating: 1-5;
  comment?: string;
}

// No frontend
function InsightFeedback({ insight }: { insight: Insight }) {
  const [feedback, setFeedback] = useState<FeedbackForm>({
    insightId: insight.id,
    wasUseful: false,
    actionTaken: false,
    rating: 3
  });
  
  const submitFeedback = async () => {
    await fetch('/api/agente/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback)
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{insight.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{insight.description}</p>
        
        <div className="mt-4">
          <Label>Este insight foi útil?</Label>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(star => (
              <Star 
                key={star}
                className={feedback.rating >= star ? 'fill-yellow-400' : ''}
                onClick={() => setFeedback({...feedback, rating: star})}
              />
            ))}
          </div>
        </div>
        
        <div className="mt-4">
          <Checkbox 
            checked={feedback.actionTaken}
            onCheckedChange={(checked) => 
              setFeedback({...feedback, actionTaken: checked as boolean})
            }
          />
          <Label>Tomei ação baseado neste insight</Label>
        </div>
        
        <Button onClick={submitFeedback} className="mt-4">
          Enviar Feedback
        </Button>
      </CardContent>
    </Card>
  );
}
```

#### **2. Reinforcement Learning (Aprendizado por Reforço)**

**Como funciona:**
- Sistema testa diferentes thresholds
- Mede taxa de ação tomada vs. falsos positivos
- Otimiza para maximizar utilidade

**Implementação:**
```typescript
class ReinforcementLearner {
  async optimize(ruleId: string) {
    const model = await this.getModel(ruleId);
    
    // Calcular reward baseado em feedbacks recentes
    const reward = await this.calculateReward(ruleId);
    
    if (reward < 0.5) {
      // Performance ruim, ajustar
      model.threshold *= 1.05; // Ser mais conservador
    } else if (reward > 0.8) {
      // Performance ótima, pode ser mais agressivo
      model.threshold *= 0.98; // Ser mais sensível
    }
    
    await this.saveModel(model);
  }
  
  private async calculateReward(ruleId: string): Promise<number> {
    // Buscar últimos 20 insights
    const { data: insights } = await this.supabase
      .from('agente_insights')
      .select('*, agente_feedback(*)')
      .eq('type', ruleId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (!insights || insights.length === 0) return 0.5;
    
    let totalReward = 0;
    for (const insight of insights) {
      const feedback = insight.agente_feedback?.[0];
      
      if (!feedback) continue;
      
      // Reward = (rating / 5) * actionWeight
      const actionWeight = feedback.action_taken ? 1.5 : 1.0;
      const reward = (feedback.rating / 5) * actionWeight;
      
      totalReward += reward;
    }
    
    return totalReward / insights.length;
  }
}
```

#### **3. Pattern Discovery (Descoberta de Padrões)**

**Como funciona:**
- Analisa correlações nos dados
- Identifica padrões recorrentes
- Sugere novas regras automaticamente

**Implementação:**
```typescript
async function discoverCorrelations() {
  // Exemplo: CMV alto correlaciona com que outros eventos?
  
  const { data: highCMVDays } = await supabase
    .from('contahub_periodo')
    .select('bar_id, data')
    .gt('cmv_percentual', 35);
  
  if (!highCMVDays) return;
  
  // Para cada dia com CMV alto, buscar outros eventos
  const correlations = [];
  
  for (const day of highCMVDays) {
    // Eventos no mesmo dia
    const { data: events } = await supabase
      .from('eventos_base')
      .select('*')
      .eq('bar_id', day.bar_id)
      .eq('data', day.data);
    
    // Checklists não feitos
    const { data: missedChecklists } = await supabase
      .from('checklist_executions')
      .select('*')
      .eq('bar_id', day.bar_id)
      .eq('data', day.data)
      .neq('status', 'concluido');
    
    if (events?.length > 0 || missedChecklists?.length > 0) {
      correlations.push({
        date: day.data,
        highCMV: true,
        hasEvent: events?.length > 0,
        missedChecklists: missedChecklists?.length || 0
      });
    }
  }
  
  // Analisar correlações
  const eventCorrelation = correlations.filter(c => c.hasEvent).length / correlations.length;
  const checklistCorrelation = correlations.filter(c => c.missedChecklists > 0).length / correlations.length;
  
  console.log('Correlações descobertas:');
  console.log(`- CMV alto em dias com evento: ${(eventCorrelation * 100).toFixed(1)}%`);
  console.log(`- CMV alto em dias com checklist não feito: ${(checklistCorrelation * 100).toFixed(1)}%`);
  
  // Se correlação > 70%, sugerir nova regra
  if (checklistCorrelation > 0.7) {
    return {
      type: 'correlation_rule',
      description: 'CMV alto correlaciona fortemente com checklists não completados',
      suggestedAction: 'Criar regra: alertar quando checklist não for feito antes de evento'
    };
  }
}
```

---

## 🔍 Vasculhamento de Banco de Dados

### Estratégias de Scan

#### 1. **Real-time (Triggers)**

Para dados críticos que precisam resposta imediata:

```sql
-- Criar tabela de eventos do agente
CREATE TABLE agente_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para detectar mudanças críticas
CREATE OR REPLACE FUNCTION notify_agente()
RETURNS TRIGGER AS $$
BEGIN
  -- Exemplo: NPS baixo
  IF TG_TABLE_NAME = 'nps' AND NEW.nota <= 6 THEN
    INSERT INTO agente_events (table_name, operation, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW)::jsonb);
    
    -- Notificar via pg_notify
    PERFORM pg_notify('agente_alert', json_build_object(
      'type', 'nps_baixo',
      'data', row_to_json(NEW)
    )::text);
  END IF;
  
  -- Exemplo: Checklist atrasado
  IF TG_TABLE_NAME = 'checklist_executions' 
     AND NEW.status = 'pendente' 
     AND NEW.data_prevista < NOW() THEN
    PERFORM pg_notify('agente_alert', json_build_object(
      'type', 'checklist_atrasado',
      'data', row_to_json(NEW)
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em tabelas relevantes
CREATE TRIGGER agente_nps_trigger
  AFTER INSERT OR UPDATE ON nps
  FOR EACH ROW
  EXECUTE FUNCTION notify_agente();

CREATE TRIGGER agente_checklist_trigger
  AFTER INSERT OR UPDATE ON checklist_executions
  FOR EACH ROW
  EXECUTE FUNCTION notify_agente();
```

**Backend Listener:**

```typescript
// backend/supabase/functions/agente-realtime/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Escutar mudanças em tempo real
const subscription = supabase
  .channel('agente_alerts')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public',
      table: 'agente_events'
    }, 
    async (payload) => {
      console.log('Evento detectado:', payload);
      
      // Processar evento imediatamente
      await processRealtimeEvent(payload.new);
    }
  )
  .subscribe();

async function processRealtimeEvent(event: any) {
  const analyzer = new IntelligentAnalyzer(supabase);
  const notifier = new IntelligentNotifier(supabase);
  
  // Analisar
  const insights = await analyzer.analyze({
    jobId: 'realtime',
    timestamp: new Date(),
    data: [event.new_data],
    changes: [],
    metrics: []
  });
  
  // Notificar
  for (const insight of insights) {
    await notifier.notify(insight);
  }
}
```

#### 2. **Scheduled Scans (Cron)**

Para análises periódicas:

```typescript
// supabase/functions/agente-scheduler/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  try {
    const scanner = new DatabaseScanner(supabase);
    const analyzer = new IntelligentAnalyzer(supabase);
    const notifier = new IntelligentNotifier(supabase);
    
    // Executar todos os jobs programados
    const jobs = await getScheduledJobs();
    
    for (const job of jobs) {
      if (shouldRun(job)) {
        console.log(`Running job: ${job.id}`);
        
        // Scan
        const scanResult = await scanner.runScan(job.id);
        
        // Analyze
        const insights = await analyzer.analyze(scanResult);
        
        // Notify
        for (const insight of insights) {
          await notifier.notify(insight);
        }
        
        // Atualizar última execução
        await updateJobLastRun(job.id);
      }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in scheduler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

function shouldRun(job: ScanJob): boolean {
  const now = Date.now();
  const lastRun = job.lastRun ? new Date(job.lastRun).getTime() : 0;
  const interval = getIntervalMs(job.frequency);
  
  return (now - lastRun) >= interval;
}

function getIntervalMs(frequency: string): number {
  const intervals = {
    '5min': 5 * 60 * 1000,
    '1hour': 60 * 60 * 1000,
    '1day': 24 * 60 * 60 * 1000
  };
  return intervals[frequency] || intervals['1hour'];
}
```

**Configurar Cron no Supabase:**

```sql
-- Criar extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar execução do agente
SELECT cron.schedule(
  'agente-5min',
  '*/5 * * * *', -- A cada 5 minutos
  $$
  SELECT
    net.http_post(
      url:='https://[seu-projeto].supabase.co/functions/v1/agente-scheduler',
      headers:='{"Authorization": "Bearer [service-role-key]"}'::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'agente-hourly',
  '0 * * * *', -- A cada hora
  $$
  SELECT
    net.http_post(
      url:='https://[seu-projeto].supabase.co/functions/v1/agente-scheduler',
      headers:='{"Authorization": "Bearer [service-role-key]"}'::jsonb,
      body:='{"type": "hourly"}'::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'agente-daily',
  '0 6 * * *', -- Todo dia às 6h
  $$
  SELECT
    net.http_post(
      url:='https://[seu-projeto].supabase.co/functions/v1/agente-scheduler',
      headers:='{"Authorization": "Bearer [service-role-key]"}'::jsonb,
      body:='{"type": "daily"}'::jsonb
    ) as request_id;
  $$
);
```

#### 3. **On-Demand Queries**

Usuário pode consultar o agente diretamente:

```typescript
// frontend/src/app/api/agente/query/route.ts

export async function POST(request: Request) {
  const { question } = await request.json();
  
  // Parse da pergunta
  const intent = parseIntent(question);
  
  // Executar query apropriada
  const result = await executeQuery(intent);
  
  return Response.json({ answer: result });
}

function parseIntent(question: string) {
  // Exemplos de perguntas:
  // "Qual bar tem o melhor NPS este mês?"
  // "Quantos checklists estão atrasados hoje?"
  // "Qual o CMV médio da semana?"
  
  if (question.includes('nps') || question.includes('avaliação')) {
    return { type: 'nps', timeframe: extractTimeframe(question) };
  }
  
  if (question.includes('checklist')) {
    return { type: 'checklist', status: extractStatus(question) };
  }
  
  if (question.includes('cmv')) {
    return { type: 'cmv', timeframe: extractTimeframe(question) };
  }
  
  return { type: 'unknown' };
}

async function executeQuery(intent: any) {
  const supabase = createClientComponentClient();
  
  switch (intent.type) {
    case 'nps':
      const { data: npsData } = await supabase
        .from('nps')
        .select('bar_id, bars(nome), nota')
        .gte('created_at', intent.timeframe.start)
        .lte('created_at', intent.timeframe.end);
      
      // Agrupar e calcular média por bar
      const npsAvg = groupBy(npsData, 'bar_id')
        .map(([barId, notas]) => ({
          bar: notas[0].bars.nome,
          nps: average(notas.map(n => n.nota))
        }))
        .sort((a, b) => b.nps - a.nps);
      
      return {
        text: `Bar com melhor NPS: ${npsAvg[0].bar} (${npsAvg[0].nps.toFixed(1)})`,
        data: npsAvg
      };
      
    case 'checklist':
      const { data: checklistData } = await supabase
        .from('checklist_executions')
        .select('*, bars(nome)')
        .eq('status', 'pendente')
        .lt('data_prevista', new Date().toISOString());
      
      return {
        text: `${checklistData?.length || 0} checklists atrasados`,
        data: checklistData
      };
      
    case 'cmv':
      const { data: cmvData } = await supabase
        .from('contahub_periodo')
        .select('cmv_percentual')
        .gte('data', intent.timeframe.start)
        .lte('data', intent.timeframe.end);
      
      const cmvAvg = average(cmvData?.map(d => d.cmv_percentual) || []);
      
      return {
        text: `CMV médio: ${cmvAvg.toFixed(1)}%`,
        data: cmvAvg
      };
      
    default:
      return {
        text: 'Desculpe, não entendi sua pergunta.',
        suggestions: [
          'Qual bar tem o melhor NPS este mês?',
          'Quantos checklists estão atrasados hoje?',
          'Qual o CMV médio da semana?'
        ]
      };
  }
}
```

### Tabelas Prioritárias para Monitorar

**Alta Prioridade (Real-time):**
```typescript
const realtimeTables = [
  'nps',                      // Avaliações de clientes
  'checklist_executions',     // Execução de checklists
  'contahub_alertas',        // Alertas do ContaHub
  'security_events',         // Eventos de segurança
  'whatsapp_messages'        // Mensagens WhatsApp
];
```

**Média Prioridade (Hourly):**
```typescript
const hourlyTables = [
  'estoque_insumos',         // Estoque
  'contahub_tempo',          // Dados horários
  'checklist_agendamentos',  // Agendamentos
  'eventos_base',            // Eventos próximos
  'producoes'                // Produção
];
```

**Baixa Prioridade (Daily):**
```typescript
const dailyTables = [
  'contahub_periodo',        // Período completo
  'cmv_semanal',            // CMV semanal
  'desempenho_semanal',     // Desempenho
  'cliente_estatisticas',   // Estatísticas agregadas
  'sistema_kpis'            // KPIs do sistema
];
```

---

## 🚨 Alertas e Notificações

### Categorias de Alertas

#### 1. **Crítico (Immediate Action Required)**

```typescript
const criticalAlerts = {
  nps_muito_baixo: {
    condition: (nota) => nota <= 3,
    severity: 'critical',
    channels: ['discord', 'whatsapp', 'in-app'],
    recipients: ['owner', 'manager'],
    message: '🔴 URGENTE: Cliente muito insatisfeito!'
  },
  
  estoque_zerado: {
    condition: (qty) => qty === 0,
    severity: 'critical',
    channels: ['discord', 'whatsapp', 'in-app'],
    recipients: ['owner', 'manager', 'operations'],
    message: '🔴 CRÍTICO: Insumo zerado!'
  },
  
  falha_integracao: {
    condition: (error) => error.attempts > 5,
    severity: 'critical',
    channels: ['discord', 'in-app'],
    recipients: ['tech', 'owner'],
    message: '🔴 FALHA: Integração offline!'
  }
};
```

#### 2. **Alto (Action Needed Soon)**

```typescript
const highAlerts = {
  checklist_atrasado: {
    condition: (delay) => delay > 30, // minutos
    severity: 'high',
    channels: ['whatsapp', 'in-app'],
    recipients: ['manager', 'responsible'],
    message: '🚨 Checklist atrasado!'
  },
  
  cmv_alto: {
    condition: (cmv) => cmv > 35,
    severity: 'high',
    channels: ['discord', 'in-app'],
    recipients: ['owner', 'manager'],
    message: '🚨 CMV acima da meta!'
  },
  
  producao_baixa: {
    condition: (prod, meta) => prod < meta * 0.7,
    severity: 'high',
    channels: ['discord', 'in-app'],
    recipients: ['manager', 'operations'],
    message: '🚨 Produção 30% abaixo da meta!'
  }
};
```

#### 3. **Médio (Monitor Closely)**

```typescript
const mediumAlerts = {
  estoque_baixo: {
    condition: (qty, min) => qty <= min && qty > 0,
    severity: 'medium',
    channels: ['in-app'],
    recipients: ['manager', 'operations'],
    message: '⚠️ Estoque abaixo do mínimo'
  },
  
  evento_proximo: {
    condition: (days) => days <= 3,
    severity: 'medium',
    channels: ['in-app'],
    recipients: ['manager'],
    message: '⚠️ Evento em 3 dias - preparar'
  }
};
```

#### 4. **Baixo (Informational)**

```typescript
const lowAlerts = {
  insight_mensal: {
    severity: 'low',
    channels: ['in-app'],
    recipients: ['owner'],
    message: 'ℹ️ Relatório mensal disponível'
  },
  
  padrão_descoberto: {
    severity: 'low',
    channels: ['in-app'],
    recipients: ['owner'],
    message: 'ℹ️ Novo padrão identificado'
  }
};
```

### Smart Notifications (Evitar Spam)

```typescript
class SmartNotifier {
  private recentAlerts: Map<string, Date> = new Map();
  
  async notify(insight: Insight) {
    // Verificar se já enviou alerta similar recentemente
    const key = `${insight.type}-${insight.data.bar_id}`;
    const lastSent = this.recentAlerts.get(key);
    
    if (lastSent) {
      const hoursSince = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
      
      // Não enviar se:
      // - Criticidade baixa e enviou há menos de 24h
      // - Criticidade média e enviou há menos de 6h
      // - Criticidade alta e enviou há menos de 2h
      
      const cooldown = {
        low: 24,
        medium: 6,
        high: 2,
        critical: 0 // Sempre enviar críticos
      };
      
      if (hoursSince < cooldown[insight.severity]) {
        console.log(`Skipping notification (cooldown): ${key}`);
        return;
      }
    }
    
    // Enviar notificação
    await this.sendNotification(insight);
    
    // Registrar envio
    this.recentAlerts.set(key, new Date());
  }
  
  // Agrupar alertas similares
  async groupAlerts(insights: Insight[]): Promise<Insight[]> {
    const grouped = new Map<string, Insight[]>();
    
    for (const insight of insights) {
      const key = insight.type;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(insight);
    }
    
    const result: Insight[] = [];
    
    for (const [type, group] of grouped) {
      if (group.length === 1) {
        result.push(group[0]);
      } else {
        // Criar insight agrupado
        result.push({
          id: crypto.randomUUID(),
          timestamp: new Date(),
          type: type,
          severity: group[0].severity,
          title: `${group.length} ${group[0].title}`,
          description: `Múltiplas ocorrências detectadas`,
          data: group.map(i => i.data),
          recommendations: group[0].recommendations,
          priority: group[0].priority
        });
      }
    }
    
    return result;
  }
}
```

---

## 💻 Implementação Prática

### Passo 1: Estrutura de Banco de Dados

```sql
-- Criar tabelas do agente
CREATE TABLE agente_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  data JSONB,
  recommendations TEXT[],
  priority INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agente_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_id UUID REFERENCES agente_insights(id),
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  action_taken BOOLEAN DEFAULT FALSE,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agente_learning_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id TEXT UNIQUE NOT NULL,
  accuracy DECIMAL(5,4),
  threshold DECIMAL(10,4),
  confidence DECIMAL(5,4),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agente_scan_jobs (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  frequency TEXT NOT NULL,
  query TEXT NOT NULL,
  last_run TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agente_notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_id UUID REFERENCES agente_insights(id),
  channels_used TEXT[],
  recipients TEXT[],
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_insights_type ON agente_insights(type);
CREATE INDEX idx_insights_severity ON agente_insights(severity);
CREATE INDEX idx_insights_created_at ON agente_insights(created_at DESC);
CREATE INDEX idx_feedback_insight ON agente_feedback(insight_id);
CREATE INDEX idx_feedback_user ON agente_feedback(user_id);
```

### Passo 2: Edge Functions

Criar estrutura de Edge Functions:

```bash
# No terminal
cd backend/supabase/functions

# Criar funções do agente
mkdir agente-scanner
mkdir agente-analyzer
mkdir agente-notifier
mkdir agente-learning
mkdir agente-scheduler
mkdir agente-realtime
```

Cada função terá um `index.ts` com a implementação correspondente (já detalhadas anteriormente).

### Passo 3: Frontend - Dashboard do Agente

```tsx
// frontend/src/app/agente/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Bell, TrendingUp, AlertTriangle, Info } from 'lucide-react';

interface Insight {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendations: string[];
  priority: number;
  created_at: string;
}

export default function AgenteDashboard() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [filter, setFilter] = useState<string>('all');
  
  useEffect(() => {
    loadInsights();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadInsights, 30000);
    return () => clearInterval(interval);
  }, [filter]);
  
  async function loadInsights() {
    const response = await fetch('/api/agente/insights' + 
      (filter !== 'all' ? `?severity=${filter}` : ''));
    const data = await response.json();
    setInsights(data);
  }
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium': return <Bell className="w-5 h-5 text-yellow-600" />;
      case 'low': return <Info className="w-5 h-5 text-blue-600" />;
    }
  };
  
  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    };
    
    return <Badge className={variants[severity]}>{severity.toUpperCase()}</Badge>;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="card-dark p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="card-title-dark">🤖 Agente Inteligente Zykor</h1>
              <p className="card-description-dark">
                Insights automáticos e alertas em tempo real
              </p>
            </div>
            
            <Button onClick={loadInsights}>
              Atualizar
            </Button>
          </div>
          
          <Tabs defaultValue="all" onValueChange={setFilter}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="critical">Críticos</TabsTrigger>
              <TabsTrigger value="high">Altos</TabsTrigger>
              <TabsTrigger value="medium">Médios</TabsTrigger>
              <TabsTrigger value="low">Baixos</TabsTrigger>
            </TabsList>
            
            <div className="space-y-4">
              {insights.map(insight => (
                <Card key={insight.id} className="card-dark">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getSeverityIcon(insight.severity)}
                        <div>
                          <CardTitle className="text-lg">
                            {insight.title}
                          </CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(insight.severity)}
                        <Badge variant="outline">
                          Prioridade: {insight.priority}/10
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {insight.recommendations.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-sm mb-2">
                          💡 Recomendações:
                        </h4>
                        <ul className="space-y-1">
                          {insight.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                              {i + 1}. {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(insight.created_at).toLocaleString('pt-BR')}
                      </span>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Ver Detalhes
                        </Button>
                        <Button size="sm">
                          Dar Feedback
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {insights.length === 0 && (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Nenhum insight no momento. Tudo tranquilo! 🎉
                  </p>
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
```

### Passo 4: API Routes

```typescript
// frontend/src/app/api/agente/insights/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const severity = searchParams.get('severity');
  
  const supabase = createRouteHandlerClient({ cookies });
  
  let query = supabase
    .from('agente_insights')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (severity && severity !== 'all') {
    query = query.eq('severity', severity);
  }
  
  const { data, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}
```

```typescript
// frontend/src/app/api/agente/feedback/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { error } = await supabase
    .from('agente_feedback')
    .insert({
      insight_id: body.insightId,
      user_id: user.id,
      rating: body.rating,
      action_taken: body.actionTaken,
      comment: body.comment
    });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Trigger learning engine
  await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agente-learning`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'feedback',
      data: body
    })
  });
  
  return NextResponse.json({ success: true });
}
```

---

## 🗺️ Roadmap de Desenvolvimento

### Fase 1: MVP (Semanas 1-2) ✅

**Objetivo:** Scanner básico + Alertas críticos

- [ ] Setup de tabelas do agente
- [ ] Implementar Scanner básico
- [ ] Implementar Analyzer com 5 regras principais:
  - Checklist atrasado
  - Estoque baixo
  - CMV alto
  - NPS baixo
  - Falha de integração
- [ ] Implementar Notifier (Discord + In-App)
- [ ] Dashboard básico no frontend
- [ ] Configurar Cron (5min + 1hour)

**Critério de Sucesso:**
- ✅ Agente detecta e notifica 5 tipos de problemas
- ✅ Alertas chegam via Discord e In-App
- ✅ Dashboard mostra insights em tempo real

### Fase 2: Aprendizado (Semanas 3-4) 🔄

**Objetivo:** Implementar feedback e aprendizado

- [ ] Sistema de feedback completo
- [ ] Learning Engine básico
- [ ] Ajuste automático de thresholds
- [ ] Histórico de insights
- [ ] Métricas de accuracy

**Critério de Sucesso:**
- ✅ Usuários podem dar feedback em insights
- ✅ Thresholds se ajustam automaticamente
- ✅ Accuracy > 70% após 2 semanas

### Fase 3: Inteligência Avançada (Semanas 5-8) 🧠

**Objetivo:** Pattern discovery e predições

- [ ] Detecção de correlações
- [ ] Descoberta automática de padrões
- [ ] Sugestão de novas regras
- [ ] Predição de tendências
- [ ] Análise de anomalias (ML)
- [ ] Query natural language (NLP básico)

**Critério de Sucesso:**
- ✅ Agente descobre 3+ padrões não programados
- ✅ Sugere novas regras úteis
- ✅ Prevê problemas antes de ocorrerem

### Fase 4: Expansão de Canais (Semanas 9-10) 📢

**Objetivo:** Mais canais de notificação

- [ ] Integração WhatsApp
- [ ] Notificações por email
- [ ] SMS para alertas críticos
- [ ] Integração com Slack (opcional)
- [ ] Push notifications mobile

**Critério de Sucesso:**
- ✅ 4+ canais de notificação funcionais
- ✅ Smart grouping para evitar spam
- ✅ Configuração personalizada por usuário

### Fase 5: Agente Conversacional (Semanas 11-12) 💬

**Objetivo:** Interação via chat

- [ ] Chat interface no frontend
- [ ] Natural Language Processing
- [ ] Responder perguntas sobre dados
- [ ] Executar queries complexas
- [ ] Gerar relatórios sob demanda
- [ ] Sugerir ações proativamente

**Critério de Sucesso:**
- ✅ Usuários podem conversar com agente
- ✅ Entende 20+ tipos de perguntas
- ✅ Respostas precisas em < 3 segundos

### Fase 6: Automação Completa (Semanas 13-16) 🤖

**Objetivo:** Agente toma ações automaticamente

- [ ] Ações automáticas configuráveis
- [ ] Criação automática de pedidos (estoque)
- [ ] Ajuste automático de agendamentos
- [ ] Redistribuição de tarefas
- [ ] Geração automática de relatórios
- [ ] Self-healing de problemas

**Critério de Sucesso:**
- ✅ 50% dos problemas resolvidos automaticamente
- ✅ 0% de ações incorretas
- ✅ Usuário pode reverter qualquer ação

---

## 📊 Métricas de Sucesso do Agente

### KPIs Principais

```typescript
interface AgentMetrics {
  // Performance
  insightsGenerated: number;        // Total de insights gerados
  insightsActionable: number;       // Insights que geraram ação
  accuracy: number;                 // % de insights úteis
  falsePositiveRate: number;        // % de falsos positivos
  
  // Aprendizado
  rulesActive: number;              // Regras ativas
  rulesAutodiscovered: number;      // Regras descobertas automaticamente
  averageConfidence: number;        // Confiança média dos modelos
  
  // Impacto
  problemsPrevented: number;        // Problemas prevenidos
  hoursTimeSaved: number;          // Horas economizadas da equipe
  issuesDetectedEarly: number;     // Issues detectadas precocemente
  
  // Engajamento
  feedbackReceived: number;         // Feedbacks recebidos
  averageRating: number;           // Rating médio (1-5)
  activeUsers: number;             // Usuários ativos usando agente
}
```

### Dashboard de Métricas

```tsx
// frontend/src/app/agente/metrics/page.tsx

export default function AgentMetrics() {
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  
  useEffect(() => {
    fetch('/api/agente/metrics')
      .then(res => res.json())
      .then(setMetrics);
  }, []);
  
  if (!metrics) return <div>Carregando...</div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Accuracy"
        value={`${(metrics.accuracy * 100).toFixed(1)}%`}
        trend={+2.5}
        icon={<TrendingUp />}
      />
      
      <MetricCard
        title="Insights Gerados"
        value={metrics.insightsGenerated.toString()}
        subtitle={`${metrics.insightsActionable} acionáveis`}
        icon={<Brain />}
      />
      
      <MetricCard
        title="Problemas Prevenidos"
        value={metrics.problemsPrevented.toString()}
        icon={<Shield />}
      />
      
      <MetricCard
        title="Tempo Economizado"
        value={`${metrics.hoursTimeSaved}h`}
        icon={<Clock />}
      />
    </div>
  );
}
```

---

## 🎓 Conclusão

O **Agente Inteligente Zykor** é um sistema completo de análise, monitoramento e aprendizado contínuo que transforma dados brutos em insights acionáveis, detecta problemas precocemente e aprende continuamente com feedback.

### Próximos Passos Imediatos:

1. ✅ **Revisar este documento** e fazer ajustes necessários
2. ✅ **Criar tabelas** no banco de dados (Fase 1)
3. ✅ **Implementar Scanner** básico (Fase 1)
4. ✅ **Configurar primeiras regras** de análise (Fase 1)
5. ✅ **Setup notificações** Discord (Fase 1)
6. ✅ **Dashboard** básico frontend (Fase 1)
7. ✅ **Testar** com dados reais (Fase 1)
8. ✅ **Coletar feedback** e iterar (Fase 2)

### Recursos Necessários:

- **Backend:** Edge Functions do Supabase (já configurado)
- **Database:** PostgreSQL (já configurado)
- **Notificações:** Discord Webhook, WhatsApp API
- **Frontend:** Next.js (já configurado)
- **Cron Jobs:** pg_cron no Supabase

### Estimativa de Tempo:

- **MVP (Fase 1):** 2 semanas
- **Sistema Completo (Fases 1-6):** 3-4 meses
- **Manutenção contínua:** Dedicação parcial ongoing

---

**Este sistema vai revolucionar como você monitora e gerencia o Zykor!** 🚀

Qualquer dúvida sobre implementação, estou aqui para ajudar! 💪
