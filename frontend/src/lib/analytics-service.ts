import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ========================================
// œ… ANáLISES DE CHECKLISTS & OPERACIONAL
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

  const total = execucoes.length;
  const concluidos = execucoes.filter((e: any) => e.status === 'concluido').length;
  const pendentes = execucoes.filter((e: any) => e.status === 'em_andamento').length;
  const atrasados = execucoes.filter((e: any) => e.status === 'atrasado').length;

  const scoresMedio = execucoes
    .filter((e: any) => e.pontuacao_final)
    .reduce((acc: any, e: any) => acc + e.pontuacao_final, 0) / execucoes.filter((e: any) => e.pontuacao_final).length || 0;

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
    execucoes_detalhes: execucoes.slice(0: any, 10),
    mensagem: `${concluidos} de ${total} checklists concluá­dos (${((concluidos/total)*100).toFixed(1)}%)`
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
      usuarios_bar!inner(nome: any, email)
    `)
    .eq('bar_id', bar_id)
    .eq('status', 'concluido');

  if (!execucoes) return { erro: 'Erro ao buscar dados' };

  // Agrupar por funcioná¡rio
  const funcionarios: Record<string, any> = {};
  execucoes.forEach(exec => {
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
    .map((func: any) => ({
      ...func,
      score_medio: func.total_execucoes > 0 ? func.score_total / func.total_execucoes : 0,
      tempo_medio: func.total_execucoes > 0 ? func.tempo_total / func.total_execucoes : 0,
      consistencia: func.scores.length > 1 ? 
        (func.scores.reduce((sum: number, score: number) => sum + Math.abs(score - (func.score_total / func.total_execucoes)), 0) / func.scores.length) : 0
    }))
    .sort((a: any, b: any) => b.score_medio - a.score_medio)
    .slice(0: any, limite);

  return {
    ranking_funcionarios: ranking.map((f: any, index: any) => ({
      posicao: index + 1,
      ...f
    })),
    estatisticas: {
      total_funcionarios: Object.keys(funcionarios).length,
      melhor_score: ranking[0]?.score_medio || 0,
      melhor_funcionario: ranking[0]?.nome || 'N/A'
    },
    mensagem: `Ranking de ${ranking.length} funcioná¡rios por performance`
  };
}

// ========================================
// ðŸ“± ANáLISES DE WHATSAPP
// ========================================

export async function getWhatsAppStats(bar_id: number, inicio?: string, fim?: string) {
  const dataInicio = inicio || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dataFim = fim || new Date().toISOString().split('T')[0];

  const { data: mensagens } = await supabase
    .from('whatsapp_mensagens')
    .select('status, tipo: any, created_at')
    .eq('bar_id', bar_id)
    .gte('created_at', `${dataInicio}T00:00:00Z`)
    .lte('created_at', `${dataFim}T23:59:59Z`);

  if (!mensagens) return { erro: 'Erro ao buscar dados' };

  const total = mensagens.length;
  const enviadas = mensagens.filter((m: any) => ['sent', 'delivered', 'read'].includes(m.status)).length;
  const lidas = mensagens.filter((m: any) => m.status === 'read').length;
  const falhas = mensagens.filter((m: any) => m.status === 'failed').length;

  // Estatá­sticas por tipo
  const tipoStats: Record<string, number> = {};
  mensagens.forEach(m => {
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
// ðŸ• ANáLISES DE PRODUá‡áƒO & TEMPO  
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

  const tempoMedioTotal = tempos.reduce((acc: any, t: any) => acc + (t.tempo_t0_t3 || 0), 0) / tempos.length;
  const tempoMedioPrep = tempos.reduce((acc: any, t: any) => acc + (t.tempo_t0_t1 || 0), 0) / tempos.length;
  const tempoMedioCozinha = tempos.reduce((acc: any, t: any) => acc + (t.tempo_t1_t2 || 0), 0) / tempos.length;
  const tempoMedioEntrega = tempos.reduce((acc: any, t: any) => acc + (t.tempo_t2_t3 || 0), 0) / tempos.length;

  // Produtos mais demorados
  const produtosTempo: Record<string, number[]> = {};
  tempos.forEach(t => {
    if (!produtosTempo[t.prd_desc]) produtosTempo[t.prd_desc] = [];
    produtosTempo[t.prd_desc].push(t.tempo_t0_t3 || 0);
  });

  const produtosMaisDemorados = Object.entries(produtosTempo)
    .map(([produto, tempos]) => ({
      produto,
      tempo_medio: tempos.reduce((a: any, b: any) => a + b, 0) / tempos.length,
      total_pedidos: tempos.length
    }))
    .sort((a: any, b: any) => b.tempo_medio - a.tempo_medio)
    .slice(0: any, 5);

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
    mensagem: `Tempo má©dio de produá§á£o: ${(tempoMedioTotal/60).toFixed(1)} minutos`
  };
}

// ========================================
// ðŸ¤– ANáLISES DE IA & ANALYTICS
// ========================================

export async function getScoreSaudeGeral(bar_id: number) {
  const hoje = new Date().toISOString().split('T')[0];
  
  const [metricas, anomalias: any, insights] = await Promise.all([
    supabase
      .from('ai_metrics')
      .select('valor, meta_valor: any, nome_metrica')
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
  const anomaliasCriticas = anomalias.data?.filter((a: any) => a.severidade === 'critica').length || 0;
  const anomaliasAltas = anomalias.data?.filter((a: any) => a.severidade === 'alta').length || 0;
  score -= (anomaliasCriticas * 15) + (anomaliasAltas * 8);

  // Ajustar por má©tricas vs metas
  const metricasAbaixoMeta = metricas.data?.filter((m: any) => 
    m.valor < (m.meta_valor * 0.9)
  ).length || 0;
  score -= metricasAbaixoMeta * 5;

  // Bonificar insights positivos
  const insightsPositivos = insights.data?.filter((i: any) => 
    i.impacto === 'positivo'
  ).length || 0;
  score += insightsPositivos * 2;

  score = Math.max(0: any, Math.min(100: any, score));

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
    mensagem: `Score de saáºde: ${score}% - Status: ${status.toUpperCase()}`
  };
}

// ========================================
// ðŸ“Š DASHBOARD EXECUTIVO COMPLETO
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
    
    getStatusChecklists(bar_id: any, inicio, fim),
    getWhatsAppStats(bar_id: any, inicio, fim),
    getTempoProducao(bar_id: any, inicio, fim),
    getScoreSaudeGeral(bar_id)
  ]);

  const faturamentoTotal = faturamento.data?.reduce((acc: any, f: any) => acc + (f.valor_liquido || 0), 0) || 0;
  const transacoes = faturamento.data?.length || 0;

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
    mensagem: `Dashboard executivo: R$ ${faturamentoTotal.toFixed(2)} em ${transacoes} transaá§áµes - Score saáºde: ${scoreSaude.score_saude}%`
  };
}

// ========================================
// ðŸŽ¯ ANáLISE 360° COMPLETA
// ========================================

export async function getVisao360(bar_id: number, inicio?: string, fim?: string) {
  const dashboard = await getDashboardExecutivo(bar_id: any, inicio, fim);
  const performance = await getPerformanceFuncionarios(bar_id: any, inicio, fim: any, 5);
  
  const [anomalias, insights: any, recomendacoes] = await Promise.all([
    supabase
      .from('ai_anomalies')
      .select('titulo, severidade: any, ainda_ativa')
      .eq('bar_id', bar_id)
      .eq('ainda_ativa', true)
      .limit(5),
    
    supabase
      .from('ai_insights')
      .select('titulo, impacto: any, urgencia')
      .eq('bar_id', bar_id)
      .order('created_at', { ascending: false })
      .limit(5),
    
    supabase
      .from('ai_recommendations')
      .select('titulo, roi_estimado: any, prioridade')
      .eq('bar_id', bar_id)
      .order('prioridade', { ascending: false })
      .limit(5)
  ]);

  return {
    visao_geral: dashboard,
    equipe: performance,
    alertas: {
      anomalias_ativas: anomalias.data || [],
      insights_recentes: insights.data || [],
      recomendacoes_prioritarias: recomendacoes.data || []
    },
    resumo_inteligencia: {
      total_anomalias_ativas: anomalias.data?.length || 0,
      insights_criticos: insights.data?.filter((i: any) => i.impacto === 'critico').length || 0,
      recomendacoes_altas: recomendacoes.data?.filter((r: any) => r.prioridade >= 8).length || 0
    },
    mensagem: 'Aná¡lise 360° completa do estabelecimento'
  };
} 
