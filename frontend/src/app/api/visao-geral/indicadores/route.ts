import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'anual';
    const barId = searchParams.get('bar_id');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Buscar dados anuais
    if (periodo === 'anual') {
      const currentYear = new Date().getFullYear();
      
      // Faturamento 2025 (ContaHub + Yuzer + Sympla)
      const [contahubResult, yuzerResult, symplaResult] = await Promise.all([
        supabase
          .from('contahub_pagamentos')
          .select('liquido')
          .eq('bar_id', barId)
          .gte('data_pagamento', `${currentYear}-01-01`)
          .lte('data_pagamento', `${currentYear}-12-31`),
        
        supabase
          .from('yuzer_pagamentos')
          .select('valor_liquido')
          .eq('bar_id', barId)
          .gte('data_pagamento', `${currentYear}-01-01`)
          .lte('data_pagamento', `${currentYear}-12-31`),
        
        supabase
          .from('sympla_pedidos')
          .select('valor_liquido')
          .eq('bar_id', barId)
          .gte('data_pedido', `${currentYear}-01-01`)
          .lte('data_pedido', `${currentYear}-12-31`)
      ]);

      const faturamentoContahub = contahubResult.data?.reduce((sum, item) => sum + (item.liquido || 0), 0) || 0;
      const faturamentoYuzer = yuzerResult.data?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
      const faturamentoSympla = symplaResult.data?.reduce((sum, item) => sum + (item.valor_liquido || 0), 0) || 0;
      const faturamentoTotal = faturamentoContahub + faturamentoYuzer + faturamentoSympla;

      // Número de Pessoas (ContaHub + Yuzer + Sympla)
      const [pessoasContahub, pessoasYuzer, pessoasSympla] = await Promise.all([
        supabase
          .from('contahub_periodo')
          .select('pessoas')
          .eq('bar_id', barId)
          .gte('data', `${currentYear}-01-01`)
          .lte('data', `${currentYear}-12-31`),
        
        supabase
          .from('yuzer_produtos')
          .select('quantidade, produto_nome')
          .eq('bar_id', barId)
          .or('produto_nome.ilike.%ingresso%,produto_nome.ilike.%entrada%')
          .gte('created_at', `${currentYear}-01-01`)
          .lte('created_at', `${currentYear}-12-31`),
        
        supabase
          .from('sympla_participantes')
          .select('id')
          .eq('bar_id', barId)
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
        .eq('bar_id', barId)
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
            meta: 4.5
          },
          ebitda: {
            valor: ebitda,
            meta: 3000000
          }
        }
      });
    }

    // Buscar dados trimestrais
    if (periodo === 'trimestral') {
      const startDate = '2025-07-01';
      const endDate = '2025-09-30';

      // Clientes Ativos (visitaram 2+ vezes no trimestre)
      const { data: clientesData } = await supabase
        .from('contahub_periodo')
        .select('telefone, data')
        .eq('bar_id', barId)
        .gte('data', startDate)
        .lte('data', endDate)
        .not('telefone', 'is', null);

      // Agrupar por telefone e contar visitas
      const clientesMap = new Map();
      clientesData?.forEach(item => {
        if (item.telefone) {
          const count = clientesMap.get(item.telefone) || 0;
          clientesMap.set(item.telefone, count + 1);
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
          .eq('bar_id', barId)
          .gte('data', startDate)
          .lte('data', endDate),
        
        supabase
          .from('yuzer_produtos')
          .select('quantidade, produto_nome')
          .eq('bar_id', barId)
          .or('produto_nome.ilike.%ingresso%,produto_nome.ilike.%entrada%')
          .gte('created_at', startDate)
          .lte('created_at', endDate),
        
        supabase
          .from('sympla_participantes')
          .select('id')
          .eq('bar_id', barId)
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
        .eq('bar_id', barId)
        .in('categoria', categoriasCMO)
        .gte('data_vencimento', startDate)
        .lte('data_vencimento', endDate);

      const totalCMO = cmoData?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0;

      // Faturamento trimestral para calcular %
      const [fatContahub, fatYuzer, fatSympla] = await Promise.all([
        supabase
          .from('contahub_pagamentos')
          .select('liquido')
          .eq('bar_id', barId)
          .gte('data_pagamento', startDate)
          .lte('data_pagamento', endDate),
        
        supabase
          .from('yuzer_pagamentos')
          .select('valor_liquido')
          .eq('bar_id', barId)
          .gte('data_pagamento', startDate)
          .lte('data_pagamento', endDate),
        
        supabase
          .from('sympla_pedidos')
          .select('valor_liquido')
          .eq('bar_id', barId)
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
        .eq('bar_id', barId)
        .gte('data', startDate)
        .lte('data', endDate);

      const percentualArtistica = artisticaData && artisticaData.length > 0
        ? artisticaData.reduce((sum, item) => sum + (item.percent_art_fat || 0), 0) / artisticaData.length
        : 0;

      return NextResponse.json({
        trimestral: {
          clientesAtivos: {
            valor: clientesAtivos,
            meta: 5000
          },
          clientesTotais: {
            valor: totalClientesTrimestre,
            meta: 36000 // 12.000 mensal * 3
          },
          retencao: {
            valor: 0, // Manual por enquanto
            meta: 65
          },
          cmvLimpo: {
            valor: 0, // Manual por enquanto
            meta: 30
          },
          cmo: {
            valor: percentualCMO,
            meta: 25,
            valorAbsoluto: totalCMO
          },
          artistica: {
            valor: percentualArtistica,
            meta: 15
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
