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
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bar_id, mensagem } = body

    if (!bar_id || !mensagem) {
      return NextResponse.json(
        { error: 'bar_id e mensagem são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar acesso ao bar
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

    // Chamar Edge Function de chat
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/agente-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        bar_id,
        usuario_id: session.user.id,
        mensagem
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Edge Function error: ${errorText}`)
    }

    const data = await response.json()

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Erro na API /api/agente/chat:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar chat' },
      { status: 500 }
    )
  }
}

// Buscar histórico de conversas
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const bar_id = searchParams.get('bar_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!bar_id) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar acesso
    const { data: acesso } = await supabase
      .from('usuarios_bar')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('bar_id', parseInt(bar_id))
      .single()

    if (!acesso) {
      return NextResponse.json(
        { error: 'Sem acesso a este bar' },
        { status: 403 }
      )
    }

    // Buscar conversas
    const { data: conversas, error } = await supabase
      .from('agente_conversas')
      .select('*')
      .eq('bar_id', parseInt(bar_id))
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      conversas: conversas?.reverse() || []
    })

  } catch (error: any) {
    console.error('Erro ao buscar conversas:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar conversas' },
      { status: 500 }
    )
  }
}
