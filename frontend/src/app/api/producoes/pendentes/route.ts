import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bar_id, user_id } = body

    if (!bar_id || !user_id) {
      return NextResponse.json(
        { error: 'bar_id e user_id são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseClient()
    
    // Buscar produtos que precisam ser produzidos (estoque baixo)
    const { data: produtos, error: prodError } = await supabase
      .from('produtos')
      .select('id, nome, estoque_minimo, estoque_atual')
      .eq('bar_id', bar_id)
      .eq('ativo', true)
      .not('estoque_minimo', 'is', null)
      .not('estoque_atual', 'is', null)

    if (prodError) {
      console.error('Erro ao buscar produtos:', prodError)
      return NextResponse.json({ receitas_pendentes: 0 })
    }

    // Produtos com estoque baixo
    const produtosBaixoEstoque = produtos?.filter((p: any) => 
      p.estoque_atual <= p.estoque_minimo
    ) || []

    // Buscar produções em andamento (não finalizadas)
    const { data: producoes, error: prodErr } = await supabase
      .from('producoes')
      .select('id, produto_id, status, created_at')
      .eq('bar_id', bar_id)
      .in('status', ['iniciada', 'em_andamento'])
      .order('created_at', { ascending: false })

    if (prodErr) {
      console.error('Erro ao buscar produções:', prodErr)
    }

    const producoesEmAndamento = producoes?.length || 0

    return NextResponse.json({
      receitas_pendentes: produtosBaixoEstoque.length + producoesEmAndamento,
      detalhes: {
        produtos_baixo_estoque: produtosBaixoEstoque.length,
        producoes_em_andamento: producoesEmAndamento,
        produtos_criticos: produtosBaixoEstoque.map((p: any) => ({
          id: p.id,
          nome: p.nome,
          estoque_atual: p.estoque_atual,
          estoque_minimo: p.estoque_minimo,
          diferenca: p.estoque_minimo - p.estoque_atual
        }))
      }
    })

  } catch (error) {
    console.error('Erro ao buscar produções pendentes:', error)
    return NextResponse.json({ receitas_pendentes: 0 })
  }
} 