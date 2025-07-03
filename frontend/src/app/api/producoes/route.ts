import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

// POST - Salvar produção na tabela producoes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('💾 Dados recebidos para salvar produção:', body)

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com banco' 
      }, { status: 500 })
    }

    // Validar dados obrigatórios
    if (!body.receita_codigo || !body.receita_nome) {
      return NextResponse.json({
        success: false,
        error: 'Receita código e nome são obrigatórios'
      }, { status: 400 })
    }

    if (!body.rendimento_real || parseFloat(body.rendimento_real) <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Rendimento real é obrigatório e deve ser maior que zero'
      }, { status: 400 })
    }

    // Preparar dados para inserção
    const dadosProducao = {
      bar_id: body.bar_id || 3,
      receita_codigo: body.receita_codigo,
      receita_nome: body.receita_nome,
      receita_categoria: body.receita_categoria,
      criado_por_nome: body.criado_por_nome || 'Sistema',
      inicio_producao: body.inicio_producao ? new Date(body.inicio_producao).toISOString() : new Date().toISOString(),
      fim_producao: body.fim_producao ? new Date(body.fim_producao).toISOString() : new Date().toISOString(),
      peso_bruto_proteina: parseFloat(body.peso_bruto_proteina || 0),
      peso_limpo_proteina: parseFloat(body.peso_limpo_proteina || 0),
      rendimento_real: parseFloat(body.rendimento_real),
      rendimento_esperado: parseFloat(body.rendimento_esperado || 0),
      insumo_chefe_id: body.insumo_chefe_id,
      insumo_chefe_nome: body.insumo_chefe_nome,
      peso_insumo_chefe: parseFloat(body.peso_insumo_chefe || 0),
      observacoes: body.observacoes || '',
      status: body.status || 'finalizada'
    }

    // Inserir produção
    const { data, error } = await supabase
      .from('producoes')
      .insert([dadosProducao])
      .select('*')
      .single()

    if (error) {
      console.error('❌ Erro ao inserir produção:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao salvar produção: ' + error.message
      }, { status: 500 })
    }

    console.log('✅ Produção salva com sucesso:', data.id)

    return NextResponse.json({
      success: true,
      message: 'Produção salva com sucesso',
      data: data
    })

  } catch (error) {
    console.error('❌ Erro interno na API produção:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + (error as Error).message
    }, { status: 500 })
  }
}

// GET - Buscar histórico de produções
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = parseInt(searchParams.get('bar_id') || '3')
    const funcionario = searchParams.get('funcionario')
    const dataInicio = searchParams.get('data_inicio')
    const dataFim = searchParams.get('data_fim')
    const receita_codigo = searchParams.get('receita_codigo')
    const limite = parseInt(searchParams.get('limite') || '50')

    console.log(`📊 Buscando histórico de produções para bar_id: ${barId}`)

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com banco' 
      }, { status: 500 })
    }

    // Construir query
    let query = supabase
      .from('producoes')
      .select('*')
      .eq('bar_id', barId)
      .order('criado_em', { ascending: false })
      .limit(limite)

    // Aplicar filtros opcionais
    if (funcionario) {
      query = query.eq('criado_por_nome', funcionario)
    }
    
    if (dataInicio) {
      query = query.gte('criado_em', dataInicio)
    }
    
    if (dataFim) {
      query = query.lte('criado_em', dataFim + 'T23:59:59')
    }

    if (receita_codigo) {
      query = query.eq('receita_codigo', receita_codigo)
    }

    const { data: producoes, error } = await query

    if (error) {
      console.error('❌ Erro ao buscar produções:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar histórico: ' + error.message
      }, { status: 500 })
    }

    // Calcular estatísticas
    const estatisticas = {
      total_producoes: producoes?.length || 0,
      desvio_medio: 0,
      eficiencia_excelente: 0,
      eficiencia_boa: 0,
      eficiencia_regular: 0,
      eficiencia_ruim: 0
    }

    if (producoes && producoes.length > 0) {
      const desvios = producoes
        .filter((p: any) => p.desvio && p.desvio > 0)
        .map((p: any) => p.desvio as number)
      
      if (desvios.length > 0) {
        estatisticas.desvio_medio = desvios.reduce((a: number, b: number) => a + b, 0) / desvios.length
        estatisticas.eficiencia_excelente = desvios.filter((d: number) => d >= 95).length
        estatisticas.eficiencia_boa = desvios.filter((d: number) => d >= 85 && d < 95).length
        estatisticas.eficiencia_regular = desvios.filter((d: number) => d >= 75 && d < 85).length
        estatisticas.eficiencia_ruim = desvios.filter((d: number) => d < 75).length
      }
    }

    console.log(`✅ ${producoes?.length || 0} produções encontradas`)

    return NextResponse.json({
      success: true,
      producoes: producoes || [],
      estatisticas,
      total: producoes?.length || 0
    })

  } catch (error) {
    console.error('❌ Erro interno na API histórico:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + (error as Error).message
    }, { status: 500 })
  }
} 