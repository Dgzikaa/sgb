import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    const status = searchParams.get('status')
    const genero = searchParams.get('genero')

    let query = supabase
      .from('eventos')
      .select('*')
      .order('data_evento', { ascending: true })

    // Filtros opcionais
    if (dataInicio) {
      query = query.gte('data_evento', dataInicio)
    }
    
    if (dataFim) {
      query = query.lte('data_evento', dataFim)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (genero) {
      query = query.eq('genero', genero)
    }

    const { data: eventos, error } = await query

    if (error) {
      console.error('Erro ao buscar eventos:', error)
      return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 })
    }

    return NextResponse.json({ eventos })

  } catch (error) {
    console.error('Erro ao buscar eventos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 