import { NextRequest, NextResponse } from 'next/server'

/**
 * 🗺️ API - MAPEAR TABELAS
 * Endpoint para consultar estrutura do banco de dados
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, tabela, campo, termo_busca } = body

    // Validar action
    const actionsValidas = ['listar_tabelas', 'detalhar_tabela', 'buscar_campo', 'sugerir_query', 'explicar_relacionamento']
    if (!action || !actionsValidas.includes(action)) {
      return NextResponse.json(
        { success: false, error: `action deve ser uma de: ${actionsValidas.join(', ')}` },
        { status: 400 }
      )
    }

    // Chamar Edge Function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/agente-mapeador-tabelas`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ action, tabela, campo, termo_busca })
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
    endpoint: '/api/agente/mapear-tabelas',
    descricao: 'Consulta estrutura e documentação do banco de dados',
    actions: [
      { action: 'listar_tabelas', descricao: 'Lista todas as tabelas do sistema' },
      { action: 'detalhar_tabela', descricao: 'Detalha campos de uma tabela', params: ['tabela'] },
      { action: 'buscar_campo', descricao: 'Busca campos por termo', params: ['termo_busca'] },
      { action: 'sugerir_query', descricao: 'Sugere queries baseado no termo', params: ['termo_busca'] },
      { action: 'explicar_relacionamento', descricao: 'Explica relacionamentos de uma tabela', params: ['tabela'] }
    ]
  })
}

