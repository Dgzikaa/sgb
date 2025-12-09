import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { filtrarDiasAbertos } from '@/lib/helpers/calendario-helper';

export const dynamic = 'force-dynamic'

// Função para calcular datas do trimestre
function getTrimestreDates(trimestre: number) {
  const year = 2025;
  const quarters = {
    2: { start: `${year}-04-01`, end: `${year}-06-30` }, // Abr-Jun
    3: { start: `${year}-07-01`, end: `${year}-09-30` }, // Jul-Set  
    4: { start: `${year}-10-01`, end: `${year}-12-31` }  // Out-Dez
  };
  
  return quarters[trimestre as keyof typeof quarters] || quarters[3];
}

// Função para calcular trimestre anterior
function getTrimestreAnterior(trimestre: number) {
  const year = 2025;
  const quarters = {
    2: { start: `${year}-01-01`, end: `${year}-03-31` }, // T1 (Jan-Mar) - anterior ao T2
    3: { start: `${year}-04-01`, end: `${year}-06-30` }, // T2 (Abr-Jun) - anterior ao T3
    4: { start: `${year}-07-01`, end: `${year}-09-30` }  // T3 (Jul-Set) - anterior ao T4
  };
  
  return quarters[trimestre as keyof typeof quarters] || quarters[2]; // Default T1
}

// Função para calcular taxa de retornantes trimestral
// MESMA LÓGICA DA PÁGINA CLIENTES-ATIVOS:
// Retornantes = clientes do período que JÁ VIERAM ANTES do início do período
// Taxa = retornantes / total_clientes_do_período
async function calcularRetencao(supabase: any, barIdNum: number, mesEspecifico?: string, trimestre?: number) {
  try {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const year = new Date().getFullYear();
    
    // Definir período do trimestre
    let inicioPeriodo: string;
    let fimPeriodo: string;
    let inicioPeriodoAnterior: string;
    let fimPeriodoAnterior: string;
    
    if (trimestre) {
      // Usar trimestre específico
      const quarters: { [key: number]: { start: string; end: string } } = {
        1: { start: `${year}-01-01`, end: `${year}-03-31` },
        2: { start: `${year}-04-01`, end: `${year}-06-30` },
        3: { start: `${year}-07-01`, end: `${year}-09-30` },
        4: { start: `${year}-10-01`, end: `${year}-12-31` }
      };
      
      const quarterAnterior: { [key: number]: { start: string; end: string } } = {
        1: { start: `${year - 1}-10-01`, end: `${year - 1}-12-31` }, // T4 ano anterior
        2: { start: `${year}-01-01`, end: `${year}-03-31` },          // T1
        3: { start: `${year}-04-01`, end: `${year}-06-30` },          // T2
        4: { start: `${year}-07-01`, end: `${year}-09-30` }           // T3
      };
      
      const periodoAtual = quarters[trimestre] || quarters[4];
      const periodoAnterior = quarterAnterior[trimestre] || quarterAnterior[4];
      
      // Ajustar fim do período atual para não ultrapassar hoje
      const hoje = new Date();
      const fimPeriodoDate = new Date(periodoAtual.end);
      const fimEfetivo = hoje < fimPeriodoDate ? hoje : fimPeriodoDate;
      
      inicioPeriodo = periodoAtual.start;
      fimPeriodo = formatDate(fimEfetivo);
      inicioPeriodoAnterior = periodoAnterior.start;
      fimPeriodoAnterior = periodoAnterior.end;
    } else if (mesEspecifico) {
      // Usar mês específico como referência para rolling 90 dias
      const [ano, mes] = mesEspecifico.split('-').map(Number);
      const dataReferencia = new Date(ano, mes, 0); // último dia do mês
      
      const fimPeriodoAtual = dataReferencia;
      const inicioPeriodoAtual = new Date(dataReferencia);
      inicioPeriodoAtual.setDate(fimPeriodoAtual.getDate() - 90);
      
      const fimPeriodoAnt = new Date(inicioPeriodoAtual);
      fimPeriodoAnt.setDate(fimPeriodoAnt.getDate() - 1);
      const inicioPeriodoAnt = new Date(fimPeriodoAnt);
      inicioPeriodoAnt.setDate(fimPeriodoAnt.getDate() - 90);
      
      inicioPeriodo = formatDate(inicioPeriodoAtual);
      fimPeriodo = formatDate(fimPeriodoAtual);
      inicioPeriodoAnterior = formatDate(inicioPeriodoAnt);
      fimPeriodoAnterior = formatDate(fimPeriodoAnt);
    } else {
      // Usar últimos 90 dias
      const hoje = new Date();
      const inicio90d = new Date(hoje);
      inicio90d.setDate(hoje.getDate() - 90);
      
      inicioPeriodo = formatDate(inicio90d);
      fimPeriodo = formatDate(hoje);
      
      const fimAnt = new Date(inicio90d);
      fimAnt.setDate(fimAnt.getDate() - 1);
      const inicioAnt = new Date(fimAnt);
      inicioAnt.setDate(fimAnt.getDate() - 90);
      
      inicioPeriodoAnterior = formatDate(inicioAnt);
      fimPeriodoAnterior = formatDate(fimAnt);
    }
    
    console.log('🔄 CALCULANDO TAXA DE RETORNANTES (mesma lógica clientes-ativos):');
    console.log(`Período ATUAL: ${inicioPeriodo} até ${fimPeriodo}`);
    console.log(`Período ANTERIOR: ${inicioPeriodoAnterior} até ${fimPeriodoAnterior}`);
    
    // ✅ USAR A STORED PROCEDURE calcular_metricas_clientes (mesma da clientes-ativos)
    const { data: metricas, error: errorMetricas } = await supabase.rpc('calcular_metricas_clientes', {
      p_bar_id: barIdNum,
      p_data_inicio_atual: inicioPeriodo,
      p_data_fim_atual: fimPeriodo,
      p_data_inicio_anterior: inicioPeriodoAnterior,
      p_data_fim_anterior: fimPeriodoAnterior
    });
    
    if (errorMetricas) {
      console.error('❌ Erro ao calcular métricas:', errorMetricas);
      throw errorMetricas;
    }
    
    const resultado = metricas[0];
    const totalClientesAtual = Number(resultado.total_atual) || 0;
    const retornantesAtual = Number(resultado.retornantes_atual) || 0;
    const totalClientesAnterior = Number(resultado.total_anterior) || 0;
    const retornantesAnterior = Number(resultado.retornantes_anterior) || 0;
    
    // ✅ TAXA DE RETORNANTES = retornantes / total (igual clientes-ativos)
    const percentualRetornantes = totalClientesAtual > 0 
      ? (retornantesAtual / totalClientesAtual) * 100 
      : 0;
    
    const percentualRetornantesAnterior = totalClientesAnterior > 0 
      ? (retornantesAnterior / totalClientesAnterior) * 100 
      : 0;
    
    // Calcular variação
    const variacaoRetornantes = percentualRetornantesAnterior > 0 
      ? ((percentualRetornantes - percentualRetornantesAnterior) / percentualRetornantesAnterior * 100)
      : 0;
    
    console.log('🔄 TAXA DE RETORNANTES CALCULADA:');
    console.log(`Total clientes período atual: ${totalClientesAtual}`);
    console.log(`Retornantes período atual: ${retornantesAtual}`);
    console.log(`Taxa de retornantes: ${percentualRetornantes.toFixed(1)}%`);
    console.log(`Taxa de retornantes anterior: ${percentualRetornantesAnterior.toFixed(1)}%`);
    console.log(`Variação: ${variacaoRetornantes.toFixed(1)}%`);
    
    return {
      valor: parseFloat(percentualRetornantes.toFixed(1)),
      variacao: parseFloat(variacaoRetornantes.toFixed(1))
    };
    
  } catch (error) {
    console.error('❌ Erro ao calcular retenção:', error);
    return { valor: 0, variacao: 0 };
  }
}

