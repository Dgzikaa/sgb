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
  
      const MAX_ITERATIONS = 1000;
    let iterations = 0;
    while (iterations < MAX_ITERATIONS) {
      iterations++;
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

    // Headers de cache HTTP para CDN (Vercel) e navegador
    //  - s-maxage: cache em edge por 60s
    //  - stale-while-revalidate: serve cache enquanto revalida por 5min
    //  Obs: a resposta final mais abaixo inclui estes headers via NextResponse
    
    // Logs de diagnóstico antigos removidos para reduzir IO/overhead

    // Buscar dados anuais
    if (periodo === 'anual') {
      // Performance Anual - Ano completo de 2025
      const startDate = '2025-02-01'; // Bar abriu em Fevereiro
      const endDate = '2025-12-31'; // Ano completo
      // Tenta usar a view materializada se existir
      try {
        const { data: anualView, error: anualViewErr } = await supabase
          .from('view_visao_geral_anual')
          .select('faturamento_total, faturamento_contahub, faturamento_yuzer, faturamento_sympla, pessoas_total, pessoas_contahub, pessoas_yuzer, pessoas_sympla, reputacao_media')
          .eq('bar_id', barIdNum)
          .eq('ano', 2025)
          .limit(1);
        if (!anualViewErr && anualView && anualView.length > 0) {
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
      } catch (_) {
        // segue com fallback abaixo
      }
      // Faturamento 2025 (ContaHub + Yuzer + Sympla) - ATÉ DATA ATUAL
      
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


      // Calcular com dados paginados
      
      const faturamentoContahub = contahubData?.reduce((sum, item) => sum + (item.liquido || 0), 0) || 0;
      const faturamentoYuzer = yuzerData?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
      const faturamentoSympla = symplaData?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
      const faturamentoTotal = faturamentoContahub + faturamentoYuzer + faturamentoSympla;
      
      // 🔍 DEBUG: Logs detalhados dos dados
      console.log('📊 DADOS DE FATURAMENTO DETALHADOS:');
      console.log(`ContaHub Pagamentos: ${contahubData?.length || 0} registros = R$ ${faturamentoContahub}`);
      console.log(`Yuzer Pagamentos: ${yuzerData?.length || 0} registros = R$ ${faturamentoYuzer}`);
      console.log(`Sympla Pedidos: ${symplaData?.length || 0} registros = R$ ${faturamentoSympla}`);
      console.log(`TOTAL FATURAMENTO: R$ ${faturamentoTotal}`);
      
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
        
        supabase
          .from('sympla_participantes')
          .select('id')
          .eq('bar_id', barIdNum)
          .eq('fez_checkin', true)
          .gte('data_checkin', startDate)
          .lte('data_checkin', endDate)
      ]);

      const totalPessoasContahub = pessoasContahubData?.reduce((sum, item) => sum + (item.pessoas || 0), 0) || 0;
      const totalPessoasYuzer = pessoasYuzer.data?.reduce((sum, item) => sum + (item.quantidade || 0), 0) || 0;
      const totalPessoasSympla = pessoasSympla.data?.length || 0;
      const totalPessoas = totalPessoasContahub + totalPessoasYuzer + totalPessoasSympla;
      
      // 🔍 DEBUG: Logs detalhados das pessoas
      console.log('👥 DADOS DE PESSOAS DETALHADOS:');
      console.log(`ContaHub Período: ${pessoasContahubData?.length || 0} registros = ${totalPessoasContahub} pessoas`);
      console.log(`Yuzer Produtos: ${pessoasYuzer.data?.length || 0} registros = ${totalPessoasYuzer} pessoas`);
      console.log(`Sympla Participantes: ${pessoasSympla.data?.length || 0} registros = ${totalPessoasSympla} pessoas`);
      console.log(`TOTAL PESSOAS: ${totalPessoas}`);
      
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

      // Clientes Ativos (visitaram 2+ vezes nos últimos 90 dias) - COM PAGINAÇÃO
      // Clientes ativos últimos 90 dias
      
      // Calcular data de 90 dias atrás
      const hoje = new Date();
      const dataInicio90Dias = new Date(hoje);
      dataInicio90Dias.setDate(hoje.getDate() - 90);
      const startDate90Dias = dataInicio90Dias.toISOString().split('T')[0];
      const endDate90Dias = hoje.toISOString().split('T')[0];
      
      // Período de 90 dias
      
      const clientesData = await fetchAllData(supabase, 'contahub_periodo', 'cli_fone, dt_gerencial', {
        'eq_bar_id': barIdNum,
        'gte_dt_gerencial': startDate90Dias,
        'lte_dt_gerencial': endDate90Dias
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
      
      // Logs detalhados removidos

      // Tenta usar a view materializada trimestral se existir
      let viewTri: any | null = null;
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
      
      const clientesTotaisSymplaData = viewTri ? null : await fetchAllData(supabase, 'sympla_participantes', 'id', {
        'eq_bar_id': barIdNum,
        'eq_fez_checkin': true,
        'gte_data_checkin': startDate,
        'lte_data_checkin': endDate
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
      if (!viewTri && ingressosYuzer.length > 0) {
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
      const totalClientesSympla = viewTri ? 0 : (clientesTotaisSymplaData?.length || 0);
      const totalClientesTrimestre = viewTri ? (viewTri.clientes_totais || 0) : (totalClientesContahub + totalClientesYuzer + totalClientesSympla);
      
      // 🔍 DEBUG: Logs detalhados dos clientes totais
      console.log('👥 CLIENTES TOTAIS TRIMESTRE DETALHADOS:');
      if (viewTri) {
        console.log(`📊 Usando VIEW materializada: ${viewTri.clientes_totais || 0} clientes`);
      } else {
        console.log(`ContaHub Período: ${clientesTotaisContahubData?.length || 0} registros = ${totalClientesContahub} pessoas`);
        console.log(`Yuzer Ingressos: ${ingressosYuzer.length || 0} produtos = ${totalClientesYuzer} pessoas`);
        console.log(`Sympla Check-ins: ${clientesTotaisSymplaData?.length || 0} participantes = ${totalClientesSympla} pessoas`);
      }
      console.log(`TOTAL CLIENTES TRIMESTRE: ${totalClientesTrimestre}`);
      
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
        // USAR A MESMA LÓGICA DO FATURAMENTO ANUAL
        const fatContahubData = await fetchAllData(supabase, 'contahub_pagamentos', 'liquido', {
          'gte_dt_gerencial': startDate,
          'lte_dt_gerencial': endDate,
          'eq_bar_id': barIdNum  // Mesma ordem dos parâmetros do anual
        });
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
        const faturamentoContahubTri = fatContahubData?.reduce((sum, item) => sum + (item.liquido || 0), 0) || 0;
        const faturamentoYuzerTri = fatYuzerData?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
        const faturamentoSymplaTri = fatSymplaData?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
        faturamentoTrimestre = faturamentoContahubTri + faturamentoYuzerTri + faturamentoSymplaTri;

        // 🔍 DEBUG: Faturamento trimestral para CMO (MESMA LÓGICA ANUAL)
        console.log('📊 FATURAMENTO TRIMESTRE (LÓGICA ANUAL):');
        console.log(`Período: ${startDate} até ${endDate}`);
        console.log(`ContaHub: R$ ${faturamentoContahubTri.toLocaleString('pt-BR')}`);
        console.log(`Yuzer: R$ ${faturamentoYuzerTri.toLocaleString('pt-BR')}`);
        console.log(`Sympla: R$ ${faturamentoSymplaTri.toLocaleString('pt-BR')}`);
        console.log(`TOTAL: R$ ${faturamentoTrimestre.toLocaleString('pt-BR')}`);
      }
      
      const percentualCMO = viewTri ? (viewTri.cmo_percent || 0) : (faturamentoTrimestre > 0 ? (totalCMO / faturamentoTrimestre) * 100 : 0);
      
      // 🔍 DEBUG: Cálculo final CMO
      console.log('🧮 CÁLCULO CMO FINAL:');
      console.log(`CMO Total: R$ ${totalCMO}`);
      console.log(`Faturamento Trimestre: R$ ${faturamentoTrimestre}`);
      console.log(`Percentual CMO: ${percentualCMO.toFixed(2)}%`);
      
      // Logs detalhados removidos

      // % Artística (Planejamento Comercial) - CÁLCULO CORRIGIDO
      let viewOk = true;
      const percentualArtistica = viewTri ? (viewTri.artistica_percent || 0) : (async () => {
        const { data: artisticaData, error: artisticaErr } = await supabase
          .from('view_eventos')
          .select('c_art_real, c_prod, real_r')
          .eq('bar_id', barIdNum)
          .gte('data_evento', startDate)
          .lte('data_evento', endDate)
          .gt('real_r', 0); // Apenas eventos com faturamento
        
        viewOk = !artisticaErr;
        
        if (!artisticaData || artisticaData.length === 0) return 0;
        
        // Calcular percentual agregado (CORRETO): (Custo Artístico + Custo Produção) / Total faturamento * 100
        const totalCustoArtistico = artisticaData.reduce((sum, item) => sum + (item.c_art_real || 0), 0);
        const totalCustoProducao = artisticaData.reduce((sum, item) => sum + (item.c_prod || 0), 0);
        const totalFaturamento = artisticaData.reduce((sum, item) => sum + (item.real_r || 0), 0);
        
        const totalCustoCompleto = totalCustoArtistico + totalCustoProducao;
        
        return totalFaturamento > 0 ? (totalCustoCompleto / totalFaturamento) * 100 : 0;
      })();

      const resp = NextResponse.json({
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
            valorAbsoluto: viewTri ? (viewTri.cmo_total || 0) : totalCMO
          },
          artistica: {
            valor: await percentualArtistica,
            meta: 17
          }
        }
      });
      resp.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      if (!viewOk) resp.headers.set('X-Artistica-View', 'missing:view_eventos');
      if (viewTri) resp.headers.set('X-View-Used', 'view_visao_geral_trimestral');
      return resp;
    }

    const resp = NextResponse.json({ error: 'Período inválido' }, { status: 400 });
    resp.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return resp;

  } catch (error) {
    console.error('Erro ao buscar indicadores:', error);
    const resp = NextResponse.json(
      { error: 'Erro ao buscar indicadores' },
      { status: 500 }
    );
    resp.headers.set('Cache-Control', 's-maxage=10');
    return resp;
  }
}
