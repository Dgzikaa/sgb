import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { SupabaseClient } from '@supabase/supabase-js';

// Tipos auxiliares
interface ReceitaItem {
  insumo_codigo: string;
  quantidade_receita: number;
}

interface Produto {
  codigo: string;
  nome: string;
  rendimento_percentual?: number;
  quantidade_base?: number;
  unidade_final?: string;
  observacoes?: string;
  ativo?: boolean;
  insumos?: InsumoReceita[];
  custo_total_receita?: number;
}

interface InsumoReceita {
  insumo_codigo: string;
  insumo_nome: string;
  quantidade_receita: number;
  custo_unitario: number;
  custo_total: number;
  unidade: string;
}

// Criar tabelas de produtos e receitas
const criarTabelas = async (supabase: SupabaseClient) => {
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
      
      -- Ã¡Ândices
      CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo);
      CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
      CREATE INDEX IF NOT EXISTS idx_receitas_produto ON receitas(produto_codigo);
      CREATE INDEX IF NOT EXISTS idx_receitas_insumo ON receitas(insumo_codigo);
    `
  })
  
  if (error) {
    console.error('ÂÅ’ Erro ao criar tabelas produtos/receitas:', error)
    throw error
  }
  
  console.log('Å“â€¦ Tabelas produtos/receitas criadas/verificadas')
}

// GET - Listar produtos com receitas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ativo = searchParams.get('ativo') !== 'false'
    const busca = searchParams.get('busca') || ''
    const comReceitas = searchParams.get('com_receitas') === 'true'

    const supabase: SupabaseClient = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    // Verificar/criar tabelas
    await criarTabelas(supabase)

    let query = supabase
      .from('produtos')
      .select('*')
      .eq('ativo', ativo)
      .order('nome', { ascending: true })

    if (busca) {
      query = query.or(`nome.ilike.%${busca}%,codigo.ilike.%${busca}%`)
    }

    const { data: produtos, error } = await query

    if (error) {
      console.error('ÂÅ’ Erro ao buscar produtos:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao buscar produtos' 
      }, { status: 500 })
    }

    // Se solicitado, incluir receitas de cada produto
    const produtosComReceitas: Produto[] = produtos || [];
    
    if (comReceitas && produtos && produtos.length > 0) {
      for (const produto of produtos as Produto[]) {
        // Buscar receitas do produto com dados dos insumos
        const { data: receitas } = await supabase
          .from('receitas')
          .select(`
            quantidade_receita,
            insumos (
              codigo,
              nome,
              custo_unitario,
              unidade,
              peso_volume_unidade
            )
          `)
          .eq('produto_codigo', produto.codigo);

        // Calcular custo total da receita
        let custoTotalReceita = 0;
        const insumosReceita: InsumoReceita[] = (receitas as Array<{ quantidade_receita: number; insumos: { codigo: string; nome: string; custo_unitario: number; unidade: string } }>)?.map((r: { quantidade_receita: number; insumos: { codigo: string; nome: string; custo_unitario: number; unidade: string } }) => {
          const custoInsumo = r.quantidade_receita * r.insumos.custo_unitario;
          custoTotalReceita += custoInsumo;
          return {
            insumo_codigo: r.insumos.codigo,
            insumo_nome: r.insumos.nome,
            quantidade_receita: r.quantidade_receita,
            custo_unitario: r.insumos.custo_unitario,
            custo_total: custoInsumo,
            unidade: r.insumos.unidade
          };
        }) || [];
        produto.insumos = insumosReceita;
        produto.custo_total_receita = custoTotalReceita;
      }
    }

    return NextResponse.json({
      success: true,
      data: produtosComReceitas,
      total: produtosComReceitas.length
    })

  } catch (error) {
    console.error('ÂÅ’ Erro interno:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
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
      receita = []
    }: { codigo: string; nome: string; rendimento_percentual?: number; quantidade_base?: number; unidade_final?: string; observacoes?: string; receita: ReceitaItem[] } = body;

    console.log(`Ã°Å¸ÂÂ½Ã¯Â¸Â Cadastrando produto:`, { codigo, nome, receita: receita.length })

    // ValidaÃ¡Â§Ã¡Âµes
    if (!codigo || !nome) {
      return NextResponse.json({
        success: false,
        error: 'Campos obrigatÃ¡Â³rios: codigo, nome'
      }, { status: 400 })
    }

    if (!Array.isArray(receita) || (receita ).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Receita deve ter pelo menos um insumo'
      }, { status: 400 })
    }

    const supabase: SupabaseClient = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    // Verificar/criar tabelas
    await criarTabelas(supabase)

    // Verificar se cÃ¡Â³digo jÃ¡Â¡ existe
    const { data: existente } = await supabase
      .from('produtos')
      .select('codigo')
      .eq('codigo', codigo)
      .single()

    if (existente) {
      return NextResponse.json({
        success: false,
        error: `CÃ¡Â³digo ${codigo} jÃ¡Â¡ existe`
      }, { status: 400 })
    }

    // Verificar se todos os insumos existem
    const insumoCodigos: string[] = receita.map((r: ReceitaItem) => r.insumo_codigo);
    const { data: insumosExistentes } = await supabase
      .from('insumos')
      .select('codigo')
      .in('codigo', insumoCodigos)
      .eq('ativo', true)

    const codigosExistentes: string[] = insumosExistentes?.map((i: { codigo: string }) => i.codigo) || [];
    const insumosInvalidos: string[] = insumoCodigos.filter((codigo: string) => !codigosExistentes.includes(codigo))

    if (insumosInvalidos.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Insumos nÃ¡Â£o encontrados: ${insumosInvalidos.join(', ')}`
      }, { status: 400 })
    }

    // Inserir produto
    const { data: produto, error: erroProduto } = await supabase
      .from('produtos')
      .insert([{
        codigo,
        nome,
        rendimento_percentual: parseFloat(String(rendimento_percentual)),
        quantidade_base: parseFloat(String(quantidade_base)),
        unidade_final,
        observacoes
      }])
      .select()

    if (erroProduto) {
      console.error('ÂÅ’ Erro ao cadastrar produto:', erroProduto)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao cadastrar produto' 
      }, { status: 500 })
    }

    // Inserir receitas
    const receitasParaInserir = receita.map((r: ReceitaItem) => ({
      produto_codigo: codigo,
      insumo_codigo: r.insumo_codigo,
      quantidade_receita: parseFloat(String(r.quantidade_receita))
    }));

    const { error: erroReceitas } = await supabase
      .from('receitas')
      .insert(receitasParaInserir)

    if (erroReceitas) {
      // Se falhou nas receitas, remover produto
      await supabase.from('produtos').delete().eq('codigo', codigo)
      
      console.error('ÂÅ’ Erro ao cadastrar receitas:', erroReceitas)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao cadastrar receitas do produto' 
      }, { status: 500 })
    }

    console.log(`Å“â€¦ Produto cadastrado: ${codigo} com ${receita.length} insumos`)

    return NextResponse.json({
      success: true,
      data: produto[0],
      message: 'Produto e receita cadastrados com sucesso!'
    })

  } catch (error) {
    console.error('ÂÅ’ Erro interno:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
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
      receita = []
    }: { codigo: string; nome?: string; rendimento_percentual?: number; quantidade_base?: number; unidade_final?: string; observacoes?: string; ativo?: boolean; receita: ReceitaItem[] } = body;

    if (!codigo) {
      return NextResponse.json({
        success: false,
        error: 'CÃ¡Â³digo Ã¡Â© obrigatÃ¡Â³rio para atualizaÃ¡Â§Ã¡Â£o'
      }, { status: 400 })
    }

    const supabase: SupabaseClient = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    // Atualizar produto
    const { data: produto, error: erroProduto } = await supabase
      .from('produtos')
      .update({
        nome,
        rendimento_percentual: parseFloat(String(rendimento_percentual)),
        quantidade_base: parseFloat(String(quantidade_base)),
        unidade_final,
        observacoes,
        ativo,
        updated_at: new Date().toISOString()
      })
      .eq('codigo', codigo)
      .select()

    if (erroProduto) {
      console.error('ÂÅ’ Erro ao atualizar produto:', erroProduto)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao atualizar produto' 
      }, { status: 500 })
    }

    // Se receita foi fornecida, atualizar
    if ((receita ).length > 0) {
      // Remover receitas antigas
      await supabase
        .from('receitas')
        .delete()
        .eq('produto_codigo', codigo)

      // Inserir novas receitas
      const receitasParaInserir = (receita ).map((r: ReceitaItem) => ({
        produto_codigo: codigo,
        insumo_codigo: r.insumo_codigo,
        quantidade_receita: parseFloat(String(r.quantidade_receita))
      }));

      const { error: erroReceitas } = await supabase
        .from('receitas')
        .insert(receitasParaInserir)

      if (erroReceitas) {
        console.error('ÂÅ’ Erro ao atualizar receitas:', erroReceitas)
        return NextResponse.json({ 
          success: false, 
          error: 'Erro ao atualizar receitas' 
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      data: produto[0],
      message: 'Produto atualizado com sucesso!'
    })

  } catch (error) {
    console.error('ÂÅ’ Erro interno:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 

