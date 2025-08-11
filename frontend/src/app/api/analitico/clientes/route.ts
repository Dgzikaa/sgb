import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .rpc('get_clientes_recorrentes')

    if (error) {
      console.error('Erro ao buscar clientes:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar dados dos clientes' },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Erro na API de clientes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
