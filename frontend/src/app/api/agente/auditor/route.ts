import { NextRequest, NextResponse } from 'next/server'

/**
 * 🔍 API - AUDITOR
 * Endpoint para auditoria e validação de dados
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, bar_id, data_inicio, data_fim, tabela } = body

    if (!bar_id) {
      return NextResponse.json(
        { success: false, error: 'bar_id é obrigatório' },
        { status: 400 }
      )
    }

    // Validar action
    const actionsValidas = ['validate_sync', 'check_anomalies', 'data_quality', 'full_audit']
    if (!action || !actionsValidas.includes(action)) {
      return NextResponse.json(
        { success: false, error: `action deve ser uma de: ${actionsValidas.join(', ')}` },
        { status: 400 }
      )
    }

    // Chamar Edge Function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/agente-auditor`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ action, bar_id, data_inicio, data_fim, tabela })
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
    endpoint: '/api/agente/auditor',
    descricao: 'Auditoria e validação de dados do sistema',
    actions: [
      { 
        action: 'validate_sync', 
        descricao: 'Verifica se syncs estão atualizados',
        params: ['bar_id']
      },
      { 
        action: 'check_anomalies', 
        descricao: 'Detecta anomalias nos dados',
        params: ['bar_id', 'data_inicio?', 'data_fim?']
      },
      { 
        action: 'data_quality', 
        descricao: 'Verifica qualidade dos dados',
        params: ['bar_id', 'tabela?']
      },
      { 
        action: 'full_audit', 
        descricao: 'Auditoria completa do sistema',
        params: ['bar_id']
      }
    ]
  })
}

