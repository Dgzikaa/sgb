import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dias = parseInt(searchParams.get('dias') || '30')
    
    // 1. Buscar dados de qualidade dos últimos X dias
    const { data: qualityData, error: qualityError } = await supabase
      .from('contahub_quality_monitor')
      .select('*')
      .gte('data_evento', new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('data_evento', { ascending: false })

    if (qualityError) {
      throw qualityError
    }

    // 2. Buscar alertas ativos
    const { data: alertsData, error: alertsError } = await supabase
      .from('contahub_alertas')
      .select('*')
      .eq('status', 'ATIVO')
      .order('created_at', { ascending: false })
      .limit(10)

    if (alertsError) {
      throw alertsError
    }

    // 3. Calcular estatísticas
    const totalDias = qualityData.length
    const diasPerfeitos = qualityData.filter(d => d.status_qualidade === 'PERFEITO').length
    const diasComProblemas = qualityData.filter(d => d.status_qualidade === 'CRITICO').length
    const precisaoMedia = totalDias > 0 
      ? qualityData.reduce((acc, d) => acc + (d.percentual_precisao || 0), 0) / totalDias 
      : 0

    // 4. Dados para gráfico de tendência
    const tendencia = qualityData.slice(0, 7).reverse().map(d => ({
      data: d.data_evento,
      precisao: d.percentual_precisao || 0,
      diferenca: Math.abs(d.diferenca || 0),
      status: d.status_qualidade
    }))

    // 5. Resumo de alertas por severidade
    const alertasPorSeveridade = alertsData.reduce((acc, alert) => {
      acc[alert.severidade] = (acc[alert.severidade] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: {
        estatisticas: {
          totalDias,
          diasPerfeitos,
          diasComProblemas,
          precisaoMedia: Math.round(precisaoMedia * 100) / 100,
          percentualPrecisao: Math.round((diasPerfeitos / Math.max(totalDias, 1)) * 100)
        },
        tendencia,
        alertasAtivos: alertsData,
        alertasPorSeveridade,
        ultimasValidacoes: qualityData.slice(0, 10)
      }
    })

  } catch (error) {
    console.error('Erro ao buscar dados de qualidade:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data_evento, valor_esperado } = await request.json()

    if (!data_evento || !valor_esperado) {
      return NextResponse.json(
        { success: false, error: 'data_evento e valor_esperado são obrigatórios' },
        { status: 400 }
      )
    }

    // Executar validação automática
    const { error } = await supabase.rpc('registrar_validacao_automatica', {
      data_evento,
      valor_esperado: parseFloat(valor_esperado)
    })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Validação executada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao executar validação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
