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

﻿import { createClient } from '@supabase/supabase-js';

// Configuração mais robusta do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificação mais segura das variáveis de ambiente
if (!supabaseUrl) {
  console.warn('NEXT_PUBLIC_SUPABASE_URL não está configurada');
}

if (!supabaseKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY não está configurada');
}

// Criação do cliente com fallback
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Função helper para verificar se o cliente está disponível
function checkSupabaseClient() {
  if (!supabase) {
    throw new Error('Cliente Supabase não está configurado. Verifique as variáveis de ambiente.');
  }
  return supabase;
}

// ========================================
// INTERFACES PARA TIPAGEM
// ========================================

interface ChecklistExecucao {
  status: string;
  pontuacao_final?: number;
  tempo_execucao_minutos?: number;
  created_at: string;
  checklists: { nome: string };
  usuarios_bar: { nome: string };
}

interface FuncionarioPerformance {
  nome: string;
  email: string;
  total_execucoes: number;
  score_total: number;
  tempo_total: number;
  scores: number[];
  score_medio?: number;
  tempo_medio?: number;
  consistencia?: number;
}

interface WhatsAppMensagem {
  status: string;
  tipo: string;
  created_at: string;
}

interface TempoProducao {
  tempo_t0_t1?: number;
  tempo_t1_t2?: number;
  tempo_t2_t3?: number;
  tempo_t0_t3?: number;
  prd_desc: string;
  dia: string;
}

interface Anomalia {
  severidade: string;
  ainda_ativa: boolean;
}

interface Metrica {
  valor: number;
  meta_valor: number;
  nome_metrica: string;
}

interface Insight {
  impacto: string;
  urgencia: string;
}

interface Faturamento {
  valor_liquido: number;
}

interface ProdutoTempo {
  produto: string;
  tempo_medio: number;
  total_pedidos: number;
}

interface ChecklistResult {
  erro?: string;
  periodo?: { inicio: string; fim: string };
  resumo?: {
    total_execucoes: number;
    concluidos: number;
    pendentes: number;
    atrasados: number;
    taxa_conclusao: number;
    score_medio: number;
  };
  execucoes_detalhes?: ChecklistExecucao[];
  mensagem?: string;
}

interface PerformanceResult {
  erro?: string;
  ranking_funcionarios?: Array<FuncionarioPerformance & { posicao: number }>;
  estatisticas?: {
    total_funcionarios: number;
    melhor_score: number;
    melhor_funcionario: string;
  };
  mensagem?: string;
}

interface WhatsAppResult {
  erro?: string;
  periodo?: { inicio: string; fim: string };
  estatisticas?: {
    total_mensagens: number;
    taxa_entrega: number;
    taxa_leitura: number;
    taxa_falha: number;
    engagement: number;
  };
  por_tipo?: Record<string, number>;
  mensagem?: string;
}

interface TempoResult {
  erro?: string;
  periodo?: { inicio: string; fim: string };
  tempos_medios?: {
    total_segundos: number;
    total_minutos: number;
    preparacao: number;
    cozinha: number;
    entrega: number;
  };
  produtos_mais_demorados?: ProdutoTempo[];
  total_producoes?: number;
  mensagem?: string;
}

interface ScoreSaudeResult {
  score_saude: number;
  status: string;
  fatores: {
    anomalias_criticas: number;
    anomalias_altas: number;
    metricas_abaixo_meta: number;
    insights_positivos: number;
  };
  mensagem: string;
}

interface DashboardResult {
  periodo: { inicio: string; fim: string };
  kpis_principais: {
    faturamento_total: number;
    total_transacoes: number;
    ticket_medio: number;
    taxa_conclusao_checklists: number;
    engagement_whatsapp: number;
    tempo_medio_producao: number;
  };
  score_saude: ScoreSaudeResult;
  resumo_operacional: {
    checklists?: ChecklistResult['resumo'];
    whatsapp?: WhatsAppResult['estatisticas'];
    producao?: TempoResult['tempos_medios'];
  };
  mensagem: string;
}

