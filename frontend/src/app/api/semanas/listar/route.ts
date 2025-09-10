import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    console.log('🔍 Buscando semanas disponíveis...');

    // Busca as últimas 20 semanas ordenadas por data_inicio DESC
    const { data: semanas, error } = await supabase
      .from('semanas_referencia')
      .select('semana, data_inicio, data_fim, periodo_formatado')
      .order('data_inicio', { ascending: false })
      .limit(20);

    if (error) {
      console.error('❌ Erro ao buscar semanas:', error);
      throw error;
    }

    console.log(`✅ ${semanas?.length || 0} semanas encontradas`);

    return NextResponse.json({
      success: true,
      semanas: semanas || [],
      total: semanas?.length || 0
    });

  } catch (error) {
    console.error('❌ Erro na API de semanas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
