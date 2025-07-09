import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('bar_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    
    if (!barId) {
      return NextResponse.json({ 
        success: false,
        error: 'bar_id é obrigatório',
        lancamentos: [],
        resumo: null
      }, { status: 400 })
    }

    console.log(`📊 [V1] Buscando dados para bar_id: ${barId}`)

    // Buscar dados da tabela contaazul
    const { data: lancamentos, error: queryError } = await supabase
      .from('contaazul')
      .select('*')
      .eq('bar_id', barId)
      .order('data_competencia', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (queryError) {
      console.error('❌ [V1] Erro na consulta:', queryError)
      return NextResponse.json({ 
        success: false,
        error: 'Erro ao buscar dados',
        lancamentos: [],
        resumo: null
      })
    }

    console.log(`✅ [V1] Dados encontrados: ${lancamentos?.length || 0} registros`)

    // Processar dados
    const lancamentosProcessados = (lancamentos || []).map((item: any) => ({
      id: item.id,
      descricao: item.descricao || 'Sem descrição',
      valor: parseFloat(item.valor) || 0,
      categoria: item.categoria || 'Não categorizado',
      centro_custo: item.centro_custo || null,
      data_competencia: item.data_competencia,
      data_vencimento: item.data_vencimento,
      tipo: item.tipo || (parseFloat(item.valor) > 0 ? 'receita' : 'despesa'),
      cliente_fornecedor: item.cliente_fornecedor || 'N/A',
      documento: item.documento || 'N/A',
      forma_pagamento: item.forma_pagamento || null,
      status: item.status || 'sincronizado',
      observacoes: item.observacoes || null,
      sincronizado_em: item.sincronizado_em
    }))

    // Calcular resumo
    let totalReceitas = 0
    let totalDespesas = 0
    let quantidadeReceitas = 0
    let quantidadeDespesas = 0

    lancamentosProcessados.forEach((item: any) => {
      const valor = item.valor
      if (valor > 0) {
        totalReceitas += valor
        quantidadeReceitas++
      } else {
        totalDespesas += Math.abs(valor)
        quantidadeDespesas++
      }
    })

    const resumo = {
      total_lancamentos: lancamentosProcessados.length,
      total_receitas: totalReceitas,
      total_despesas: totalDespesas,
      saldo: totalReceitas - totalDespesas,
      quantidade_receitas: quantidadeReceitas,
      quantidade_despesas: quantidadeDespesas
    }

    return NextResponse.json({
      success: true,
      lancamentos: lancamentosProcessados,
      resumo: resumo,
      pagination: {
        page,
        limit,
        total: lancamentosProcessados.length
      }
    })

  } catch (error: any) {
    console.error('❌ [V1] Erro geral:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      lancamentos: [],
      resumo: null
    }, { status: 500 })
  }
} 