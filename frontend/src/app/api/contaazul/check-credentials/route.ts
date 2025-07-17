import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('barId') || '3'
    
    const supabase = createSupabaseClient()

    // Buscar credenciais do ContaAzul
    const { data: credentials, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .single()

    if (error) {
      return NextResponse.json({ 
        error: 'Erro ao buscar credenciais',
        details: error.message 
      }, { status: 500 })
    }

    if (!credentials) {
      return NextResponse.json({ 
        error: 'Credenciais nÃ¡Â£o encontradas',
        bar_id: parseInt(barId)
      }, { status: 404 })
    }

    // Verificar se token estÃ¡Â¡ expirado
    const agora = new Date()
    const expiraEm = new Date(credentials.expires_at)
    const isExpired = expiraEm.getTime() <= agora.getTime()
    const timeToExpire = expiraEm.getTime() - agora.getTime()

    return NextResponse.json({
      bar_id: credentials.bar_id,
      sistema: credentials.sistema,
      ativo: credentials.ativo,
      has_access_token: !!credentials.access_token,
      has_refresh_token: !!credentials.refresh_token,
      has_client_id: !!credentials.client_id,
      has_client_secret: !!credentials.client_secret,
      expires_at: credentials.expires_at,
      expires_at_formatted: expiraEm.toLocaleString('pt-BR'),
      is_expired: isExpired,
      time_to_expire_minutes: Math.floor(timeToExpire / 1000 / 60),
      token_refresh_count: credentials.token_refresh_count || 0,
      last_token_refresh: credentials.last_token_refresh,
      created_at: credentials.created_at,
      updated_at: credentials.updated_at
    })

  } catch (error) {
    console.error('ÂÅ’ Erro ao verificar credenciais:', error)
    return NextResponse.json({ 
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 

