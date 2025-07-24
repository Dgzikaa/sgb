import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { 
  getStatusChecklists,
  getPerformanceFuncionarios,
  getWhatsAppStats,
  getTempoProducao,
  getScoreSaudeGeral,
  getDashboardExecutivo,
  getVisao360
} from '@/lib/analytics-service';

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schema para consultas
const QuerySchema = z.object({
  query_type: z.enum([
    // 💰 Financeiro & Faturamento
    'maior_faturamento',
    'faturamento_periodo',
    'comparativo_mensal',
    'top_clientes',
    'produtos_vendidos',
    'performance_periodo',
    'resumo_dia',
    'resumo_mes',
    
    // ✅ Checklists & Operacional
    'status_checklists',
    'performance_funcionarios',
    'checklists_atrasados',
    'qualidade_execucoes',
    'tempo_medio_execucao',
    'funcionario_destaque',
    
    // 📱 WhatsApp & Comunicação
    'whatsapp_stats',
    'engagement_whatsapp',
    'mensagens_pendentes',
    'campanhas_ativas',
    
    // 🍕 Produção & Tempo
    'tempo_producao',
    'produtos_demorados',
    'eficiencia_cozinha',
    'picos_movimento',
    
    // 🤖 IA & Analytics
    'anomalias_recentes',
    'insights_importantes',
    'recomendacoes_ia',
    'score_saude_geral',
    'metricas_ia',
    
    // 👥 Equipe & Usuários
    'atividade_usuarios',
    'usuarios_ativos',
    'perfil_funcionarios',
    
    // 📊 Dashboards & Visão Geral
    'dashboard_executivo',
    'visao_360',
    'comparativo_historico',
    'tendencias'
  ]),
  bar_id: z.number().int(),
  periodo_inicio: z.string().optional(),
  periodo_fim: z.string().optional(),
  limite: z.number().int().min(1).max(50).optional().default(10),
  usuario_id: z.number().int().optional(),
  checklist_id: z.number().int().optional()
});