// Função para calcular RETENÇÃO REAL (rolling 90 dias)
// "Dos clientes do trimestre anterior, quantos voltaram neste trimestre?"
async function calcularRetencaoReal(supabase: any, barIdNum: number, trimestre?: number) {
  try {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const year = new Date().getFullYear();
    
    // Definir período do trimestre atual e anterior
    let inicioPeriodoAtual: string;
    let fimPeriodoAtual: string;
    let inicioPeriodoAnterior: string;
    let fimPeriodoAnterior: string;
    let inicioPeriodoComparacao: string;
    let fimPeriodoComparacao: string;
    
    if (trimestre) {
      const quarters: { [key: number]: { start: string; end: string } } = {
        1: { start: `${year}-01-01`, end: `${year}-03-31` },
        2: { start: `${year}-04-01`, end: `${year}-06-30` },
        3: { start: `${year}-07-01`, end: `${year}-09-30` },
        4: { start: `${year}-10-01`, end: `${year}-12-31` }
      };
      
      const quarterAnterior: { [key: number]: { start: string; end: string } } = {
        1: { start: `${year - 1}-10-01`, end: `${year - 1}-12-31` },
        2: { start: `${year}-01-01`, end: `${year}-03-31` },
        3: { start: `${year}-04-01`, end: `${year}-06-30` },
        4: { start: `${year}-07-01`, end: `${year}-09-30` }
      };
      
      const quarterComparacao: { [key: number]: { start: string; end: string } } = {
        1: { start: `${year - 1}-07-01`, end: `${year - 1}-09-30` },
        2: { start: `${year - 1}-10-01`, end: `${year - 1}-12-31` },
        3: { start: `${year}-01-01`, end: `${year}-03-31` },
        4: { start: `${year}-04-01`, end: `${year}-06-30` }
      };
      
      const periodoAtual = quarters[trimestre] || quarters[4];
      const periodoAnterior = quarterAnterior[trimestre] || quarterAnterior[4];
      const periodoComparacao = quarterComparacao[trimestre] || quarterComparacao[4];
      
      // Ajustar fim do período atual para não ultrapassar hoje
      const hoje = new Date();
      const fimPeriodoDate = new Date(periodoAtual.end);
      const fimEfetivo = hoje < fimPeriodoDate ? hoje : fimPeriodoDate;
      
      inicioPeriodoAtual = periodoAtual.start;
      fimPeriodoAtual = formatDate(fimEfetivo);
      inicioPeriodoAnterior = periodoAnterior.start;
      fimPeriodoAnterior = periodoAnterior.end;
      inicioPeriodoComparacao = periodoComparacao.start;
      fimPeriodoComparacao = periodoComparacao.end;
    } else {
      // Fallback: rolling 90 dias
      const hoje = new Date();
      const inicio90d = new Date(hoje);
      inicio90d.setDate(hoje.getDate() - 90);
      
      inicioPeriodoAtual = formatDate(inicio90d);
      fimPeriodoAtual = formatDate(hoje);
      
      const fimAnt = new Date(inicio90d);
      fimAnt.setDate(fimAnt.getDate() - 1);
      const inicioAnt = new Date(fimAnt);
      inicioAnt.setDate(fimAnt.getDate() - 90);
      
      inicioPeriodoAnterior = formatDate(inicioAnt);
      fimPeriodoAnterior = formatDate(fimAnt);
      
      const fimComp = new Date(inicioAnt);
      fimComp.setDate(fimComp.getDate() - 1);
      const inicioComp = new Date(fimComp);
      inicioComp.setDate(fimComp.getDate() - 90);
      
      inicioPeriodoComparacao = formatDate(inicioComp);
      fimPeriodoComparacao = formatDate(fimComp);
    }
    
    console.log('🔄 CALCULANDO RETENÇÃO REAL (% que voltaram):');
    console.log(`Período ATUAL: ${inicioPeriodoAtual} até ${fimPeriodoAtual}`);
    console.log(`Período ANTERIOR: ${inicioPeriodoAnterior} até ${fimPeriodoAnterior}`);
    
    // Buscar clientes dos períodos
    const [clientesPeriodoAtualBruto, clientesPeriodoAnteriorBruto, clientesPeriodoComparacaoBruto] = await Promise.all([
      fetchAllData(supabase, 'contahub_periodo', 'cli_fone', {
        'eq_bar_id': barIdNum,
        'gte_dt_gerencial': inicioPeriodoAtual,
        'lte_dt_gerencial': fimPeriodoAtual
      }),
      fetchAllData(supabase, 'contahub_periodo', 'cli_fone', {
        'eq_bar_id': barIdNum,
        'gte_dt_gerencial': inicioPeriodoAnterior,
        'lte_dt_gerencial': fimPeriodoAnterior
      }),
      fetchAllData(supabase, 'contahub_periodo', 'cli_fone', {
        'eq_bar_id': barIdNum,
        'gte_dt_gerencial': inicioPeriodoComparacao,
        'lte_dt_gerencial': fimPeriodoComparacao
      })
    ]);
    
    // Criar sets de clientes únicos
    const clientesPeriodoAtual = new Set(
      clientesPeriodoAtualBruto?.filter(item => item.cli_fone && item.cli_fone.length >= 8).map(item => item.cli_fone) || []
    );
    
    const clientesPeriodoAnterior = new Set(
      clientesPeriodoAnteriorBruto?.filter(item => item.cli_fone && item.cli_fone.length >= 8).map(item => item.cli_fone) || []
    );
    
    const clientesPeriodoComparacao = new Set(
      clientesPeriodoComparacaoBruto?.filter(item => item.cli_fone && item.cli_fone.length >= 8).map(item => item.cli_fone) || []
    );
    
    // RETENÇÃO REAL = clientes do período ANTERIOR que voltaram no período ATUAL
    const clientesQueVoltaram = [...clientesPeriodoAnterior].filter(cliente => 
      clientesPeriodoAtual.has(cliente)
    );
    
    const totalClientesAnterior = clientesPeriodoAnterior.size;
    const totalQueVoltaram = clientesQueVoltaram.length;
    
    // Taxa de retenção real = quantos do período anterior voltaram
    const percentualRetencaoReal = totalClientesAnterior > 0 
      ? (totalQueVoltaram / totalClientesAnterior) * 100 
      : 0;
    
    // Calcular variação (comparar com período ainda anterior)
    const clientesQueVoltaramAnterior = [...clientesPeriodoComparacao].filter(cliente => 
      clientesPeriodoAnterior.has(cliente)
    );
    
    const percentualRetencaoRealAnterior = clientesPeriodoComparacao.size > 0 
      ? (clientesQueVoltaramAnterior.length / clientesPeriodoComparacao.size) * 100 
      : 0;
    
    const variacaoRetencaoReal = percentualRetencaoRealAnterior > 0 
      ? ((percentualRetencaoReal - percentualRetencaoRealAnterior) / percentualRetencaoRealAnterior * 100)
      : 0;
    
    console.log('🔄 RETENÇÃO REAL CALCULADA:');
    console.log(`Clientes período anterior: ${totalClientesAnterior}`);
    console.log(`Clientes que voltaram: ${totalQueVoltaram}`);
    console.log(`Taxa de retenção real: ${percentualRetencaoReal.toFixed(1)}%`);
    console.log(`Variação: ${variacaoRetencaoReal.toFixed(1)}%`);
    
    return {
      valor: parseFloat(percentualRetencaoReal.toFixed(1)),
      variacao: parseFloat(variacaoRetencaoReal.toFixed(1))
    };
    
  } catch (error) {
    console.error('❌ Erro ao calcular retenção real:', error);
    return { valor: 0, variacao: 0 };
  }
}

