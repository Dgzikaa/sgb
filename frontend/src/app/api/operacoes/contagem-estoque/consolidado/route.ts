import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Buscar contagem consolidada por produto (somando todas as áreas)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bar_id_param = searchParams.get('bar_id');
    
    if (!bar_id_param) {
      return NextResponse.json(
        { success: false, error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }
    const bar_id = parseInt(bar_id_param);
    const data_contagem = searchParams.get('data');
    const categoria = searchParams.get('categoria');

    if (!data_contagem) {
      return NextResponse.json(
        { success: false, error: 'Data da contagem é obrigatória' },
        { status: 400 }
      );
    }

    // Buscar todas as contagens da data agrupadas por produto
    let query = supabase
      .from('contagem_estoque_produtos')
      .select(`
        *,
        areas_contagem (
          id,
          nome,
          tipo,
          descricao
        )
      `)
      .eq('bar_id', bar_id)
      .eq('data_contagem', data_contagem)
      .order('categoria', { ascending: true })
      .order('descricao', { ascending: true });

    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    const { data: contagens, error } = await query;

    if (error) throw error;

    // Agrupar por produto e consolidar
    const produtosMap = new Map();

    (contagens || []).forEach((contagem: any) => {
      const key = `${contagem.categoria}|${contagem.descricao}`;
      
      if (!produtosMap.has(key)) {
        produtosMap.set(key, {
          categoria: contagem.categoria,
          descricao: contagem.descricao,
          preco: parseFloat(contagem.preco),
          areas: [],
          estoque_fechado_total: 0,
          estoque_flutuante_total: 0,
          estoque_total: 0,
          valor_total: 0,
          total_areas: 0
        });
      }

      const produto = produtosMap.get(key);
      
      produto.areas.push({
        area_id: contagem.area_id,
        area_nome: contagem.areas_contagem?.nome || 'Sem área',
        area_tipo: contagem.areas_contagem?.tipo || null,
        estoque_fechado: parseFloat(contagem.estoque_fechado),
        estoque_flutuante: parseFloat(contagem.estoque_flutuante),
        estoque_total: parseFloat(contagem.estoque_total),
        valor_total: parseFloat(contagem.valor_total)
      });

      produto.estoque_fechado_total += parseFloat(contagem.estoque_fechado);
      produto.estoque_flutuante_total += parseFloat(contagem.estoque_flutuante);
      produto.estoque_total += parseFloat(contagem.estoque_total);
      produto.valor_total += parseFloat(contagem.valor_total);
      produto.total_areas += 1;
    });

    const produtosConsolidados = Array.from(produtosMap.values());

    // Calcular estatísticas gerais
    const estatisticas = {
      total_produtos: produtosConsolidados.length,
      total_areas_utilizadas: new Set(contagens?.map((c: any) => c.area_id).filter(Boolean)).size,
      estoque_total_geral: produtosConsolidados.reduce((sum, p) => sum + p.estoque_total, 0),
      valor_total_geral: produtosConsolidados.reduce((sum, p) => sum + p.valor_total, 0),
      categorias: [...new Set(produtosConsolidados.map(p => p.categoria))]
    };

    return NextResponse.json({
      success: true,
      data: produtosConsolidados,
      estatisticas,
      data_contagem
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar contagem consolidada:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar contagem consolidada' },
      { status: 500 }
    );
  }
}

