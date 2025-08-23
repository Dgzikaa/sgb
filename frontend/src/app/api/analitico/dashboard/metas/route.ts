import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

// GET - Buscar metas de um bar do banco de dados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bar_id = searchParams.get('bar_id');

    if (!bar_id) {
      return NextResponse.json(
        { success: false, error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    // Buscar metas do bar no banco
    const { data: bar, error } = await supabase
      .from('bars')
      .select('metas')
      .eq('id', parseInt(bar_id))
      .single();

    if (error) {
      console.error('❌ Erro ao buscar metas:', error);

      // Se não encontrou o bar, retornar estrutura vazia
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: null,
          message: 'Nenhuma meta encontrada para este bar',
        });
      }

      return NextResponse.json(
        { success: false, error: 'Erro ao buscar metas do banco' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bar?.metas || [],
      message: 'Metas carregadas com sucesso',
    });
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Salvar/atualizar metas de um bar no banco de dados
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.bar_id) {
      return NextResponse.json(
        { success: false, error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    // Buscar metas existentes
    const { data: bar, error: fetchError } = await supabase
      .from('bars')
      .select('metas')
      .eq('id', body.bar_id)
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar metas existentes:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar metas existentes' },
        { status: 500 }
      );
    }

    const metasExistentes = bar?.metas || [];
    const novasMetas = body.metas || [];

    // Atualizar a coluna metas
    const { error: updateError } = await supabase
      .from('bars')
      .update({
        metas: novasMetas,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', body.bar_id);

    if (updateError) {
      console.error('❌ Erro ao salvar metas:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar metas no banco' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: novasMetas,
      message: 'Metas salvas com sucesso',
    });
  } catch (error) {
    console.error('Erro ao salvar metas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
