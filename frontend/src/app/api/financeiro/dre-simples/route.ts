import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Buscar DRE consolidada (view_dre + dre_manual)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ano = parseInt(searchParams.get('ano') || '2025')
    const mes = parseInt(searchParams.get('mes') || '8')

    console.log(`🔍 [DRE-SIMPLES] Buscando DRE para ${mes}/${ano}`)

    // Usar função SQL para obter DRE consolidada
    const { data: dreConsolidada, error: dreError } = await supabase
      .rpc('get_dre_consolidada', { 
        p_ano: ano, 
        p_mes: mes 
      })

    if (dreError) {
      console.error('❌ [DRE-SIMPLES] Erro ao buscar DRE consolidada:', dreError)
      return NextResponse.json(
        { error: 'Erro ao buscar DRE consolidada', details: dreError.message },
        { status: 500 }
      )
    }

    // Buscar detalhes dos lançamentos manuais para o mês
    const { data: lancamentosManuais, error: manuaisError } = await supabase
      .from('dre_manual')
      .select('*')
      .gte('data_competencia', `${ano}-${mes.toString().padStart(2, '0')}-01`)
      .lt('data_competencia', `${mes === 12 ? ano + 1 : ano}-${mes === 12 ? '01' : (mes + 1).toString().padStart(2, '0')}-01`)
      .order('data_competencia', { ascending: false })

    if (manuaisError) {
      console.error('❌ [DRE-SIMPLES] Erro ao buscar lançamentos manuais:', manuaisError)
    }

    // Separar dados por atividade (igual ao Nibo)
    const operacionais = dreConsolidada?.filter(item => item.atividade === 'Operacional') || []
    const investimentos = dreConsolidada?.filter(item => item.atividade === 'Investimento') || []
    const financiamentos = dreConsolidada?.filter(item => item.atividade === 'Financiamento') || []

    // Calcular totais operacionais
    const receitas = operacionais.filter(item => item.categoria_dre === 'Receita')
    const custosOperacionais = operacionais.filter(item => item.categoria_dre !== 'Receita')

    const totalReceitas = receitas.reduce((sum, item) => sum + parseFloat(item.valor_total || '0'), 0)
    const totalCustosOperacionais = Math.abs(custosOperacionais.reduce((sum, item) => sum + parseFloat(item.valor_total || '0'), 0))
    
    // Calcular totais de investimento e financiamento
    const totalInvestimentos = Math.abs(investimentos.reduce((sum, item) => sum + parseFloat(item.valor_total || '0'), 0))
    const totalFinanciamentos = Math.abs(financiamentos.reduce((sum, item) => sum + parseFloat(item.valor_total || '0'), 0))

    const lucroOperacional = totalReceitas - totalCustosOperacionais
    
    // Resultado líquido considerando todas as atividades
    const resultadoLiquido = lucroOperacional - totalInvestimentos - totalFinanciamentos

    const resultado = {
      periodo: { ano, mes },
      resumo: {
        total_receitas: totalReceitas,
        total_custos_operacionais: totalCustosOperacionais,
        lucro_operacional: lucroOperacional,
        margem_operacional: totalReceitas > 0 ? (lucroOperacional / totalReceitas) * 100 : 0,
        total_investimentos: totalInvestimentos,
        total_financiamentos: totalFinanciamentos,
        resultado_liquido: resultadoLiquido
      },
      atividades: {
        operacional: {
          receitas: receitas,
          custos_despesas: custosOperacionais,
          total_receitas: totalReceitas,
          total_custos: totalCustosOperacionais,
          resultado: lucroOperacional
        },
        investimento: {
          categorias: investimentos,
          total: totalInvestimentos
        },
        financiamento: {
          categorias: financiamentos,
          total: totalFinanciamentos
        }
      },
      categorias: dreConsolidada || [], // Manter compatibilidade
      lancamentos_manuais: lancamentosManuais || [],
      total_registros: {
        automaticos: dreConsolidada?.filter(item => ['automatico', 'hibrido'].includes(item.origem)).length || 0,
        manuais: lancamentosManuais?.length || 0
      }
    }

    console.log(`✅ [DRE-SIMPLES] DRE consolidada retornada:`, {
      categorias: resultado.categorias.length,
      lancamentos_manuais: resultado.lancamentos_manuais.length,
      lucro_operacional: resultado.resumo.lucro_operacional
    })

    return NextResponse.json(resultado)

  } catch (error) {
    console.error('❌ [DRE-SIMPLES] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

// POST: Adicionar lançamento manual
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data_competencia, descricao, valor, categoria, categoria_macro, observacoes, usuario_criacao } = body

    console.log('📝 [DRE-SIMPLES] Adicionando lançamento manual:', { data_competencia, descricao, valor, categoria, categoria_macro })

    // Validações
    if (!data_competencia || !descricao || valor === undefined || !categoria || !categoria_macro) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: data_competencia, descricao, valor, categoria, categoria_macro' },
        { status: 400 }
      )
    }

    // Inserir lançamento manual
    const { data: novoLancamento, error: insertError } = await supabase
      .from('dre_manual')
      .insert({
        data_competencia,
        descricao,
        valor: parseFloat(valor),
        categoria,
        categoria_macro,
        observacoes: observacoes || null,
        usuario_criacao: usuario_criacao || 'sistema'
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ [DRE-SIMPLES] Erro ao inserir lançamento:', insertError)
      return NextResponse.json(
        { error: 'Erro ao inserir lançamento manual', details: insertError.message },
        { status: 500 }
      )
    }

    console.log('✅ [DRE-SIMPLES] Lançamento manual adicionado:', novoLancamento.id)

    return NextResponse.json({
      success: true,
      lancamento: novoLancamento,
      message: 'Lançamento manual adicionado com sucesso'
    })

  } catch (error) {
    console.error('❌ [DRE-SIMPLES] Erro ao processar POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

// DELETE: Remover lançamento manual
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do lançamento é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🗑️ [DRE-SIMPLES] Removendo lançamento manual:', id)

    const { error: deleteError } = await supabase
      .from('dre_manual')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('❌ [DRE-SIMPLES] Erro ao remover lançamento:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao remover lançamento manual', details: deleteError.message },
        { status: 500 }
      )
    }

    console.log('✅ [DRE-SIMPLES] Lançamento manual removido:', id)

    return NextResponse.json({
      success: true,
      message: 'Lançamento manual removido com sucesso'
    })

  } catch (error) {
    console.error('❌ [DRE-SIMPLES] Erro ao processar DELETE:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
