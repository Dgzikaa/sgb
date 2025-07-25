import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

// Interfaces TypeScript
interface SistemaMetrica {
  id: string;
  bar_id: number;
  tipo_metrica: string;
  categoria: string;
  nome_metrica: string;
  valor: number;
  valor_anterior: number | null;
  variacao_percentual: number | null;
  unidade: string;
  metadados: Record<string, unknown>;
  periodo_inicio: string;
  periodo_fim: string;
  coletado_em: string;
  bars?: {
    nome: string;
  };
}

interface MetricasResumo {
  total_metricas: number;
  metricas_por_tipo: Record<string, number>;
  ultima_coleta: string | null;
  periodo_consultado: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const barId = searchParams.get('bar_id') || '3'
    const tipoMetrica = searchParams.get('tipo') // 'performance', 'usage', 'business', 'technical'
    const categoria = searchParams.get('categoria')
    const periodo = searchParams.get('periodo') || '7' // dias

    const supabase = await getAdminClient()

    // Query base
    let query = supabase
      .from('sistema_metricas')
      .select(`
        *,
        bars(nome)
      `)
      .eq('bar_id', parseInt(barId))
      .gte('periodo_inicio', new Date(Date.now() - parseInt(periodo) * 24 * 60 * 60 * 1000).toISOString())
      .order('periodo_inicio', { ascending: false })

    // Filtros opcionais
    if (tipoMetrica) {
      query = query.eq('tipo_metrica', tipoMetrica)
    }
    if (categoria) {
      query = query.eq('categoria', categoria)
    }

    const { data: metricas, error } = await query

    if (error) {
      throw error
    }

    // Calcular estatísticas resumidas
    const resumo: MetricasResumo = {
      total_metricas: metricas?.length || 0,
      metricas_por_tipo: {} as Record<string, number>,
      ultima_coleta: metricas?.[0]?.coletado_em || null,
      periodo_consultado: `${periodo} dias`
    }

    metricas?.forEach((metrica: SistemaMetrica) => {
      resumo.metricas_por_tipo[metrica.tipo_metrica] = 
        (resumo.metricas_por_tipo[metrica.tipo_metrica] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      data: {
        metricas: metricas as SistemaMetrica[],
        resumo
      }
    })

  } catch (error) {
    console.error('❌ Erro ao buscar métricas:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar métricas do sistema',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      bar_id,
      tipo_metrica,
      categoria,
      nome_metrica,
      valor,
      valor_anterior,
      unidade = 'count',
      metadados = {},
      periodo_inicio,
      periodo_fim
    } = body

    // Validação básica
    if (!bar_id || !tipo_metrica || !categoria || !nome_metrica || valor === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Campos obrigatórios: bar_id, tipo_metrica, categoria, nome_metrica, valor'
      }, { status: 400 })
    }

    const supabase = await getAdminClient()

    // Calcular variação percentual se valor_anterior fornecido
    let variacao_percentual: number | null = null
    if (valor_anterior && valor_anterior > 0) {
      variacao_percentual = ((valor - valor_anterior) / valor_anterior) * 100
    }

    // Inserir métrica
    const { data: metrica, error } = await supabase
      .from('sistema_metricas')
      .insert({
        bar_id: parseInt(bar_id),
        tipo_metrica,
        categoria,
        nome_metrica,
        valor: parseFloat(valor),
        valor_anterior: valor_anterior ? parseFloat(valor_anterior) : null,
        variacao_percentual,
        unidade,
        metadados,
        periodo_inicio: periodo_inicio || new Date().toISOString(),
        periodo_fim: periodo_fim || new Date().toISOString(),
        coletado_em: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: metrica as SistemaMetrica,
      message: 'Métrica registrada com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao registrar métrica:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao registrar métrica',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
