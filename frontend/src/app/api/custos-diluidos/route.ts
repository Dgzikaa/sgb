import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Buscar custos diluídos de um mês/ano
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = parseInt(searchParams.get('mes') || (new Date().getMonth() + 1).toString());
    const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString());
    const barIdParam = searchParams.get('bar_id');
    
    if (!barIdParam) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }
    const barId = parseInt(barIdParam);

    console.log(`📊 Buscando custos diluídos para ${mes}/${ano} - Bar ${barId}`);

    const { data, error } = await supabase
      .from('custos_mensais_diluidos')
      .select('*')
      .eq('bar_id', barId)
      .eq('mes', mes)
      .eq('ano', ano)
      .eq('ativo', true)
      .order('descricao');

    if (error) {
      console.error('Erro ao buscar custos diluídos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar custos diluídos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      meta: {
        mes,
        ano,
        total_custos: data?.length || 0,
        valor_total: data?.reduce((sum, c) => sum + parseFloat(c.valor_total.toString()), 0) || 0
      }
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo custo diluído
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bar_id,
      mes,
      ano,
      descricao,
      valor_total,
      parcela_atual,
      total_parcelas,
      tipo_diluicao,
      observacoes
    } = body;

    // Validações
    if (!bar_id || !mes || !ano || !descricao || !valor_total || !tipo_diluicao) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    if (!['dias_uteis', 'dias_evento', 'semanas', 'mensal'].includes(tipo_diluicao)) {
      return NextResponse.json(
        { error: 'Tipo de diluição inválido' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('custos_mensais_diluidos')
      .insert({
        bar_id,
        mes,
        ano,
        descricao,
        valor_total,
        parcela_atual,
        total_parcelas,
        tipo_diluicao,
        observacoes,
        ativo: true
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar custo diluído:', error);
      return NextResponse.json(
        { error: 'Erro ao criar custo diluído', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Custo diluído criado com sucesso'
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar custo diluído
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('custos_mensais_diluidos')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar custo diluído:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar custo diluído' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Custo diluído atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Desativar custo diluído (soft delete)
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
      .from('custos_mensais_diluidos')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Erro ao desativar custo diluído:', error);
      return NextResponse.json(
        { error: 'Erro ao desativar custo diluído' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Custo diluído desativado com sucesso'
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}


