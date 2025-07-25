import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buscar centros de custo ativos
    const { data: centrosCusto, error } = await supabase
      .from('nibo_centros_custo')
      .select('id, nome, descricao')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('Erro ao buscar centros de custo:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar centros de custo' },
        { status: 500 }
      );
    }

    return NextResponse.json({ centrosCusto });
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
