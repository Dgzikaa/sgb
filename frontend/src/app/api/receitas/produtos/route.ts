import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { SupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'

// Tipos auxiliares
interface Insumo {
  id: number;
  codigo: string;
  nome: string;
  unidade_medida: string;
  categoria: string;
}

interface Receita {
  id: number;
  quantidade_necessaria: number;
  insumo_chefe_id: number;
  rendimento_esperado: number;
  insumos: Insumo;
}

interface Produto {
  id: number;
  codigo: string;
  nome: string;
  tipo: string;
  tipo_local?: string;
  receitas?: Receita[];
}

// GET - Buscar produtos com receitas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = parseInt(searchParams.get('bar_id') || '3')
    
    console.log(`Ã°Å¸â€œÂ¦ Buscando produtos para bar_id: ${barId}`)

    const supabase: SupabaseClient = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com banco' 
      }, { status: 500 })
    }

    // 1. Buscar produtos
    const { data: produtos, error: produtosError } = await supabase
      .from('produtos')
      .select('*')
      .eq('bar_id', barId)
      .order('nome')

    if (produtosError) {
      console.error('ÂÅ’ Erro ao buscar produtos:', produtosError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar produtos: ' + produtosError.message
      }, { status: 500 })
    }

    console.log(`Ã°Å¸â€œÂ¦ ${produtos.length} produtos encontrados`)

    // Se nÃ¡Â£o encontrou produtos para este bar_id, buscar de todos os bars
    let produtosFinal: Produto[] = produtos as Produto[]
    if (produtos.length === 0) {
      console.log('Å¡Â Ã¯Â¸Â Nenhum produto encontrado para este bar_id, buscando todos...')
      
      const { data: todosProdutos, error: todosError } = await supabase
        .from('produtos')
        .select('*')
        .order('nome')

      if (todosError) {
        console.error('ÂÅ’ Erro ao buscar todos os produtos:', todosError)
        return NextResponse.json({
          success: false,
          error: 'Erro ao buscar produtos: ' + todosError.message
        }, { status: 500 })
      }

      produtosFinal = todosProdutos as Produto[]
      console.log(`Ã°Å¸â€œÂ¦ ${produtosFinal.length} produtos encontrados (todos os bars)`)
    }

    // 2. Para cada produto, buscar receitas com insumos
    const produtosComReceitas: Produto[] = await Promise.all(
      (produtosFinal ).map(async (produto: Produto) => {
        try {
          // Buscar receitas do produto com insumos usando relacionamento especÃ¡Â­fico
          const { data: receitasData, error: receitasError } = await supabase
            .from('receitas')
            .select(`
              id,
              quantidade_necessaria,
              insumo_chefe_id,
              rendimento_esperado,
              insumos!receitas_insumo_id_fkey (
                id,
                codigo,
                nome,
                unidade_medida,
                categoria
              )
            `)
            .eq('produto_id', produto.id)

          if (receitasError) {
            console.warn(`Å¡Â Ã¯Â¸Â Erro nas receitas do produto ${produto.codigo}:`, receitasError)
            return {
              ...produto,
              tipo_local: produto.tipo === 'bebida' ? 'bar' : 'cozinha',
              receitas: []
            }
          }

          // 3. Processar receitas com dados corretos do banco
          const receitasFormatadas: Receita[] = (receitasData || []).map((receita: any) => {
            return {
              id: receita.id,
              quantidade_necessaria: receita.quantidade_necessaria,
              insumo_chefe_id: receita.insumo_chefe_id,
              rendimento_esperado: receita.rendimento_esperado,
              insumos: {
                id: receita.insumos.id,
                codigo: receita.insumos.codigo,
                nome: receita.insumos.nome,
                unidade_medida: receita.insumos.unidade_medida,
                categoria: receita.insumos.categoria
              }
            } as Receita;
          })

          return {
            ...produto,
            tipo_local: produto.tipo === 'bebida' ? 'bar' : 'cozinha',
            receitas: receitasFormatadas
          }
        } catch (err) {
          console.warn(`Å¡Â Ã¯Â¸Â Erro na receita do produto ${produto.codigo}:`, err)
          return {
            ...produto,
            tipo_local: produto.tipo === 'bebida' ? 'bar' : 'cozinha',
            receitas: []
          }
        }
      })
    )

    const produtosComReceitasValidas: Produto[] = produtosComReceitas.filter((p: Produto) => p.receitas && p.receitas.length > 0)

    console.log(`Å“â€¦ ${produtosComReceitasValidas.length} produtos com receitas retornados`)

    return NextResponse.json({
      success: true,
      produtos: produtosComReceitasValidas,
      meta: {
        total_produtos: produtosFinal.length,
        produtos_com_receitas: produtosComReceitasValidas.length
      }
    })

  } catch (error) {
    console.error('ÂÅ’ Erro interno:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + String(error)
    }, { status: 500 })
  }
} 

