import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Buscar TODAS as receitas (ativas e inativas) para dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = parseInt(searchParams.get('bar_id') || '3');

    console.log(
      `🍽️ Buscando TODAS as receitas para dashboard - bar_id: ${barId}`
    );

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao conectar com banco',
        },
        { status: 500 }
      );
    }

    // Buscar TODAS as receitas (ativas e inativas) com insumos
    const { data: todasReceitas, error: receitasError } = await supabase
      .from('receitas')
      .select(
        `
        receita_codigo,
        receita_nome,
        receita_categoria,
        tipo_local,
        insumo_chefe_id,
        rendimento_esperado,
        insumo_id,
        quantidade_necessaria,
        ativo,
        insumos!receitas_insumo_id_fkey(
          id,
          codigo,
          nome,
          unidade_medida,
          categoria
        )
      `
      )
      .eq('bar_id', barId)
      .order('receita_codigo');

    if (receitasError) {
      console.error('❌ Erro ao buscar receitas:', receitasError);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar receitas: ' + receitasError.message,
        },
        { status: 500 }
      );
    }

    console.log(
      `🍽️ ${todasReceitas?.length || 0} registros de receitas encontrados (incluindo inativas)`
    );

    // Agrupar receitas por código
    const receitasAgrupadas = new Map<string, any>();

    for (const receita of todasReceitas || []) {
      const codigo = receita.receita_codigo;

      if (codigo && !receitasAgrupadas.has(codigo)) {
        receitasAgrupadas.set(codigo, {
          receita_codigo: codigo,
          receita_nome: receita.receita_nome,
          receita_categoria: receita.receita_categoria,
          rendimento_esperado: 0, // Será preenchido quando encontrar o insumo chefe
          insumo_chefe_id: receita.insumo_chefe_id,
          tipo_local: receita.receita_categoria?.includes('DRINKS')
            ? 'bar'
            : 'cozinha',
          ativo: receita.ativo, // IMPORTANTE: Incluir status ativo/inativo
          insumos: [],
        });
      }

      // Adicionar insumo à receita
      if (receita.insumos && Array.isArray(receita.insumos) && receita.insumos[0]) {
        const receitaObj = codigo ? receitasAgrupadas.get(codigo) : null;
        const insumo = receita.insumos[0];
        const isChefe = receita.insumo_chefe_id === insumo.id;

        // Se este é o insumo chefe, aplicar o rendimento esperado à receita
        if (isChefe && receita.rendimento_esperado) {
          receitaObj.rendimento_esperado = receita.rendimento_esperado;
        }

        receitaObj.insumos.push({
          id: insumo.id,
          codigo: insumo.codigo,
          nome: insumo.nome,
          quantidade_necessaria: receita.quantidade_necessaria,
          unidade_medida: insumo.unidade_medida,
          categoria: insumo.categoria,
          is_chefe: isChefe,
        });
      }
    }

    const receitasComInsumos = Array.from(receitasAgrupadas.values());

    // Estatísticas
    const receitasAtivas = receitasComInsumos.filter(r => r.ativo !== false);
    const receitasInativas = receitasComInsumos.filter(r => r.ativo === false);

    console.log(
      `✅ ${receitasComInsumos.length} receitas processadas: ${receitasAtivas.length} ativas, ${receitasInativas.length} inativas`
    );

    return NextResponse.json({
      success: true,
      receitas: receitasComInsumos,
      estatisticas: {
        total_receitas: receitasComInsumos.length,
        receitas_ativas: receitasAtivas.length,
        receitas_inativas: receitasInativas.length,
        receitas_bar: receitasComInsumos.filter(r => r.tipo_local === 'bar')
          .length,
        receitas_cozinha: receitasComInsumos.filter(
          r => r.tipo_local === 'cozinha'
        ).length,
      },
    });
  } catch (error) {
    console.error('❌ Erro interno na API receitas/todas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
