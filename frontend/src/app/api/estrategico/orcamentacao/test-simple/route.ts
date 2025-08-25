import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('🧪 TESTE SIMPLES - Verificando acesso ao NIBO');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Teste 1: Contar todos os registros
    console.log('📊 Teste 1: Contando todos os registros...');
    const { count: totalCount, error: countError } = await supabase
      .from('nibo_agendamentos')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erro ao contar registros:', countError);
      return NextResponse.json({ success: false, error: countError.message });
    }

    console.log(`✅ Total de registros na tabela: ${totalCount}`);

    // Teste 2: Buscar registros do bar 3
    console.log('📊 Teste 2: Buscando registros do bar 3...');
    const { data: barData, error: barError } = await supabase
      .from('nibo_agendamentos')
      .select('*')
      .eq('bar_id', 3)
      .limit(5);

    if (barError) {
      console.error('❌ Erro ao buscar registros do bar:', barError);
      return NextResponse.json({ success: false, error: barError.message });
    }

    console.log(`✅ Registros do bar 3 encontrados: ${barData?.length || 0}`);
    if (barData && barData.length > 0) {
      console.log('📋 Amostra:', barData[0]);
    }

    // Teste 3: Buscar registros de 2025
    console.log('📊 Teste 3: Buscando registros de 2025...');
    const { data: yearData, error: yearError } = await supabase
      .from('nibo_agendamentos')
      .select('*')
      .eq('bar_id', 3)
      .gte('data_competencia', '2025-01-01')
      .lte('data_competencia', '2025-12-31')
      .limit(5);

    if (yearError) {
      console.error('❌ Erro ao buscar registros de 2025:', yearError);
      return NextResponse.json({ success: false, error: yearError.message });
    }

    console.log(`✅ Registros de 2025 encontrados: ${yearData?.length || 0}`);
    if (yearData && yearData.length > 0) {
      console.log('📋 Amostra 2025:', yearData[0]);
    }

    return NextResponse.json({
      success: true,
      total_registros: totalCount,
      registros_bar_3: barData?.length || 0,
      registros_2025: yearData?.length || 0,
      amostra_bar: barData?.[0] || null,
      amostra_2025: yearData?.[0] || null
    });

  } catch (error) {
    console.error('❌ Erro no teste simples:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
