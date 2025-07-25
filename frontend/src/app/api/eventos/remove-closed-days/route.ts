import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST() {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }
    console.log('🗑️ Removendo dias fechados...');

    // Criar cliente Supabase

    // Lista de datas de dias fechados (formato YYYY-MM-DD)
    const diasFechados = [
      // Fechados gerais (segundas e terças)
      '2025-02-03',
      '2025-02-10',
      '2025-02-17',
      '2025-02-24',
      '2025-03-03',
      '2025-03-10',
      '2025-03-17',
      '2025-03-24',
      '2025-03-31',
      '2025-04-07',
      '2025-04-14',
      '2025-04-21',
      '2025-04-28',
      '2025-05-05',
      '2025-05-12',
      '2025-05-19',
      '2025-05-26',
      '2025-06-02',
      '2025-06-09',
      '2025-06-16',
      '2025-06-23',
      '2025-06-30',
      // Dias específicos fechados
      '2025-02-09',
      '2025-03-05',
      '2025-04-22',
      '2025-04-29',
      '2025-05-06',
      '2025-05-13',
      '2025-05-20',
      '2025-05-27',
      '2025-06-03',
      '2025-06-10',
      '2025-06-17',
      '2025-06-24',
    ];

    console.log(`📅 Removendo ${diasFechados.length} dias fechados`);

    // Remover eventos nos dias fechados
    const { data, error } = await supabase
      .from('eventos')
      .delete()
      .eq('bar_id', 1)
      .in('data_evento', diasFechados)
      .select();

    if (error) {
      console.error('❌ Erro ao remover dias fechados:', error);
      return NextResponse.json({
        success: false,
        error: 'Erro ao remover dias fechados',
        details: error,
      });
    }

    console.log(`✅ Removidos ${data?.length || 0} eventos de dias fechados`);

    return NextResponse.json({
      success: true,
      message: `Removidos ${data?.length || 0} eventos de dias fechados`,
      removedCount: data?.length || 0,
      diasFechados: diasFechados.length,
      removedEvents: data,
    });
  } catch (error: unknown) {
    console.error('❌ Erro geral:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
