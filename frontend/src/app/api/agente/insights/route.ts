import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bar_id = searchParams.get('bar_id')
    const categoria = searchParams.get('categoria')
    const tipo = searchParams.get('tipo')
    const visualizado = searchParams.get('visualizado')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!bar_id) {
      return NextResponse.json({ error: 'bar_id é obrigatório' }, { status: 400 })
    }

    // Construir query
    let query = supabase
      .from('agente_insights')
      .select('*')
      .eq('bar_id', parseInt(bar_id))
      .eq('arquivado', false)
      .order('prioridade', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (categoria) {
      query = query.eq('categoria', categoria)
    }

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    if (visualizado !== null && visualizado !== undefined) {
      query = query.eq('visualizado', visualizado === 'true')
    }

    const { data: insights, error } = await query

    if (error) throw error

    return NextResponse.json({ insights })

  } catch (error: any) {
    console.error('Erro ao buscar insights:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar insights' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { insight_id, visualizado, arquivado } = body

    if (!insight_id) {
      return NextResponse.json({ error: 'insight_id é obrigatório' }, { status: 400 })
    }

    const updates: any = {}
    if (visualizado !== undefined) updates.visualizado = visualizado
    if (arquivado !== undefined) updates.arquivado = arquivado

    const { data, error } = await supabase
      .from('agente_insights')
      .update(updates)
      .eq('id', insight_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ insight: data })

  } catch (error: any) {
    console.error('Erro ao atualizar insight:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar insight' },
      { status: 500 }
    )
  }
}