interface Visao360Result {
  visao_geral: DashboardResult;
  equipe: PerformanceResult;
  alertas: {
    anomalias_ativas: unknown[];
    insights_recentes: Insight[];
    recomendacoes_prioritarias: Array<{ titulo: string; roi_estimado: number; prioridade: number }>;
  };
  resumo_inteligencia: {
    total_anomalias_ativas: number;
    insights_criticos: number;
    recomendacoes_altas: number;
  };
  mensagem: string;
}

// ========================================
// ANÁLISES DE CHECKLISTS & OPERACIONAL
// ========================================

export async function getStatusChecklists(bar_id: number, inicio?: string, fim?: string): Promise<ChecklistResult> {
  const dataInicio = inicio || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dataFim = fim || new Date().toISOString().split('T')[0];

  const response = await (checkSupabaseClient() as unknown)
    .from('checklist_execucoes')
    .select(`
      status,
      pontuacao_final,
      tempo_execucao_minutos,
      created_at,
      checklists!inner(nome),
      usuarios_bar!inner(nome)
    `)
    .eq('bar_id', bar_id)
    .gte('created_at', `${dataInicio}T00:00:00Z`)
    .lte('created_at', `${dataFim}T23:59:59Z`);

  const execucoes = response.data as ChecklistExecucao[] | null;
  if (!execucoes) return { erro: 'Erro ao buscar dados' };
  const total = execucoes.length;
  const concluidos = execucoes.filter((e: ChecklistExecucao) => e.status === 'concluido').length;
  const pendentes = execucoes.filter((e: ChecklistExecucao) => e.status === 'em_andamento').length;
  const atrasados = execucoes.filter((e: ChecklistExecucao) => e.status === 'atrasado').length;

  const scoresMedio = execucoes
    .filter((e: ChecklistExecucao) => e.pontuacao_final)
    .reduce((acc: number, e: ChecklistExecucao) => acc + (e.pontuacao_final || 0), 0) / execucoes.filter((e: ChecklistExecucao) => e.pontuacao_final).length || 0;

  return {
    periodo: { inicio: dataInicio, fim: dataFim },
    resumo: {
      total_execucoes: total,
      concluidos,
      pendentes,
      atrasados,
      taxa_conclusao: total > 0 ? (concluidos / total) * 100 : 0,
      score_medio: scoresMedio
    },
    execucoes_detalhes: execucoes.slice(0, 10),
    mensagem: `${concluidos} de ${total} checklists concluídos (${((concluidos/total)*100).toFixed(1)}%)`
  };
}

export async function getPerformanceFuncionarios(bar_id: number, inicio?: string, fim?: string, limite = 10): Promise<PerformanceResult> {
  const response = await (checkSupabaseClient() as unknown)
    .from('checklist_execucoes')
    .select(`
      executado_por,
      status,
      pontuacao_final,
      tempo_execucao_minutos,
      usuarios_bar!inner(nome, email)
    `)
    .eq('bar_id', bar_id)
    .eq('status', 'concluido');

  const execucoes = response.data as (ChecklistExecucao & { executado_por: number; usuarios_bar: { nome: string; email: string } })[] | null;
  if (!execucoes) return { erro: 'Erro ao buscar dados' };

  // Agrupar por funcionário
  const funcionarios: Record<string, FuncionarioPerformance> = {};
  execucoes.forEach((exec) => {
    const id = exec.executado_por.toString();
    if (!funcionarios[id]) {
      funcionarios[id] = {
        nome: exec.usuarios_bar.nome,
        email: exec.usuarios_bar.email,
        total_execucoes: 0,
        score_total: 0,
        tempo_total: 0,
        scores: []
      };
    }
    funcionarios[id].total_execucoes++;
    funcionarios[id].score_total += exec.pontuacao_final || 0;
    funcionarios[id].tempo_total += exec.tempo_execucao_minutos || 0;
    funcionarios[id].scores.push(exec.pontuacao_final || 0);
  });

  const ranking = Object.values(funcionarios)
    .map((func) => ({
      ...func,
      score_medio: func.total_execucoes > 0 ? func.score_total / func.total_execucoes : 0,
      tempo_medio: func.total_execucoes > 0 ? func.tempo_total / func.total_execucoes : 0,
      consistencia: func.scores.length > 1 ? 
        (func.scores.reduce((sum: number, score: number) => sum + Math.abs(score - (func.score_total / func.total_execucoes)), 0) / func.scores.length) : 0
    }))
    .sort((a, b) => (b.score_medio || 0) - (a.score_medio || 0))
    .slice(0, limite);

  return {
    ranking_funcionarios: ranking.map((f, index) => ({
      posicao: index + 1,
      ...f
    })),
    estatisticas: {
      total_funcionarios: Object.keys(funcionarios).length,
      melhor_score: ranking[0]?.score_medio || 0,
      melhor_funcionario: ranking[0]?.nome || 'N/A'
    },
    mensagem: `Ranking de ${ranking.length} funcionários por performance`
  };
}