// Função para buscar dados com paginação (contorna limite de 1000 do Supabase)
async function fetchAllData(supabase: any, tableName: string, columns: string, filters: any = {}) {
  let allData: any[] = [];
  let from = 0;
  const limit = 1000;
  let pageCount = 0;
  
  const MAX_ITERATIONS = 100;
  let iterations = 0;
  
  while (iterations < MAX_ITERATIONS) {
    iterations++;
    pageCount++;
    
    let query = supabase
      .from(tableName)
      .select(columns)
      .range(from, from + limit - 1);
    
    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (key.includes('gte_')) {
        query = query.gte(key.replace('gte_', ''), value);
      } else if (key.includes('lte_')) {
        query = query.lte(key.replace('lte_', ''), value);
      } else if (key.includes('eq_')) {
        query = query.eq(key.replace('eq_', ''), value);
      } else if (key.includes('in_')) {
        query = query.in(key.replace('in_', ''), value);
      }
    });
    
    const { data, error } = await query;
    
    if (error) {
      // Log apenas em desenvolvimento para evitar poluir console em produção
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ Erro ao buscar ${tableName}:`, error);
      }
      break;
    }
    
    if (!data || data.length === 0) {
      break;
    }
    
    allData.push(...data);
    
    if (data.length < limit) {
      break; // Última página
    }
    
    from += limit;
  }
  
  return allData;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'anual';
    const trimestre = parseInt(searchParams.get('trimestre') || '3'); // 2, 3 ou 4
    const mesRetencao = searchParams.get('mes_retencao'); // formato YYYY-MM
    const barId = searchParams.get('bar_id') || 
      (request.headers.get('x-user-data') 
        ? JSON.parse(request.headers.get('x-user-data') || '{}').bar_id 
        : null);
    
    // Log simplificado de início
    // Log principal apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Visão Geral: Calculando ${periodo}${trimestre ? ` T${trimestre}` : ''} - Bar ${barId}`);
      console.log(`🔍 DEBUG: mesRetencao recebido: "${mesRetencao}"`);
    }
    
    if (!barId) {
      return NextResponse.json(
        { success: false, error: 'Bar não selecionado' },
        { status: 400 }
      );
    }
    
    // Converter para número
    const barIdNum = parseInt(barId.toString());
    
    // Usar service_role para dados administrativos (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Headers de cache HTTP para CDN (Vercel) e navegador
    //  - s-maxage: cache em edge por 60s
    //  - stale-while-revalidate: serve cache enquanto revalida por 5min
    //  Obs: a resposta final mais abaixo inclui estes headers via NextResponse
    
    // Logs de diagnóstico antigos removidos para reduzir IO/overhead

    // Buscar dados anuais
    if (periodo === 'anual') {
      // Performance Anual - Desde abertura até data atual
      const startDate = '2025-02-01'; // Bar abriu em Fevereiro
      const hoje = new Date();
      const endDate = hoje.toISOString().split('T')[0]; // Data atual
      // 🚨 DESABILITAR VIEW ANUAL TEMPORARIAMENTE PARA FORÇAR RECÁLCULO
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('🚨 VIEW ANUAL DESABILITADA - FORÇANDO RECÁLCULO MANUAL');
      }
      
      // COMENTADO PARA FORÇAR RECÁLCULO MANUAL
      /*
      try {
        const { data: anualView, error: anualViewErr } = await supabase
          .from('view_visao_geral_anual')
          .select('faturamento_total, faturamento_contahub, faturamento_yuzer, faturamento_sympla, pessoas_total, pessoas_contahub, pessoas_yuzer, pessoas_sympla, reputacao_media')
          .eq('bar_id', barIdNum)
          .eq('ano', 2025)
          .limit(1);
        if (!anualViewErr && anualView && anualView.length > 0) {
          // Log apenas em desenvolvimento
          if (process.env.NODE_ENV === 'development') {
            console.log('📊 USANDO VIEW ANUAL:', anualView[0]);
          }
          const row = anualView[0] as any;
          const resp = NextResponse.json({
            anual: {
              faturamento: {
                valor: row.faturamento_total || 0,
                meta: 10000000,
                detalhes: {
                  contahub: row.faturamento_contahub || 0,
                  yuzer: row.faturamento_yuzer || 0,
                  sympla: row.faturamento_sympla || 0,
                },
              },
              pessoas: {
                valor: row.pessoas_total || 0,
                meta: 144000,
                detalhes: {
                  contahub: row.pessoas_contahub || 0,
                  yuzer: row.pessoas_yuzer || 0,
                  sympla: row.pessoas_sympla || 0,
                },
              },
              reputacao: {
                valor: row.reputacao_media || 0,
                meta: 4.8,
              },
              ebitda: {
                valor: 0,
                meta: 1000000,
              },
            },
          });
          resp.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
          resp.headers.set('X-View-Used', 'view_visao_geral_anual');
          return resp;
        }
      } catch (err) {
        // Log de erro apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Erro ao buscar view anual:', err);
        }
      }
      */
      // 🚀 OTIMIZAÇÃO: Buscar TODOS os dados em paralelo
      const [
        contahubData,
        yuzerData,
        symplaData,
        pessoasContahubData,
        pessoasYuzer,
        pessoasSympla,
        reputacaoData
      ] = await Promise.all([
        // Faturamento ContaHub
        fetchAllData(supabase, 'contahub_pagamentos', 'liquido, meio', {
          'gte_dt_gerencial': startDate,
          'lte_dt_gerencial': endDate,
          'eq_bar_id': barIdNum
        }),
        // Faturamento Yuzer
        fetchAllData(supabase, 'yuzer_pagamento', 'valor_liquido', {
          'gte_data_evento': startDate,
          'lte_data_evento': endDate,
          'eq_bar_id': barIdNum
        }),
        // Faturamento Sympla
        fetchAllData(supabase, 'sympla_pedidos', 'valor_liquido', {
          'gte_data_pedido': startDate,
          'lte_data_pedido': endDate
        }),
        // Pessoas ContaHub
        fetchAllData(supabase, 'contahub_periodo', 'pessoas', {
          'eq_bar_id': barIdNum,
          'gte_dt_gerencial': startDate,
          'lte_dt_gerencial': endDate
        }),
        // Pessoas Yuzer
        supabase
          .from('yuzer_produtos')
          .select('quantidade, produto_nome')
          .eq('bar_id', barIdNum)
          .or('produto_nome.ilike.%ingresso%,produto_nome.ilike.%entrada%')
          .gte('data_evento', startDate)
          .lte('data_evento', endDate),
        // Pessoas Sympla
        supabase
          .from('sympla_resumo')
          .select('checkins_realizados')
          .gte('data_inicio', startDate)
          .lte('data_inicio', endDate),
        // Reputação Google
        fetchAllData(supabase, 'windsor_google', 'review_average_rating_total', {
          'gte_date': startDate,
          'lte_date': endDate
        })
      ]);

      // Calcular Faturamento
      const contahubFiltrado = contahubData?.filter(item => item.meio !== 'Conta Assinada') || [];
      const faturamentoContahub = contahubFiltrado?.reduce((sum, item) => sum + (item.liquido || 0), 0) || 0;
      const faturamentoYuzer = yuzerData?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
      const faturamentoSympla = symplaData?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
      const faturamentoTotal = faturamentoContahub + faturamentoYuzer + faturamentoSympla;

      // Calcular Pessoas
      const totalPessoasContahub = pessoasContahubData?.reduce((sum, item) => sum + (item.pessoas || 0), 0) || 0;
      const totalPessoasYuzer = pessoasYuzer.data?.reduce((sum, item) => sum + (item.quantidade || 0), 0) || 0;
      const totalPessoasSympla = pessoasSympla.data?.reduce((sum, item) => sum + (item.checkins_realizados || 0), 0) || 0;
      const totalPessoas = totalPessoasContahub + totalPessoasYuzer + totalPessoasSympla;
      
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log(`💰 Faturamento Anual: R$ ${faturamentoTotal.toLocaleString('pt-BR')}`);
        console.log(`👥 Total Pessoas: ${totalPessoas.toLocaleString('pt-BR')}`);
      }

      // Calcular Reputação (já buscado em paralelo acima)
      const reputacaoValida = reputacaoData?.filter(item => item.review_average_rating_total != null && item.review_average_rating_total > 0) || [];
      const reputacao = reputacaoValida.length > 0 
        ? reputacaoValida.reduce((sum, item) => sum + item.review_average_rating_total, 0) / reputacaoValida.length
        : 0;

      // EBITDA (será calculado futuramente com DRE)
      const ebitda = 0;

      return NextResponse.json({
        anual: {
          faturamento: {
            valor: faturamentoTotal,
            meta: 10000000,
            detalhes: {
              contahub: faturamentoContahub,
              yuzer: faturamentoYuzer,
              sympla: faturamentoSympla
            }
          },
          pessoas: {
            valor: totalPessoas,
            meta: 144000, // 12.000 mensal * 12
            detalhes: {
              contahub: totalPessoasContahub,
              yuzer: totalPessoasYuzer,
              sympla: totalPessoasSympla
            }
          },
          reputacao: {
            valor: reputacao,
            meta: 4.8
          },
          ebitda: {
            valor: ebitda,
            meta: 1000000
          }
        }
      });
    }

    // Buscar dados trimestrais
    if (periodo === 'trimestral') {
      // Datas dinâmicas baseadas no trimestre selecionado
      const { start: startDate, end: endDate } = getTrimestreDates(trimestre);
      const { start: startDateAnterior, end: endDateAnterior } = getTrimestreAnterior(trimestre);
      
      // Ajustar endDate para não ultrapassar a data atual
      const hoje = new Date();
      const endDateObj = new Date(endDate);
      const endDateEfetivo = hoje < endDateObj ? hoje.toISOString().split('T')[0] : endDate;

      // 🚀 OTIMIZAÇÃO: Buscar dados de clientes em PARALELO
      const [
        clientesData,
        clientesDataAnterior,
        clientesTotaisContahubData,
        clientesTotaisYuzerData,
        clientesTotaisSymplaData
      ] = await Promise.all([
        // Clientes ativos do trimestre atual
        fetchAllData(supabase, 'contahub_periodo', 'cli_fone, dt_gerencial', {
          'eq_bar_id': barIdNum,
          'gte_dt_gerencial': startDate,
          'lte_dt_gerencial': endDateEfetivo
        }),
        // Clientes ativos do trimestre anterior
        fetchAllData(supabase, 'contahub_periodo', 'cli_fone, dt_gerencial', {
          'eq_bar_id': barIdNum,
          'gte_dt_gerencial': startDateAnterior,
          'lte_dt_gerencial': endDateAnterior
        }),
        // Clientes totais ContaHub
        fetchAllData(supabase, 'contahub_periodo', 'pessoas', {
          'eq_bar_id': barIdNum,
          'gte_dt_gerencial': startDate,
          'lte_dt_gerencial': endDateEfetivo
        }),
        // Clientes totais Yuzer
        fetchAllData(supabase, 'yuzer_produtos', 'quantidade, produto_nome', {
          'eq_bar_id': barIdNum,
          'gte_data_evento': startDate,
          'lte_data_evento': endDateEfetivo
        }),
        // Clientes totais Sympla
        fetchAllData(supabase, 'sympla_resumo', 'checkins_realizados', {
          'gte_data_inicio': startDate,
          'lte_data_inicio': endDateEfetivo
        })
      ]);
      
      // Calcular Clientes Ativos (2+ visitas) - Trimestre Atual
      const clientesComTelefone = clientesData?.filter(item => item.cli_fone) || [];
      const clientesMap = new Map();
      clientesComTelefone.forEach(item => {
        const count = clientesMap.get(item.cli_fone) || 0;
        clientesMap.set(item.cli_fone, count + 1);
      });
      let clientesAtivos = 0;
      clientesMap.forEach(count => {
        if (count >= 2) clientesAtivos++;
      });
      
      // Calcular Clientes Ativos - Trimestre Anterior
      const clientesComTelefoneAnterior = clientesDataAnterior?.filter(item => item.cli_fone) || [];
      const clientesMapAnterior = new Map();
      clientesComTelefoneAnterior.forEach(item => {
        const count = clientesMapAnterior.get(item.cli_fone) || 0;
        clientesMapAnterior.set(item.cli_fone, count + 1);
      });
      let clientesAtivosAnterior = 0;
      clientesMapAnterior.forEach(count => {
        if (count >= 2) clientesAtivosAnterior++;
      });
      
      const variacaoClientesAtivos = clientesAtivosAnterior > 0 ? ((clientesAtivos - clientesAtivosAnterior) / clientesAtivosAnterior * 100) : 0;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`👥 T${trimestre}: ${clientesAtivos} ativos | T${trimestre-1}: ${clientesAtivosAnterior} | Var: ${variacaoClientesAtivos.toFixed(1)}%`);
      }
      
      // View desabilitada - usando cálculo manual
      const viewTri: any | null = null;

      // Logs detalhados removidos
      
      // Filtrar produtos Yuzer que são ingressos/entradas
      const ingressosYuzer = viewTri ? [] : clientesTotaisYuzerData?.filter(item => 
        item.produto_nome && (
          item.produto_nome.toLowerCase().includes('ingresso') ||
          item.produto_nome.toLowerCase().includes('entrada')
        )
      ) || [];
      
      // 🔍 DEBUG: Detalhes dos produtos Yuzer
      if (!viewTri && ingressosYuzer.length > 0 && process.env.NODE_ENV === 'development') {
        console.log('🎫 PRODUTOS YUZER DETALHADOS:');
        ingressosYuzer.forEach((item, index) => {
          if (index < 5) { // Mostrar apenas os 5 primeiros
            console.log(`  ${item.produto_nome}: ${item.quantidade} unidades`);
          }
        });
        if (ingressosYuzer.length > 5) {
          console.log(`  ... e mais ${ingressosYuzer.length - 5} produtos`);
        }
      }
      
      const totalClientesContahub = viewTri ? 0 : (clientesTotaisContahubData?.reduce((sum, item) => sum + (item.pessoas || 0), 0) || 0);
      // ✅ CORREÇÃO: Somar unidades de ingressos = pessoas que foram ao evento
      // Cada ingresso vendido representa uma pessoa
      const totalClientesYuzer = viewTri ? 0 : ingressosYuzer.reduce((sum, item) => sum + (item.quantidade || 0), 0);
      // ✅ CORRIGIDO: Somar checkins_realizados do sympla_resumo no trimestral
      const totalClientesSympla = viewTri ? 0 : (clientesTotaisSymplaData?.reduce((sum, item) => sum + (item.checkins_realizados || 0), 0) || 0);
      const totalClientesTrimestre = viewTri ? (viewTri.clientes_totais || 0) : (totalClientesContahub + totalClientesYuzer + totalClientesSympla);
      
      // ✅ COMPARAÇÃO CLIENTES TOTAIS COM TRIMESTRE ANTERIOR
      // 🔧 CORREÇÃO: Usar trimestre anterior REAL (T3: Jul-Set) não D-90
      const trimestreAnteriorDatesClientes = getTrimestreAnterior(trimestre);
      const trimestreAnteriorStartClientes = trimestreAnteriorDatesClientes.start;
      const trimestreAnteriorEndClientes = trimestreAnteriorDatesClientes.end;
      
      const [clientesContahubAnterior, clientesYuzerAnterior, clientesSymplaAnterior] = await Promise.all([
        fetchAllData(supabase, 'contahub_periodo', 'pessoas', {
          'eq_bar_id': barIdNum,
          'gte_dt_gerencial': trimestreAnteriorStartClientes,
          'lte_dt_gerencial': trimestreAnteriorEndClientes
        }),
        supabase.from('yuzer_produtos').select('quantidade, produto_nome').eq('bar_id', barIdNum)
          .gte('data_evento', trimestreAnteriorStartClientes)
          .lte('data_evento', trimestreAnteriorEndClientes),
        fetchAllData(supabase, 'sympla_resumo', 'checkins_realizados', {
          'gte_data_inicio': trimestreAnteriorStartClientes,
          'lte_data_inicio': trimestreAnteriorEndClientes
        })
      ]);
      
      const ingressosYuzerAnterior = clientesYuzerAnterior.data?.filter(item => 
        item.produto_nome && (
          item.produto_nome.toLowerCase().includes('ingresso') ||
          item.produto_nome.toLowerCase().includes('entrada')
        )
      ) || [];
      
      const totalClientesContahubAnterior = clientesContahubAnterior?.reduce((sum, item) => sum + (item.pessoas || 0), 0) || 0;
      const totalClientesYuzerAnterior = ingressosYuzerAnterior.reduce((sum, item) => sum + (item.quantidade || 0), 0);
      const totalClientesSymplaAnterior = clientesSymplaAnterior?.reduce((sum, item) => sum + (item.checkins_realizados || 0), 0) || 0;
      const totalClientesTrimestreAnterior = totalClientesContahubAnterior + totalClientesYuzerAnterior + totalClientesSymplaAnterior;
      
      const variacaoClientesTotais = totalClientesTrimestreAnterior > 0 ? 
        ((totalClientesTrimestre - totalClientesTrimestreAnterior) / totalClientesTrimestreAnterior * 100) : 0;
      
      // 🔍 DEBUG: Logs detalhados dos clientes totais
      console.log('👥 CLIENTES TOTAIS TRIMESTRE DETALHADOS - ✅ CORRIGIDO:');
      console.log(`Trimestre ATUAL (T${trimestre}): ${startDate} a ${endDate}`);
      console.log(`Trimestre ANTERIOR (T${trimestre - 1}): ${trimestreAnteriorStartClientes} a ${trimestreAnteriorEndClientes}`);
      if (viewTri) {
        console.log(`📊 Usando VIEW materializada: ${viewTri.clientes_totais || 0} clientes`);
      } else {
        console.log(`\nT${trimestre} (atual):`);
        console.log(`  ContaHub: ${clientesTotaisContahubData?.length || 0} registros = ${totalClientesContahub} pessoas`);
        console.log(`  Yuzer: ${ingressosYuzer.length || 0} produtos = ${totalClientesYuzer} pessoas`);
        console.log(`  Sympla: ${clientesTotaisSymplaData?.length || 0} participantes = ${totalClientesSympla} pessoas`);
      }
      console.log(`\nTOTAL CLIENTES T${trimestre} (atual): ${totalClientesTrimestre}`);
      console.log(`TOTAL CLIENTES T${trimestre - 1} (anterior): ${totalClientesTrimestreAnterior}`);
      console.log(`✅ Variação correta: ${variacaoClientesTotais.toFixed(1)}%`);
      
      // Logs detalhados removidos

      // CMO % (Nibo)
      const categoriasCMO = [
        'SALARIO FUNCIONARIOS', 'ALIMENTAÇÃO', 'PROVISÃO TRABALHISTA', 'VALE TRANSPORTE',
        'FREELA ATENDIMENTO', 'FREELA BAR', 'FREELA COZINHA',
        'FREELA LIMPEZA', 'FREELA SEGURANÇA', 'Marketing', 'MANUTENÇÃO',
        'Materiais Operação', 'Outros Operação'
      ];

      let totalCMO = viewTri ? (viewTri.cmo_total || 0) : 0;
      if (!viewTri) {
        const { data: cmoData } = await supabase
          .from('nibo_agendamentos')
          .select('valor, categoria_nome')
          .eq('bar_id', barIdNum)
          .in('categoria_nome', categoriasCMO)
          .gte('data_competencia', startDate)
          .lte('data_competencia', endDateEfetivo);
        totalCMO = cmoData?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0;
        
        // 🔍 DEBUG: Detalhes do CMO
        console.log('💰 CMO DETALHADO:');
        console.log(`Registros Nibo: ${cmoData?.length || 0}`);
        console.log(`Categorias CMO: ${categoriasCMO.join(', ')}`);
        console.log(`Total CMO: R$ ${totalCMO}`);
        if (cmoData && cmoData.length > 0) {
          const categoriasSoma = {};
          cmoData.forEach(item => {
            categoriasSoma[item.categoria_nome] = (categoriasSoma[item.categoria_nome] || 0) + (item.valor || 0);
          });
          console.log('Por categoria:', categoriasSoma);
        }
      }
      
      // Logs detalhados removidos

            // Faturamento trimestral - MESMA LÓGICA DO ANUAL (últimos 3 meses)
      let faturamentoTrimestre = viewTri ? (viewTri.faturamento_trimestre || 0) : 0;
      
      // 🔍 DEBUG: Verificar se está usando VIEW
      if (viewTri) {
        console.log('📊 USANDO VIEW MATERIALIZADA para faturamento:');
        console.log(`Faturamento Trimestre: R$ ${faturamentoTrimestre}`);
      }
      
      if (!viewTri) {
        // USAR A MESMA LÓGICA DO FATURAMENTO ANUAL (excluindo Conta Assinada)
        const fatContahubData = await fetchAllData(supabase, 'contahub_pagamentos', 'liquido, meio', {
          'gte_dt_gerencial': startDate,
          'lte_dt_gerencial': endDateEfetivo,
          'eq_bar_id': barIdNum  // Mesma ordem dos parâmetros do anual
        });
        
        // Filtrar para excluir 'Conta Assinada' (consumo de sócios)
        const fatContahubFiltrado = fatContahubData?.filter(item => item.meio !== 'Conta Assinada') || [];
        const fatYuzerData = await fetchAllData(supabase, 'yuzer_pagamento', 'valor_liquido', {
          'gte_data_evento': startDate,
          'lte_data_evento': endDateEfetivo,
          'eq_bar_id': barIdNum  // Mesma ordem dos parâmetros do anual
        });
        const fatSymplaData = await fetchAllData(supabase, 'sympla_pedidos', 'valor_liquido', {
          'gte_data_pedido': startDate,
          'lte_data_pedido': endDateEfetivo
          // Sympla não tem bar_id (mesma lógica do anual)
        });
        
        // Calcular com dados paginados (mesma lógica do anual)
        const faturamentoContahubTri = fatContahubFiltrado?.reduce((sum, item) => sum + (item.liquido || 0), 0) || 0;
        const faturamentoYuzerTri = fatYuzerData?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
        const faturamentoSymplaTri = fatSymplaData?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
        faturamentoTrimestre = faturamentoContahubTri + faturamentoYuzerTri + faturamentoSymplaTri;

        // Log final faturamento trimestre
        console.log(`💰 Faturamento T${trimestre} (${startDate} a ${endDateEfetivo}): R$ ${faturamentoTrimestre.toLocaleString('pt-BR')}`);
      }
      
      // FORÇAR RECÁLCULO DO CMO % (não usar VIEW para garantir valor correto)
      const percentualCMO = faturamentoTrimestre > 0 ? (totalCMO / faturamentoTrimestre) * 100 : 0;
      
      // 🔍 DEBUG: Cálculo final CMO
      console.log('🧮 CÁLCULO CMO FINAL (FORÇADO):');
      console.log(`CMO Total: R$ ${totalCMO.toLocaleString('pt-BR')}`);
      console.log(`Faturamento Trimestre: R$ ${faturamentoTrimestre.toLocaleString('pt-BR')}`);
      console.log(`Divisão: ${totalCMO} ÷ ${faturamentoTrimestre} = ${(totalCMO / faturamentoTrimestre).toFixed(4)}`);
      console.log(`Percentual CMO: ${percentualCMO.toFixed(2)}%`);
      console.log(`Usando VIEW? ${viewTri ? 'SIM' : 'NÃO - RECÁLCULO MANUAL'}`);
      
      if (viewTri) {
        console.log(`⚠️  VIEW tinha: ${viewTri.cmo_percent}% (IGNORADO)`);
      }
      
      // ✅ COMPARAÇÃO CMO COM TRIMESTRE ANTERIOR
      // 🔧 CORREÇÃO: Usar trimestre anterior REAL (T3: Jul-Set) não D-90
      const trimestreAnteriorDatesCMO = getTrimestreAnterior(trimestre);
      const cmoTrimestreAnteriorStart = trimestreAnteriorDatesCMO.start;
      const cmoTrimestreAnteriorEnd = trimestreAnteriorDatesCMO.end;
      
      // Buscar CMO do trimestre anterior
      const cmoAnteriorData = await fetchAllData(supabase, 'nibo_agendamentos', 'valor', {
        'eq_bar_id': barIdNum,
        'gte_data_competencia': cmoTrimestreAnteriorStart,
        'lte_data_competencia': cmoTrimestreAnteriorEnd,
        'in_categoria_nome': categoriasCMO
      });
      
      // Buscar faturamento do trimestre anterior (excluindo Conta Assinada)
      const faturamentoTrimestreAnteriorContahubData = await fetchAllData(supabase, 'contahub_pagamentos', 'liquido, meio', {
        'eq_bar_id': barIdNum,
        'gte_dt_gerencial': cmoTrimestreAnteriorStart,
        'lte_dt_gerencial': cmoTrimestreAnteriorEnd
      });
      
      // Filtrar para excluir 'Conta Assinada' (consumo de sócios)
      const faturamentoTrimestreAnteriorContahub = faturamentoTrimestreAnteriorContahubData?.filter(item => item.meio !== 'Conta Assinada') || [];
      
      const [faturamentoYuzerTriAnterior, faturamentoSymplaTriAnterior] = await Promise.all([
        supabase.from('yuzer_pagamento').select('valor_liquido').eq('bar_id', barIdNum)
          .gte('data_evento', cmoTrimestreAnteriorStart).lte('data_evento', cmoTrimestreAnteriorEnd),
        supabase.from('sympla_pedidos').select('valor_liquido')
          .gte('data_pedido', cmoTrimestreAnteriorStart).lte('data_pedido', cmoTrimestreAnteriorEnd)
      ]);
      
      const totalCMOAnterior = cmoAnteriorData?.reduce((sum, item) => sum + Math.abs(item.valor || 0), 0) || 0;
      const faturamentoAnteriorContahub = faturamentoTrimestreAnteriorContahub?.reduce((sum, item) => sum + (item.liquido || 0), 0) || 0;
      const faturamentoAnteriorYuzer = faturamentoYuzerTriAnterior.data?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
      const faturamentoAnteriorSympla = faturamentoSymplaTriAnterior.data?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
      const faturamentoTrimestreAnteriorTotal = faturamentoAnteriorContahub + faturamentoAnteriorYuzer + faturamentoAnteriorSympla;
      
      const percentualCMOAnterior = faturamentoTrimestreAnteriorTotal > 0 ? (totalCMOAnterior / faturamentoTrimestreAnteriorTotal) * 100 : 0;
      const variacaoCMO = percentualCMOAnterior > 0 ? ((percentualCMO - percentualCMOAnterior) / percentualCMOAnterior * 100) : 0;
      
      // 🔍 DEBUG: Comparação CMO detalhada
      console.log('🔄 COMPARAÇÃO CMO TRIMESTRE - ✅ CORRIGIDO:');
      console.log(`Trimestre ATUAL (T${trimestre}): ${startDate} a ${endDate}`);
      console.log(`Trimestre ANTERIOR (T${trimestre - 1}): ${cmoTrimestreAnteriorStart} a ${cmoTrimestreAnteriorEnd}`);
      console.log(`\nDados T${trimestre - 1} (anterior):`);
      console.log(`  CMO: R$ ${totalCMOAnterior.toLocaleString('pt-BR')}`);
      console.log(`  Faturamento ContaHub: R$ ${faturamentoAnteriorContahub.toLocaleString('pt-BR')}`);
      console.log(`  Faturamento Yuzer: R$ ${faturamentoAnteriorYuzer.toLocaleString('pt-BR')}`);
      console.log(`  Faturamento Sympla: R$ ${faturamentoAnteriorSympla.toLocaleString('pt-BR')}`);
      console.log(`  Faturamento TOTAL: R$ ${faturamentoTrimestreAnteriorTotal.toLocaleString('pt-BR')}`);
      console.log(`  CMO%: ${percentualCMOAnterior.toFixed(2)}%`);
      console.log(`\nCMO% T${trimestre} (atual): ${percentualCMO.toFixed(2)}%`);
      console.log(`✅ Variação correta: ${variacaoCMO.toFixed(1)}%`);
      
      // Logs detalhados removidos

      // % Artística (Planejamento Comercial) - CÁLCULO CORRIGIDO USANDO NIBO_AGENDAMENTOS
      let viewOk = true;
      let variacaoArtistica = 0;
      const percentualArtistica = viewTri ? (viewTri.artistica_percent || 0) : (async () => {
        // Buscar custos artísticos e de produção na nibo_agendamentos
        const [custoArtisticoData, custoProducaoData] = await Promise.all([
          fetchAllData(supabase, 'nibo_agendamentos', 'valor', {
            'eq_bar_id': barIdNum,
            'gte_data_competencia': startDate,
            'lte_data_competencia': endDateEfetivo,
            'eq_categoria_nome': 'Atrações Programação'
          }),
          fetchAllData(supabase, 'nibo_agendamentos', 'valor', {
            'eq_bar_id': barIdNum,
            'gte_data_competencia': startDate,
            'lte_data_competencia': endDateEfetivo,
            'eq_categoria_nome': 'Produção Eventos'
          })
        ]);
        
        // Calcular totais
        const totalCustoArtistico = custoArtisticoData?.reduce((sum, item) => sum + Math.abs(item.valor || 0), 0) || 0;
        const totalCustoProducao = custoProducaoData?.reduce((sum, item) => sum + Math.abs(item.valor || 0), 0) || 0;
        
        // Usar o faturamento já calculado acima
        const totalFaturamento = faturamentoTrimestre;
        
        // 🔍 DEBUG: Logs do cálculo artística
        console.log('🎭 CÁLCULO % ARTÍSTICA (NIBO_AGENDAMENTOS):');
        console.log(`Registros Atrações: ${custoArtisticoData?.length || 0}`);
        console.log(`Registros Produção: ${custoProducaoData?.length || 0}`);
        console.log(`Total Custo Artístico: R$ ${totalCustoArtistico.toLocaleString('pt-BR')}`);
        console.log(`Total Custo Produção: R$ ${totalCustoProducao.toLocaleString('pt-BR')}`);
        console.log(`Total Faturamento: R$ ${totalFaturamento.toLocaleString('pt-BR')}`);
        
        const totalCustoCompleto = totalCustoArtistico + totalCustoProducao;
        
        const percentualCalculado = totalFaturamento > 0 ? (totalCustoCompleto / totalFaturamento) * 100 : 0;
        
        // ✅ COMPARAÇÃO % ARTÍSTICA COM TRIMESTRE ANTERIOR CORRETO (NIBO_AGENDAMENTOS)
        // 🔧 CORREÇÃO: Usar trimestre anterior REAL (T3: Jul-Set) não D-90
        const trimestreAnteriorDatesArtistica = getTrimestreAnterior(trimestre);
        const trimestreAnteriorStartArtistica = trimestreAnteriorDatesArtistica.start;
        const trimestreAnteriorEndArtistica = trimestreAnteriorDatesArtistica.end;
        
        const [custoArtisticoAnterior, custoProducaoAnterior] = await Promise.all([
          fetchAllData(supabase, 'nibo_agendamentos', 'valor', {
            'eq_bar_id': barIdNum,
            'gte_data_competencia': trimestreAnteriorStartArtistica,
            'lte_data_competencia': trimestreAnteriorEndArtistica,
            'eq_categoria_nome': 'Atrações Programação'
          }),
          fetchAllData(supabase, 'nibo_agendamentos', 'valor', {
            'eq_bar_id': barIdNum,
            'gte_data_competencia': trimestreAnteriorStartArtistica,
            'lte_data_competencia': trimestreAnteriorEndArtistica,
            'eq_categoria_nome': 'Produção Eventos'
          })
        ]);
        
        const totalCustoArtisticoAnterior = custoArtisticoAnterior?.reduce((sum, item) => sum + Math.abs(item.valor || 0), 0) || 0;
        const totalCustoProducaoAnterior = custoProducaoAnterior?.reduce((sum, item) => sum + Math.abs(item.valor || 0), 0) || 0;
        const totalCustoCompletoAnterior = totalCustoArtisticoAnterior + totalCustoProducaoAnterior;
        
        // 🔧 CORREÇÃO: Calcular faturamento do trimestre anterior CORRETO (T3: Jul-Set)
        const [fatContahubAnteriorArtistica, fatYuzerAnteriorArtistica, fatSymplaAnteriorArtistica] = await Promise.all([
          fetchAllData(supabase, 'contahub_pagamentos', 'liquido, meio', {
            'eq_bar_id': barIdNum,
            'gte_dt_gerencial': trimestreAnteriorStartArtistica,
            'lte_dt_gerencial': trimestreAnteriorEndArtistica
          }),
          fetchAllData(supabase, 'yuzer_pagamento', 'valor_liquido', {
            'eq_bar_id': barIdNum,
            'gte_data_evento': trimestreAnteriorStartArtistica,
            'lte_data_evento': trimestreAnteriorEndArtistica
          }),
          fetchAllData(supabase, 'sympla_pedidos', 'valor_liquido', {
            'gte_data_pedido': trimestreAnteriorStartArtistica,
            'lte_data_pedido': trimestreAnteriorEndArtistica
          })
        ]);
        
        // Filtrar Conta Assinada
        const fatContahubFiltradoAnterior = fatContahubAnteriorArtistica?.filter(item => item.meio !== 'Conta Assinada') || [];
        const faturamentoContahubAnterior = fatContahubFiltradoAnterior?.reduce((sum, item) => sum + (item.liquido || 0), 0) || 0;
        const faturamentoYuzerAnterior = fatYuzerAnteriorArtistica?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
        const faturamentoSymplaAnterior = fatSymplaAnteriorArtistica?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
        const totalFaturamentoAnterior = faturamentoContahubAnterior + faturamentoYuzerAnterior + faturamentoSymplaAnterior;
        
        const percentualAnterior = totalFaturamentoAnterior > 0 ? (totalCustoCompletoAnterior / totalFaturamentoAnterior) * 100 : 0;
        variacaoArtistica = percentualAnterior > 0 ? ((percentualCalculado - percentualAnterior) / percentualAnterior * 100) : 0;
        
        console.log('🎭 COMPARAÇÃO % ARTÍSTICA (TRIMESTRE - NIBO) - ✅ CORRIGIDO:');
        console.log(`Trimestre ATUAL (T${trimestre}): ${startDate} até ${endDate}`);
        console.log(`Trimestre ANTERIOR (T${trimestre - 1}): ${trimestreAnteriorStartArtistica} até ${trimestreAnteriorEndArtistica}`);
        console.log(`\nDados T${trimestre - 1} (anterior):`);
        console.log(`  Registros Atrações: ${custoArtisticoAnterior?.length || 0}`);
        console.log(`  Registros Produção: ${custoProducaoAnterior?.length || 0}`);
        console.log(`  Custo Artístico: R$ ${totalCustoArtisticoAnterior.toLocaleString('pt-BR')}`);
        console.log(`  Custo Produção: R$ ${totalCustoProducaoAnterior.toLocaleString('pt-BR')}`);
        console.log(`  Faturamento Total: R$ ${totalFaturamentoAnterior.toLocaleString('pt-BR')}`);
        console.log(`  % Artística: ${percentualAnterior.toFixed(2)}%`);
        console.log(`\n% Artística T${trimestre} (atual): ${percentualCalculado.toFixed(2)}%`);
        console.log(`✅ Variação correta: ${variacaoArtistica.toFixed(1)}%`);
        
        // Variação será usada no retorno da função
        
        return percentualCalculado;
      })();

      // Log final do CMO
      console.log(`📊 CMO T${trimestre}: ${percentualCMO.toFixed(1)}% (R$ ${totalCMO.toLocaleString('pt-BR')} / R$ ${faturamentoTrimestre.toLocaleString('pt-BR')})`);

      // 🔧 CORREÇÃO: Usar trimestre anterior REAL em vez de D-90 para % Artística
      const trimestreAnteriorDates = getTrimestreAnterior(trimestre);
      const trimestreAnteriorStart = trimestreAnteriorDates.start;
      const trimestreAnteriorEnd = trimestreAnteriorDates.end;

      console.log('🔄 CORREÇÃO: Usando trimestre anterior REAL para comparações:');
      console.log(`T${trimestre} atual: ${startDate} a ${endDate}`);
      console.log(`T${trimestre - 1} anterior: ${trimestreAnteriorStart} a ${trimestreAnteriorEnd}`);

      // Metas dinâmicas por trimestre
      const getMetasTrimestre = (trimestre: number) => {
        const metas = {
          2: { // T2 (Abr-Jun)
            clientesAtivos: 3000,
            clientesTotais: 30000,
            retencao: 40,
            retencaoReal: 5,
            cmvLimpo: 34,
            cmo: 20,
            artistica: 17
          },
          3: { // T3 (Jul-Set)
            clientesAtivos: 3000,
            clientesTotais: 30000,
            retencao: 40,
            retencaoReal: 5,
            cmvLimpo: 34,
            cmo: 20,
            artistica: 17
          },
          4: { // T4 (Out-Dez) - METAS OFICIAIS
            clientesAtivos: 4000,
            clientesTotais: 15000,
            retencao: 40,
            retencaoReal: 5,
            cmvLimpo: 34,
            cmo: 20,
            artistica: 20
          }
        };
        return metas[trimestre as keyof typeof metas] || metas[3];
      };

      const metasTrimestre = getMetasTrimestre(trimestre);

      const resp = NextResponse.json({
        trimestral: {
          clientesAtivos: {
            valor: clientesAtivos,
            meta: metasTrimestre.clientesAtivos,
            variacao: variacaoClientesAtivos
          },
          clientesTotais: {
            valor: totalClientesTrimestre,
            meta: metasTrimestre.clientesTotais,
            variacao: variacaoClientesTotais
          },
          retencao: {
            ...(await calcularRetencao(supabase, barIdNum, mesRetencao || undefined, trimestre)),
            meta: metasTrimestre.retencao
          },
          retencaoReal: {
            ...(await calcularRetencaoReal(supabase, barIdNum, trimestre)),
            meta: metasTrimestre.retencaoReal
          },
          cmvLimpo: await (async () => {
            // Buscar CMV do trimestre atual da tabela cmv_manual
            const ano = new Date().getFullYear();
            const trimestresDatas: Record<number, { inicio: string; fim: string }> = {
              2: { inicio: `${ano}-04-01`, fim: `${ano}-06-30` },
              3: { inicio: `${ano}-07-01`, fim: `${ano}-09-30` },
              4: { inicio: `${ano}-10-01`, fim: `${ano}-12-31` }
            };
            
            const periodoAtual = trimestresDatas[trimestre] || trimestresDatas[4];
            
            const { data: cmvData } = await supabase
              .from('cmv_manual')
              .select('cmv_percentual')
              .eq('bar_id', barIdNum)
              .eq('periodo_tipo', 'trimestral')
              .eq('periodo_inicio', periodoAtual.inicio)
              .single();
            
            // Buscar CMV do trimestre anterior para variação
            const trimestreAnterior = trimestre === 2 ? 4 : trimestre - 1;
            const anoAnterior = trimestre === 2 ? ano - 1 : ano;
            const periodoAnterior = {
              2: { inicio: `${anoAnterior}-04-01`, fim: `${anoAnterior}-06-30` },
              3: { inicio: `${anoAnterior}-07-01`, fim: `${anoAnterior}-09-30` },
              4: { inicio: `${anoAnterior}-10-01`, fim: `${anoAnterior}-12-31` }
            }[trimestreAnterior] || { inicio: `${anoAnterior}-10-01`, fim: `${anoAnterior}-12-31` };
            
            const { data: cmvAnterior } = await supabase
              .from('cmv_manual')
              .select('cmv_percentual')
              .eq('bar_id', barIdNum)
              .eq('periodo_tipo', 'trimestral')
              .eq('periodo_inicio', periodoAnterior.inicio)
              .single();
            
            const valorAtual = cmvData?.cmv_percentual || 0;
            const valorAnterior = cmvAnterior?.cmv_percentual || 0;
            const variacao = valorAnterior > 0 ? ((valorAtual - valorAnterior) / valorAnterior) * 100 : 0;
            
            return {
              valor: valorAtual,
              meta: metasTrimestre.cmvLimpo,
              variacao: variacao
            };
          })(),
          cmo: {
            valor: percentualCMO,
            meta: metasTrimestre.cmo,
            valorAbsoluto: viewTri ? (viewTri.cmo_total || 0) : totalCMO,
            variacao: variacaoCMO
          },
          artistica: {
            valor: await percentualArtistica,
            meta: metasTrimestre.artistica,
            variacao: variacaoArtistica
          }
        }
      });
      resp.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      if (!viewOk) resp.headers.set('X-Artistica-View', 'missing:view_eventos');
      if (viewTri) resp.headers.set('X-View-Used', 'view_visao_geral_trimestral');
      return resp;
    }

    // Buscar dados mensais
    if (periodo === 'mensal') {
      const mes = searchParams.get('mes'); // formato YYYY-MM
      
      if (!mes) {
        return NextResponse.json(
          { success: false, error: 'Mês não especificado' },
          { status: 400 }
        );
      }

      const [ano, mesNum] = mes.split('-').map(Number);
      const startDate = `${ano}-${mesNum.toString().padStart(2, '0')}-01`;
      const endDate = new Date(ano, mesNum, 0).toISOString().split('T')[0]; // Último dia do mês

      // Clientes Ativos (visitaram 2+ vezes nos últimos 30 dias)
      const dataLimite30Dias = new Date();
      dataLimite30Dias.setDate(dataLimite30Dias.getDate() - 30);
      const dataLimite30DiasStr = dataLimite30Dias.toISOString().split('T')[0];

      const { data: clientesAtivosData, error: clientesAtivosError } = await supabase
        .from('contahub_periodo')
        .select('cli_fone')
        .eq('bar_id', barIdNum)
        .gte('dt_gerencial', dataLimite30DiasStr)
        .not('cli_fone', 'is', null);

      if (clientesAtivosError) {
        console.error('Erro ao buscar clientes ativos mensais:', clientesAtivosError);
      }

      // Contar clientes únicos com 2+ visitas
      const clientesMap = new Map<string, number>();
      (clientesAtivosData || []).forEach(row => {
        const fone = (row.cli_fone || '').toString().trim();
        if (fone) {
          clientesMap.set(fone, (clientesMap.get(fone) || 0) + 1);
        }
      });

      const clientesAtivos = Array.from(clientesMap.values()).filter(count => count >= 2).length;

      // Clientes Totais do mês
      const { data: clientesTotaisData, error: clientesTotaisError } = await supabase
        .from('contahub_periodo')
        .select('cli_fone')
        .eq('bar_id', barIdNum)
        .gte('dt_gerencial', startDate)
        .lte('dt_gerencial', endDate)
        .not('cli_fone', 'is', null);

      if (clientesTotaisError) {
        console.error('Erro ao buscar clientes totais mensais:', clientesTotaisError);
      }

      const clientesTotaisUnicos = new Set(
        (clientesTotaisData || []).map(row => (row.cli_fone || '').toString().trim()).filter(Boolean)
      ).size;

      // Faturamento Total do mês
      const { data: faturamentoData, error: faturamentoError } = await supabase
        .from('contahub_periodo')
        .select('vr_total')
        .eq('bar_id', barIdNum)
        .gte('dt_gerencial', startDate)
        .lte('dt_gerencial', endDate);

      if (faturamentoError) {
        console.error('Erro ao buscar faturamento mensal:', faturamentoError);
      }

      const faturamentoTotal = (faturamentoData || []).reduce((sum, row) => sum + (row.vr_total || 0), 0);

      // Taxa de Retenção (clientes ativos / clientes totais)
      const taxaRetencao = clientesTotaisUnicos > 0 ? (clientesAtivos / clientesTotaisUnicos) * 100 : 0;

      // Artística (valores simulados para o mês)
      const artistica = faturamentoTotal * 0.05; // 5% do faturamento

      const resp = NextResponse.json({
        success: true,
        data: {
          faturamentoTotal: {
            valor: faturamentoTotal,
            meta: 800000, // Meta mensal
            variacao: 0 // TODO: Calcular variação vs mês anterior
          },
          clientesAtivos: {
            valor: clientesAtivos,
            meta: 250, // Meta mensal
            variacao: 0
          },
          clientesTotais: {
            valor: clientesTotaisUnicos,
            meta: 1000, // Meta mensal
            variacao: 0
          },
          retencao: {
            valor: taxaRetencao,
            meta: 40, // Meta de 40% (retornantes)
            variacao: 0
          },
          retencaoReal: {
            valor: 0, // TODO: Calcular para visão anual
            meta: 5, // Meta de 5% (que voltaram)
            variacao: 0
          },
          artistica: {
            valor: artistica,
            meta: faturamentoTotal * 0.08, // Meta de 8%
            variacao: 0
          }
        }
      });

      resp.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      return resp;
    }

    const resp = NextResponse.json({ error: 'Período inválido' }, { status: 400 });
    resp.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return resp;

  } catch (error) {
    // Log detalhado apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Erro ao buscar indicadores:', error);
    } else {
      // Em produção, log simplificado
      console.error('Erro na API visão-geral:', error instanceof Error ? error.message : 'Erro desconhecido');
    }
    
    const resp = NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
    resp.headers.set('Cache-Control', 'no-store');
    return resp;
  }
}