// ========================================
// 🤖 POST /api/ai/query (Consultas inteligentes)
// ========================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query_type, bar_id, periodo_inicio, periodo_fim, limite } = QuerySchema.parse(body);

    let resultado;

    switch (query_type) {
      case 'maior_faturamento':
        resultado = await getMaiorFaturamento(bar_id);
        break;
      
      case 'faturamento_periodo':
        resultado = await getFaturamentoPeriodo(bar_id, periodo_inicio, periodo_fim);
        break;
      
      case 'comparativo_mensal':
        resultado = await getComparativoMensal(bar_id);
        break;
      
      case 'top_clientes':
        resultado = await getTopClientes(bar_id, limite);
        break;
      
      case 'produtos_vendidos':
        resultado = await getProdutosMaisVendidos(bar_id, limite);
        break;
      
      case 'performance_periodo':
        resultado = await getPerformancePeriodo(bar_id, periodo_inicio, periodo_fim);
        break;
      
      case 'resumo_dia':
        resultado = await getResumoDia(bar_id, periodo_inicio || new Date().toISOString().split('T')[0]);
        break;
      
      case 'resumo_mes':
        resultado = await getResumoMes(bar_id, periodo_inicio);
        break;
      
      case 'anomalias_recentes':
        resultado = await getAnomaliasRecentes(bar_id, limite);
        break;
      
      case 'insights_importantes':
        resultado = await getInsightsImportantes(bar_id, limite);
        break;
      
      // ✅ Checklists & Operacional
      case 'status_checklists':
        resultado = await getStatusChecklists(bar_id, periodo_inicio, periodo_fim);
        break;
      
      case 'performance_funcionarios':
        resultado = await getPerformanceFuncionarios(bar_id, periodo_inicio, periodo_fim, limite);
        break;
      
      case 'checklists_atrasados':
        // TODO: Implementar getChecklistsAtrasados
        resultado = { mensagem: 'Funcionalidade em desenvolvimento' };
        break;
      
      case 'qualidade_execucoes':
        // TODO: Implementar getQualidadeExecucoes  
        resultado = { mensagem: 'Funcionalidade em desenvolvimento' };
        break;
      
      case 'funcionario_destaque':
        // TODO: Implementar getFuncionarioDestaque
        resultado = { mensagem: 'Funcionalidade em desenvolvimento' };
        break;
      
      // 📱 WhatsApp & Comunicação
      case 'whatsapp_stats':
        resultado = await getWhatsAppStats(bar_id, periodo_inicio, periodo_fim);
        break;
      
      case 'engagement_whatsapp':
        resultado = await getWhatsAppStats(bar_id, periodo_inicio, periodo_fim);
        break;
      
      case 'mensagens_pendentes':
        resultado = { mensagem: 'Funcionalidade em desenvolvimento' };
        break;
      
      // 🍕 Produção & Tempo
      case 'tempo_producao':
        resultado = await getTempoProducao(bar_id, periodo_inicio, periodo_fim);
        break;
      
      case 'produtos_demorados':
        resultado = { mensagem: 'Funcionalidade em desenvolvimento' };
        break;
      
      case 'eficiencia_cozinha':
        resultado = { mensagem: 'Funcionalidade em desenvolvimento' };
        break;
      
      case 'picos_movimento':
        resultado = { mensagem: 'Funcionalidade em desenvolvimento' };
        break;
      
      // 🤖 IA & Analytics
      case 'recomendacoes_ia':
        resultado = { mensagem: 'Funcionalidade em desenvolvimento' };
        break;
      
      case 'score_saude_geral':
        resultado = await getScoreSaudeGeral(bar_id);
        break;
      
      case 'metricas_ia':
        resultado = { mensagem: 'Funcionalidade em desenvolvimento' };
        break;
      
      // 👥 Equipe & Usuários
      case 'atividade_usuarios':
        resultado = { mensagem: 'Funcionalidade em desenvolvimento' };
        break;
      
      case 'usuarios_ativos':
        resultado = { mensagem: 'Funcionalidade em desenvolvimento' };
        break;
      
      case 'perfil_funcionarios':
        resultado = { mensagem: 'Funcionalidade em desenvolvimento' };
        break;
      
      // 📊 Dashboards & Visão Geral
      case 'dashboard_executivo':
        resultado = await getDashboardExecutivo(bar_id, periodo_inicio, periodo_fim);
        break;
      
      case 'visao_360':
        resultado = await getVisao360(bar_id, periodo_inicio, periodo_fim);
        break;
      
      case 'comparativo_historico':
        resultado = { mensagem: 'Funcionalidade em desenvolvimento' };
        break;
      
      case 'tendencias':
        resultado = { mensagem: 'Funcionalidade em desenvolvimento' };
        break;
      
      default:
        return NextResponse.json({ error: 'Tipo de consulta não suportado' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      query_type,
      data: resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Parâmetros inválidos',
        details: error.issues
      }, { status: 400 });
    }

    console.error('Erro na API de consultas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// 💰 CONSULTAS DE FATURAMENTO
// ========================================

/**
 * Busca o maior faturamento registrado
 */
async function getMaiorFaturamento(bar_id: number) {
  const { data: faturamento } = await supabase
    .from('contahub_pagamentos')
    .select(`
      dt_gerencial,
      valor_liquido,
      valor_bruto,
      meio,
      cliente
    `)
    .eq('bar_id', bar_id)
    .order('valor_liquido', { ascending: false })
    .limit(1);

  if (!faturamento || faturamento.length === 0) {
    return {
      mensagem: 'Nenhum registro de faturamento encontrado',
      valor: 0
    };
  }

  const record = faturamento[0];
  
  // Buscar faturamento total do dia
  const { data: diaTotal } = await supabase
    .from('contahub_pagamentos')
    .select('valor_liquido')
    .eq('bar_id', bar_id)
    .eq('dt_gerencial', record.dt_gerencial);

  const faturamentoDia = diaTotal?.reduce((total, item) => total + (item.valor_liquido || 0), 0) || 0;

  return {
    maior_venda: {
      data: record.dt_gerencial,
      valor: record.valor_liquido,
      valor_bruto: record.valor_bruto,
      meio_pagamento: record.meio,
      cliente: record.cliente
    },
    faturamento_total_dia: faturamentoDia,
    data_maior_faturamento: record.dt_gerencial,
    mensagem: `Maior venda individual: R$ ${record.valor_liquido?.toFixed(2)} no dia ${new Date(record.dt_gerencial).toLocaleDateString('pt-BR')}`
  };
}

/**
 * Faturamento em período específico
 */
async function getFaturamentoPeriodo(bar_id: number, inicio?: string, fim?: string) {
  const dataInicio = inicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dataFim = fim || new Date().toISOString().split('T')[0];

  const { data: pagamentos } = await supabase
    .from('contahub_pagamentos')
    .select(`
      dt_gerencial,
      valor_liquido,
      valor_bruto,
      meio,
      valor_pagamentos
    `)
    .eq('bar_id', bar_id)
    .gte('dt_gerencial', dataInicio)
    .lte('dt_gerencial', dataFim);

  if (!pagamentos || pagamentos.length === 0) {
    return {
      periodo: { inicio: dataInicio, fim: dataFim },
      faturamento_total: 0,
      transacoes: 0,
      mensagem: 'Nenhum faturamento encontrado no período'
    };
  }

  const faturamentoTotal = pagamentos.reduce((total, item) => total + (item.valor_liquido || 0), 0);
  const faturamentoBruto = pagamentos.reduce((total, item) => total + (item.valor_bruto || 0), 0);
  
  // Agrupar por meio de pagamento
  const meiosPagamento: Record<string, { valor: number; transacoes: number }> = {};
  pagamentos.forEach(pag => {
    const meio = pag.meio || 'Não informado';
    if (!meiosPagamento[meio]) {
      meiosPagamento[meio] = { valor: 0, transacoes: 0 };
    }
    meiosPagamento[meio].valor += pag.valor_liquido || 0;
    meiosPagamento[meio].transacoes += 1;
  });

  // Agrupar por dia
  const faturamentoPorDia: Record<string, number> = {};
  pagamentos.forEach(pag => {
    const dia = pag.dt_gerencial;
    if (!faturamentoPorDia[dia]) {
      faturamentoPorDia[dia] = 0;
    }
    faturamentoPorDia[dia] += pag.valor_liquido || 0;
  });

  const melhorDia = Object.entries(faturamentoPorDia).reduce((max, [dia, valor]) => 
    (valor as number) > max.valor ? { dia, valor: valor as number } : max, { dia: '', valor: 0 });

  return {
    periodo: { inicio: dataInicio, fim: dataFim },
    faturamento_liquido: faturamentoTotal,
    faturamento_bruto: faturamentoBruto,
    total_transacoes: pagamentos.length,
    ticket_medio: faturamentoTotal / pagamentos.length,
    melhor_dia: melhorDia,
    meios_pagamento: meiosPagamento,
    faturamento_por_dia: faturamentoPorDia,
    mensagem: `Faturamento de R$ ${faturamentoTotal.toFixed(2)} em ${pagamentos.length} transações no período`
  };
}

/**
 * Comparativo mensal
 */
async function getComparativoMensal(bar_id: number) {
  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  const mesAnterior = `${hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear()}-${String(hoje.getMonth() === 0 ? 12 : hoje.getMonth()).padStart(2, '0')}`;

  // Faturamento mês atual
  const { data: fatAtual } = await supabase
    .from('contahub_pagamentos')
    .select('valor_liquido')
    .eq('bar_id', bar_id)
    .gte('dt_gerencial', `${mesAtual}-01`)
    .lt('dt_gerencial', `${mesAtual}-32`);

  // Faturamento mês anterior
  const { data: fatAnterior } = await supabase
    .from('contahub_pagamentos')
    .select('valor_liquido')
    .eq('bar_id', bar_id)
    .gte('dt_gerencial', `${mesAnterior}-01`)
    .lt('dt_gerencial', `${mesAnterior}-32`);

  const faturamentoAtual = fatAtual?.reduce((total, item) => total + (item.valor_liquido || 0), 0) || 0;
  const faturamentoAnterior = fatAnterior?.reduce((total, item) => total + (item.valor_liquido || 0), 0) || 0;
  
  const variacao = faturamentoAnterior > 0 ? 
    ((faturamentoAtual - faturamentoAnterior) / faturamentoAnterior) * 100 : 0;

  return {
    mes_atual: {
      periodo: mesAtual,
      faturamento: faturamentoAtual,
      transacoes: fatAtual?.length || 0
    },
    mes_anterior: {
      periodo: mesAnterior,
      faturamento: faturamentoAnterior,
      transacoes: fatAnterior?.length || 0
    },
    comparativo: {
      variacao_percentual: variacao,
      diferenca_absoluta: faturamentoAtual - faturamentoAnterior,
      status: variacao > 0 ? 'crescimento' : variacao < 0 ? 'queda' : 'estável'
    },
    mensagem: `${variacao > 0 ? '📈' : variacao < 0 ? '📉' : '➡️'} ${Math.abs(variacao).toFixed(1)}% em relação ao mês anterior`
  };
}

/**
 * Top clientes por faturamento
 */
async function getTopClientes(bar_id: number, limite: number) {
  const query = supabase
    .from('contahub_clientes_faturamento')
    .select(`
      cli_nome,
      cli_cpf,
      valor,
      vendas,
      ultima
    `)
    .eq('bar_id', bar_id)
    .order('valor', { ascending: false })
    .limit(limite);

  const { data: clientes } = await query;

  if (!clientes || clientes.length === 0) {
    return {
      clientes: [],
      mensagem: 'Nenhum cliente encontrado'
    };
  }

  const clientesFormatados = clientes.map((cliente, index) => ({
    posicao: index + 1,
    nome: cliente.cli_nome || 'Cliente não identificado',
    cpf: cliente.cli_cpf,
    faturamento_total: cliente.valor,
    total_vendas: cliente.vendas,
    ticket_medio: cliente.vendas > 0 ? cliente.valor / cliente.vendas : 0,
    ultima_compra: cliente.ultima
  }));

  const faturamentoTotalClientes = clientes.reduce((total, cliente) => total + (cliente.valor || 0), 0);

  return {
    clientes: clientesFormatados,
    resumo: {
      total_clientes: clientes.length,
      faturamento_total: faturamentoTotalClientes,
      ticket_medio_geral: faturamentoTotalClientes / clientes.length
    },
    mensagem: `Top ${clientes.length} clientes por faturamento`
  };
}

/**
 * Produtos mais vendidos
 */
async function getProdutosMaisVendidos(bar_id: number, limite: number) {
  const { data: produtos } = await supabase
    .from('contahub_analitico')
    .select(`
      prd_desc,
      grp_desc,
      itm_qtd,
      valor_total,
      preco_unitario
    `)
    .eq('bar_id', bar_id)
    .order('itm_qtd', { ascending: false })
    .limit(limite);

  if (!produtos || produtos.length === 0) {
    return {
      produtos: [],
      mensagem: 'Nenhum produto encontrado'
    };
  }

  // Agrupar por produto
  const produtosAgrupados: Record<string, (unknown)> = {};
  produtos.forEach(produto => {
    const nome = produto.prd_desc || 'Produto não identificado';
    if (!produtosAgrupados[nome]) {
      produtosAgrupados[nome] = {
        nome,
        grupo: produto.grp_desc,
        quantidade_total: 0,
        valor_total: 0,
        preco_medio: 0
      };
    }
    (produtosAgrupados[nome] as Record<string, unknown>).quantidade_total = ((produtosAgrupados[nome] as Record<string, unknown>).quantidade_total as number || 0) + (produto.itm_qtd || 0);
    (produtosAgrupados[nome] as Record<string, unknown>).valor_total = ((produtosAgrupados[nome] as Record<string, unknown>).valor_total as number || 0) + (produto.valor_total || 0);
  });

  const produtosOrdenados = Object.values(produtosAgrupados)
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (b.quantidade_total as number) - (a.quantidade_total as number))
    .slice(0, limite)
    .map((produto: Record<string, unknown>, index) => ({
      posicao: index + 1,
      ...produto,
      preco_medio: (produto.quantidade_total as number) > 0 ? (produto.valor_total as number) / (produto.quantidade_total as number) : 0
    }));

  return {
    produtos: produtosOrdenados,
    resumo: {
      total_produtos: produtosOrdenados.length,
      quantidade_total: produtosOrdenados.reduce((total, p) => total + (p as any).quantidade_total, 0),
      valor_total: produtosOrdenados.reduce((total, p) => total + (p as any).valor_total, 0)
    },
    mensagem: `Top ${produtosOrdenados.length} produtos mais vendidos`
  };
}

