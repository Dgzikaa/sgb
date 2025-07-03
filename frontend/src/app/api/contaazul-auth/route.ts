import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';

import { cookies } from 'next/headers'



// ConfiguraÃ§Ãµes do ContaAzul
const CONTAAZUL_CREDENTIALS = {
  client_id: '6gd44mo7npa9dg76edh3kq6vpu',
  client_secret: '1cg8c06u1ncb0har9utsfk6kub8ogts181f2ps8hpkhc8p'
}

const CONTAAZUL_AUTH_URL = 'https://auth.contaazul.com'
const CONTAAZUL_API_URL = 'https://api-v2.contaazul.com'
const REDIRECT_URI = 'https://sgb-contaazul.vercel.app/api/contaazul-callback'

export async function POST(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const body = await request.json()
    const { action, bar_id } = body

    console.log(`ðŸ“‹ AÃ§Ã£o solicitada: ${action} para bar_id: ${bar_id}`)

    switch (action) {
      case 'get_auth_url':
        // NÃ£o precisa de autenticaÃ§Ã£o para gerar URL
        return getAuthUrl(bar_id)
      case 'disconnect':
        return disconnectContaAzul(supabase, bar_id)
      case 'sync':
        return syncContaAzulData(supabase, bar_id)
      default:
        return NextResponse.json(
          { success: false, error: 'AÃ§Ã£o invÃ¡lida' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Erro na API ContaAzul:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

// 1. Gerar URL de autorizaÃ§Ã£o OAuth
function getAuthUrl(bar_id: number) {
  try {
    const state = `bar_${bar_id}_${Date.now()}`
    
    const authUrl = new URL(`${CONTAAZUL_AUTH_URL}/oauth2/authorize`)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', CONTAAZUL_CREDENTIALS.client_id)
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('scope', 'openid profile aws.cognito.signin.user.admin')

    console.log('ðŸ”— URL de autorizaÃ§Ã£o gerada:', authUrl.toString())

    return NextResponse.json({
      success: true,
      auth_url: authUrl.toString(),
      state: state
    })

  } catch (error) {
    console.error('âŒ Erro ao gerar URL de autorizaÃ§Ã£o:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

// 2. Desconectar ContaAzul
async function disconnectContaAzul(supabase: any, bar_id: number) {
  try {
    const { error } = await supabase
      .from('contaazul_config')
      .delete()
      .eq('bar_id', bar_id)

    if (error) {
      throw new Error('Erro ao remover configuraÃ§Ã£o')
    }

    return NextResponse.json({
      success: true,
      message: 'Desconectado com sucesso'
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

// 3. Sincronizar dados
async function syncContaAzulData(supabase: any, bar_id: number) {
  try {
    // Buscar configuraÃ§Ã£o do bar
    const { data: config, error: configError } = await supabase
      .from('contaazul_config')
      .select('*')
      .eq('bar_id', bar_id)
      .single()

    if (configError || !config) {
      throw new Error('ConfiguraÃ§Ã£o ContaAzul nÃ£o encontrada')
    }

    // Verificar se token ainda Ã© vÃ¡lido
    if (new Date(config.expires_at) <= new Date()) {
      throw new Error('Token expirado, reconecte a conta')
    }

    console.log('ðŸ”„ Iniciando sincronizaÃ§Ã£o de dados...')

    let syncResults = {
      produtos: 0,
      contasPagar: 0,
      contasReceber: 0,
      errors: [] as string[]
    }

    // Sincronizar produtos usando API v2
    try {
      const produtosResponse = await fetch(`${CONTAAZUL_API_URL}/v1/products`, {
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (produtosResponse.ok) {
        const produtos = await produtosResponse.json()
        syncResults.produtos = produtos.length || 0
        console.log(`âœ… ${syncResults.produtos} produtos sincronizados`)
      } else {
        const errorText = await produtosResponse.text()
        syncResults.errors.push(`Erro ao sincronizar produtos: ${produtosResponse.status}`)
        console.error('âŒ Erro produtos:', errorText)
      }
    } catch (error) {
      syncResults.errors.push('Erro ao sincronizar produtos')
    }

    // Sincronizar contas a pagar
    try {
      const contasPagarResponse = await fetch(`${CONTAAZUL_API_URL}/v1/bills`, {
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (contasPagarResponse.ok) {
        const contasPagar = await contasPagarResponse.json()
        syncResults.contasPagar = contasPagar.length || 0
        console.log(`âœ… ${syncResults.contasPagar} contas a pagar sincronizadas`)
      } else {
        syncResults.errors.push(`Erro ao sincronizar contas a pagar: ${contasPagarResponse.status}`)
      }
    } catch (error) {
      syncResults.errors.push('Erro ao sincronizar contas a pagar')
    }

    // Sincronizar vendas (contas a receber)
    try {
      const vendasResponse = await fetch(`${CONTAAZUL_API_URL}/v1/sales`, {
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (vendasResponse.ok) {
        const vendas = await vendasResponse.json()
        syncResults.contasReceber = vendas.length || 0
        console.log(`âœ… ${syncResults.contasReceber} vendas sincronizadas`)
      } else {
        syncResults.errors.push(`Erro ao sincronizar vendas: ${vendasResponse.status}`)
      }
    } catch (error) {
      syncResults.errors.push('Erro ao sincronizar vendas')
    }

    // Atualizar timestamp da Ãºltima sincronizaÃ§Ã£o
    await supabase
      .from('contaazul_config')
      .update({ ultima_sync: new Date().toISOString() })
      .eq('bar_id', bar_id)

    return NextResponse.json({
      success: true,
      message: 'SincronizaÃ§Ã£o concluÃ­da',
      results: syncResults
    })

  } catch (error) {
    console.error('ðŸ’¥ Erro na sincronizaÃ§Ã£o:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

// FunÃ§Ã£o para trocar cÃ³digo por token (usada pelo callback)
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
    console.error('ðŸ’¥ Erro na troca do cÃ³digo:', error)
    throw error
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      success: true, 
      message: 'API ContaAzul OAuth 2.0 funcionando',
      endpoints: ['POST /api/contaazul-auth', 'GET /api/contaazul-callback']
    }
  )
}
