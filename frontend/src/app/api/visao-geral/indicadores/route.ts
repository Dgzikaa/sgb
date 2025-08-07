import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'anual';
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
      const currentYear = 2025;
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
      const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
      
      // Bar abriu em Fevereiro 2025
      const startDate = `${currentYear}-02-01`;
      console.log(`🏪 Bar abriu em FEV/2025 - Buscando dados de ${startDate} até ${endDate}`);
      
      // Faturamento 2025 (ContaHub + Yuzer + Sympla) - ATÉ DATA ATUAL
      
      const [contahubResult, yuzerResult, symplaResult] = await Promise.all([
        supabase
          .from('contahub_pagamentos')
          .select('liquido')
          .gte('dt_gerencial', startDate)
          .lte('dt_gerencial', endDate)
          .eq('bar_id', barIdNum),
        
        supabase
          .from('yuzer_pagamento')
          .select('valor_liquido')
          .gte('data_evento', startDate)
          .lte('data_evento', endDate)
          .eq('bar_id', barIdNum),
        
        supabase
          .from('sympla_pedidos')
          .select('valor_liquido')
      ]);


      console.log('=== DIAGNÓSTICO FATURAMENTO ===');
      console.log('Contahub:', contahubResult.data?.length || 0, 'registros');
      console.log('Yuzer:', yuzerResult.data?.length || 0, 'registros');
      console.log('Sympla:', symplaResult.data?.length || 0, 'registros');
      
      if (yuzerResult.error) {
        console.log('❌ ERRO YUZER:', yuzerResult.error);
      }
      
      if (yuzerResult.data?.length === 0) {
        console.log('🔍 YUZER VAZIO - Testando tabela...');
        // Testar sem filtros
        const yuzerTest = await supabase
          .from('yuzer_pagamento')
          .select('valor_liquido, data_evento, bar_id')
          .limit(5);
        console.log('🔍 YUZER TESTE (5 primeiros):', yuzerTest.data);
        
        // Testar com todos os campos para ver a estrutura
        const yuzerEstrutura = await supabase
          .from('yuzer_pagamento')
          .select('*')
          .limit(1);
        console.log('🔍 YUZER ESTRUTURA:', yuzerEstrutura.data?.[0]);
        
        // Listar tabelas disponíveis
        const tabelas = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .ilike('table_name', '%yuzer%');
        console.log('📋 TABELAS YUZER DISPONÍVEIS:', tabelas.data?.map(t => t.table_name));
      }
      
      if (contahubResult.error) console.log('Erro Contahub:', contahubResult.error);
      if (yuzerResult.error) console.log('Erro Yuzer:', yuzerResult.error);
      if (symplaResult.error) console.log('Erro Sympla:', symplaResult.error);
      
      // Verificar valores
      console.log('Amostra Contahub (5 primeiros):', contahubResult.data?.slice(0, 5));
      console.log('Amostra Yuzer (5 primeiros):', yuzerResult.data?.slice(0, 5));
      
      const faturamentoContahub = contahubResult.data?.reduce((sum, item) => sum + (item.liquido || 0), 0) || 0;
      const faturamentoYuzer = yuzerResult.data?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
      const faturamentoSympla = symplaResult.data?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
      const faturamentoTotal = faturamentoContahub + faturamentoYuzer + faturamentoSympla;
      
      console.log('=== FATURAMENTOS CALCULADOS ===');
      console.log('Contahub:', faturamentoContahub);
      console.log('Yuzer:', faturamentoYuzer);
      console.log('Sympla:', faturamentoSympla);
      console.log('Total:', faturamentoTotal);

      // Número de Pessoas (ContaHub + Yuzer + Sympla)
      const [pessoasContahub, pessoasYuzer, pessoasSympla] = await Promise.all([
        supabase
          .from('contahub_periodo')
          .select('pessoas')
          .eq('bar_id', barIdNum)
          .gte('dt_gerencial', startDate)
          .lte('dt_gerencial', endDate),
        
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

      const totalPessoasContahub = pessoasContahub.data?.reduce((sum, item) => sum + (item.pessoas || 0), 0) || 0;
      const totalPessoasYuzer = pessoasYuzer.data?.reduce((sum, item) => sum + (item.quantidade || 0), 0) || 0;
      const totalPessoasSympla = pessoasSympla.data?.length || 0;
      const totalPessoas = totalPessoasContahub + totalPessoasYuzer + totalPessoasSympla;

      // Reputação (Google Reviews)
      const { data: reputacaoData } = await supabase
        .from('windsor_google')
        .select('review_average_rating_total')
        .eq('bar_id', barIdNum)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('🌟 Reputação - dados:', reputacaoData);
      const reputacao = reputacaoData?.review_average_rating_total || 0;
      console.log('🌟 Reputação calculada:', reputacao);

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
      // 3º Trimestre: Julho, Agosto, Setembro
      const startDate = '2025-07-01';
      const endDate = '2025-09-30';

      // Clientes Ativos (visitaram 2+ vezes no trimestre)
      const { data: clientesData } = await supabase
        .from('contahub_periodo')
        .select('cli_fone, dt_gerencial')
        .eq('bar_id', barIdNum)
        .gte('dt_gerencial', startDate)
        .lte('dt_gerencial', endDate)
        .not('cli_fone', 'is', null);

      // Agrupar por telefone e contar visitas
      const clientesMap = new Map();
      clientesData?.forEach(item => {
        if (item.cli_fone) {
          const count = clientesMap.get(item.cli_fone) || 0;
          clientesMap.set(item.cli_fone, count + 1);
        }
      });

      // Contar clientes com 2+ visitas
      let clientesAtivos = 0;
      clientesMap.forEach(count => {
        if (count >= 2) clientesAtivos++;
      });

      // Número total de clientes no trimestre
      const [clientesContahub, clientesYuzer, clientesSympla] = await Promise.all([
        supabase
          .from('contahub_periodo')
          .select('pessoas')
          .eq('bar_id', barIdNum)
          .gte('dt_gerencial', startDate)
          .lte('dt_gerencial', endDate),
        
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

      const totalClientesTrimestre = 
        (clientesContahub.data?.reduce((sum, item) => sum + (item.pessoas || 0), 0) || 0) +
        (clientesYuzer.data?.reduce((sum, item) => sum + (item.quantidade || 0), 0) || 0) +
        (clientesSympla.data?.length || 0);

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

      // Faturamento trimestral para calcular %
      const [fatContahub, fatYuzer, fatSympla] = await Promise.all([
        supabase
          .from('contahub_pagamentos')
          .select('liquido')
          .eq('bar_id', barIdNum)
          .gte('dt_gerencial', startDate)
          .lte('dt_gerencial', endDate),
        
        supabase
          .from('yuzer_pagamento')
          .select('valor_liquido')
          .eq('bar_id', barIdNum)
          .gte('data_evento', startDate)
          .lte('data_evento', endDate),
        
        supabase
          .from('sympla_pedidos')
          .select('valor_liquido')
          .gte('data_pedido', startDate)
          .lte('data_pedido', endDate)
      ]);

      const faturamentoTrimestre = 
        (fatContahub.data?.reduce((sum, item) => sum + (item.liquido || 0), 0) || 0) +
        (fatYuzer.data?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0) +
        (fatSympla.data?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0);

      const percentualCMO = faturamentoTrimestre > 0 ? (totalCMO / faturamentoTrimestre) * 100 : 0;

      // % Artística (Planejamento Comercial)
      const { data: artisticaData } = await supabase
        .from('planejamento_comercial_view')
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
            meta: 10000
          },
          retencao: {
            valor: 8.5, // TODO: Implementar input manual
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