/**
 * Performance do período
 */
async function getPerformancePeriodo(bar_id: number, inicio?: string, fim?: string) {
  const dataInicio = inicio || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dataFim = fim || new Date().toISOString().split('T')[0];

  // Buscar dados do período
  const [pagamentos, tempos, analitico] = await Promise.all([
    supabase
      .from('contahub_pagamentos')
      .select('valor_liquido, dt_gerencial')
      .eq('bar_id', bar_id)
      .gte('dt_gerencial', dataInicio)
      .lte('dt_gerencial', dataFim),
    
    supabase
      .from('contahub_tempo')
      .select('tempo_t0_t3, prd_desc')
      .eq('bar_id', bar_id)
      .gte('dia', `${dataInicio}T00:00:00`)
      .lte('dia', `${dataFim}T23:59:59`),
    
    supabase
      .from('contahub_analitico')
      .select('itm_qtd, valor_total')
      .eq('bar_id', bar_id)
      .gte('dia', `${dataInicio}T00:00:00`)
      .lte('dia', `${dataFim}T23:59:59`)
  ]);

  const faturamentoTotal = pagamentos.data?.reduce((total, item) => total + (item.valor_liquido || 0), 0) || 0;
  const totalItens = analitico.data?.reduce((total, item) => total + (item.itm_qtd || 0), 0) || 0;
        const tempoMedioProducao = (tempos.data && tempos.data.length > 0) ?
        tempos.data.reduce((total: number, item: Record<string, unknown>) => total + ((item.tempo_t0_t3 as number) || 0), 0) / (tempos.data.length || 1) : 0;

  return {
    periodo: { inicio: dataInicio, fim: dataFim },
    performance: {
      faturamento_total: faturamentoTotal,
      total_transacoes: pagamentos.data?.length || 0,
      total_itens_vendidos: totalItens,
      tempo_medio_producao_segundos: tempoMedioProducao,
      tempo_medio_producao_minutos: tempoMedioProducao / 60,
      ticket_medio: (pagamentos.data?.length || 0) > 0 ? faturamentoTotal / (pagamentos.data?.length || 1) : 0
    },
    mensagem: `Performance do período: R$ ${faturamentoTotal.toFixed(2)} em ${pagamentos.data?.length || 0} transações`
  };
}

