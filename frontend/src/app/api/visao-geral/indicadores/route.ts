import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

// Função para calcular retenção dinâmica (mês específico vs últimos 2 meses)
async function calcularRetencao(supabase: any, barIdNum: number, mesEspecifico?: string) {
  try {
    let dataReferencia: Date;
    
    if (mesEspecifico) {
      // Se foi passado um mês específico (formato YYYY-MM)
      const [ano, mes] = mesEspecifico.split('-').map(Number);
      dataReferencia = new Date(ano, mes - 1, 1); // mes - 1 porque Date usa 0-11
    } else {
      // Se não foi passado, usa o mês atual
      dataReferencia = new Date();
    }
    
    // Calcular primeiro dia do mês de referência
    const inicioMesAtual = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), 1);
    const fimMesAtual = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() + 1, 0);
    
    // Calcular últimos 2 meses (mês anterior e anterior ao anterior)
    const inicioUltimos2Meses = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() - 2, 1);
    const fimUltimos2Meses = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), 0);
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    const mesAtualInicio = formatDate(inicioMesAtual);
    const mesAtualFim = formatDate(fimMesAtual);
    const ultimos2MesesInicio = formatDate(inicioUltimos2Meses);
    const ultimos2MesesFim = formatDate(fimUltimos2Meses);
    
    // Logs apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 CALCULANDO RETENÇÃO:');
      console.log(`Parâmetro mesEspecifico recebido: ${mesEspecifico}`);
      console.log(`Data de referência calculada: ${dataReferencia.toISOString()}`);
      console.log(`Mês de referência${mesEspecifico ? ` (${mesEspecifico})` : ' (atual)'}: ${mesAtualInicio} até ${mesAtualFim}`);
      console.log(`Últimos 2 meses: ${ultimos2MesesInicio} até ${ultimos2MesesFim}`);
    }
    
    // Buscar clientes do mês atual
    const clientesMesAtualData = await fetchAllData(supabase, 'contahub_periodo', 'cli_fone', {
      'eq_bar_id': barIdNum,
      'gte_dt_gerencial': mesAtualInicio,
      'lte_dt_gerencial': mesAtualFim
    });
    
    // Buscar clientes dos últimos 2 meses
    const clientesUltimos2MesesData = await fetchAllData(supabase, 'contahub_periodo', 'cli_fone', {
      'eq_bar_id': barIdNum,
      'gte_dt_gerencial': ultimos2MesesInicio,
      'lte_dt_gerencial': ultimos2MesesFim
    });
    
    // Filtrar apenas clientes com telefone
    const clientesMesAtual = new Set(
      clientesMesAtualData?.filter(item => item.cli_fone).map(item => item.cli_fone) || []
    );
    
    const clientesUltimos2Meses = new Set(
      clientesUltimos2MesesData?.filter(item => item.cli_fone).map(item => item.cli_fone) || []
    );
    
    // Calcular intersecção (clientes que vieram no mês atual E nos últimos 2 meses)
    const clientesRetidos = [...clientesMesAtual].filter(cliente => 
      clientesUltimos2Meses.has(cliente)
    );
    
    const totalClientesMesAtual = clientesMesAtual.size;
    const totalClientesRetidos = clientesRetidos.length;
    const percentualRetencao = totalClientesMesAtual > 0 
      ? (totalClientesRetidos / totalClientesMesAtual) * 100 
      : 0;
    
    // ✅ COMPARAÇÃO COM MÊS ANTERIOR
    const mesAnteriorReferencia = new Date(dataReferencia);
    mesAnteriorReferencia.setMonth(mesAnteriorReferencia.getMonth() - 1);
    
    const inicioMesAnterior = new Date(mesAnteriorReferencia.getFullYear(), mesAnteriorReferencia.getMonth(), 1);
    const fimMesAnterior = new Date(mesAnteriorReferencia.getFullYear(), mesAnteriorReferencia.getMonth() + 1, 0);
    const inicioUltimos2MesesAnterior = new Date(mesAnteriorReferencia.getFullYear(), mesAnteriorReferencia.getMonth() - 2, 1);
    const fimUltimos2MesesAnterior = new Date(mesAnteriorReferencia.getFullYear(), mesAnteriorReferencia.getMonth(), 0);
    
    const mesAnteriorInicioStr = formatDate(inicioMesAnterior);
    const mesAnteriorFimStr = formatDate(fimMesAnterior);
    const ultimos2MesesAnteriorInicioStr = formatDate(inicioUltimos2MesesAnterior);
    const ultimos2MesesAnteriorFimStr = formatDate(fimUltimos2MesesAnterior);
    
    // Buscar dados do mês anterior
    const [clientesMesAnteriorData, clientesUltimos2MesesAnteriorData] = await Promise.all([
      fetchAllData(supabase, 'contahub_periodo', 'cli_fone', {
        'eq_bar_id': barIdNum,
        'gte_dt_gerencial': mesAnteriorInicioStr,
        'lte_dt_gerencial': mesAnteriorFimStr
      }),
      fetchAllData(supabase, 'contahub_periodo', 'cli_fone', {
        'eq_bar_id': barIdNum,
        'gte_dt_gerencial': ultimos2MesesAnteriorInicioStr,
        'lte_dt_gerencial': ultimos2MesesAnteriorFimStr
      })
    ]);
    
    const clientesMesAnterior = new Set(
      clientesMesAnteriorData?.filter(item => item.cli_fone).map(item => item.cli_fone) || []
    );
    
    const clientesUltimos2MesesAnterior = new Set(
      clientesUltimos2MesesAnteriorData?.filter(item => item.cli_fone).map(item => item.cli_fone) || []
    );
    
    const clientesRetidosAnterior = [...clientesMesAnterior].filter(cliente => 
      clientesUltimos2MesesAnterior.has(cliente)
    );
    
    const totalClientesMesAnterior = clientesMesAnterior.size;
    const totalClientesRetidosAnterior = clientesRetidosAnterior.length;
    const percentualRetencaoAnterior = totalClientesMesAnterior > 0 
      ? (totalClientesRetidosAnterior / totalClientesMesAnterior) * 100 
      : 0;
    
    const variacaoRetencao = percentualRetencaoAnterior > 0 
      ? ((percentualRetencao - percentualRetencaoAnterior) / percentualRetencaoAnterior * 100)
      : 0;
    
    // Logs detalhados apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 RETENÇÃO CALCULADA:');
      console.log(`Clientes únicos mês atual: ${totalClientesMesAtual}`);
      console.log(`Clientes únicos últimos 2 meses: ${clientesUltimos2Meses.size}`);
      console.log(`Clientes retidos (intersecção): ${totalClientesRetidos}`);
      console.log(`Taxa de retenção: ${percentualRetencao.toFixed(1)}%`);
      console.log(`Taxa de retenção mês anterior: ${percentualRetencaoAnterior.toFixed(1)}%`);
      console.log(`Variação retenção: ${variacaoRetencao.toFixed(1)}%`);
    }
    
    return {
      valor: parseFloat(percentualRetencao.toFixed(1)),
      variacao: parseFloat(variacaoRetencao.toFixed(1))
    };
    
  } catch (error) {
    // Log apenas em desenvolvimento para evitar poluir console em produção
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Erro ao calcular retenção:', error);
    }
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
      // Faturamento 2025 (ContaHub + Yuzer + Sympla) - ATÉ DATA ATUAL
      
      // Buscar dados do ContaHub excluindo 'Conta Assinada' (mesma lógica do desempenho)
      const contahubData = await fetchAllData(supabase, 'contahub_pagamentos', 'liquido, meio', {
        'gte_dt_gerencial': startDate,
        'lte_dt_gerencial': endDate,
        'eq_bar_id': barIdNum
      });
      
      // Filtrar para excluir 'Conta Assinada' (consumo de sócios)
      const contahubFiltrado = contahubData?.filter(item => item.meio !== 'Conta Assinada') || [];
      
      const yuzerData = await fetchAllData(supabase, 'yuzer_pagamento', 'valor_liquido', {
        'gte_data_evento': startDate,
        'lte_data_evento': endDate,
        'eq_bar_id': barIdNum
      });
      
      const symplaData = await fetchAllData(supabase, 'sympla_pedidos', 'valor_liquido', {
        'gte_data_pedido': startDate,
        'lte_data_pedido': endDate
      });


      // Calcular com dados paginados
      
      const faturamentoContahub = contahubFiltrado?.reduce((sum, item) => sum + (item.liquido || 0), 0) || 0;
      const faturamentoYuzer = yuzerData?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
      const faturamentoSympla = symplaData?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
      const faturamentoTotal = faturamentoContahub + faturamentoYuzer + faturamentoSympla;
      
      // Log final de faturamento
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log(`💰 Faturamento Anual (${startDate} a ${endDate}): R$ ${faturamentoTotal.toLocaleString('pt-BR')}`);
      }
      
      // Logs detalhados removidos

      // Número de Pessoas (ContaHub + Yuzer + Sympla)
      // Pessoas com PAGINAÇÃO
      // Pessoas com paginação
      
      const pessoasContahubData = await fetchAllData(supabase, 'contahub_periodo', 'pessoas', {
        'eq_bar_id': barIdNum,
        'gte_dt_gerencial': startDate,
        'lte_dt_gerencial': endDate
      });
      
      // Yuzer e Sympla por enquanto sem paginação (volumes menores)
      const [pessoasYuzer, pessoasSympla] = await Promise.all([
        supabase
          .from('yuzer_produtos')
          .select('quantidade, produto_nome')
          .eq('bar_id', barIdNum)
          .or('produto_nome.ilike.%ingresso%,produto_nome.ilike.%entrada%')
          .gte('data_evento', startDate)
          .lte('data_evento', endDate),
        
        // ✅ USAR SYMPLA_RESUMO PARA MELHOR PERFORMANCE
        supabase
          .from('sympla_resumo')
          .select('checkins')
          .eq('bar_id', barIdNum)
          .gte('data_evento', startDate)
          .lte('data_evento', endDate)
      ]);

      const totalPessoasContahub = pessoasContahubData?.reduce((sum, item) => sum + (item.pessoas || 0), 0) || 0;
      const totalPessoasYuzer = pessoasYuzer.data?.reduce((sum, item) => sum + (item.quantidade || 0), 0) || 0;
      // ✅ SOMAR CHECKINS DO SYMPLA_RESUMO
      const totalPessoasSympla = pessoasSympla.data?.reduce((sum, item) => sum + (item.checkins || 0), 0) || 0;
      const totalPessoas = totalPessoasContahub + totalPessoasYuzer + totalPessoasSympla;
      
      // Log final de pessoas
      console.log(`👥 Total Pessoas (${startDate} a ${endDate}): ${totalPessoas.toLocaleString('pt-BR')}`);
      
      // Logs detalhados removidos

      // Reputação (Google Reviews)
      // Reputação (Google Reviews - Windsor) - COM PAGINAÇÃO
      // Reputação com paginação
      
      const reputacaoData = await fetchAllData(supabase, 'windsor_google', 'review_average_rating_total', {
        'gte_date': startDate,
        'lte_date': endDate
      });

      // Filtrar apenas registros com valor válido (não null)
      const reputacaoValida = reputacaoData?.filter(item => item.review_average_rating_total != null && item.review_average_rating_total > 0) || [];
      const reputacao = reputacaoValida.length > 0 
        ? reputacaoValida.reduce((sum, item) => sum + item.review_average_rating_total, 0) / reputacaoValida.length
        : 0;
        
      // Logs detalhados removidos

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
      // Trimestre selecionado

      // Clientes Ativos (visitaram 2+ vezes) no TRIMESTRE ATUAL
      // Usar as datas completas do trimestre selecionado
      
      const clientesData = await fetchAllData(supabase, 'contahub_periodo', 'cli_fone, dt_gerencial', {
        'eq_bar_id': barIdNum,
        'gte_dt_gerencial': startDate,
        'lte_dt_gerencial': endDate
      });
      
      // Filtrar apenas clientes com telefone
      const clientesComTelefone = clientesData?.filter(item => item.cli_fone) || [];
      // Logs detalhados removidos

      // Agrupar por telefone e contar visitas
      const clientesMap = new Map();
      clientesComTelefone.forEach(item => {
        const count = clientesMap.get(item.cli_fone) || 0;
        clientesMap.set(item.cli_fone, count + 1);
      });

      // Contar clientes com 2+ visitas
      let clientesAtivos = 0;
      clientesMap.forEach(count => {
        if (count >= 2) clientesAtivos++;
      });
      
      // ✅ COMPARAÇÃO COM TRIMESTRE ANTERIOR COMPLETO
      const { start: startDateAnterior, end: endDateAnterior } = getTrimestreAnterior(trimestre);
      
      const clientesDataAnterior = await fetchAllData(supabase, 'contahub_periodo', 'cli_fone, dt_gerencial', {
        'eq_bar_id': barIdNum,
        'gte_dt_gerencial': startDateAnterior,
        'lte_dt_gerencial': endDateAnterior
      });
      
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
      
      // 🔍 DEBUG: Logs de comparação
      // Logs detalhados apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('👥 CLIENTES ATIVOS - COMPARAÇÃO TRIMESTRAL:');
        console.log(`Trimestre atual: T${trimestre} (${startDate} a ${endDate}) = ${clientesAtivos} clientes ativos`);
        console.log(`Trimestre anterior: T${trimestre-1} (${startDateAnterior} a ${endDateAnterior}) = ${clientesAtivosAnterior} clientes ativos`);
      }
      const variacaoClientesAtivos = clientesAtivosAnterior > 0 ? ((clientesAtivos - clientesAtivosAnterior) / clientesAtivosAnterior * 100) : 0;
      if (process.env.NODE_ENV === 'development') {
        console.log(`Variação: ${variacaoClientesAtivos.toFixed(1)}%`);
      }
      
      // Logs detalhados removidos

      // 🚨 DESABILITANDO VIEW TEMPORARIAMENTE PARA FORÇAR RECÁLCULO DO CMO
      let viewTri: any | null = null;
      // COMENTADO PARA FORÇAR RECÁLCULO MANUAL
      /*
      try {
        const { data: triView, error: triViewErr } = await supabase
          .from('view_visao_geral_trimestral')
          .select('clientes_totais, cmo_total, faturamento_trimestre, cmo_percent, artistica_percent')
          .eq('bar_id', barIdNum)
          .eq('ano', 2025)
          .eq('trimestre', trimestre)
          .limit(1);
        if (!triViewErr && triView && triView.length > 0) {
          viewTri = triView[0];
        }
      } catch (_) {
        // ignora
      }
      */
      
      console.log('🚨 VIEW DESABILITADA - FORÇANDO RECÁLCULO MANUAL DE TUDO');
      // Número total de clientes no trimestre - COM PAGINAÇÃO
      // Clientes totais com paginação
      
      const clientesTotaisContahubData = viewTri ? null : await fetchAllData(supabase, 'contahub_periodo', 'pessoas', {
        'eq_bar_id': barIdNum,
        'gte_dt_gerencial': startDate,
        'lte_dt_gerencial': endDate
      });
      
      const clientesTotaisYuzerData = viewTri ? null : await fetchAllData(supabase, 'yuzer_produtos', 'quantidade, produto_nome', {
        'eq_bar_id': barIdNum,
        'gte_data_evento': startDate,
        'lte_data_evento': endDate
      });
      
      // ✅ USAR SYMPLA_RESUMO PARA MELHOR PERFORMANCE NO TRIMESTRAL
      const clientesTotaisSymplaData = viewTri ? null : await fetchAllData(supabase, 'sympla_resumo', 'checkins', {
        'eq_bar_id': barIdNum,
        'gte_data_evento': startDate,
        'lte_data_evento': endDate
      });

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
      // ✅ SOMAR CHECKINS DO SYMPLA_RESUMO NO TRIMESTRAL
      const totalClientesSympla = viewTri ? 0 : (clientesTotaisSymplaData?.reduce((sum, item) => sum + (item.checkins || 0), 0) || 0);
      const totalClientesTrimestre = viewTri ? (viewTri.clientes_totais || 0) : (totalClientesContahub + totalClientesYuzer + totalClientesSympla);
      
      // ✅ COMPARAÇÃO CLIENTES TOTAIS COM TRIMESTRE ANTERIOR
      // Usar as mesmas datas já calculadas para o trimestre anterior
      
      const [clientesContahubAnterior, clientesYuzerAnterior, clientesSymplaAnterior] = await Promise.all([
        fetchAllData(supabase, 'contahub_periodo', 'pessoas', {
          'eq_bar_id': barIdNum,
          'gte_dt_gerencial': startDateAnterior,
          'lte_dt_gerencial': endDateAnterior
        }),
        supabase.from('yuzer_produtos').select('quantidade, produto_nome').eq('bar_id', barIdNum)
          .gte('data_evento', startDateAnterior)
          .lte('data_evento', endDateAnterior),
        fetchAllData(supabase, 'sympla_resumo', 'checkins', {
          'eq_bar_id': barIdNum,
          'gte_data_evento': startDateAnterior,
          'lte_data_evento': endDateAnterior
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
      const totalClientesSymplaAnterior = clientesSymplaAnterior?.reduce((sum, item) => sum + (item.checkins || 0), 0) || 0;
      const totalClientesTrimestreAnterior = totalClientesContahubAnterior + totalClientesYuzerAnterior + totalClientesSymplaAnterior;
      
      const variacaoClientesTotais = totalClientesTrimestreAnterior > 0 ? 
        ((totalClientesTrimestre - totalClientesTrimestreAnterior) / totalClientesTrimestreAnterior * 100) : 0;
      
      // 🔍 DEBUG: Logs detalhados dos clientes totais
      console.log('👥 CLIENTES TOTAIS TRIMESTRE DETALHADOS:');
      if (viewTri) {
        console.log(`📊 Usando VIEW materializada: ${viewTri.clientes_totais || 0} clientes`);
      } else {
        console.log(`ContaHub Período: ${clientesTotaisContahubData?.length || 0} registros = ${totalClientesContahub} pessoas`);
        console.log(`Yuzer Ingressos: ${ingressosYuzer.length || 0} produtos = ${totalClientesYuzer} pessoas`);
        console.log(`Sympla Check-ins: ${clientesTotaisSymplaData?.length || 0} participantes = ${totalClientesSympla} pessoas`);
      }
      console.log(`TOTAL CLIENTES TRIMESTRE ATUAL: ${totalClientesTrimestre}`);
      console.log(`TOTAL CLIENTES TRIMESTRE ANTERIOR: ${totalClientesTrimestreAnterior}`);
      console.log(`VARIAÇÃO CLIENTES TOTAIS: ${variacaoClientesTotais.toFixed(1)}%`);
      
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
          .lte('data_competencia', endDate);
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
          'lte_dt_gerencial': endDate,
          'eq_bar_id': barIdNum  // Mesma ordem dos parâmetros do anual
        });
        
        // Filtrar para excluir 'Conta Assinada' (consumo de sócios)
        const fatContahubFiltrado = fatContahubData?.filter(item => item.meio !== 'Conta Assinada') || [];
        const fatYuzerData = await fetchAllData(supabase, 'yuzer_pagamento', 'valor_liquido', {
          'gte_data_evento': startDate,
          'lte_data_evento': endDate,
          'eq_bar_id': barIdNum  // Mesma ordem dos parâmetros do anual
        });
        const fatSymplaData = await fetchAllData(supabase, 'sympla_pedidos', 'valor_liquido', {
          'gte_data_pedido': startDate,
          'lte_data_pedido': endDate
          // Sympla não tem bar_id (mesma lógica do anual)
        });
        
        // Calcular com dados paginados (mesma lógica do anual)
        const faturamentoContahubTri = fatContahubFiltrado?.reduce((sum, item) => sum + (item.liquido || 0), 0) || 0;
        const faturamentoYuzerTri = fatYuzerData?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
        const faturamentoSymplaTri = fatSymplaData?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
        faturamentoTrimestre = faturamentoContahubTri + faturamentoYuzerTri + faturamentoSymplaTri;

        // Log final faturamento trimestre
        console.log(`💰 Faturamento T${trimestre} (${startDate} a ${endDate}): R$ ${faturamentoTrimestre.toLocaleString('pt-BR')}`);
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
      const cmoTrimestreAnteriorStart = trimestreAnteriorStart.toISOString().split('T')[0];
      const cmoTrimestreAnteriorEnd = trimestreAnteriorEnd.toISOString().split('T')[0];
      
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
      console.log('🔄 COMPARAÇÃO CMO TRIMESTRE ANTERIOR:');
      console.log(`Período anterior: ${cmoTrimestreAnteriorStart} até ${cmoTrimestreAnteriorEnd}`);
      console.log(`CMO Anterior: R$ ${totalCMOAnterior.toLocaleString('pt-BR')}`);
      console.log(`Faturamento Anterior - ContaHub: R$ ${faturamentoAnteriorContahub.toLocaleString('pt-BR')}`);
      console.log(`Faturamento Anterior - Yuzer: R$ ${faturamentoAnteriorYuzer.toLocaleString('pt-BR')}`);
      console.log(`Faturamento Anterior - Sympla: R$ ${faturamentoAnteriorSympla.toLocaleString('pt-BR')}`);
      console.log(`Faturamento Anterior TOTAL: R$ ${faturamentoTrimestreAnteriorTotal.toLocaleString('pt-BR')}`);
      console.log(`CMO% Anterior: ${percentualCMOAnterior.toFixed(2)}%`);
      console.log(`CMO% Atual: ${percentualCMO.toFixed(2)}%`);
      console.log(`Variação CMO: ${variacaoCMO.toFixed(1)}%`);
      
      console.log('🧮 COMPARAÇÃO CMO (TRIMESTRE):');
      console.log(`CMO Atual: ${percentualCMO.toFixed(2)}%`);
      console.log(`CMO Trimestre Anterior (${cmoTrimestreAnteriorStart} a ${cmoTrimestreAnteriorEnd}): ${percentualCMOAnterior.toFixed(2)}%`);
      console.log(`Variação: ${variacaoCMO.toFixed(1)}%`);
      
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
            'lte_data_competencia': endDate,
            'eq_categoria_nome': 'Atrações Programação'
          }),
          fetchAllData(supabase, 'nibo_agendamentos', 'valor', {
            'eq_bar_id': barIdNum,
            'gte_data_competencia': startDate,
            'lte_data_competencia': endDate,
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
        
        // ✅ COMPARAÇÃO % ARTÍSTICA COM TRIMESTRE ANTERIOR (NIBO_AGENDAMENTOS)
        const [custoArtisticoAnterior, custoProducaoAnterior] = await Promise.all([
          fetchAllData(supabase, 'nibo_agendamentos', 'valor', {
            'eq_bar_id': barIdNum,
            'gte_data_competencia': cmoTrimestreAnteriorStart,
            'lte_data_competencia': cmoTrimestreAnteriorEnd,
            'eq_categoria_nome': 'Atrações Programação'
          }),
          fetchAllData(supabase, 'nibo_agendamentos', 'valor', {
            'eq_bar_id': barIdNum,
            'gte_data_competencia': cmoTrimestreAnteriorStart,
            'lte_data_competencia': cmoTrimestreAnteriorEnd,
            'eq_categoria_nome': 'Produção Eventos'
          })
        ]);
        
        const totalCustoArtisticoAnterior = custoArtisticoAnterior?.reduce((sum, item) => sum + Math.abs(item.valor || 0), 0) || 0;
        const totalCustoProducaoAnterior = custoProducaoAnterior?.reduce((sum, item) => sum + Math.abs(item.valor || 0), 0) || 0;
        const totalCustoCompletoAnterior = totalCustoArtisticoAnterior + totalCustoProducaoAnterior;
        
        // Usar faturamento do trimestre anterior já calculado
        const totalFaturamentoAnterior = faturamentoTrimestreAnteriorTotal;
        
        const percentualAnterior = totalFaturamentoAnterior > 0 ? (totalCustoCompletoAnterior / totalFaturamentoAnterior) * 100 : 0;
        variacaoArtistica = percentualAnterior > 0 ? ((percentualCalculado - percentualAnterior) / percentualAnterior * 100) : 0;
        
        console.log('🎭 COMPARAÇÃO % ARTÍSTICA (TRIMESTRE - NIBO):');
        console.log(`Período anterior: ${cmoTrimestreAnteriorStart} até ${cmoTrimestreAnteriorEnd}`);
        console.log(`Registros Atrações Anterior: ${custoArtisticoAnterior?.length || 0}`);
        console.log(`Registros Produção Anterior: ${custoProducaoAnterior?.length || 0}`);
        console.log(`Custo Artístico Anterior: R$ ${totalCustoArtisticoAnterior.toLocaleString('pt-BR')}`);
        console.log(`Custo Produção Anterior: R$ ${totalCustoProducaoAnterior.toLocaleString('pt-BR')}`);
        console.log(`Faturamento Anterior: R$ ${totalFaturamentoAnterior.toLocaleString('pt-BR')}`);
        console.log(`% Artística Atual: ${percentualCalculado.toFixed(2)}%`);
        console.log(`% Artística Anterior: ${percentualAnterior.toFixed(2)}%`);
        console.log(`Variação: ${variacaoArtistica.toFixed(1)}%`);
        
        // Variação será usada no retorno da função
        
        return percentualCalculado;
      })();

      // Log final do CMO
      console.log(`📊 CMO T${trimestre}: ${percentualCMO.toFixed(1)}% (R$ ${totalCMO.toLocaleString('pt-BR')} / R$ ${faturamentoTrimestre.toLocaleString('pt-BR')})`);

      const resp = NextResponse.json({
        trimestral: {
          clientesAtivos: {
            valor: clientesAtivos,
            meta: 3000,
            variacao: variacaoClientesAtivos
          },
          clientesTotais: {
            valor: totalClientesTrimestre,
            meta: 30000,
            variacao: variacaoClientesTotais
          },
          retencao: {
            ...(await calcularRetencao(supabase, barIdNum, mesRetencao || undefined)),
            meta: 10
          },
          cmvLimpo: {
            valor: 28.7, // TODO: Implementar input manual
            meta: 34
          },
          cmo: {
            valor: percentualCMO,
            meta: 20,
            valorAbsoluto: viewTri ? (viewTri.cmo_total || 0) : totalCMO,
            variacao: variacaoCMO
          },
          artistica: {
            valor: await percentualArtistica,
            meta: 17,
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

      // CMV e Artística (valores simulados para o mês)
      const cmvLimpo = 25; // Percentual padrão
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
            meta: 25, // Meta de 25%
            variacao: 0
          },
          cmvLimpo: {
            valor: cmvLimpo,
            meta: 30, // Meta de 30%
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
