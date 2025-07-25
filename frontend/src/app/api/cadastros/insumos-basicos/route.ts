import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// Listar insumos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = parseInt(searchParams.get('bar_id') || '1');

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    const { data: insumos, error } = await supabase
      .from('insumos')
      .select('*')
      .eq('bar_id', barId)
      .eq('ativo', true)
      .order('codigo', { ascending: true });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar insumos: ' + error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      insumos: insumos || [],
    });
  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// Editar insumo existente
export async function PUT(request: NextRequest) {
  try {
    const { id, codigo, nome, categoria, unidade_medida, observacoes, bar_id } =
      await request.json();

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('insumos')
      .update({
        codigo,
        nome,
        categoria,
        unidade_medida,
        observacoes,
      })
      .eq('id', id)
      .eq('bar_id', bar_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao atualizar insumo: ' + error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Insumo atualizado com sucesso',
      data: data,
    });
  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor: ' + String(error),
      },
      { status: 500 }
    );
  }
}

// Cadastrar novo insumo
export async function POST(request: NextRequest) {
  try {
    const {
      codigo,
      nome,
      categoria,
      unidade_medida,
      observacoes,
      bar_id,
      ativo,
    } = await request.json();

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('insumos')
      .insert({
        codigo,
        nome,
        categoria,
        unidade_medida,
        observacoes,
        bar_id,
        ativo: ativo !== false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao criar insumo: ' + error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Insumo criado com sucesso',
      data: data,
    });
  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor: ' + String(error),
      },
      { status: 500 }
    );
  }
}