// ========================================
// ANÁLISES DE WHATSAPP
// ========================================

export async function getWhatsAppStats(bar_id: number, inicio?: string, fim?: string): Promise<WhatsAppResult> {
  const dataInicio = inicio || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dataFim = fim || new Date().toISOString().split('T')[0];

  const response = await (checkSupabaseClient() as unknown)
    .from('whatsapp_mensagens')
    .select('status, tipo, created_at')
    .eq('bar_id', bar_id)
    .gte('created_at', `${dataInicio}T00:00:00Z`)
    .lte('created_at', `${dataFim}T23:59:59Z`);

  const mensagens = response.data as WhatsAppMensagem[] | null;
  if (!mensagens) return { erro: 'Erro ao buscar dados' };
  const total = mensagens.length;
  const enviadas = mensagens.filter((m: WhatsAppMensagem) => ['sent', 'delivered', 'read'].includes(m.status)).length;
  const lidas = mensagens.filter((m: WhatsAppMensagem) => m.status === 'read').length;
  const falhas = mensagens.filter((m: WhatsAppMensagem) => m.status === 'failed').length;

  // Estatísticas por tipo
  const tipoStats: Record<string, number> = {};
  mensagens.forEach((m: WhatsAppMensagem) => {
    tipoStats[m.tipo] = (tipoStats[m.tipo] || 0) + 1;
  });

  return {
    periodo: { inicio: dataInicio, fim: dataFim },
    estatisticas: {
      total_mensagens: total,
      taxa_entrega: total > 0 ? (enviadas / total) * 100 : 0,
      taxa_leitura: total > 0 ? (lidas / total) * 100 : 0,
      taxa_falha: total > 0 ? (falhas / total) * 100 : 0,
      engagement: total > 0 ? ((lidas + (enviadas * 0.5)) / total) * 100 : 0
    },
    por_tipo: tipoStats,
    mensagem: `${total} mensagens enviadas com ${((lidas/total)*100).toFixed(1)}% de taxa de leitura`
  };
}

// ========================================
// ANÁLISES DE PRODUÇÃO & TEMPO  
// ========================================

