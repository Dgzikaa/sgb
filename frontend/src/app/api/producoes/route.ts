import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// ========================================
// 🍳 API PARA PRODUÇÕES
// ========================================

interface InsumoProducao {
  codigo?: string;
  nome?: string;
  unidade_medida?: string;
  quantidade_necessaria: number;
  quantidade_calculada?: number;
  quantidade_real?: number;
  is_chefe?: boolean;
}

interface Producao {
  id?: string;
  bar_id: number;
  receita_codigo: string;
  receita_nome: string;
  receita_categoria: string;
  criado_por_nome: string;
  inicio_producao: string;
  fim_producao: string;
  peso_bruto_proteina: number;
  peso_limpo_proteina: number;
  rendimento_real: number;
  rendimento_esperado: number;
  insumo_chefe_id?: string;
  insumo_chefe_nome?: string;
  peso_insumo_chefe: number;
  percentual_aderencia_receita: number;
  observacoes: string;
  status: string;
  criado_em?: string;
  desvio?: number;
}

interface Estatisticas {
  total_producoes: number;
  desvio_medio: number;
  eficiencia_excelente: number;
  eficiencia_boa: number;
  eficiencia_regular: number;
  eficiencia_ruim: number;
}

interface ApiError {
  message: string;
}

// ========================================
// 🍳 POST /api/producoes
// ========================================

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

    // Calcular percentual de aderência à receita baseado nos insumos
    let percentual_aderencia_receita = 100 // Default se não há insumos
    let total_desvio_insumos = 0
    let insumos_validos = 0

    if (body.insumos && Array.isArray(body.insumos) && body.insumos.length > 0) {
      console.log('📊 Calculando aderência à receita com', body.insumos.length, 'insumos')
      
      body.insumos.forEach((insumo: InsumoProducao, index: number) => {
        const planejado = parseFloat(String(insumo.quantidade_necessaria)) || 0;
        const calculado = parseFloat(String(insumo.quantidade_calculada)) || planejado;
        const real = parseFloat(String(insumo.quantidade_real)) || 0;
        
        if (calculado > 0 && real > 0) {
          // Calcular desvio percentual do real vs calculado
          const aderencia = (real / calculado) * 100;
          const desvio = Math.abs(100 - aderencia);
          total_desvio_insumos += desvio;
          insumos_validos++;
          
          console.log(`📋 Insumo ${index + 1} (${insumo.nome}): Calculado=${calculado}${insumo.unidade_medida}, Real=${real}${insumo.unidade_medida}, Aderência=${aderencia.toFixed(1)}%`);
        }
      });
      
      if (insumos_validos > 0) {
        const desvio_medio = total_desvio_insumos / insumos_validos
        percentual_aderencia_receita = Math.max(0, 100 - desvio_medio)
        console.log(`🎯 Desvio médio: ${desvio_medio.toFixed(1)}% | Aderência final: ${percentual_aderencia_receita.toFixed(1)}%`)
      }
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
      peso_bruto_proteina: parseFloat(String(body.peso_bruto_proteina || 0)),
      peso_limpo_proteina: parseFloat(String(body.peso_limpo_proteina || 0)),
      rendimento_real: parseFloat(String(body.rendimento_real)),
      rendimento_esperado: parseFloat(String(body.rendimento_esperado || 0)),
      insumo_chefe_id: body.insumo_chefe_id,
      insumo_chefe_nome: body.insumo_chefe_nome,
      peso_insumo_chefe: parseFloat(String(body.peso_insumo_chefe || 0)),
      percentual_aderencia_receita: Math.round(percentual_aderencia_receita * 100) / 100, // 2 decimais
      observacoes: body.observacoes || '',
      status: body.status || 'finalizada'
    };

    // Inserir produção
    const { data: producaoSalva, error } = await supabase
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

    console.log('✅ Produção salva com sucesso:', producaoSalva.id)

    // Salvar dados detalhados dos insumos se fornecidos
    if (body.insumos && Array.isArray(body.insumos) && body.insumos.length > 0) {
      console.log('💾 Salvando dados detalhados de', body.insumos.length, 'insumos...')
      
      const insumosParaSalvar = body.insumos.map((insumo: InsumoProducao) => ({
        producao_id: producaoSalva.id,
        codigo_insumo: insumo.codigo || '',
        nome_insumo: insumo.nome || '',
        unidade: insumo.unidade_medida || 'g',
        quantidade_planejada: parseFloat(String(insumo.quantidade_necessaria)) || 0,
        quantidade_calculada: parseFloat(String(insumo.quantidade_calculada)) || parseFloat(String(insumo.quantidade_necessaria)) || 0,
        quantidade_utilizada_real: parseFloat(String(insumo.quantidade_real)) || 0,
        is_chefe: insumo.is_chefe || false
      }));

      const { data: insumosData, error: insumosError } = await supabase
        .from('producao_insumos_calculados')
        .insert(insumosParaSalvar)
        .select('*')

      if (insumosError) {
        console.error('⚠️ Erro ao salvar insumos (produção salva):', insumosError)
        // Não falhar a produção por erro nos insumos
      } else {
        console.log('✅ Salvos', insumosData?.length || 0, 'insumos detalhados')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Produção salva com sucesso',
      data: {
        ...producaoSalva,
        percentual_aderencia_receita,
        insumos_salvos: body.insumos?.length || 0
      }
    })

  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('❌ Erro interno na API produção:', apiError);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + apiError.message
    }, { status: 500 });
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
    const estatisticas: Estatisticas = {
      total_producoes: producoes?.length || 0,
      desvio_medio: 0,
      eficiencia_excelente: 0,
      eficiencia_boa: 0,
      eficiencia_regular: 0,
      eficiencia_ruim: 0
    }

    if (producoes && producoes.length > 0) {
      const desvios = producoes
        .filter((p: Producao) => p.desvio && p.desvio > 0)
        .map((p: Producao) => p.desvio as number)
      
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

  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('❌ Erro interno na API histórico:', apiError);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + apiError.message
    }, { status: 500 });
  }
} 
