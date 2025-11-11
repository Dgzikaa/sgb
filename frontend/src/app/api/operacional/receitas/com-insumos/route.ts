import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Buscar receitas COM insumos (abordagem simplificada e robusta)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = parseInt(searchParams.get('bar_id') || '3');

    console.log(`🍽️ Buscando receitas COM insumos - bar_id: ${barId}`);

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    // 1. Buscar todas as receitas ativas
    const { data: receitas, error: receitasError } = await supabase
      .from('receitas')
      .select('*')
      .eq('bar_id', barId)
      .eq('ativo', true)
      .order('receita_nome', { ascending: true });

    if (receitasError) {
      console.error('❌ Erro ao buscar receitas:', receitasError);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar receitas: ' + receitasError.message },
        { status: 500 }
      );
    }

    console.log(`📋 ${receitas?.length || 0} receitas encontradas`);

    // 2. Para cada receita, buscar seus insumos
    const receitasComInsumos = await Promise.all(
      (receitas || []).map(async (receita: any) => {
        try {
          // Buscar insumos da receita
          const { data: receitaInsumos, error: insumosError } = await supabase
            .from('receitas_insumos')
            .select(`
              id,
              quantidade_necessaria,
              unidade_medida,
              is_chefe,
              insumo_id,
              receita_insumo_id,
              insumos:insumo_id (
                id,
                codigo,
                nome,
                unidade_medida,
                categoria,
                custo_unitario
              )
            `)
            .eq('receita_id', receita.id);

          if (insumosError) {
            console.warn(`⚠️ Erro ao buscar insumos da receita ${receita.receita_codigo}:`, insumosError);
          }

          // Processar insumos
          const insumos = (receitaInsumos || []).map((ri: any) => ({
            id: ri.insumos?.id || null,
            codigo: ri.insumos?.codigo || '',
            nome: ri.insumos?.nome || 'Insumo não encontrado',
            quantidade_necessaria: ri.quantidade_necessaria,
            unidade_medida: ri.unidade_medida || ri.insumos?.unidade_medida || 'g',
            categoria: ri.insumos?.categoria || '',
            is_chefe: ri.is_chefe || false,
            custo_unitario: ri.insumos?.custo_unitario || 0,
          }));

          return {
            ...receita,
            insumos,
          };
        } catch (error) {
          console.error(`❌ Erro ao processar receita ${receita.receita_codigo}:`, error);
          return {
            ...receita,
            insumos: [],
          };
        }
      })
    );

    console.log(`✅ ${receitasComInsumos.length} receitas processadas com sucesso`);

    return NextResponse.json({
      success: true,
      receitas: receitasComInsumos,
      total: receitasComInsumos.length,
    });
  } catch (error) {
    console.error('❌ Erro interno na API receitas/com-insumos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

