import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const receitaId = searchParams.get('receita_id');

    let query = supabase
      .from('receitas_historico')
      .select('*')
      .order('data_atualizacao', { ascending: false });

    if (receitaId) {
      query = query.eq('receita_id', receitaId);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar histórico de alterações' },
        { status: 500 }
      );
    }

    return NextResponse.json({ historico: data || [] });
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

