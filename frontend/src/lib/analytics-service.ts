import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

// ========================================
// ANÁLISES DE CHECKLISTS & OPERACIONAL
// ========================================

export async function getStatusChecklists(bar_id: number, inicio?: string, fim?: string) {
  const dataInicio = inicio || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dataFim = fim || new Date().toISOString().split('T')[0];

  const { data: execucoes } = await supabase
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

  if (!execucoes) return { erro: 'Erro ao buscar dados' };

  const execucoesTyped = execucoes as ChecklistExecucao[];
  const total = execucoesTyped.length;
  const concluidos = execucoesTyped.filter((e: ChecklistExecucao) => e.status === 'concluido').length;
  const pendentes = execucoesTyped.filter((e: ChecklistExecucao) => e.status === 'em_andamento').length;
  const atrasados = execucoesTyped.filter((e: ChecklistExecucao) => e.status === 'atrasado').length;

  const scoresMedio = execucoesTyped
    .filter((e: ChecklistExecucao) => e.pontuacao_final)
    .reduce((acc: number, e: ChecklistExecucao) => acc + (e.pontuacao_final || 0), 0) / execucoesTyped.filter((e: ChecklistExecucao) => e.pontuacao_final).length || 0;

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
    execucoes_detalhes: execucoesTyped.slice(0, 10),
    mensagem: `${concluidos} de ${total} checklists concluídos (${((concluidos/total)*100).toFixed(1)}%)`
  };
}

