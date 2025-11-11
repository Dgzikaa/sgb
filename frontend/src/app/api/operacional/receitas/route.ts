import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Listar receitas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bar_id = searchParams.get('bar_id');
    const ativo = searchParams.get('ativo') !== 'false';
    const busca = searchParams.get('busca') || '';

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    let query = supabase
      .from('receitas')
      .select('*')
      .eq('ativo', ativo)
      .order('receita_nome', { ascending: true });

    if (bar_id) {
      query = query.eq('bar_id', parseInt(bar_id));
    }

    if (busca) {
      query = query.or(`receita_nome.ilike.%${busca}%,receita_codigo.ilike.%${busca}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar receitas:', error);
      return NextResponse.json({ success: false, error: 'Erro ao buscar receitas' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Cadastrar receita com insumos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      receita_codigo,
      receita_nome,
      receita_categoria = 'cozinha',
      tipo_local = 'cozinha',
      rendimento_esperado = 0,
      observacoes = '',
      insumos = [],
      bar_id = 3,
    } = body;

    console.log(`📦 Cadastrando receita: ${receita_codigo} - ${receita_nome}`);

    // Validações
    if (!receita_codigo || !receita_nome) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: receita_codigo, receita_nome' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    // Verificar se código já existe
    const { data: existente } = await supabase
      .from('receitas')
      .select('receita_codigo')
      .eq('receita_codigo', receita_codigo)
      .single();

    if (existente) {
      return NextResponse.json(
        { success: false, error: `Receita ${receita_codigo} já existe` },
        { status: 400 }
      );
    }

    // Inserir receita
    const { data: receitaData, error: receitaError } = await supabase
      .from('receitas')
      .insert([
        {
          bar_id: parseInt(bar_id),
          receita_codigo,
          receita_nome,
          receita_categoria,
          tipo_local,
          rendimento_esperado: parseFloat(rendimento_esperado) || 0,
          observacoes,
          ativo: true,
        },
      ])
      .select()
      .single();

    if (receitaError) {
      console.error('❌ Erro ao cadastrar receita:', receitaError);
      return NextResponse.json({ success: false, error: 'Erro ao cadastrar receita' }, { status: 500 });
    }

    // Inserir insumos da receita
    if (insumos.length > 0) {
      const insumosParaInserir = insumos.map((insumo: any) => ({
        receita_id: receitaData.id,
        insumo_id: insumo.insumo_id || null,
        receita_insumo_id: insumo.receita_insumo_id || null,
        quantidade_necessaria: parseFloat(insumo.quantidade),
        unidade_medida: insumo.unidade,
        is_chefe: insumo.eh_insumo_chefe || false,
      }));

      const { error: insumosError } = await supabase
        .from('receitas_insumos')
        .insert(insumosParaInserir);

      if (insumosError) {
        console.error('❌ Erro ao cadastrar insumos da receita:', insumosError);
        // Rollback: deletar receita
        await supabase.from('receitas').delete().eq('id', receitaData.id);
        return NextResponse.json(
          { success: false, error: 'Erro ao cadastrar insumos da receita' },
          { status: 500 }
        );
      }
    }

    console.log(`✅ Receita cadastrada: ${receita_codigo} com ${insumos.length} insumos`);

    return NextResponse.json({
      success: true,
      data: receitaData,
      message: 'Receita cadastrada com sucesso!',
    });
  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT - Atualizar receita
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      codigo,
      nome,
      tipo,
      rendimento_gramas,
      observacoes,
      ativo = true,
      bar_id,
    } = body;

    if (!id || !bar_id) {
      return NextResponse.json(
        { success: false, error: 'ID e bar_id são obrigatórios para atualização' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('receitas')
      .update({
        codigo,
        nome,
        tipo,
        rendimento_gramas: parseFloat(rendimento_gramas),
        observacoes,
        ativo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('bar_id', bar_id)
      .select();

    if (error) {
      console.error('❌ Erro ao atualizar receita:', error);
      return NextResponse.json({ success: false, error: 'Erro ao atualizar receita' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data[0],
      message: 'Receita atualizada com sucesso!',
    });
  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