export async function getTempoProducao(bar_id: number, inicio?: string, fim?: string): Promise<TempoResult> {
  const dataInicio = inicio || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dataFim = fim || new Date().toISOString().split('T')[0];

  const response = await (checkSupabaseClient() as unknown)
    .from('contahub_tempo')
    .select(`
      tempo_t0_t1,
      tempo_t1_t2,
      tempo_t2_t3,
      tempo_t0_t3,
      prd_desc,
      dia
    `)
    .eq('bar_id', bar_id)
    .gte('dia', `${dataInicio}T00:00:00`)
    .lte('dia', `${dataFim}T23:59:59`);

  const tempos = response.data as TempoProducao[] | null;
  if (!tempos) return { erro: 'Erro ao buscar dados' };
  const tempoMedioTotal = tempos.reduce((acc: number, t: TempoProducao) => acc + (t.tempo_t0_t3 || 0), 0) / tempos.length;
  const tempoMedioPrep = tempos.reduce((acc: number, t: TempoProducao) => acc + (t.tempo_t0_t1 || 0), 0) / tempos.length;
  const tempoMedioCozinha = tempos.reduce((acc: number, t: TempoProducao) => acc + (t.tempo_t1_t2 || 0), 0) / tempos.length;
  const tempoMedioEntrega = tempos.reduce((acc: number, t: TempoProducao) => acc + (t.tempo_t2_t3 || 0), 0) / tempos.length;

  // Produtos mais demorados
  const produtosTempo: Record<string, number[]> = {};
  tempos.forEach((t: TempoProducao) => {
    if (!produtosTempo[t.prd_desc]) produtosTempo[t.prd_desc] = [];
    produtosTempo[t.prd_desc].push(t.tempo_t0_t3 || 0);
  });

  const produtosMaisDemorados: ProdutoTempo[] = Object.entries(produtosTempo)
    .map(([produto, tempos]) => ({
      produto,
      tempo_medio: tempos.reduce((a: number, b: number) => a + b, 0) / tempos.length,
      total_pedidos: tempos.length
    }))
    .sort((a, b) => b.tempo_medio - a.tempo_medio)
    .slice(0, 5);

  return {
    periodo: { inicio: dataInicio, fim: dataFim },
    tempos_medios: {
      total_segundos: tempoMedioTotal,
      total_minutos: tempoMedioTotal / 60,
      preparacao: tempoMedioPrep,
      cozinha: tempoMedioCozinha,
      entrega: tempoMedioEntrega
    },
    produtos_mais_demorados: produtosMaisDemorados,
    total_producoes: tempos.length,
    mensagem: `Tempo médio de produção: ${(tempoMedioTotal/60).toFixed(1)} minutos`
  };
}

// ========================================
// ANÁLISES DE IA & ANALYTICS
// ========================================

export async function getScoreSaudeGeral(bar_id: number): Promise<ScoreSaudeResult> {
  const hoje = new Date().toISOString().split('T')[0];
  
  const [metricasResponse, anomaliasResponse, insightsResponse] = await Promise.all([
    (checkSupabaseClient() as unknown)
      .from('ai_metrics')
      .select('valor, meta_valor, nome_metrica')
      .eq('bar_id', bar_id)
      .eq('data_referencia', hoje),
    
    (checkSupabaseClient() as unknown)
      .from('ai_anomalies')
      .select('severidade')
      .eq('bar_id', bar_id)
      .eq('ainda_ativa', true),
    
    (checkSupabaseClient() as unknown)
      .from('ai_insights')
      .select('impacto, urgencia')
      .eq('bar_id', bar_id)
      .gte('created_at', `${hoje}T00:00:00Z`)
  ]);

  let score = 100;

  // Penalizar por anomalias ativas
  const anomalias = anomaliasResponse.data as Anomalia[] || [];
  const anomaliasCriticas = anomalias.filter((a: Anomalia) => a.severidade === 'critica').length;
  const anomaliasAltas = anomalias.filter((a: Anomalia) => a.severidade === 'alta').length;
  score -= (anomaliasCriticas * 15) + (anomaliasAltas * 8);

  // Ajustar por métricas vs metas
  const metricas = metricasResponse.data as Metrica[] || [];
  const metricasAbaixoMeta = metricas.filter((m: Metrica) => 
    m.valor < (m.meta_valor * 0.9)
  ).length;
  score -= metricasAbaixoMeta * 5;

  // Bonificar insights positivos
  const insights = insightsResponse.data as Insight[] || [];
  const insightsPositivos = insights.filter((i: Insight) => 
    i.impacto === 'positivo'
  ).length;
  score += insightsPositivos * 2;

  score = Math.max(0, Math.min(100, score));

  let status = 'excelente';
  if (score < 40) status = 'critico';
  else if (score < 60) status = 'ruim';
  else if (score < 75) status = 'regular';
  else if (score < 90) status = 'bom';

  return {
    score_saude: score,
    status,
    fatores: {
      anomalias_criticas: anomaliasCriticas,
      anomalias_altas: anomaliasAltas,
      metricas_abaixo_meta: metricasAbaixoMeta,
      insights_positivos: insightsPositivos
    },
    mensagem: `Score de saúde: ${score}% - Status: ${status.toUpperCase()}`
  };
}

// ========================================
// DASHBOARD EXECUTIVO COMPLETO
// ========================================

