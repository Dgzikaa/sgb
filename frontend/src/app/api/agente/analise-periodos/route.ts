import { NextRequest, NextResponse } from 'next/server'

/**
 * 📊 API - ANÁLISE DE PERÍODOS
 * Endpoint para análises comparativas e tendências
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, bar_id, periodo_1, periodo_2, ano, mes } = body

    // Validar campos obrigatórios
    if (!bar_id) {
      return NextResponse.json(
        { success: false, error: 'bar_id é obrigatório' },
        { status: 400 }
      )
    }

    // Validar action
    const actionsValidas = ['comparar_semanas', 'comparar_meses', 'tendencia', 'evolucao_anual', 'resumo_periodo']
    if (!action || !actionsValidas.includes(action)) {
      return NextResponse.json(
        { success: false, error: `action deve ser uma de: ${actionsValidas.join(', ')}` },
        { status: 400 }
      )
    }

    // Chamar Edge Function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/agente-analise-periodos`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ action, bar_id, periodo_1, periodo_2, ano, mes })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { success: false, error: `Erro: ${response.status}`, detalhes: errorText },
        { status: response.status }
      )
    }

    const resultado = await response.json()
    return NextResponse.json(resultado)

  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: '/api/agente/analise-periodos',
    descricao: 'Análises comparativas de períodos e tendências',
    actions: [
      { 
        action: 'comparar_semanas', 
        descricao: 'Compara métricas entre duas semanas',
        params: ['bar_id', 'periodo_1?', 'periodo_2?']
      },
      { 
        action: 'comparar_meses', 
        descricao: 'Compara métricas entre dois meses',
        params: ['bar_id', 'ano?', 'mes?']
      },
      { 
        action: 'evolucao_anual', 
        descricao: 'Mostra evolução mês a mês do ano',
        params: ['bar_id', 'ano?']
      },
      { 
        action: 'resumo_periodo', 
        descricao: 'Resumo de métricas de um período',
        params: ['bar_id', 'periodo_1']
      }
    ]
  })
}

