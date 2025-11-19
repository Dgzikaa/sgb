import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Mapeamento de categorias genéricas para categorias específicas do banco
const CATEGORIA_MAPPING: Record<string, string[]> = {
  'Bebidas': [
    'DESTILADOS',
    'DESTILADOS LOG',
    'Long Neck',
    'Lata',
    'Artesanal',
    'Retornáveis',
    'retornáveis',
    'Vinhos',
    'Não-alcóolicos',
    'POLPAS',
    'polpa'
  ],
  'Alimentos': [
    'MERCADO (C)',
    'MERCADO (F)',
    'MERCADO (S)',
    'MERCADO B',
    'HORTIFRUTI (C)',
    'HORTIFRUTI (F)',
    'HORTIFRUTI B',
    'hortifruti',
    'PÃES',
    'PROTEÍNA',
    'PROTEÍNA (F)',
    'PEIXE',
    'tempero',
    'fruta'
  ],
  'Insumos': [
    'ARMAZÉM (C)',
    'ARMAZÉM (B)',
    'ARMAZÉM B',
    'IMPÉRIO'
  ],
  'Descartáveis': [],
  'Limpeza': [],
  'Outros': [
    'OUTROS',
    'líquido'
  ]
};

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

    // Buscar categorias específicas para a categoria genérica
    const categoriasEspecificas = CATEGORIA_MAPPING[categoria] || [];

    if (categoriasEspecificas.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        message: 'Nenhuma categoria específica mapeada para esta categoria'
      });
    }

    // Buscar produtos da tabela insumos usando as categorias específicas
    const { data, error } = await supabase
      .from('insumos')
      .select('nome, custo_unitario, categoria')
      .eq('bar_id', bar_id)
      .eq('ativo', true)
      .in('categoria', categoriasEspecificas)
      .order('nome', { ascending: true });

    if (error) throw error;

    // Formatar produtos
    const produtos = (data || []).map((item: any) => ({
      descricao: item.nome,
      preco: parseFloat(item.custo_unitario || '0'),
      categoria: item.categoria
    }));

    return NextResponse.json({
      success: true,
      data: produtos,
      total: produtos.length
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar produtos:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}

