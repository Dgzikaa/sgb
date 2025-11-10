import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { data_selecionada, filtros = [] } = await request.json();

    console.log('🔍 API Stockout - Data recebida:', data_selecionada, 'Filtros:', filtros);

    if (!data_selecionada) {
      return NextResponse.json(
        { error: 'Data é obrigatória' },
        { status: 400 }
      );
    }

    // Construir condições de filtro
    let whereConditions = `data_consulta = '${data_selecionada}'`;
    
    if (filtros.length > 0) {
      const filtroConditions = filtros.map((filtro: string) => {
        if (filtro === 'sem_local') {
          return `loc_desc IS NOT NULL`;
        }
        return `loc_desc != '${filtro}'`;
      }).join(' AND ');
      
      whereConditions += ` AND ${filtroConditions}`;
    }

    // 1. Estatísticas gerais - NOVA LÓGICA: apenas produtos ativos='S' e venda='N'
    let query = supabase
      .from('contahub_stockout')
      .select('prd_ativo, prd_venda')
      .eq('data_consulta', data_selecionada)
      .eq('prd_ativo', 'S'); // Apenas produtos ativos

    // Aplicar filtros se existirem
    if (filtros.length > 0) {
      filtros.forEach(filtro => {
        if (filtro === 'sem_local') {
          query = query.not('loc_desc', 'is', null);
        } else {
          query = query.neq('loc_desc', filtro);
        }
      });
    }

    const { data: dadosGerais, error: errorEstatisticas } = await query;

    console.log('📊 Dados encontrados:', dadosGerais?.length || 0, 'produtos');

    if (errorEstatisticas) {
      console.error('❌ Erro ao buscar estatísticas:', errorEstatisticas);
      throw new Error('Erro ao buscar estatísticas gerais');
    }

    // Calcular estatísticas com NOVA LÓGICA
    const totalProdutosAtivos = dadosGerais?.length || 0; // Total de produtos ativos
    const countProdutosDisponiveis = dadosGerais?.filter(p => p.prd_venda === 'S').length || 0; // Ativos E venda='S'
    const countProdutosStockout = dadosGerais?.filter(p => p.prd_venda === 'N').length || 0; // Ativos E venda='N' = STOCKOUT
    const percentualStockout = totalProdutosAtivos > 0 ? ((countProdutosStockout / totalProdutosAtivos) * 100).toFixed(2) : '0.00';

    console.log(`📈 Total: ${totalProdutosAtivos}, Disponíveis: ${countProdutosDisponiveis}, Stockout: ${countProdutosStockout}, %: ${percentualStockout}%`);

    // 2. Análise por local de produção - NOVA LÓGICA: apenas produtos ativos
    let queryLocais = supabase
      .from('contahub_stockout')
      .select('loc_desc, prd_ativo, prd_venda')
      .eq('data_consulta', data_selecionada)
      .eq('prd_ativo', 'S'); // Apenas produtos ativos

    // Aplicar filtros se existirem
    if (filtros.length > 0) {
      filtros.forEach(filtro => {
        if (filtro === 'sem_local') {
          queryLocais = queryLocais.not('loc_desc', 'is', null);
        } else {
          queryLocais = queryLocais.neq('loc_desc', filtro);
        }
      });
    }

    const { data: dadosLocais, error: errorLocais } = await queryLocais;

    if (errorLocais) {
      throw new Error('Erro ao buscar dados por local');
    }

    // Processar dados por local com NOVA LÓGICA
    const locaisMap = new Map();
    dadosLocais?.forEach(item => {
      const local = item.loc_desc || 'Sem local definido';
      if (!locaisMap.has(local)) {
        locaisMap.set(local, { total: 0, disponiveis: 0, stockout: 0 });
      }
      const stats = locaisMap.get(local);
      stats.total++; // Total de produtos ativos neste local
      if (item.prd_venda === 'S') {
        stats.disponiveis++; // Ativos E venda='S'
      } else if (item.prd_venda === 'N') {
        stats.stockout++; // Ativos E venda='N' = STOCKOUT
      }
    });

    const analiseLocais = Array.from(locaisMap.entries()).map(([local, stats]) => ({
      local_producao: local,
      total_produtos: stats.total,
      disponiveis: stats.disponiveis,
      indisponiveis: stats.stockout, // Renomeado para manter compatibilidade
      perc_stockout: stats.total > 0 ? parseFloat(((stats.stockout / stats.total) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.perc_stockout - a.perc_stockout || b.total_produtos - a.total_produtos);

    // 3. Produtos em stockout (top 50) - NOVA LÓGICA: ativos='S' E venda='N'
    let queryIndisponiveis = supabase
      .from('contahub_stockout')
      .select('prd_desc, loc_desc, prd_precovenda, prd_estoque, prd_controlaestoque, prd_validaestoquevenda')
      .eq('data_consulta', data_selecionada)
      .eq('prd_ativo', 'S') // Apenas produtos ativos
      .eq('prd_venda', 'N') // E que não estão à venda = STOCKOUT
      .order('loc_desc')
      .order('prd_desc')
      .limit(50);

    // Aplicar filtros se existirem
    if (filtros.length > 0) {
      filtros.forEach(filtro => {
        if (filtro === 'sem_local') {
          queryIndisponiveis = queryIndisponiveis.not('loc_desc', 'is', null);
        } else {
          queryIndisponiveis = queryIndisponiveis.neq('loc_desc', filtro);
        }
      });
    }

    const { data: listaProdutosIndisponiveis, error: errorIndisponiveis } = await queryIndisponiveis;

    // 4. Produtos disponíveis (amostra de 20) - NOVA LÓGICA: ativos='S' E venda='S'
    let queryDisponiveis = supabase
      .from('contahub_stockout')
      .select('prd_desc, loc_desc, prd_precovenda, prd_estoque')
      .eq('data_consulta', data_selecionada)
      .eq('prd_ativo', 'S') // Apenas produtos ativos
      .eq('prd_venda', 'S') // E que estão à venda = DISPONÍVEIS
      .order('loc_desc')
      .order('prd_desc')
      .limit(20);

    // Aplicar filtros se existirem
    if (filtros.length > 0) {
      filtros.forEach(filtro => {
        if (filtro === 'sem_local') {
          queryDisponiveis = queryDisponiveis.not('loc_desc', 'is', null);
        } else {
          queryDisponiveis = queryDisponiveis.neq('loc_desc', filtro);
        }
      });
    }

    const { data: listaProdutosDisponiveis, error: errorDisponiveis } = await queryDisponiveis;

    if (errorIndisponiveis || errorDisponiveis) {
      throw new Error('Erro ao buscar produtos');
    }

    return NextResponse.json({
      success: true,
      data: {
        data_analisada: data_selecionada,
        filtros_aplicados: filtros,
        estatisticas: {
          total_produtos: totalProdutosAtivos, // Total de produtos ativos
          produtos_ativos: countProdutosDisponiveis, // Ativos E venda='S'
          produtos_inativos: countProdutosStockout, // Ativos E venda='N' = STOCKOUT
          percentual_stockout: `${percentualStockout}%`,
          percentual_disponibilidade: `${(100 - parseFloat(percentualStockout)).toFixed(2)}%`
        },
        produtos: {
          inativos: listaProdutosIndisponiveis || [],
          ativos: listaProdutosDisponiveis || []
        },
        grupos: {
          inativos: (analiseLocais || []).filter((local: any) => local.perc_stockout > 0),
          ativos: (analiseLocais || []).filter((local: any) => local.perc_stockout === 0)
        },
        analise_por_local: analiseLocais || [],
        timestamp_consulta: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro na API de stockout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
