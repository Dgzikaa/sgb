import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

// Criar tabela de insumos
const criarTabelaInsumos = async (supabase: any) => {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS insumos (
        id BIGSERIAL PRIMARY KEY,
        bar_id INTEGER NOT NULL DEFAULT 3,
        codigo VARCHAR(20) UNIQUE NOT NULL,
        nome VARCHAR(255) NOT NULL,
        categoria VARCHAR(50) DEFAULT 'cozinha',
        tipo_local VARCHAR(20) DEFAULT 'cozinha' CHECK (tipo_local IN ('cozinha', 'bar')),
        unidade_medida VARCHAR(10) NOT NULL DEFAULT 'g' CHECK (unidade_medida IN ('g', 'kg', 'ml', 'l', 'unid', 'pct')),
        custo_unitario DECIMAL(10,4) DEFAULT 0,
        observacoes TEXT,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Adicionar colunas que podem estar faltando
      ALTER TABLE insumos ADD COLUMN IF NOT EXISTS bar_id INTEGER DEFAULT 3;
      ALTER TABLE insumos ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT 'cozinha';
      ALTER TABLE insumos ADD COLUMN IF NOT EXISTS tipo_local VARCHAR(20) DEFAULT 'cozinha';
      ALTER TABLE insumos ADD COLUMN IF NOT EXISTS unidade_medida VARCHAR(10) DEFAULT 'g';
      
      -- Adicionar constraint se não existir
      DO $$ 
      BEGIN
        ALTER TABLE insumos ADD CONSTRAINT insumos_tipo_local_check 
        CHECK (tipo_local IN ('cozinha', 'bar'));
      EXCEPTION 
        WHEN duplicate_object THEN NULL;
      END $$;
      
      -- Corrigir dados existentes que podem ter valores NULL ou vazios
      UPDATE insumos SET bar_id = 3 WHERE bar_id IS NULL;
      UPDATE insumos SET categoria = 'cozinha' WHERE categoria IS NULL OR categoria = '';
      UPDATE insumos SET tipo_local = 'cozinha' WHERE tipo_local IS NULL OR tipo_local = '';
      UPDATE insumos SET unidade_medida = 'g' WHERE unidade_medida IS NULL OR unidade_medida = '';
      UPDATE insumos SET custo_unitario = 0 WHERE custo_unitario IS NULL;
      
      CREATE INDEX IF NOT EXISTS idx_insumos_codigo ON insumos(codigo);
      CREATE INDEX IF NOT EXISTS idx_insumos_ativo ON insumos(ativo);
      CREATE INDEX IF NOT EXISTS idx_insumos_tipo_local ON insumos(tipo_local);
      CREATE INDEX IF NOT EXISTS idx_insumos_bar_id ON insumos(bar_id);
    `,
  });

  if (error) {
    console.error('❌ Erro ao criar tabela insumos:', error);
    throw error;
  }

  console.log('✅ Tabela insumos criada/verificada');
};

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

    // Verificar/criar tabela
    await criarTabelaInsumos(supabase);

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

    // Verificar/criar tabela
    await criarTabelaInsumos(supabase);

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