/**
 * Resumo do dia
 */
async function getResumoDia(bar_id: number, data: string) {
  const [pagamentos, fatPorHora] = await Promise.all([
    supabase
      .from('contahub_pagamentos')
      .select('valor_liquido, meio, hr_transacao')
      .eq('bar_id', bar_id)
      .eq('dt_gerencial', data),
    
    supabase
      .from('contahub_fatporhora')
      .select('hora, qtd, valor')
      .eq('bar_id', bar_id)
      .eq('vd_dtgerencial', data)
      .order('hora')
  ]);

  const faturamento = pagamentos.data?.reduce((total, item) => total + (item.valor_liquido || 0), 0) || 0;
  
  // Horário de pico
  const horarioPico = fatPorHora.data?.reduce((max, current) => 
    (current.valor || 0) > (max.valor || 0) ? current : max, { hora: '', valor: 0 });

  return {
    data,
    resumo: {
      faturamento_total: faturamento,
      total_transacoes: pagamentos.data?.length || 0,
      ticket_medio: (pagamentos.data?.length || 0) > 0 ? faturamento / (pagamentos.data?.length || 1) : 0,
      horario_pico: horarioPico ? `${horarioPico.hora}h com R$ ${horarioPico.valor?.toFixed(2)}` : 'Não identificado'
    },
    faturamento_por_hora: fatPorHora.data || [],
    mensagem: `Resumo de ${new Date(data).toLocaleDateString('pt-BR')}: R$ ${faturamento.toFixed(2)}`
  };
}

