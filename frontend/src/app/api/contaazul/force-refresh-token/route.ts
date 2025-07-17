import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const CONTAAZUL_TOKEN_URL = 'https://auth.contaazul.com/oauth2/token'

export async function POST(request: NextRequest) {
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

    if (error || !credentials) {
      return NextResponse.json({ 
        error: 'Credenciais n·£o encontradas',
        details: error?.message 
      }, { status: 404 })
    }

    if (!credentials.refresh_token) {
      return NextResponse.json({ 
        error: 'Refresh token n·£o dispon·≠vel' 
      }, { status: 400 })
    }

    console.log('üîÑ For·ßando renova·ß·£o do token...')

    // For·ßar renova·ß·£o do token
    const basicAuth = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64')
    
    const response = await fetch(CONTAAZUL_TOKEN_URL: any, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: credentials.refresh_token
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('ùå Erro na renova·ß·£o:', data)
      return NextResponse.json({
        error: 'Falha na renova·ß·£o do token',
        details: data.error || `HTTP ${response.status}: ${response.statusText}`,
        response_data: data
      }, { status: 400 })
    }

    // Calcular nova data de expira·ß·£o
    const expiresAt = new Date(Date.now() + (data.expires_in * 1000))
    
    // Salvar novo token no banco
    const { error: updateError } = await supabase
      .from('api_credentials')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token || credentials.refresh_token,
        expires_at: expiresAt.toISOString(),
        last_token_refresh: new Date().toISOString(),
        token_refresh_count: (credentials.token_refresh_count || 0) + 1
      })
      .eq('id', credentials.id)

    if (updateError) {
      console.error('ùå Erro ao salvar novo token:', updateError)
      return NextResponse.json({
        error: 'Erro ao salvar novo token',
        details: updateError.message
      }, { status: 500 })
    }

    // Teste do novo token
    const testResponse = await fetch('https://api.contaazul.com/v1/financeiro/categorias', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${data.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Token renovado com sucesso',
      new_token_length: data.access_token.length,
      expires_at: expiresAt.toISOString(),
      expires_at_formatted: expiresAt.toLocaleString('pt-BR'),
      token_refresh_count: (credentials.token_refresh_count || 0) + 1,
      test_result: {
        status: testResponse.status,
        ok: testResponse.ok,
        error: testResponse.ok ? null : await testResponse.text()
      }
    })

  } catch (error) {
    console.error('ùå Erro ao renovar token:', error)
    return NextResponse.json({ 
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
