import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // Buscar dados da tabela contahub_prodporhora
    const { data: produtosPorHora, error } = await supabase
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
      .order('hora', { ascending: true })
      .order('quantidade', { ascending: false });

    if (error) {
      console.error('Erro ao buscar produtos por hora:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar dados do banco' },
        { status: 500 }
      );
    }

    // Calcular estatísticas
    const totalProdutos = produtosPorHora?.reduce((sum, item) => sum + item.quantidade, 0) || 0;
    const totalValor = produtosPorHora?.reduce((sum, item) => sum + item.valor_total, 0) || 0;
    const produtosUnicos = new Set(produtosPorHora?.map(item => item.produto_id) || []).size;
    const gruposUnicos = new Set(produtosPorHora?.map(item => item.grupo_descricao).filter(Boolean) || []).size;

    // Encontrar horário e produto de pico
    const produtosPorQuantidade = [...(produtosPorHora || [])].sort((a, b) => b.quantidade - a.quantidade);
    const produtoPico = produtosPorQuantidade[0];

    // Vendas por horário (agregado)
    const vendasPorHorario = produtosPorHora?.reduce((acc, item) => {
      if (!acc[item.hora]) {
        acc[item.hora] = {
          hora: item.hora,
          total_quantidade: 0,
          total_valor: 0,
          produtos_diferentes: new Set()
        };
      }
      acc[item.hora].total_quantidade += item.quantidade;
      acc[item.hora].total_valor += item.valor_total;
      acc[item.hora].produtos_diferentes.add(item.produto_id);
      return acc;
    }, {} as Record<number, any>) || {};

    const horarioPico = Object.values(vendasPorHorario)
      .sort((a: any, b: any) => b.total_quantidade - a.total_quantidade)[0];

    // Top 5 produtos
    const topProdutos = produtosPorHora?.reduce((acc, item) => {
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

    console.log(`✅ Encontrados ${produtosPorHora?.length || 0} registros de produtos por hora`);

    return NextResponse.json({
      success: true,
      data_selecionada,
      dados: produtosPorHora || [],
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
