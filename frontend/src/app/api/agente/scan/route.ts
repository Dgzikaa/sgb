import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { bar_id, tipo_scan = 'completo' } = body

    if (!bar_id) {
      return NextResponse.json({ error: 'bar_id é obrigatório' }, { status: 400 })
    }

    // Verificar se usuário tem acesso ao bar
    const { data: userBar } = await supabase
      .from('usuarios_bar')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('bar_id', bar_id)
      .single()

    if (!userBar) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Chamar Edge Function agente-scanner
    const { data, error } = await supabase.functions.invoke('agente-scanner', {
      body: { bar_id, tipo_scan }
    })

    if (error) throw error

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Erro ao iniciar scan:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao iniciar scan' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bar_id = searchParams.get('bar_id')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!bar_id) {
      return NextResponse.json({ error: 'bar_id é obrigatório' }, { status: 400 })
    }

    // Buscar histórico de scans
    const { data: scans, error } = await supabase
      .from('agente_scans')
      .select('*')
      .eq('bar_id', parseInt(bar_id))
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ scans })

  } catch (error: any) {
    console.error('Erro ao buscar scans:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar scans' },
      { status: 500 }
    )
  }
}
