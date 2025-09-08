import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buscar categorias macro distintas como centros de custo
    const { data: categorias, error } = await supabase
      .from('nibo_categorias')
      .select('categoria_macro')
      .eq('ativo', true);

    if (error) {
      console.error('Erro ao buscar centros de custo:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar centros de custo' },
        { status: 500 }
      );
    }

    // Criar lista única de centros de custo baseada nas categorias macro
    const centrosCustoUnicos = [...new Set(categorias?.map(c => c.categoria_macro) || [])];
    const centrosCusto = centrosCustoUnicos.map((nome, index) => ({
      id: index + 1,
      nome: nome,
      descricao: `Centro de custo: ${nome}`
    }));

    return NextResponse.json({ centrosCusto });
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
