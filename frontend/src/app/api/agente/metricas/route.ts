import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bar_id = searchParams.get('bar_id')
    const categoria = searchParams.get('categoria')
    const metrica = searchParams.get('metrica')
    const limit = parseInt(searchParams.get('limit') || '100')

    if (!bar_id) {
      return NextResponse.json({ error: 'bar_id é obrigatório' }, { status: 400 })
    }

    let query = supabase
      .from('agente_metricas')
      .select('*')
      .eq('bar_id', parseInt(bar_id))
      .order('created_at', { ascending: false })
      .limit(limit)

    if (categoria) {
      query = query.eq('categoria', categoria)
    }

    if (metrica) {
      query = query.eq('metrica', metrica)
    }

    const { data: metricas, error } = await query

    if (error) throw error

    // Agrupar métricas por categoria
    const metricasAgrupadas = metricas?.reduce((acc: any, m: any) => {
      if (!acc[m.categoria]) {
        acc[m.categoria] = []
      }
      acc[m.categoria].push(m)
      return acc
    }, {})

    return NextResponse.json({ metricas: metricasAgrupadas || {} })

  } catch (error: any) {
    console.error('Erro ao buscar métricas:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar métricas' },
      { status: 500 }
    )
  }
}
