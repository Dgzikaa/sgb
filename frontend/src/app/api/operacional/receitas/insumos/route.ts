import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

// NOTA: Tabela 'insumos' já foi criada via migration do Supabase
// Não é necessário criar via RPC

// GET - Listar insumos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo') !== 'false';
    const busca = searchParams.get('busca') || '';

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    let query = supabase
      .from('insumos')
      .select('*')
      .eq('ativo', ativo)
      .order('nome', { ascending: true });

    if (busca) {
      query = query.or(`nome.ilike.%${busca}%,codigo.ilike.%${busca}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar insumos:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar insumos',
        },
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
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// POST - Cadastrar insumo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      codigo,
      nome,
      categoria = 'cozinha',
      tipo_local = 'cozinha',
      custo_unitario = 0,
      unidade_medida = 'g',
      observacoes = '',
      bar_id = 3,
    } = body;

    console.log(`📦 Cadastrando insumo:`, {
      codigo,
      nome,
      categoria,
      tipo_local,
      unidade_medida,
    });

    // Validações
    if (!codigo || !nome) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos obrigatórios: codigo, nome',
        },
        { status: 400 }
      );
    }

    const unidadesValidas = ['g', 'kg', 'ml', 'l', 'unid', 'pct'];
    if (!unidadesValidas.includes(unidade_medida)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unidade deve ser uma das: ${unidadesValidas.join(', ')}`,
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

    // Verificar se código já existe
    const { data: existente } = await supabase
      .from('insumos')
      .select('codigo')
      .eq('codigo', codigo)
      .single();

    if (existente) {
      return NextResponse.json(
        {
          success: false,
          error: `Código ${codigo} já existe`,
        },
        { status: 400 }
      );
    }

    // Inserir insumo
    const { data, error } = await supabase
      .from('insumos')
      .insert([
        {
          codigo,
          nome,
          categoria,
          tipo_local,
          unidade_medida,
          custo_unitario: parseFloat(custo_unitario) || 0,
          observacoes,
          bar_id: parseInt(bar_id),
          ativo: true,
        },
      ])
      .select();

    if (error) {
      console.error('❌ Erro ao cadastrar insumo:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao cadastrar insumo',
        },
        { status: 500 }
      );
    }

    console.log(`✅ Insumo cadastrado: ${codigo}`);

    return NextResponse.json({
      success: true,
      data: data[0],
      message: 'Insumo cadastrado com sucesso!',
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

// PUT - Atualizar insumo
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      codigo,
      nome,
      categoria,
      tipo_local,
      custo_unitario = 0,
      unidade_medida,
      observacoes,
      ativo = true,
      bar_id,
    } = body;

    if (!id || !bar_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID e bar_id são obrigatórios para atualização',
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

    const { data, error } = await supabase
      .from('insumos')
      .update({
        codigo,
        nome,
        categoria,
        tipo_local,
        unidade_medida,
        custo_unitario: parseFloat(custo_unitario) || 0,
        observacoes,
        ativo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('bar_id', bar_id)
      .select();

    if (error) {
      console.error('❌ Erro ao atualizar insumo:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao atualizar insumo',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data[0],
      message: 'Insumo atualizado com sucesso!',
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
