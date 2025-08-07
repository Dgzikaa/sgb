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
    
    console.log('=== DEBUG API ===');
    console.log('barId type:', typeof barId);
    console.log('barId value:', barId);
    
    if (!barId) {
      console.log('barId é falsy');
      return NextResponse.json(
        { success: false, error: 'Bar não selecionado' },
        { status: 400 }
      );
    }
    
    // Converter para número
    const barIdNum = parseInt(barId);
    console.log('barIdNum:', barIdNum);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Buscar dados anuais
    if (periodo === 'anual') {
      const currentYear = 2024; // Usar 2024 onde estão os dados reais
      
      // Faturamento 2025 (ContaHub + Yuzer + Sympla)
      const [contahubResult, yuzerResult, symplaResult] = await Promise.all([
        supabase
          .from('contahub_pagamentos')
          .select('liquido')
          .eq('bar_id', barIdNumNumber),
        
        supabase
          .from('yuzer_pagamento')
          .select('valor_liquido')
          .eq('bar_id', barIdNumNumber),
        
        supabase
          .from('sympla_pedidos')
          .select('valor_liquido')
      ]);

      console.log('Contahub result:', contahubResult.data?.length, 'registros');
      if (contahubResult.error) console.log('Contahub error:', contahubResult.error);
      
      console.log('Yuzer result:', yuzerResult.data?.length, 'registros');  
      if (yuzerResult.error) console.log('Yuzer error:', yuzerResult.error);
      
      console.log('Sympla result:', symplaResult.data?.length, 'registros');
      if (symplaResult.error) console.log('Sympla error:', symplaResult.error);
      
      const faturamentoContahub = contahubResult.data?.reduce((sum, item) => sum + (item.liquido || 0), 0) || 0;
      const faturamentoYuzer = yuzerResult.data?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
      const faturamentoSympla = symplaResult.data?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
      const faturamentoTotal = faturamentoContahub + faturamentoYuzer + faturamentoSympla;
      
      console.log('Faturamentos calculados:', {
        contahub: faturamentoContahub,
        yuzer: faturamentoYuzer,
        sympla: faturamentoSympla,
        total: faturamentoTotal
      });

      // Número de Pessoas (ContaHub + Yuzer + Sympla)
      const [pessoasContahub, pessoasYuzer, pessoasSympla] = await Promise.all([
        supabase
          .from('contahub_periodo')
          .select('pessoas')
          .eq('bar_id', barIdNum)
          .gte('dt_gerencial', `${currentYear}-01-01`)
          .lte('dt_gerencial', `${currentYear}-12-31`),
        
        supabase
          .from('yuzer_produtos')
          .select('quantidade, produto_nome')
          .eq('bar_id', barIdNum)
          .or('produto_nome.ilike.%ingresso%,produto_nome.ilike.%entrada%')
          .gte('data_evento', `${currentYear}-01-01`)
          .lte('data_evento', `${currentYear}-12-31`),
        
        supabase
          .from('sympla_participantes')
          .select('id')
          .eq('bar_id', barIdNum)
          .eq('fez_checkin', true)
          .gte('data_checkin', `${currentYear}-01-01`)
          .lte('data_checkin', `${currentYear}-12-31`)
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

      const reputacao = reputacaoData?.review_average_rating_total || 0;

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
      const startDate = '2024-07-01';
      const endDate = '2024-09-30';

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
        'Salários', 'Alimentação', 'Provisão Trabalhista', 'Vale Transporte',
        'Adicionais', 'Freela Atendimento', 'Freela Bar', 'Freela Cozinha',
        'Freela Limpeza', 'Freela Segurança', 'CUSTO-EMPRESA FUNCIONÁRIOS'
      ];

      const { data: cmoData } = await supabase
        .from('nibo_agendamentos')
        .select('valor')
        .eq('bar_id', barIdNum)
        .in('categoria', categoriasCMO)
        .gte('data_vencimento', startDate)
        .lte('data_vencimento', endDate);

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
        .gte('data', startDate)
        .lte('data', endDate);

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
            valor: 0, // Manual por enquanto
            meta: 10
          },
          cmvLimpo: {
            valor: 0, // Manual por enquanto
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