/**
 * Resumo do mês
 */
async function getResumoMes(bar_id: number, mes?: string) {
  const mesReferencia = mes || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  
  const { data: pagamentos } = await supabase
    .from('contahub_pagamentos')
    .select('valor_liquido, dt_gerencial')
    .eq('bar_id', bar_id)
    .gte('dt_gerencial', `${mesReferencia}-01`)
    .lt('dt_gerencial', `${mesReferencia}-32`);

  const faturamento = pagamentos?.reduce((total, item) => total + (item.valor_liquido || 0), 0) || 0;
  
  // Agrupar por dia
  const faturamentoPorDia: Record<string, number> = {};
  pagamentos?.forEach((pag: Record<string, unknown>) => {
    const dia = pag.dt_gerencial as string;
    if (!faturamentoPorDia[dia]) {
      faturamentoPorDia[dia] = 0;
    }
    faturamentoPorDia[dia] += (pag.valor_liquido as number) || 0;
  });

  const diasAtivos = Object.keys(faturamentoPorDia).length;
  const faturamentoMedioDia = diasAtivos > 0 ? faturamento / diasAtivos : 0;

  return {
    mes: mesReferencia,
    resumo: {
      faturamento_total: faturamento,
      total_transacoes: pagamentos?.length || 0,
      dias_ativos: diasAtivos,
      faturamento_medio_dia: faturamentoMedioDia,
      ticket_medio: (pagamentos?.length || 0) > 0 ? faturamento / (pagamentos?.length || 1) : 0
    },
    faturamento_por_dia: faturamentoPorDia,
    mensagem: `Resumo do mês ${mesReferencia}: R$ ${faturamento.toFixed(2)} em ${diasAtivos} dias ativos`
  };
}

