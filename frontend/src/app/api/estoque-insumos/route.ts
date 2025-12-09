import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Buscar dados de estoque
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataContagem = searchParams.get('data_contagem');
    const categoria = searchParams.get('categoria');
    const status = searchParams.get('status');
    const barIdParam = searchParams.get('bar_id');
    
    if (!barIdParam) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }
    const barId = parseInt(barIdParam);

    let query = supabase
      .from('estoque_insumos')
      .select('*')
      .eq('bar_id', barId)
      .order('data_contagem', { ascending: false })
      .order('categoria', { ascending: true });

    if (dataContagem) {
      query = query.eq('data_contagem', dataContagem);
    }
    if (categoria && categoria !== 'TODAS') {
      query = query.eq('categoria', categoria);
    }
    if (status && status !== 'TODOS') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar estoque:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar dados de estoque' },
        { status: 500 }
      );
    }

    // Agrupar por categoria
    const porCategoria = data?.reduce((acc: any, item: any) => {
      if (!acc[item.categoria]) {
        acc[item.categoria] = [];
      }
      acc[item.categoria].push(item);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: data || [],
      por_categoria: porCategoria || {},
      total_registros: data?.length || 0
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar/Atualizar registro de estoque
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bar_id, registros } = body;

    if (!bar_id || !registros || !Array.isArray(registros)) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    // Inserir/atualizar registros
    const { data, error } = await supabase
      .from('estoque_insumos')
      .upsert(registros, {
        onConflict: 'bar_id,data_contagem,categoria,produto'
      })
      .select();

    if (error) {
      console.error('Erro ao salvar estoque:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar dados de estoque', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: `${data?.length || 0} registros salvos com sucesso`
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar status de um registro
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, observacoes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID e status são obrigatórios' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (observacoes !== undefined) {
      updateData.observacoes = observacoes;
    }

    const { data, error } = await supabase
      .from('estoque_insumos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar status:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar status', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Status atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir registro
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('estoque_insumos')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('Erro ao excluir registro:', error);
      return NextResponse.json(
        { error: 'Erro ao excluir registro', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Registro excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

