import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
    
    console.log('🔄 CALCULANDO RETENÇÃO:');
    console.log(`Mês de referência${mesEspecifico ? ` (${mesEspecifico})` : ' (atual)'}: ${mesAtualInicio} até ${mesAtualFim}`);
    console.log(`Últimos 2 meses: ${ultimos2MesesInicio} até ${ultimos2MesesFim}`);
    
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
    
    console.log('🔄 RETENÇÃO CALCULADA:');
    console.log(`Clientes únicos mês atual: ${totalClientesMesAtual}`);
    console.log(`Clientes únicos últimos 2 meses: ${clientesUltimos2Meses.size}`);
    console.log(`Clientes retidos (intersecção): ${totalClientesRetidos}`);
    console.log(`Taxa de retenção: ${percentualRetencao.toFixed(1)}%`);
    
    return parseFloat(percentualRetencao.toFixed(1));
    
  } catch (error) {
    console.error('❌ Erro ao calcular retenção:', error);
    return 0;
  }
}

// Função para buscar dados com paginação (contorna limite de 1000 do Supabase)
async function fetchAllData(supabase: any, tableName: string, columns: string, filters: any = {}) {
  let allData: any[] = [];
  let from = 0;
  const limit = 1000;
  
  while (true) {
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
      console.error(`❌ Erro ao buscar ${tableName}:`, error);
      break;
    }
    
    if (!data || data.length === 0) break;
    
    allData.push(...data);
    
    if (data.length < limit) break; // Última página
    
    from += limit;
  }
  
  console.log(`📊 ${tableName}: ${allData.length} registros total`);
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
    
    // Verificar estado da tabela contahub_pagamentos
    const { data: totalRegistros, count } = await supabase
      .from('contahub_pagamentos')
      .select('*', { count: 'exact', head: true });
    
    const { data: registrosComBarId } = await supabase
      .from('contahub_pagamentos')
      .select('bar_id')
      .not('bar_id', 'is', null)
      .limit(10);
    
    const { data: primeiros10 } = await supabase
      .from('contahub_pagamentos')
      .select('*')
      .limit(3);
    
    console.log('=== DIAGNÓSTICO TABELA ===');
    console.log('Total de registros na tabela:', count);
    console.log('Registros com bar_id não nulo:', registrosComBarId?.length || 0);
    console.log('Amostra primeiros 3 registros:', primeiros10);
    console.log('Procurando por bar_id:', barIdNum);
    
    // Testar se conseguimos acessar outras tabelas para verificar conexão
    const { data: testeBars, count: countBars } = await supabase
      .from('bars')
      .select('*', { count: 'exact', head: true });
    
    console.log('=== TESTE OUTRAS TABELAS ===');
    console.log('Total registros tabela bars:', countBars);
    
    // Testar nomes alternativos de tabelas
    const tabelasParaTestar = [
      'contahub_pagamentos',
      'contahub_pagamento', 
      'contahub_periodo',
      'contahub_analitico',
      'contahub_fatporhora'
    ];
    
    console.log('=== TESTANDO TABELAS CONTAHUB ===');
    for (const nomeTabela of tabelasParaTestar) {
      try {
        const { count } = await supabase
          .from(nomeTabela)
          .select('*', { count: 'exact', head: true });
        console.log(`${nomeTabela}: ${count} registros`);
      } catch (error) {
        console.log(`${nomeTabela}: ERRO - tabela não existe`);
      }
    }

    // Buscar dados anuais
    if (periodo === 'anual') {
      // Performance Anual - Ano completo de 2025
      const startDate = '2025-02-01'; // Bar abriu em Fevereiro
      const endDate = '2025-12-31'; // Ano completo
      console.log(`🏪 Performance Anual 2025 - Buscando dados de ${startDate} até ${endDate}`);
      
      // Faturamento 2025 (ContaHub + Yuzer + Sympla) - ATÉ DATA ATUAL
      
      // IMPLEMENTANDO PAGINAÇÃO REAL para contornar limite de 1000
      console.log('💰 Buscando faturamento com PAGINAÇÃO COMPLETA...');
      
      const contahubData = await fetchAllData(supabase, 'contahub_pagamentos', 'liquido', {
        'gte_dt_gerencial': startDate,
        'lte_dt_gerencial': endDate,
        'eq_bar_id': barIdNum
      });
      
      const yuzerData = await fetchAllData(supabase, 'yuzer_pagamento', 'valor_liquido', {
        'gte_data_evento': startDate,
        'lte_data_evento': endDate,
        'eq_bar_id': barIdNum
      });
      
      const symplaData = await fetchAllData(supabase, 'sympla_pedidos', 'valor_liquido', {
        'gte_data_pedido': startDate,
        'lte_data_pedido': endDate
      });


      console.log('=== FATURAMENTO COM PAGINAÇÃO ===');
      console.log('Contahub:', contahubData?.length || 0, 'registros');
      console.log('Yuzer:', yuzerData?.length || 0, 'registros');
      console.log('Sympla:', symplaData?.length || 0, 'registros');


      
      // Calcular com dados paginados
      console.log('Amostra Contahub (5 primeiros):', contahubData?.slice(0, 5));
      console.log('Amostra Yuzer (5 primeiros):', yuzerData?.slice(0, 5));
      
      const faturamentoContahub = contahubData?.reduce((sum, item) => sum + (item.liquido || 0), 0) || 0;
      const faturamentoYuzer = yuzerData?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
      const faturamentoSympla = symplaData?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
      const faturamentoTotal = faturamentoContahub + faturamentoYuzer + faturamentoSympla;
      
      console.log('=== FATURAMENTOS CALCULADOS ===');
      console.log('Contahub:', faturamentoContahub);
      console.log('Yuzer:', faturamentoYuzer);
      console.log('Sympla:', faturamentoSympla);
      console.log('Total:', faturamentoTotal);

      // Número de Pessoas (ContaHub + Yuzer + Sympla)
      // Pessoas com PAGINAÇÃO
      console.log('👥 Buscando pessoas com PAGINAÇÃO COMPLETA...');
      
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
        
        supabase
          .from('sympla_participantes')
          .select('id')
          .eq('bar_id', barIdNum)
          .eq('fez_checkin', true)
          .gte('data_checkin', startDate)
          .lte('data_checkin', endDate)
      ]);

      console.log('👥 ContaHub pessoas:', pessoasContahubData?.length || 0, 'registros');
      console.log('👥 Yuzer pessoas:', pessoasYuzer.data?.length || 0, 'registros');
      console.log('👥 Sympla pessoas:', pessoasSympla.data?.length || 0, 'registros');
      
      const totalPessoasContahub = pessoasContahubData?.reduce((sum, item) => sum + (item.pessoas || 0), 0) || 0;
      const totalPessoasYuzer = pessoasYuzer.data?.reduce((sum, item) => sum + (item.quantidade || 0), 0) || 0;
      const totalPessoasSympla = pessoasSympla.data?.length || 0;
      const totalPessoas = totalPessoasContahub + totalPessoasYuzer + totalPessoasSympla;
      
      console.log('👥 PESSOAS CALCULADAS:');
      console.log('ContaHub:', totalPessoasContahub);
      console.log('Yuzer:', totalPessoasYuzer);
      console.log('Sympla:', totalPessoasSympla);
      console.log('Total:', totalPessoas);

      // Reputação (Google Reviews)
      // Reputação (Google Reviews - Windsor) - COM PAGINAÇÃO
      console.log('🌟 Buscando reputação com PAGINAÇÃO...');
      
      const reputacaoData = await fetchAllData(supabase, 'windsor_google', 'review_average_rating_total', {
        'gte_date': startDate,
        'lte_date': endDate
      });

      console.log('🌟 Reputação - registros encontrados:', reputacaoData?.length);
      console.log('🌟 Amostra reputação (5 primeiros):', reputacaoData?.slice(0, 5));
      
      // Filtrar apenas registros com valor válido (não null)
      const reputacaoValida = reputacaoData?.filter(item => item.review_average_rating_total != null && item.review_average_rating_total > 0) || [];
      console.log('🌟 Registros com valor válido:', reputacaoValida.length);
      console.log('🌟 Registros null/zero filtrados:', (reputacaoData?.length || 0) - reputacaoValida.length);
      
      const reputacao = reputacaoValida.length > 0 
        ? reputacaoValida.reduce((sum, item) => sum + item.review_average_rating_total, 0) / reputacaoValida.length
        : 0;
        
      console.log('🌟 Reputação calculada (média):', reputacao);

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
      console.log(`📊 ${trimestre}º Trimestre 2025 - Buscando dados de ${startDate} até ${endDate}`);

      // Clientes Ativos (visitaram 2+ vezes nos últimos 90 dias) - COM PAGINAÇÃO
      console.log('🎯 Buscando clientes ativos com PAGINAÇÃO (últimos 90 dias)...');
      
      // Calcular data de 90 dias atrás
      const hoje = new Date();
      const dataInicio90Dias = new Date(hoje);
      dataInicio90Dias.setDate(hoje.getDate() - 90);
      const startDate90Dias = dataInicio90Dias.toISOString().split('T')[0];
      const endDate90Dias = hoje.toISOString().split('T')[0];
      
      console.log(`📅 Período de análise: ${startDate90Dias} até ${endDate90Dias} (últimos 90 dias)`);
      
      const clientesData = await fetchAllData(supabase, 'contahub_periodo', 'cli_fone, dt_gerencial', {
        'eq_bar_id': barIdNum,
        'gte_dt_gerencial': startDate90Dias,
        'lte_dt_gerencial': endDate90Dias
      });
      
      // Filtrar apenas clientes com telefone
      const clientesComTelefone = clientesData?.filter(item => item.cli_fone) || [];
      console.log('📞 Clientes com telefone:', clientesComTelefone.length);

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
      
      console.log('🎯 CLIENTES ATIVOS CALCULADOS (ÚLTIMOS 90 DIAS):');
      console.log('Total clientes únicos:', clientesMap.size);
      console.log('Clientes ativos (2+ visitas nos últimos 90 dias):', clientesAtivos);

      // Número total de clientes no trimestre - COM PAGINAÇÃO
      console.log('👥 Buscando clientes totais do trimestre com PAGINAÇÃO...');
      
      const clientesTotaisContahubData = await fetchAllData(supabase, 'contahub_periodo', 'pessoas', {
        'eq_bar_id': barIdNum,
        'gte_dt_gerencial': startDate,
        'lte_dt_gerencial': endDate
      });
      
      const clientesTotaisYuzerData = await fetchAllData(supabase, 'yuzer_produtos', 'quantidade, produto_nome', {
        'eq_bar_id': barIdNum,
        'gte_data_evento': startDate,
        'lte_data_evento': endDate
      });
      
      const clientesTotaisSymplaData = await fetchAllData(supabase, 'sympla_participantes', 'id', {
        'eq_bar_id': barIdNum,
        'eq_fez_checkin': true,
        'gte_data_checkin': startDate,
        'lte_data_checkin': endDate
      });

      console.log('👥 CLIENTES TOTAIS - REGISTROS ENCONTRADOS:');
      console.log('ContaHub:', clientesTotaisContahubData?.length || 0, 'registros');
      console.log('Yuzer:', clientesTotaisYuzerData?.length || 0, 'registros');
      console.log('Sympla:', clientesTotaisSymplaData?.length || 0, 'registros');
      
      // Filtrar produtos Yuzer que são ingressos/entradas
      const ingressosYuzer = clientesTotaisYuzerData?.filter(item => 
        item.produto_nome && (
          item.produto_nome.toLowerCase().includes('ingresso') ||
          item.produto_nome.toLowerCase().includes('entrada')
        )
      ) || [];
      
      console.log('Yuzer (filtrado para ingressos):', ingressosYuzer.length, 'registros');
      
      const totalClientesContahub = clientesTotaisContahubData?.reduce((sum, item) => sum + (item.pessoas || 0), 0) || 0;
      const totalClientesYuzer = ingressosYuzer.reduce((sum, item) => sum + (item.quantidade || 0), 0);
      const totalClientesSympla = clientesTotaisSymplaData?.length || 0;
      const totalClientesTrimestre = totalClientesContahub + totalClientesYuzer + totalClientesSympla;
      
      console.log('👥 CLIENTES TOTAIS CALCULADOS:');
      console.log('ContaHub:', totalClientesContahub, 'pessoas');
      console.log('Yuzer:', totalClientesYuzer, 'pessoas');
      console.log('Sympla:', totalClientesSympla, 'pessoas');
      console.log('TOTAL TRIMESTRE:', totalClientesTrimestre, 'pessoas');

      // CMO % (Nibo)
      const categoriasCMO = [
        'SALARIO FUNCIONARIOS', 'ALIMENTAÇÃO', 'PROVISÃO TRABALHISTA', 'VALE TRANSPORTE',
        'FREELA ATENDIMENTO', 'FREELA BAR', 'FREELA COZINHA',
        'FREELA LIMPEZA', 'FREELA SEGURANÇA', 'Marketing', 'MANUTENÇÃO',
        'Materiais Operação', 'Outros Operação'
      ];

      const { data: cmoData } = await supabase
        .from('nibo_agendamentos')
        .select('valor')
        .eq('bar_id', barIdNum)
        .in('categoria_nome', categoriasCMO)
        .gte('data_competencia', startDate)
        .lte('data_competencia', endDate);

      const totalCMO = cmoData?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0;
      
      console.log('💼 CMO DADOS:');
      console.log('Registros CMO:', cmoData?.length);
      console.log('Total CMO:', totalCMO);

      // Faturamento trimestral COM PAGINAÇÃO para calcular CMO %
      console.log('💰 Buscando faturamento trimestral com PAGINAÇÃO...');
      
      const fatContahubData = await fetchAllData(supabase, 'contahub_pagamentos', 'liquido', {
        'eq_bar_id': barIdNum,
        'gte_dt_gerencial': startDate,
        'lte_dt_gerencial': endDate
      });
      
      const fatYuzerData = await fetchAllData(supabase, 'yuzer_pagamento', 'valor_liquido', {
        'eq_bar_id': barIdNum,
        'gte_data_evento': startDate,
        'lte_data_evento': endDate
      });
      
      const fatSymplaData = await fetchAllData(supabase, 'sympla_pedidos', 'valor_liquido', {
        'gte_data_pedido': startDate,
        'lte_data_pedido': endDate
      });

      const faturamentoContahubTri = fatContahubData?.reduce((sum, item) => sum + (item.liquido || 0), 0) || 0;
      const faturamentoYuzerTri = fatYuzerData?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
      const faturamentoSymplaTri = fatSymplaData?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
      const faturamentoTrimestre = faturamentoContahubTri + faturamentoYuzerTri + faturamentoSymplaTri;
      
      console.log('💰 FATURAMENTO TRIMESTRAL:');
      console.log('ContaHub:', faturamentoContahubTri);
      console.log('Yuzer:', faturamentoYuzerTri);
      console.log('Sympla:', faturamentoSymplaTri);
      console.log('Total:', faturamentoTrimestre);

      const percentualCMO = faturamentoTrimestre > 0 ? (totalCMO / faturamentoTrimestre) * 100 : 0;
      
      console.log('💼 CÁLCULO CMO:');
      console.log('CMO R$:', totalCMO);
      console.log('Faturamento Trimestre R$:', faturamentoTrimestre);
      console.log('CMO %:', percentualCMO);

      // % Artística (Planejamento Comercial)
      const { data: artisticaData } = await supabase
        .from('view_eventos')
        .select('percent_art_fat')
        .eq('bar_id', barIdNum)
        .gte('data_evento', startDate)
        .lte('data_evento', endDate);

      const percentualArtistica = artisticaData && artisticaData.length > 0
        ? artisticaData.reduce((sum, item) => sum + (item.percent_art_fat || 0), 0) / artisticaData.length
        : 0;

      return NextResponse.json({
        trimestral: {
          clientesAtivos: {
            valor: clientesAtivos,
            meta: 3000
          },
          clientesTotais: {
            valor: totalClientesTrimestre,
            meta: 30000
          },
          retencao: {
            valor: await calcularRetencao(supabase, barIdNum, mesRetencao || undefined),
            meta: 10
          },
          cmvLimpo: {
            valor: 28.7, // TODO: Implementar input manual
            meta: 34
          },
          cmo: {
            valor: percentualCMO,
            meta: 20,
            valorAbsoluto: totalCMO
          },
          artistica: {
            valor: percentualArtistica,
            meta: 17
          }
        }
      });
    }

    return NextResponse.json({ error: 'Período inválido' }, { status: 400 });

  } catch (error) {
    console.error('Erro ao buscar indicadores:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar indicadores' },
      { status: 500 }
    );
  }
}
