import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - Buscar produtos com receitas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = parseInt(searchParams.get('bar_id') || '3')
    
    console.log(`📦 Buscando produtos para bar_id: ${barId}`)

    const supabase = await getSupabaseClient()
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
      console.error('❌ Erro ao buscar produtos:', produtosError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar produtos: ' + produtosError.message
      }, { status: 500 })
    }

    console.log(`📦 ${produtos.length} produtos encontrados`)

    // Se não encontrou produtos para este bar_id, buscar de todos os bars
    let produtosFinal = produtos
    if (produtos.length === 0) {
      console.log('⚠️ Nenhum produto encontrado para este bar_id, buscando todos...')
      
      const { data: todosProdutos, error: todosError } = await supabase
        .from('produtos')
        .select('*')
        .order('nome')

      if (todosError) {
        console.error('❌ Erro ao buscar todos os produtos:', todosError)
        return NextResponse.json({
          success: false,
          error: 'Erro ao buscar produtos: ' + todosError.message
        }, { status: 500 })
      }

      produtosFinal = todosProdutos
      console.log(`📦 ${produtosFinal.length} produtos encontrados (todos os bars)`)
    }

    // 2. Para cada produto, buscar receitas com insumos
    const produtosComReceitas = await Promise.all(
      produtosFinal.map(async (produto: unknown) => {
        try {
          // Buscar receitas do produto com insumos usando relacionamento específico
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
            console.warn(`⚠️ Erro nas receitas do produto ${produto.codigo}:`, receitasError)
            return {
              ...produto,
              tipo_local: produto.tipo === 'bebida' ? 'bar' : 'cozinha',
              receitas: []
            }
          }

          // 3. Processar receitas com dados corretos do banco
          const receitasFormatadas = (receitasData || []).map((receita: unknown) => {
            return {
              id: receita.id,
              quantidade_necessaria: receita.quantidade_necessaria,
              insumo_chefe_id: receita.insumo_chefe_id,
              rendimento_esperado: receita.rendimento_esperado,
              insumos: {
                id: receita.insumos.id,
                codigo: receita.insumos.codigo,
                nome: receita.insumos.nome,
                unidade_medida: receita.insumos.unidade_medida
              }
            }
          })

          return {
            ...produto,
            tipo_local: produto.tipo === 'bebida' ? 'bar' : 'cozinha',
            receitas: receitasFormatadas
          }
        } catch (err) {
          console.warn(`⚠️ Erro na receita do produto ${produto.codigo}:`, err)
          return {
            ...produto,
            tipo_local: produto.tipo === 'bebida' ? 'bar' : 'cozinha',
            receitas: []
          }
        }
      })
    )

    const produtosComReceitasValidas = produtosComReceitas.filter(p => p.receitas && p.receitas.length > 0)

    console.log(`✅ ${produtosComReceitasValidas.length} produtos com receitas retornados`)

    return NextResponse.json({
      success: true,
      produtos: produtosComReceitasValidas,
      meta: {
        total_produtos: produtosFinal.length,
        produtos_com_receitas: produtosComReceitasValidas.length
      }
    })

  } catch (error) {
    console.error('❌ Erro interno:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + String(error)
    }, { status: 500 })
  }
} 