export async function getPerformanceFuncionarios(bar_id: number, inicio?: string, fim?: string, limite = 10) {
  const { data: execucoes } = await supabase
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

  if (!execucoes) return { erro: 'Erro ao buscar dados' };

  const execucoesTyped = execucoes as (ChecklistExecucao & { executado_por: number; usuarios_bar: { nome: string; email: string } })[];

  // Agrupar por funcionário
  const funcionarios: Record<string, FuncionarioPerformance> = {};
  execucoesTyped.forEach((exec) => {
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

export async function getWhatsAppStats(bar_id: number, inicio?: string, fim?: string) {
  const dataInicio = inicio || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dataFim = fim || new Date().toISOString().split('T')[0];

  const { data: mensagens } = await supabase
    .from('whatsapp_mensagens')
    .select('status, tipo, created_at')
    .eq('bar_id', bar_id)
    .gte('created_at', `${dataInicio}T00:00:00Z`)
    .lte('created_at', `${dataFim}T23:59:59Z`);

  if (!mensagens) return { erro: 'Erro ao buscar dados' };

  const mensagensTyped = mensagens as WhatsAppMensagem[];
  const total = mensagensTyped.length;
  const enviadas = mensagensTyped.filter((m: WhatsAppMensagem) => ['sent', 'delivered', 'read'].includes(m.status)).length;
  const lidas = mensagensTyped.filter((m: WhatsAppMensagem) => m.status === 'read').length;
  const falhas = mensagensTyped.filter((m: WhatsAppMensagem) => m.status === 'failed').length;

  // Estatísticas por tipo
  const tipoStats: Record<string, number> = {};
  mensagensTyped.forEach((m: WhatsAppMensagem) => {
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

export async function getTempoProducao(bar_id: number, inicio?: string, fim?: string) {
  const dataInicio = inicio || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dataFim = fim || new Date().toISOString().split('T')[0];

  const { data: tempos } = await supabase
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

  if (!tempos) return { erro: 'Erro ao buscar dados' };

  const temposTyped = tempos as TempoProducao[];
  const tempoMedioTotal = temposTyped.reduce((acc: number, t: TempoProducao) => acc + (t.tempo_t0_t3 || 0), 0) / temposTyped.length;
  const tempoMedioPrep = temposTyped.reduce((acc: number, t: TempoProducao) => acc + (t.tempo_t0_t1 || 0), 0) / temposTyped.length;
  const tempoMedioCozinha = temposTyped.reduce((acc: number, t: TempoProducao) => acc + (t.tempo_t1_t2 || 0), 0) / temposTyped.length;
  const tempoMedioEntrega = temposTyped.reduce((acc: number, t: TempoProducao) => acc + (t.tempo_t2_t3 || 0), 0) / temposTyped.length;

  // Produtos mais demorados
  const produtosTempo: Record<string, number[]> = {};
  temposTyped.forEach((t: TempoProducao) => {
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
    total_producoes: temposTyped.length,
    mensagem: `Tempo médio de produção: ${(tempoMedioTotal/60).toFixed(1)} minutos`
  };
}

// ========================================
// ANÁLISES DE IA & ANALYTICS
// ========================================

export async function getScoreSaudeGeral(bar_id: number) {
  const hoje = new Date().toISOString().split('T')[0];
  
  const [metricas, anomalias, insights] = await Promise.all([
    supabase
      .from('ai_metrics')
      .select('valor, meta_valor, nome_metrica')
      .eq('bar_id', bar_id)
      .eq('data_referencia', hoje),
    
    supabase
      .from('ai_anomalies')
      .select('severidade')
      .eq('bar_id', bar_id)
      .eq('ainda_ativa', true),
    
    supabase
      .from('ai_insights')
      .select('impacto, urgencia')
      .eq('bar_id', bar_id)
      .gte('created_at', `${hoje}T00:00:00Z`)
  ]);

  let score = 100;

  // Penalizar por anomalias ativas
  const anomaliasTyped = anomalias.data as Anomalia[] || [];
  const anomaliasCriticas = anomaliasTyped.filter((a: Anomalia) => a.severidade === 'critica').length;
  const anomaliasAltas = anomaliasTyped.filter((a: Anomalia) => a.severidade === 'alta').length;
  score -= (anomaliasCriticas * 15) + (anomaliasAltas * 8);

  // Ajustar por métricas vs metas
  const metricasTyped = metricas.data as Metrica[] || [];
  const metricasAbaixoMeta = metricasTyped.filter((m: Metrica) => 
    m.valor < (m.meta_valor * 0.9)
  ).length;
  score -= metricasAbaixoMeta * 5;

  // Bonificar insights positivos
  const insightsTyped = insights.data as Insight[] || [];
  const insightsPositivos = insightsTyped.filter((i: Insight) => 
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

export async function getDashboardExecutivo(bar_id: number, inicio?: string, fim?: string) {
  const dataInicio = inicio || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dataFim = fim || new Date().toISOString().split('T')[0];

  const [
    faturamento,
    checklists,
    whatsapp,
    tempos,
    scoreSaude
  ] = await Promise.all([
    supabase
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

  const faturamentoTyped = faturamento.data as Faturamento[] || [];
  const faturamentoTotal = faturamentoTyped.reduce((acc: number, f: Faturamento) => acc + (f.valor_liquido || 0), 0);
  const transacoes = faturamentoTyped.length;

  return {
    periodo: { inicio: dataInicio, fim: dataFim },
    kpis_principais: {
      faturamento_total: faturamentoTotal,
      total_transacoes: transacoes,
      ticket_medio: transacoes > 0 ? faturamentoTotal / transacoes : 0,
      taxa_conclusao_checklists: checklists.resumo?.taxa_conclusao || 0,
      engagement_whatsapp: whatsapp.estatisticas?.engagement || 0,
      tempo_medio_producao: tempos.tempos_medios?.total_minutos || 0
    },
    score_saude: scoreSaude,
    resumo_operacional: {
      checklists: checklists.resumo,
      whatsapp: whatsapp.estatisticas,
      producao: tempos.tempos_medios
    },
    mensagem: `Dashboard executivo: R$ ${faturamentoTotal.toFixed(2)} em ${transacoes} transações - Score saúde: ${scoreSaude.score_saude}%`
  };
}

// ========================================
// ANÁLISE 360° COMPLETA
// ========================================

export async function getVisao360(bar_id: number, inicio?: string, fim?: string) {
  const dashboard = await getDashboardExecutivo(bar_id, inicio, fim);
  const performance = await getPerformanceFuncionarios(bar_id, inicio, fim, 5);
  
  const [anomalias, insights, recomendacoes] = await Promise.all([
    supabase
      .from('ai_anomalies')
      .select('titulo, severidade, ainda_ativa')
      .eq('bar_id', bar_id)
      .eq('ainda_ativa', true)
      .limit(5),
    
    supabase
      .from('ai_insights')
      .select('titulo, impacto, urgencia')
      .eq('bar_id', bar_id)
      .order('created_at', { ascending: false })
      .limit(5),
    
    supabase
      .from('ai_recommendations')
      .select('titulo, roi_estimado, prioridade')
      .eq('bar_id', bar_id)
      .order('prioridade', { ascending: false })
      .limit(5)
  ]);

  const insightsTyped = insights.data as Insight[] || [];
  const recomendacoesTyped = recomendacoes.data as { titulo: string; roi_estimado: number; prioridade: number }[] || [];

  return {
    visao_geral: dashboard,
    equipe: performance,
    alertas: {
      anomalias_ativas: anomalias.data || [],
      insights_recentes: insightsTyped,
      recomendacoes_prioritarias: recomendacoesTyped
    },
    resumo_inteligencia: {
      total_anomalias_ativas: anomalias.data?.length || 0,
      insights_criticos: insightsTyped.filter((i: Insight) => i.impacto === 'critico').length,
      recomendacoes_altas: recomendacoesTyped.filter((r) => r.prioridade >= 8).length
    },
    mensagem: 'Análise 360° completa do estabelecimento'
  };
} 

