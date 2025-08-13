import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const barId = parseInt(searchParams.get('bar_id') || '1');

    // Buscar grupos únicos da tabela tempo
    const { data: grupos, error } = await supabase
      .from('tempo')
      .select('grp_desc')
      .eq('bar_id', barId)
      .not('grp_desc', 'is', null);

    if (error) {
      console.error('Erro ao buscar grupos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar grupos' },
        { status: 500 }
      );
    }

    // Extrair grupos únicos
    const gruposUnicos = [...new Set(grupos?.map((g: any) => g.grp_desc))]
      .filter(Boolean)
      .sort();

    return NextResponse.json({
      success: true,
      grupos: gruposUnicos,
    });
  } catch (error) {
    console.error('Erro interno na API de grupos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
