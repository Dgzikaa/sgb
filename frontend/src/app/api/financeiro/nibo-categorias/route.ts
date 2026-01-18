import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Buscar todas as categorias ativas do Nibo
    const { data: categorias, error } = await supabase
      .from('nibo_categorias')
      .select('*')
      .eq('ativo', true)
      .order('categoria_macro')
      .order('categoria_nome');

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar categorias' },
        { status: 500 }
      );
    }

    // Agrupar categorias por macro-categoria
    const categoriasPorMacro: Record<string, Array<{
      categoria_nome: string;
      ativo: boolean;
    }>> = {};

    categorias?.forEach((cat) => {
      if (!categoriasPorMacro[cat.categoria_macro]) {
        categoriasPorMacro[cat.categoria_macro] = [];
      }
      categoriasPorMacro[cat.categoria_macro].push({
        categoria_nome: cat.categoria_nome,
        ativo: cat.ativo,
      });
    });

    // Lista de macro-categorias na ordem correta
    const ordemMacroCategorias = [
      'Receita',
      'Custos Variáveis',
      'Custo insumos (CMV)',
      'Mão-de-Obra',
      'Despesas Comerciais',
      'Despesas Administrativas',
      'Despesas Operacionais',
      'Despesas de Ocupação (Contas)',
      'Não Operacionais',
      'Investimentos',
      'Sócios',
    ];

    return NextResponse.json({
      success: true,
      categorias: categorias || [],
      categorias_por_macro: categoriasPorMacro,
      ordem_macro_categorias: ordemMacroCategorias,
      total: categorias?.length || 0,
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
