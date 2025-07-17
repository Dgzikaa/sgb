import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

const CONTAAZUL_TOKEN_URL = 'https://auth.contaazul.com/oauth2/token'

export async function POST(request: NextRequest) {
  try {
    const { barId } = await request.json()

    if (!barId) {
      return NextResponse.json({ error: 'barId á© obrigatá³rio' }, { status: 400 })
    }

    console.log(`ðŸ”„ RENOVAá‡áƒO TOKEN - Iniciando para bar ${barId}`)

    const supabase = createSupabaseClient()

    // 1. Buscar credenciais ativas
    const { data: credentials, error: dbError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .eq('ativo', true)
      .single()

    if (dbError || !credentials) {
      console.error('Œ Credenciais ná£o encontradas:', dbError)
      return NextResponse.json({ 
        success: false, 
        error: 'Credenciais ná£o encontradas' 
      }, { status: 404 })
    }

    // 2. Verificar se temos refresh token
    if (!credentials.refresh_token) {
      console.error('Œ Refresh token ná£o disponá­vel')
      return NextResponse.json({ 
        success: false, 
        error: 'Refresh token ná£o disponá­vel. á‰ necessá¡rio fazer nova autorizaá§á£o.' 
      }, { status: 400 })
    }

    // 3. Verificar se já¡ temos um token vá¡lido
    const agora = new Date()
    const expiraEm = new Date(credentials.expires_at)
    const tokenValido = expiraEm > agora

    if (tokenValido) {
      console.log('œ… Token ainda vá¡lido, retornando sucesso')
      return NextResponse.json({
        success: true,
        message: 'Token já¡ está¡ vá¡lido',
        conectado: true,
        expires_at: credentials.expires_at,
        empresa_id: credentials.empresa_id
      })
    }

    console.log('ðŸ”„ Token expirado, renovando...')

    // 4. Renovar token usando refresh token
    const basicAuth = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64')
    
    const response = await fetch(CONTAAZUL_TOKEN_URL, {
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
      console.error('Œ Erro na renovaá§á£o:', data)
      return NextResponse.json({ 
        success: false, 
        error: data.error || 'Erro ao renovar token. Pode ser necessá¡rio fazer nova autorizaá§á£o.' 
      }, { status: 400 })
    }

    // 5. Salvar novos tokens
    const novaExpiracao = new Date(Date.now() + (data.expires_in * 1000))
    
    const { error: updateError } = await supabase
      .from('api_credentials')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token || credentials.refresh_token,
        expires_at: novaExpiracao.toISOString(),
        last_token_refresh: new Date().toISOString(),
        token_refresh_count: (credentials.token_refresh_count || 0) + 1,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', credentials.id)

    if (updateError) {
      console.error('Œ Erro ao salvar token renovado:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao salvar token renovado' 
      }, { status: 500 })
    }

    console.log('œ… Token renovado com sucesso!')

    return NextResponse.json({
      success: true,
      message: 'Token renovado com sucesso!',
      conectado: true,
      expires_at: novaExpiracao.toISOString(),
      empresa_id: credentials.empresa_id,
      nova_expiracao: novaExpiracao.toLocaleString('pt-BR')
    })

  } catch (error) {
    console.error('Œ Erro interno na renovaá§á£o:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