/**
 * Anomalias recentes
 */
async function getAnomaliasRecentes(bar_id: number, limite: number) {
  const { data: anomalias } = await supabase
    .from('ai_anomalies')
    .select(`
      tipo_anomalia,
      severidade,
      titulo,
      descricao,
      valor_esperado,
      valor_observado,
      desvio_percentual,
      data_inicio,
      ainda_ativa
    `)
    .eq('bar_id', bar_id)
    .order('data_inicio', { ascending: false })
    .limit(limite);

  return {
    anomalias: anomalias || [],
    resumo: {
      total_anomalias: anomalias?.length || 0,
      anomalias_ativas: anomalias?.filter(a => a.ainda_ativa).length || 0,
      anomalias_criticas: anomalias?.filter(a => a.severidade === 'critica').length || 0
    },
    mensagem: `${anomalias?.length || 0} anomalias recentes encontradas`
  };
}

/**
 * Insights importantes
 */
async function getInsightsImportantes(bar_id: number, limite: number) {
  const { data: insights } = await supabase
    .from('ai_insights')
    .select(`
      tipo_insight,
      categoria,
      titulo,
      descricao,
      confianca,
      impacto,
      urgencia,
      created_at
    `)
    .eq('bar_id', bar_id)
    .order('created_at', { ascending: false })
    .limit(limite);

  return {
    insights: insights || [],
    resumo: {
      total_insights: insights?.length || 0,
      insights_criticos: insights?.filter(i => i.impacto === 'critico').length || 0,
      insights_urgentes: insights?.filter(i => i.urgencia === 'alta').length || 0
    },
    mensagem: `${insights?.length || 0} insights importantes encontrados`
  };
} 
