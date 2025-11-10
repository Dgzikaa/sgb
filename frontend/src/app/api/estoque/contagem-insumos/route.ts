import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Listar contagens
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bar_id = parseInt(searchParams.get('bar_id') || '3');
    const data_contagem = searchParams.get('data_contagem');
    const tipo_local = searchParams.get('tipo_local');
    const insumo_id = searchParams.get('insumo_id');

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    let query = supabase
      .from('contagem_estoque_insumos')
      .select('*')
      .eq('bar_id', bar_id)
      .order('data_contagem', { ascending: false })
      .order('insumo_nome', { ascending: true });

    if (data_contagem) {
      query = query.eq('data_contagem', data_contagem);
    }

    if (tipo_local && tipo_local !== 'todos') {
      query = query.eq('tipo_local', tipo_local);
    }

    if (insumo_id) {
      query = query.eq('insumo_id', parseInt(insumo_id));
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar contagens:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar contagens' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar/atualizar contagem
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bar_id = 3,
      data_contagem,
      insumo_id,
      estoque_final,
      quantidade_pedido = 0,
      observacoes,
      usuario_contagem,
    } = body;

    console.log('📝 Registrando contagem:', {
      data_contagem,
      insumo_id,
      estoque_final,
    });

    // Validações
    if (!data_contagem || !insumo_id || estoque_final === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos obrigatórios: data_contagem, insumo_id, estoque_final',
        },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    // Buscar informações do insumo
    const { data: insumo, error: insumoError } = await supabase
      .from('insumos')
      .select('*')
      .eq('id', insumo_id)
      .single();

    if (insumoError || !insumo) {
      return NextResponse.json(
        { success: false, error: 'Insumo não encontrado' },
        { status: 404 }
      );
    }

    // Buscar estoque_final do dia anterior (será o estoque_inicial)
    const dataAnterior = new Date(data_contagem);
    dataAnterior.setDate(dataAnterior.getDate() - 1);
    const dataAnteriorStr = dataAnterior.toISOString().split('T')[0];

    const { data: contagemAnterior } = await supabase
      .from('contagem_estoque_insumos')
      .select('estoque_final')
      .eq('bar_id', bar_id)
      .eq('insumo_id', insumo_id)
      .eq('data_contagem', dataAnteriorStr)
      .single();

    const estoque_inicial = contagemAnterior?.estoque_final || null;

    // Verificar se já existe contagem para este insumo nesta data
    const { data: contagemExistente } = await supabase
      .from('contagem_estoque_insumos')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('data_contagem', data_contagem)
      .eq('insumo_id', insumo_id)
      .single();

    const payload = {
      bar_id,
      data_contagem,
      insumo_id,
      insumo_codigo: insumo.codigo,
      insumo_nome: insumo.nome,
      estoque_inicial,
      estoque_final: parseFloat(estoque_final),
      quantidade_pedido: parseFloat(quantidade_pedido) || 0,
      tipo_local: insumo.tipo_local,
      categoria: insumo.categoria,
      unidade_medida: insumo.unidade_medida,
      custo_unitario: parseFloat(insumo.custo_unitario) || 0,
      observacoes,
      usuario_contagem,
      updated_at: new Date().toISOString(),
    };

    let result;

    if (contagemExistente) {
      // Atualizar contagem existente
      const { data, error } = await supabase
        .from('contagem_estoque_insumos')
        .update(payload)
        .eq('id', contagemExistente.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar contagem:', error);
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar contagem' },
          { status: 500 }
        );
      }

      result = data;
      console.log('✅ Contagem atualizada:', contagemExistente.id);
    } else {
      // Criar nova contagem
      const { data, error } = await supabase
        .from('contagem_estoque_insumos')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar contagem:', error);
        return NextResponse.json(
          { success: false, error: 'Erro ao criar contagem' },
          { status: 500 }
        );
      }

      result = data;
      console.log('✅ Contagem criada:', result.id);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: contagemExistente
        ? 'Contagem atualizada com sucesso!'
        : 'Contagem registrada com sucesso!',
    });
  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar contagem específica
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      estoque_final,
      quantidade_pedido,
      observacoes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    const payload: any = {
      updated_at: new Date().toISOString(),
    };

    if (estoque_final !== undefined) {
      payload.estoque_final = parseFloat(estoque_final);
    }

    if (quantidade_pedido !== undefined) {
      payload.quantidade_pedido = parseFloat(quantidade_pedido);
    }

    if (observacoes !== undefined) {
      payload.observacoes = observacoes;
    }

    const { data, error } = await supabase
      .from('contagem_estoque_insumos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar contagem' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Contagem atualizada com sucesso!',
    });
  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover contagem
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from('contagem_estoque_insumos')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('❌ Erro ao deletar:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao deletar contagem' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contagem removida com sucesso!',
    });
  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

