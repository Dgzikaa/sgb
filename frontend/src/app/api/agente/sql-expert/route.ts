import { NextRequest, NextResponse } from 'next/server'

/**
 * 🗄️ API - SQL EXPERT
 * Endpoint para consultas ao banco de dados em linguagem natural
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mensagem, bar_id, contexto } = body

    if (!mensagem) {
      return NextResponse.json(
        { success: false, error: 'mensagem é obrigatória' },
        { status: 400 }
      )
    }

    if (!bar_id) {
      return NextResponse.json(
        { success: false, error: 'bar_id é obrigatório' },
        { status: 400 }
      )
    }

    // Chamar Edge Function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/agente-sql-expert`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ mensagem, bar_id, contexto })
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
    endpoint: '/api/agente/sql-expert',
    descricao: 'Consultas ao banco de dados usando linguagem natural',
    como_usar: {
      metodo: 'POST',
      body: {
        mensagem: 'Qual foi o faturamento da última semana?',
        bar_id: 3,
        contexto: {
          data_inicio: '2025-01-01',
          data_fim: '2025-01-07',
          limite: 10
        }
      }
    },
    exemplos_perguntas: [
      'Qual foi o faturamento total do mês?',
      'Quais são os produtos mais vendidos?',
      'Mostre o faturamento por hora',
      'Quais são os clientes mais frequentes?',
      'Como foram os meios de pagamento usados?'
    ]
  })
}

