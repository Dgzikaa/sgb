import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(
  'https://',
  'https://'
).replace('.supabase.co', '.supabase.co/functions/v1')

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bar_id, tarefa } = body

    if (!bar_id || !tarefa) {
      return NextResponse.json(
        { error: 'bar_id e tarefa são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar acesso
    const { data: acesso } = await supabase
      .from('usuarios_bar')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('bar_id', bar_id)
      .single()

    if (!acesso) {
      return NextResponse.json(
        { error: 'Sem acesso a este bar' },
        { status: 403 }
      )
    }

    // Chamar Agente Supervisor
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/agente-supervisor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        bar_id,
        tarefa,
        usuario_id: session.user.id
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Supervisor error: ${errorText}`)
    }

    const data = await response.json()

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Erro na API /api/agente/supervisor:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar tarefa' },
      { status: 500 }
    )
  }
}
