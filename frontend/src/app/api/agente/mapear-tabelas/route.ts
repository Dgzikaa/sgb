import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(
  'https://',
  'https://'
).replace('.supabase.co', '.supabase.co/functions/v1')

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

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem mapear tabelas' },
        { status: 403 }
      )
    }

    // Chamar Edge Function
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/agente-mapeador-tabelas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({})
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Edge Function error: ${errorText}`)
    }

    const data = await response.json()

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Erro na API /api/agente/mapear-tabelas:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao mapear tabelas' },
      { status: 500 }
    )
  }
}