export async function getDashboardExecutivo(bar_id: number, inicio?: string, fim?: string): Promise<DashboardResult> {
  const dataInicio = inicio || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dataFim = fim || new Date().toISOString().split('T')[0];

  const [
    faturamentoResponse,
    checklists,
    whatsapp,
    tempos,
    scoreSaude
  ] = await Promise.all([
    (checkSupabaseClient() as unknown)
      .from('contahub_pagamentos')
      .select('valor_liquido')
      .eq('bar_id', bar_id)
      .gte('dt_gerencial', dataInicio)
      .lte('dt_gerencial', dataFim),
    
    getStatusChecklists(bar_id, inicio, fim),
    getWhatsAppStats(bar_id, inicio, fim),
    getTempoProducao(bar_id, inicio, fim),
    getScoreSaudeGeral(bar_id)
  ]);

  const faturamento = faturamentoResponse.data as Faturamento[] || [];
  const faturamentoTotal = faturamento.reduce((acc: number, f: Faturamento) => acc + (f.valor_liquido || 0), 0);
  const transacoes = faturamento.length;

  const taxaConclusaoChecklists = checklists.resumo?.taxa_conclusao || 0;
  const engagementWhatsapp = whatsapp.estatisticas?.engagement || 0;
  const tempoMedioProducao = tempos.tempos_medios?.total_minutos || 0;
  const scoreSaudeValue = scoreSaude.score_saude;

  return {
    periodo: { inicio: dataInicio, fim: dataFim },
    kpis_principais: {
      faturamento_total: faturamentoTotal,
      total_transacoes: transacoes,
      ticket_medio: transacoes > 0 ? faturamentoTotal / transacoes : 0,
      taxa_conclusao_checklists: taxaConclusaoChecklists,
      engagement_whatsapp: engagementWhatsapp,
      tempo_medio_producao: tempoMedioProducao
    },
    score_saude: scoreSaude,
    resumo_operacional: {
      checklists: checklists.resumo,
      whatsapp: whatsapp.estatisticas,
      producao: tempos.tempos_medios
    },
    mensagem: `Dashboard executivo: R$ ${faturamentoTotal.toFixed(2)} em ${transacoes} transações - Score saúde: ${scoreSaudeValue}%`
  };
}

// ========================================
// ANÁLISE 360° COMPLETA
// ========================================

export async function getVisao360(bar_id: number, inicio?: string, fim?: string): Promise<Visao360Result> {
  const dashboard = await getDashboardExecutivo(bar_id, inicio, fim);
  const performance = await getPerformanceFuncionarios(bar_id, inicio, fim, 5);
  
  const [anomaliasResponse, insightsResponse, recomendacoesResponse] = await Promise.all([
    (checkSupabaseClient() as unknown)
      .from('ai_anomalies')
      .select('titulo, severidade, ainda_ativa')
      .eq('bar_id', bar_id)
      .eq('ainda_ativa', true)
      .limit(5),
    
    (checkSupabaseClient() as unknown)
      .from('ai_insights')
      .select('titulo, impacto, urgencia')
      .eq('bar_id', bar_id)
      .order('created_at', { ascending: false })
      .limit(5),
    
    (checkSupabaseClient() as unknown)
      .from('ai_recommendations')
      .select('titulo, roi_estimado, prioridade')
      .eq('bar_id', bar_id)
      .order('prioridade', { ascending: false })
      .limit(5)
  ]);

  const insightsTyped = insightsResponse.data as Insight[] || [];
  const recomendacoesTyped = recomendacoesResponse.data as { titulo: string; roi_estimado: number; prioridade: number }[] || [];

  return {
    visao_geral: dashboard,
    equipe: performance,
    alertas: {
      anomalias_ativas: anomaliasResponse.data || [],
      insights_recentes: insightsTyped,
      recomendacoes_prioritarias: recomendacoesTyped
    },
    resumo_inteligencia: {
      total_anomalias_ativas: anomaliasResponse.data?.length || 0,
      insights_criticos: insightsTyped.filter((i: Insight) => i.impacto === 'critico').length,
      recomendacoes_altas: recomendacoesTyped.filter((r) => r.prioridade >= 8).length
    },
    mensagem: 'Análise 360° completa do estabelecimento'
  };
} 

