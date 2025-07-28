import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// Interfaces para tipagem
interface Produto {
  id: number;
  codigo: string;
  nome: string;
  rendimento_percentual: number;
  quantidade_base: number;
  unidade_final: string;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface Receita {
  id: number;
  produto_codigo: string;
  insumo_codigo: string;
  quantidade_receita: number;
  created_at: string;
  insumos?: {
    id: number;
    codigo: string;
    nome: string;
    unidade_medida: string;
    categoria: string;
    custo_unitario: number;
  };
}

interface Insumo {
  id: number;
  codigo: string;
  nome: string;
  unidade_medida: string;
  categoria: string;
  custo_unitario: number;
}

// Criar tabelas de produtos e receitas
const criarTabelas = async (supabase: any) => {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Tabela de produtos
      CREATE TABLE IF NOT EXISTS produtos (
        id BIGSERIAL PRIMARY KEY,
        codigo VARCHAR(20) UNIQUE NOT NULL,
        nome VARCHAR(255) NOT NULL,
        rendimento_percentual DECIMAL(5,2) DEFAULT 100,
        quantidade_base DECIMAL(10,3) DEFAULT 1,
        unidade_final VARCHAR(10) DEFAULT 'unid',
        observacoes TEXT,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Tabela de receitas (produtos x insumos)
      CREATE TABLE IF NOT EXISTS receitas (
        id BIGSERIAL PRIMARY KEY,
        produto_codigo VARCHAR(20) NOT NULL,
        insumo_codigo VARCHAR(20) NOT NULL,
        quantidade_receita DECIMAL(10,3) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (produto_codigo) REFERENCES produtos(codigo) ON DELETE CASCADE,
        FOREIGN KEY (insumo_codigo) REFERENCES insumos(codigo) ON DELETE CASCADE,
        UNIQUE(produto_codigo, insumo_codigo)
      );
      
      -- Índices
      CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo);
      CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
      CREATE INDEX IF NOT EXISTS idx_receitas_produto ON receitas(produto_codigo);
      CREATE INDEX IF NOT EXISTS idx_receitas_insumo ON receitas(insumo_codigo);
    `,
  });

  if (error) {
    console.error('❌ Erro ao criar tabelas produtos/receitas:', error);
    throw error;
  }

  console.log('✅ Tabelas produtos/receitas criadas/verificadas');
};

// GET - Listar produtos com receitas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo') !== 'false';
    const busca = searchParams.get('busca') || '';
    const comReceitas = searchParams.get('com_receitas') === 'true';

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    // Verificar/criar tabelas
    await criarTabelas(supabase);

    let query = supabase
      .from('produtos')
      .select('*')
      .eq('ativo', ativo)
      .order('nome', { ascending: true });

    if (busca) {
      query = query.or(`nome.ilike.%${busca}%,codigo.ilike.%${busca}%`);
    }

    const { data: produtos, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar produtos',
        },
        { status: 500 }
      );
    }

    // Se solicitado, incluir receitas de cada produto
    const produtosComReceitas = produtos || [];

    if (comReceitas && produtos && produtos.length > 0) {
      for (const produto of produtos as Produto[]) {
        // Buscar receitas do produto com dados dos insumos
        const { data: receitas } = await supabase
          .from('receitas')
          .select(
            `
            *,
            insumos!receitas_insumo_codigo_fkey (
              id,
              codigo,
              nome,
              unidade_medida,
              categoria,
              custo_unitario
            )
          `
          )
          .eq('produto_codigo', produto.codigo);

        // Calcular custo total da receita
        const custoTotal = (receitas || []).reduce(
          (total: number, receita: Receita) =>
            total + (receita.quantidade_receita * (receita.insumos?.custo_unitario || 0)),
          0
        );

        // Adicionar receitas e custo ao produto
        (produto as any).receitas = receitas || [];
        (produto as any).custo_total_receita = custoTotal;
      }
    }

    return NextResponse.json({
      success: true,
      produtos: produtosComReceitas,
      meta: {
        total: produtosComReceitas.length,
        com_receitas: comReceitas,
      },
    });
  } catch (error) {
    console.error('❌ Erro na API produtos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// POST - Cadastrar produto com receita
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      codigo,
      nome,
      rendimento_percentual = 100,
      quantidade_base = 1,
      unidade_final = 'unid',
      observacoes = '',
      receita = [], // Array de {insumo_codigo, quantidade_receita}
    } = body;

    console.log(`🍽️ Cadastrando produto:`, {
      codigo,
      nome,
      receita: receita.length,
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

    if (!Array.isArray(receita) || receita.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Receita deve ter pelo menos um insumo',
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

    // Verificar/criar tabelas
    await criarTabelas(supabase);

    // Verificar se código já existe
    const { data: existente } = await supabase
      .from('produtos')
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

    // Verificar se todos os insumos existem
    const insumoCodigos = receita.map((r: any) => r.insumo_codigo);
    const { data: insumosExistentes } = await supabase
      .from('insumos')
      .select('codigo')
      .in('codigo', insumoCodigos)
      .eq('ativo', true);

    const codigosExistentes =
      insumosExistentes?.map((i: any) => i.codigo) || [];
    const insumosInvalidos = insumoCodigos.filter(
      (codigo: string) => !codigosExistentes.includes(codigo)
    );

    if (insumosInvalidos.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Insumos não encontrados: ${insumosInvalidos.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Inserir produto
    const { data: produto, error: erroProduto } = await supabase
      .from('produtos')
      .insert([
        {
          codigo,
          nome,
          rendimento_percentual: parseFloat(rendimento_percentual),
          quantidade_base: parseFloat(quantidade_base),
          unidade_final,
          observacoes,
        },
      ])
      .select();

    if (erroProduto) {
      console.error('❌ Erro ao cadastrar produto:', erroProduto);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao cadastrar produto',
        },
        { status: 500 }
      );
    }

    // Inserir receitas
    const receitasParaInserir = receita.map((r: any) => ({
      produto_codigo: codigo,
      insumo_codigo: r.insumo_codigo,
      quantidade_receita: parseFloat(r.quantidade_receita),
    }));

    const { error: erroReceitas } = await supabase
      .from('receitas')
      .insert(receitasParaInserir);

    if (erroReceitas) {
      // Se falhou nas receitas, remover produto
      await supabase.from('produtos').delete().eq('codigo', codigo);

      console.error('❌ Erro ao cadastrar receitas:', erroReceitas);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao cadastrar receitas do produto',
        },
        { status: 500 }
      );
    }

    console.log(
      `✅ Produto cadastrado: ${codigo} com ${receita.length} insumos`
    );

    return NextResponse.json({
      success: true,
      data: produto[0],
      message: 'Produto e receita cadastrados com sucesso!',
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

// PUT - Atualizar produto e receita
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      codigo,
      nome,
      rendimento_percentual,
      quantidade_base,
      unidade_final,
      observacoes,
      ativo,
      receita = [],
    } = body;

    if (!codigo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Código é obrigatório para atualização',
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

    // Atualizar produto
    const { data: produto, error: erroProduto } = await supabase
      .from('produtos')
      .update({
        nome,
        rendimento_percentual: parseFloat(rendimento_percentual),
        quantidade_base: parseFloat(quantidade_base),
        unidade_final,
        observacoes,
        ativo,
        updated_at: new Date().toISOString(),
      })
      .eq('codigo', codigo)
      .select();

    if (erroProduto) {
      console.error('❌ Erro ao atualizar produto:', erroProduto);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao atualizar produto',
        },
        { status: 500 }
      );
    }

    // Se receita foi fornecida, atualizar
    if (receita.length > 0) {
      // Remover receitas antigas
      await supabase.from('receitas').delete().eq('produto_codigo', codigo);

      // Inserir novas receitas
      const receitasParaInserir = receita.map((r: any) => ({
        produto_codigo: codigo,
        insumo_codigo: r.insumo_codigo,
        quantidade_receita: parseFloat(r.quantidade_receita),
      }));

      const { error: erroReceitas } = await supabase
        .from('receitas')
        .insert(receitasParaInserir);

      if (erroReceitas) {
        console.error('❌ Erro ao atualizar receitas:', erroReceitas);
        return NextResponse.json(
          {
            success: false,
            error: 'Erro ao atualizar receitas do produto',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: produto[0],
      message: 'Produto atualizado com sucesso!',
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
