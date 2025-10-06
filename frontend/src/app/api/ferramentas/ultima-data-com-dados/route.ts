import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bar_id = searchParams.get('bar_id') || '3';

    // Buscar a data mais recente com dados no contahub_analitico
    const { data: ultimaData, error } = await supabase
      .from('contahub_analitico')
      .select('trn_dtgerencial')
      .eq('bar_id', parseInt(bar_id))
      .order('trn_dtgerencial', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Erro ao buscar última data:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar dados' },
        { status: 500 }
      );
    }

    const dataEncontrada = ultimaData?.[0]?.trn_dtgerencial;
    
    if (!dataEncontrada) {
      return NextResponse.json(
        { error: 'Nenhuma data encontrada' },
        { status: 404 }
      );
    }

    // Verificar se há dados suficientes para essa data (pelo menos 100 registros)
    const { data: contagem, error: errorContagem } = await supabase
      .from('contahub_analitico')
      .select('trn_dtgerencial', { count: 'exact' })
      .eq('bar_id', parseInt(bar_id))
      .eq('trn_dtgerencial', dataEncontrada);

    const totalRegistros = contagem?.length || 0;

    return NextResponse.json({
      success: true,
      data: {
        ultima_data: dataEncontrada,
        total_registros: totalRegistros,
        bar_id: parseInt(bar_id)
      }
    });

  } catch (error) {
    console.error('Erro na API ultima-data-com-dados:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}


