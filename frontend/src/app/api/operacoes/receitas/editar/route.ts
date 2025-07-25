import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function PUT(request: NextRequest) {
  try {
    const {
      receita_codigo,
      receita_nome,
      receita_categoria,
      tipo_local,
      rendimento_esperado,
      insumos,
      ativo,
      bar_id,
    } = await request.json();

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    // Validações básicas
    if (!receita_codigo?.trim() || !receita_nome?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Código e nome da receita são obrigatórios',
        },
        { status: 400 }
      );
    }

    if (!insumos || insumos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pelo menos um insumo é obrigatório',
        },
        { status: 400 }
      );
    }

    const temChefe = insumos.some((i: unknown) => i.is_chefe);
    if (!temChefe) {
      return NextResponse.json(
        {
          success: false,
          error: 'Um insumo chefe deve ser selecionado',
        },
        { status: 400 }
      );
    }

    // Remover todas as receitas antigas com o mesmo código
    const { error: deleteError } = await supabase
      .from('receitas')
      .delete()
      .eq('receita_codigo', receita_codigo)
      .eq('bar_id', bar_id);

    if (deleteError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao remover receitas antigas: ' + deleteError.message,
        },
        { status: 500 }
      );
    }

    // Inserir novas receitas com os insumos atualizados
    const insumoChefe = insumos.find((i: unknown) => i.is_chefe);
    console.log('🔄 Insumo chefe encontrado:', insumoChefe);
    console.log('🔄 Dados recebidos:', {
      receita_codigo,
      tipo_local,
      bar_id,
      insumos,
    });

    const receitasData = insumos.map((insumo: unknown) => ({
      bar_id: bar_id,
      receita_codigo: receita_codigo.trim(),
      receita_nome: receita_nome.trim(),
      receita_categoria: receita_categoria?.trim() || '',
      tipo_local: tipo_local || 'cozinha',
      insumo_id: insumo.id,
      quantidade_necessaria: insumo.quantidade_necessaria || 0,
      insumo_chefe_id: insumoChefe?.id,
      rendimento_esperado: insumo.is_chefe ? rendimento_esperado : 0,
      ativo: ativo !== undefined ? ativo : true,
      updated_at: new Date().toISOString(),
    }));

    console.log('📦 Dados que serão inseridos:', receitasData);

    const { data: novasReceitas, error: receitasError } = await supabase
      .from('receitas')
      .insert(receitasData)
      .select();

    if (receitasError) {
      console.error('❌ Erro ao inserir receitas:', receitasError);
      console.error('❌ Dados que causaram erro:', receitasData);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao atualizar receitas: ' + receitasError.message,
          details: receitasError,
        },
        { status: 500 }
      );
    }

    console.log('✅ Receita atualizada com sucesso:', receita_codigo);

    return NextResponse.json({
      success: true,
      message: 'Receita atualizada com sucesso',
      data: {
        receita_codigo,
        receita_nome,
        insumos_count: novasReceitas?.length || 0,
      },
    });
  } catch (error) {
    console.error('❌ Erro interno:', error);
    console.error(
      '❌ Stack trace:',
      error instanceof Error ? error.stack : 'Sem stack trace'
    );
    return NextResponse.json(
      {
        success: false,
        error:
          'Erro interno do servidor: ' +
          (error instanceof Error ? error.message : String(error)),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
