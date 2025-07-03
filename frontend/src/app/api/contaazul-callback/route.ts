import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';




// ConfiguraÃ§Ãµes do ContaAzul
const CONTAAZUL_CREDENTIALS = {
  client_id: '6gd44mo7npa9dg76edh3kq6vpu',
  client_secret: '1cg8c06u1ncb0har9utsfk6kub8ogts181f2ps8hpkhc8p'
}

const CONTAAZUL_AUTH_URL = 'https://auth.contaazul.com'
const CONTAAZUL_API_URL = 'https://api-v2.contaazul.com'
const REDIRECT_URI = 'https://sgb-contaazul.vercel.app/api/contaazul-callback'

// FunÃ§Ã£o para trocar cÃ³digo por token
async function exchangeCodeForToken(supabase: any, bar_id: number, code: string, state: string) {
  try {
    console.log('ðŸ”„ Trocando cÃ³digo por token...')

    // Criar Basic Auth header
    const basicAuth = btoa(`${CONTAAZUL_CREDENTIALS.client_id}:${CONTAAZUL_CREDENTIALS.client_secret}`)

    const tokenResponse = await fetch(`${CONTAAZUL_AUTH_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: new URLSearchParams({
        'client_id': CONTAAZUL_CREDENTIALS.client_id,
        'client_secret': CONTAAZUL_CREDENTIALS.client_secret,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('âŒ Erro na troca do token:', errorText)
      throw new Error(`Erro na troca do token: ${tokenResponse.status} - ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    console.log('âœ… Token obtido com sucesso')

    // Obter informaÃ§Ãµes da empresa
    const userInfoResponse = await fetch(`${CONTAAZUL_API_URL}/v1/me`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    let empresaId = 'contaazul_account'
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json()
      empresaId = userInfo.id || userInfo.company_id || 'contaazul_account'
    }

    // Calcular data de expiraÃ§Ã£o
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in)

    // Salvar configuraÃ§Ã£o no banco
    const { error } = await supabase
      .from('contaazul_config')
      .upsert({
        bar_id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        empresa_id: empresaId,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('âŒ Erro ao salvar configuraÃ§Ã£o:', error)
      throw new Error('Erro ao salvar configuraÃ§Ã£o no banco de dados')
    }

    console.log('âœ… ConfiguraÃ§Ã£o salva com sucesso')

    return {
      success: true,
      message: 'ConexÃ£o estabelecida com sucesso',
      empresa_id: empresaId,
      expires_at: expiresAt.toISOString()
    }

  } catch (error) {
    console.error('ï¿½ï¿½ Erro na troca do cÃ³digo:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Verificar se houve erro na autorizaÃ§Ã£o
    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/integracoes/contaazul?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    // Verificar se o cÃ³digo foi recebido
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/integracoes/contaazul?error=missing_code', request.url)
      )
    }

    // Extrair bar_id do state
    const stateMatch = state.match(/^bar_(\d+)_/)
    if (!stateMatch) {
      return NextResponse.redirect(
        new URL('/dashboard/integracoes/contaazul?error=invalid_state', request.url)
      )
    }

    const barId = parseInt(stateMatch[1])


    
    // Fazer chamada para trocar cÃ³digo por token
    const result = await exchangeCodeForToken(supabase, barId, code, state)

    if (result.success) {
      // Sucesso - redirecionar para a pÃ¡gina de integraÃ§Ã£o
      return NextResponse.redirect(
        new URL('/dashboard/integracoes/contaazul?success=connected', request.url)
      )
    } else {
      // Erro na troca do token
      return NextResponse.redirect(
        new URL('/dashboard/integracoes/contaazul?error=token_exchange_error', request.url)
      )
    }

  } catch (error) {
    console.error('Erro no callback ContaAzul:', error)
    return NextResponse.redirect(
      new URL('/dashboard/integracoes/contaazul?error=callback_error', request.url)
    )
  }
}
