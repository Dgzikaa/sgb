import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📊 Dados recebidos para produção:', body)

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com banco' 
      }, { status: 500 })
    }

    // 1. Buscar produto para obter informações básicas
    const { data: produto, error: produtoError } = await supabase
      .from('produtos')
      .select('id, nome, rendimento_esperado')
      .eq('codigo', body.produto_codigo)
      .eq('bar_id', 3)
      .single()

    if (produtoError || !produto) {
      return NextResponse.json({
        success: false,
        error: `Produto ${body.produto_codigo} não encontrado: ${produtoError?.message}`
      }, { status: 404 })
    }

    // 2. Buscar receitas do produto e identificar insumo chefe
    const { data: receitas, error: receitasError } = await supabase
      .from('receitas')
      .select(`
        id,
        insumo_id,
        quantidade_necessaria,
        nome_receita,
        insumos(id, nome, categoria)
      `)
      .eq('produto_id', produto.id)
      .eq('bar_id', 3)

    if (receitasError) {
      return NextResponse.json({
        success: false,
        error: `Erro ao buscar receitas: ${receitasError.message}`
      }, { status: 500 })
    }

    if (receitas.length === 0) {
      return NextResponse.json({
        success: false,
        error: `Nenhuma receita encontrada para o produto ${body.produto_codigo}`
      }, { status: 404 })
    }

    // 3. Identificar insumo chefe (maior quantidade + palavras-chave)
    let insumoChefe = null
    const receitaId = receitas[0].id // Usar o ID da primeira receita como referência
    let maiorQuantidade = 0
    
    for (const receita of receitas) {
      const quantidade = receita.quantidade_necessaria || 0
      const nomeInsumo = (receita.insumos?.nome || '').toLowerCase()
      
      // Score por palavras-chave
      let score = 0
      const palavrasChave = ['frango', 'carne', 'leite', 'queijo', 'farinha', 'massa', 'batata', 'tapioca']
      for (const palavra of palavrasChave) {
        if (nomeInsumo.includes(palavra)) {
          score += 10
        }
      }
      
      // Considera maior quantidade + score de palavras-chave
      if (quantidade > maiorQuantidade || (quantidade === maiorQuantidade && score > 0)) {
        insumoChefe = receita.insumo_id
        maiorQuantidade = quantidade
      }
    }

    // 4. Calcular métricas
    const pesoBruto = parseFloat(body.peso_bruto_g) || 0
    const pesoLiquido = parseFloat(body.peso_limpo_g) || 0
    const rendimentoProduzido = parseFloat(body.peso_final_g) || 0
    const rendimentoEsperado = produto.rendimento_esperado || 0
    
    const fatorCorrecao = pesoBruto > 0 ? pesoLiquido / pesoBruto : 0
    const desvio = rendimentoEsperado > 0 ? rendimentoProduzido / rendimentoEsperado : 0

    // 5. Preparar dados para inserção
    const dadosProducao = {
      bar_id: 3,
      receita_id: receitaId, // Usar ID correto da receita
      funcionario_id: 1, // Fixo por enquanto
      peso_bruto_proteina: pesoBruto,
      peso_limpo_proteina: pesoLiquido,
      rendimento_calculado: rendimentoProduzido,
      inicio_producao: body.inicio_producao || new Date().toISOString(),
      fim_producao: body.fim_producao || new Date().toISOString(),
      status: 'concluida',
      observacoes: body.observacoes || '',
      
      // Novas colunas
      insumo_chefe_id: insumoChefe,
      rendimento_esperado: rendimentoEsperado,
      fator_correcao: fatorCorrecao,
      desvio: desvio
    }

    console.log('📊 Dados calculados:', {
      produto: produto.nome,
      insumo_chefe_id: insumoChefe,
      rendimento_esperado: rendimentoEsperado,
      fator_correcao: fatorCorrecao,
      desvio: desvio,
      percentual_rendimento: `${(desvio * 100).toFixed(1)}%`
    })

    // 6. Inserir produção no banco
    const { data: producao, error: producaoError } = await supabase
      .from('producoes')
      .insert(dadosProducao)
      .select()
      .single()

    if (producaoError) {
      console.error('❌ Erro ao inserir produção:', producaoError)
      return NextResponse.json({
        success: false,
        error: `Erro ao salvar produção: ${producaoError.message}`
      }, { status: 500 })
    }

    console.log('✅ Produção salva com sucesso:', producao.id)

    return NextResponse.json({
      success: true,
      message: 'Produção salva com sucesso!',
      data: {
        producao_id: producao.id,
        produto_nome: produto.nome,
        insumo_chefe_id: insumoChefe,
        rendimento_esperado: rendimentoEsperado,
        rendimento_produzido: rendimentoProduzido,
        fator_correcao: Math.round(fatorCorrecao * 10000) / 100, // % com 2 decimais
        desvio: Math.round(desvio * 10000) / 100, // % com 2 decimais
        performance: desvio >= 1.0 ? 'Excelente (≥100%)' : 
                    desvio >= 0.9 ? 'Bom (90-99%)' : 'Abaixo do esperado (<90%)'
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = parseInt(searchParams.get('bar_id') || '1')
    const funcionario = searchParams.get('funcionario')
    const dataInicio = searchParams.get('data_inicio')
    const dataFim = searchParams.get('data_fim')

    console.log(`🏭 Terminal: Buscando histórico de produção`, {
      bar_id: barId,
      funcionario,
      periodo: `${dataInicio} - ${dataFim}`
    })

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    // Buscar dados de produção
    let query = supabase
      .from('producao_terminal')
      .select('*')
      .eq('bar_id', barId)
      .order('created_at', { ascending: false })

    if (funcionario) {
      query = query.eq('funcionario', funcionario)
    }
    
    if (dataInicio) {
      query = query.gte('data_producao', dataInicio)
    }
    
    if (dataFim) {
      query = query.lte('data_producao', dataFim)
    }

    const { data, error } = await query.limit(100)

    if (error) {
      console.error('❌ Erro ao buscar histórico:', error)
      return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
    }

    // Calcular estatísticas do período
    const estatisticas = {
      total_producoes: data?.length || 0,
      tempo_medio: 0,
      performance_media: 0,
      excelentes: 0,
      bons: 0,
      atencao: 0,
      criticos: 0
    }

    if (data && data.length > 0) {
      const tempos = data.map((p: unknown) => p.tempo_producao_segundos).filter((t: number) => t > 0)
      const performances = data.map((p: unknown) => p.performance_percentual).filter((p: number) => p > 0)
      
      estatisticas.tempo_medio = tempos.length > 0 
        ? Math.round(tempos.reduce((a: number, b: number) => a + b, 0) / tempos.length)
        : 0
      
      estatisticas.performance_media = performances.length > 0
        ? Math.round((performances.reduce((a: number, b: number) => a + b, 0) / performances.length) * 10) / 10
        : 0
      
      // Contar status
      data.forEach((p: unknown) => {
        switch (p.status_performance) {
          case 'excelente': estatisticas.excelentes++; break
          case 'bom': estatisticas.bons++; break
          case 'atencao': estatisticas.atencao++; break
          case 'critico': estatisticas.criticos++; break
        }
      })
    }

    return NextResponse.json({
      success: true,
      producoes: data || [],
      estatisticas,
      meta: {
        total_registros: data?.length || 0,
        filtros: { bar_id: barId, funcionario, data_inicio: dataInicio, data_fim: dataFim }
      }
    })

  } catch (error) {
    console.error('❌ Erro na busca do histórico:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + (error as Error).message },
      { status: 500 }
    )
  }
} 
