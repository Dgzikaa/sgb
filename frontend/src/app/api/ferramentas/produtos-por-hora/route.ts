import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ProdutoPorHora {
  hora: number;
  produto_id: string;
  produto_descricao: string;
  grupo_descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  is_banda: boolean;
}

interface VendaPorHorario {
  hora: number;
  total_quantidade: number;
  total_valor: number;
  produtos_diferentes: Set<string>;
}

export async function POST(request: NextRequest) {
  try {
    const { data_selecionada, bar_id = 3 } = await request.json();

    if (!data_selecionada) {
      return NextResponse.json(
        { error: 'data_selecionada é obrigatória' },
        { status: 400 }
      );
    }

    console.log(`🔍 Buscando produtos por hora para ${data_selecionada}`);

    // 🎯 MUDANÇA: Usar contahub_analitico como fonte principal para contagem de produtos
    // Excluir categorias que são compras/estoque, não vendas
    const { data: dadosAnaliticos, error: errorAnalitico } = await supabase
      .from('contahub_analitico')
      .select(`
        prd_desc,
        grp_desc,
        qtd,
        valorfinal,
        vd_mesadesc
      `)
      .eq('trn_dtgerencial', data_selecionada)
      .eq('bar_id', bar_id)
      .not('grp_desc', 'in', '("Mercadorias- Compras","Insumos","Uso Interno")')
      .order('qtd', { ascending: false });

    if (errorAnalitico) {
      console.error('Erro ao buscar dados analíticos:', errorAnalitico);
      return NextResponse.json(
        { error: 'Erro ao buscar dados do banco' },
        { status: 500 }
      );
    }

    console.log(`📊 Dados analíticos encontrados: ${dadosAnaliticos?.length || 0} registros`);

    // 🍽️ Buscar dados do prodporhora APENAS para happy hour e horários de pico
    const { data: produtosPorHora, error: errorProdPorHora } = await supabase
      .from('contahub_prodporhora')
      .select(`
        hora,
        produto_id,
        produto_descricao,
        grupo_descricao,
        quantidade,
        valor_unitario,
        valor_total
      `)
      .eq('data_gerencial', data_selecionada)
      .eq('bar_id', bar_id)
      .order('hora', { ascending: true });

    console.log(`🍽️ Dados prodporhora encontrados: ${produtosPorHora?.length || 0} registros (apenas para happy hour)`);

    // 🔄 Combinar dados: prodporhora (com horários) + analitico (produtos completos)
    let produtosPorHoraEnriquecidos: ProdutoPorHora[] = [];

    // Se temos dados do prodporhora, usar como base e enriquecer com analítico
    if (produtosPorHora && produtosPorHora.length > 0) {
      // Criar mapa de produtos da banda baseado no analítico
      const produtosBandaMap = new Map<string, boolean>();
      if (dadosAnaliticos) {
        dadosAnaliticos.forEach(item => {
          const mesaDesc = item.vd_mesadesc?.toLowerCase() || '';
          if (mesaDesc.includes('banda') || mesaDesc.includes('dj')) {
            produtosBandaMap.set(item.prd_desc, true);
          }
        });
      }

      // Usar dados do prodporhora com informação de banda
      produtosPorHoraEnriquecidos = produtosPorHora.map(item => ({
        ...item,
        is_banda: produtosBandaMap.has(item.produto_descricao) || false
      }));

      console.log(`🍽️ Usando ${produtosPorHora.length} produtos do prodporhora com info de banda`);
    } else {
      // Fallback: usar apenas dados do analítico (sem horário específico)
      const produtosAgregados = new Map<string, ProdutoPorHora>();
      
      dadosAnaliticos?.forEach(item => {
        const mesaDesc = item.vd_mesadesc?.toLowerCase() || '';
        const isBanda = mesaDesc.includes('banda') || mesaDesc.includes('dj');
        const key = item.prd_desc;
        
        if (produtosAgregados.has(key)) {
          const existing = produtosAgregados.get(key);
          if (existing) {
            existing.quantidade += parseFloat(item.qtd) || 0;
            existing.valor_total += parseFloat(item.valorfinal) || 0;
          }
        } else {
          produtosAgregados.set(key, {
            hora: 0, // Sem hora específica
            produto_id: item.prd_desc || '',
            produto_descricao: item.prd_desc || '',
            grupo_descricao: item.grp_desc || '',
            quantidade: parseFloat(item.qtd) || 0,
            valor_unitario: parseFloat(item.valorfinal) || 0,
            valor_total: parseFloat(item.valorfinal) || 0,
            is_banda: isBanda
          });
        }
      });

      produtosPorHoraEnriquecidos = Array.from(produtosAgregados.values());
      console.log(`📊 Usando ${produtosPorHoraEnriquecidos.length} produtos agregados do analítico`);
    }

    // Calcular estatísticas
    const totalProdutos = produtosPorHoraEnriquecidos?.reduce((sum, item) => sum + item.quantidade, 0) || 0;
    const totalValor = produtosPorHoraEnriquecidos?.reduce((sum, item) => sum + item.valor_total, 0) || 0;
    const produtosUnicos = new Set(produtosPorHoraEnriquecidos?.map(item => item.produto_id) || []).size;
    const gruposUnicos = new Set(produtosPorHoraEnriquecidos?.map(item => item.grupo_descricao).filter(Boolean) || []).size;

    // Encontrar horário e produto de pico
    const produtosPorQuantidade = [...(produtosPorHoraEnriquecidos || [])].sort((a, b) => b.quantidade - a.quantidade);
    const produtoPico = produtosPorQuantidade[0];

    // 🎯 Calcular horário de pico usando prodporhora (mais preciso para horários)
    // Mas apenas para produtos não-banda
    let horarioPico: VendaPorHorario | null = null;
    
    if (produtosPorHora && produtosPorHora.length > 0) {
      // Usar dados do prodporhora para horário de pico (mais preciso)
      const vendasPorHorarioProdPorHora = produtosPorHora.reduce((acc, item) => {
        if (!acc[item.hora]) {
          acc[item.hora] = {
            hora: item.hora,
            total_quantidade: 0,
            total_valor: 0,
            produtos_diferentes: new Set<string>()
          };
        }
        acc[item.hora].total_quantidade += item.quantidade;
        acc[item.hora].total_valor += item.valor_total;
        acc[item.hora].produtos_diferentes.add(item.produto_id);
        return acc;
      }, {} as Record<number, VendaPorHorario>);

      const horariosSorted = Object.values(vendasPorHorarioProdPorHora)
        .sort((a, b) => b.total_quantidade - a.total_quantidade);
      horarioPico = horariosSorted.length > 0 ? horariosSorted[0] : null;
        
      console.log(`🕐 Horário de pico calculado via prodporhora: ${horarioPico?.hora}h`);
    } else {
      // Fallback: usar dados do analítico, mas apenas para produtos não-banda
      const produtosNaoBanda = produtosPorHoraEnriquecidos?.filter(item => !item.is_banda) || [];
      
      const vendasPorHorario = produtosNaoBanda.reduce((acc, item) => {
        if (!acc[item.hora]) {
          acc[item.hora] = {
            hora: item.hora,
            total_quantidade: 0,
            total_valor: 0,
            produtos_diferentes: new Set<string>()
          };
        }
        acc[item.hora].total_quantidade += item.quantidade;
        acc[item.hora].total_valor += item.valor_total;
        acc[item.hora].produtos_diferentes.add(item.produto_id);
        return acc;
      }, {} as Record<number, VendaPorHorario>);

      const horariosSortedAnalytico = Object.values(vendasPorHorario)
        .sort((a, b) => b.total_quantidade - a.total_quantidade);
      horarioPico = horariosSortedAnalytico.length > 0 ? horariosSortedAnalytico[0] : null;
        
      console.log(`🕐 Horário de pico calculado via analítico (sem banda): ${horarioPico?.hora}h`);
    }

    // Top 5 produtos
    const topProdutos = produtosPorHoraEnriquecidos?.reduce((acc, item) => {
      const key = item.produto_descricao;
      if (!acc[key]) {
        acc[key] = {
          produto_descricao: item.produto_descricao,
          grupo_descricao: item.grupo_descricao,
          total_quantidade: 0,
          total_valor: 0
        };
      }
      acc[key].total_quantidade += item.quantidade;
      acc[key].total_valor += item.valor_total;
      return acc;
    }, {} as Record<string, any>) || {};

    const top5Produtos = Object.values(topProdutos)
      .sort((a: any, b: any) => b.total_quantidade - a.total_quantidade)
      .slice(0, 5);

    console.log(`✅ Encontrados ${produtosPorHoraEnriquecidos?.length || 0} registros de produtos por hora`);
    console.log(`🎵 Produtos identificados como banda: ${produtosPorHoraEnriquecidos?.filter(item => item.is_banda).length || 0}`);

    return NextResponse.json({
      success: true,
      data_selecionada,
      dados: produtosPorHoraEnriquecidos || [],
      estatisticas: {
        total_produtos_vendidos: totalProdutos,
        total_valor_vendas: totalValor,
        produtos_unicos: produtosUnicos,
        grupos_unicos: gruposUnicos,
        produto_pico: produtoPico ? {
          produto: produtoPico.produto_descricao,
          grupo: produtoPico.grupo_descricao,
          quantidade: produtoPico.quantidade,
          hora: produtoPico.hora,
          valor: produtoPico.valor_total
        } : null,
        horario_pico: horarioPico ? {
          hora: horarioPico.hora,
          total_quantidade: horarioPico.total_quantidade,
          total_valor: horarioPico.total_valor,
          produtos_diferentes: horarioPico.produtos_diferentes.size
        } : null,
        top_5_produtos: top5Produtos
      }
    });

  } catch (error) {
    console.error('Erro na API produtos-por-hora:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
