import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função auxiliar para aplicar filtros base (locais e prefixos a ignorar)
const aplicarFiltrosBase = (query: any) => {
  // LOCAIS A IGNORAR PERMANENTEMENTE
  query = query
    .neq('loc_desc', 'Pegue e Pague')
    .neq('loc_desc', 'Shot e Dose')
    .neq('loc_desc', 'Venda Volante')
    .not('loc_desc', 'is', null); // Excluir "Sem local definido"
  
  // PRODUTOS COM PREFIXOS A IGNORAR
  query = query
    .not('prd_desc', 'ilike', '[HH]%')  // Happy Hour
    .not('prd_desc', 'ilike', '[PP]%')  // Pegue Pague
    .not('prd_desc', 'ilike', '[DD]%')  // Dose Dupla
    .not('prd_desc', 'ilike', '[IN]%'); // Insumos
  
  return query;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const data_selecionada = searchParams.get('data');
    const bar_id = parseInt(searchParams.get('bar_id') || '3');

    if (!data_selecionada) {
      return NextResponse.json(
        { error: 'Data é obrigatória' },
        { status: 400 }
      );
    }

    // Buscar dados de stockout com NOVA LÓGICA: apenas produtos ativos='S'
    let query = supabase
      .from('contahub_stockout')
      .select('prd_ativo, prd_venda')
      .eq('data_consulta', data_selecionada)
      .eq('bar_id', bar_id)
      .eq('prd_ativo', 'S'); // Apenas produtos ativos

    // Aplicar filtros base
    query = aplicarFiltrosBase(query);

    const { data: dadosStockout, error } = await query;

    if (error) {
      console.error('Erro ao buscar dados de stockout:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar dados de stockout' },
        { status: 500 }
      );
    }

    // Calcular estatísticas com NOVA LÓGICA
    const totalProdutosAtivos = dadosStockout?.length || 0;
    const produtosDisponiveis = dadosStockout?.filter(p => p.prd_venda === 'S').length || 0;
    const produtosStockout = dadosStockout?.filter(p => p.prd_venda === 'N').length || 0;
    const percentualStockout = totalProdutosAtivos > 0 ? 
      ((produtosStockout / totalProdutosAtivos) * 100).toFixed(1) : '0.0';

    return NextResponse.json({
      success: true,
      data: {
        data_referencia: data_selecionada,
        total_produtos_ativos: totalProdutosAtivos,
        produtos_disponiveis: produtosDisponiveis,
        produtos_stockout: produtosStockout,
        percentual_stockout: `${percentualStockout}%`,
        percentual_disponibilidade: `${(100 - parseFloat(percentualStockout)).toFixed(1)}%`
      }
    });

  } catch (error) {
    console.error('Erro na API de resumo stockout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data_inicio, data_fim, bar_id = 3 } = await request.json();

    if (!data_inicio || !data_fim) {
      return NextResponse.json(
        { error: 'Data de início e fim são obrigatórias' },
        { status: 400 }
      );
    }

    // Buscar dados históricos com NOVA LÓGICA: apenas produtos ativos='S'
    let queryHistorico = supabase
      .from('contahub_stockout')
      .select('data_consulta, prd_ativo, prd_venda')
      .eq('prd_ativo', 'S') // Apenas produtos ativos
      .gte('data_consulta', data_inicio)
      .lte('data_consulta', data_fim)
      .eq('bar_id', bar_id);

    // Aplicar filtros base
    queryHistorico = aplicarFiltrosBase(queryHistorico);

    const { data: dadosHistoricos, error } = await queryHistorico;

    if (error) {
      console.error('Erro ao buscar dados históricos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar dados históricos' },
        { status: 500 }
      );
    }

    if (!dadosHistoricos || dadosHistoricos.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          periodo: { data_inicio, data_fim },
          media_stockout: '0.0%',
          total_dias: 0,
          dados_por_data: []
        }
      });
    }

    // Agrupar dados por data
    const dadosPorData = new Map();
    dadosHistoricos.forEach(item => {
      const data = item.data_consulta;
      if (!dadosPorData.has(data)) {
        dadosPorData.set(data, {
          total_ativos: 0,
          disponiveis: 0,
          stockout: 0
        });
      }
      const stats = dadosPorData.get(data);
      stats.total_ativos++;
      if (item.prd_venda === 'S') {
        stats.disponiveis++;
      } else if (item.prd_venda === 'N') {
        stats.stockout++;
      }
    });

    // Processar dados por data
    const dadosProcessados = Array.from(dadosPorData.entries()).map(([data, stats]) => {
      const percentualStockout = stats.total_ativos > 0 ? 
        ((stats.stockout / stats.total_ativos) * 100) : 0;
      
      return {
        data_referencia: data,
        total_produtos_ativos: stats.total_ativos,
        produtos_disponiveis: stats.disponiveis,
        produtos_stockout: stats.stockout,
        percentual_stockout: parseFloat(percentualStockout.toFixed(1))
      };
    }).sort((a, b) => a.data_referencia.localeCompare(b.data_referencia));

    // Calcular média do período
    const somaStockout = dadosProcessados.reduce((sum, dia) => sum + dia.percentual_stockout, 0);
    const mediaStockout = dadosProcessados.length > 0 ? 
      (somaStockout / dadosProcessados.length).toFixed(1) : '0.0';

    return NextResponse.json({
      success: true,
      data: {
        periodo: { data_inicio, data_fim },
        media_stockout: `${mediaStockout}%`,
        total_dias: dadosProcessados.length,
        dados_por_data: dadosProcessados
      }
    });

  } catch (error) {
    console.error('Erro na API de resumo histórico stockout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
