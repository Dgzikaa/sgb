import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('bar_id');
    const ativo = searchParams.get('ativo') !== 'false'; // default: true

    console.log(`[NIBO-CATEGORIAS] Buscando categorias, bar_id=${barId}, ativo=${ativo}`);

    // Buscar categorias da tabela nibo_categorias
    let query = supabase
      .from('nibo_categorias')
      .select('id, categoria_nome, categoria_macro, ativo, criado_em, atualizado_em')
      .order('categoria_macro')
      .order('categoria_nome');

    // Filtrar por ativo se necessário
    if (ativo) {
      query = query.eq('ativo', true);
    }

    const { data: categorias, error } = await query;

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar categorias', details: error.message },
        { status: 500 }
      );
    }

    // Agrupar categorias por categoria_macro para facilitar seleção
    const categoriasAgrupadas = categorias?.reduce((acc: Record<string, any[]>, cat) => {
      const macro = cat.categoria_macro || 'Outros';
      if (!acc[macro]) {
        acc[macro] = [];
      }
      acc[macro].push(cat);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      categorias: categorias || [],
      categoriasAgrupadas,
      total: categorias?.length || 0
    });

  } catch (error) {
    console.error('[NIBO-CATEGORIAS] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao buscar categorias' },
      { status: 500 }
    );
  }
}
