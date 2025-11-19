import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Buscar produtos únicos por categoria
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoria = searchParams.get('categoria');
    const bar_id = parseInt(searchParams.get('bar_id') || '3');

    if (!categoria) {
      return NextResponse.json(
        { success: false, error: 'Categoria é obrigatória' },
        { status: 400 }
      );
    }

    // Buscar produtos distintos que já foram contados nesta categoria
    const { data, error } = await supabase
      .from('contagem_estoque_produtos')
      .select('descricao, preco, categoria')
      .eq('bar_id', bar_id)
      .eq('categoria', categoria)
      .order('descricao', { ascending: true });

    if (error) throw error;

    // Agrupar por descrição (pegar a mais recente de cada produto)
    const produtosMap = new Map();
    (data || []).forEach((item: any) => {
      if (!produtosMap.has(item.descricao)) {
        produtosMap.set(item.descricao, {
          descricao: item.descricao,
          preco: parseFloat(item.preco || '0'),
          categoria: item.categoria
        });
      }
    });

    const produtosUnicos = Array.from(produtosMap.values());

    return NextResponse.json({
      success: true,
      data: produtosUnicos,
      total: produtosUnicos.length
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar produtos:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}

