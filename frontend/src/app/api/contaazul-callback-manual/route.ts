import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';

const CLIENT_ID = '3fbc2hitnbp2995slac0bcs9l'
const CLIENT_SECRET = '1vnnilt0o6s6dk1tfbcr4afg7fbqmt99sa6tihth8vpuacq6pogj'
const REDIRECT_URI = 'https://sgb-contaazul.vercel.app/api/contaazul-callback'

export async function POST(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }
    const { code, state, bar_id } = await request.json()

    console.log('ðŸ”„ Processando callback manual:', { code, state, bar_id })

    // 1. Validar state
    if (!state.startsWith(`bar_${bar_id}_`)) {
      return NextResponse.json({
        success: false,
        error: 'State invÃ¡lido'
      })
    }

    // 2. Preparar Basic Authentication (seguindo doc oficial)
    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
    console.log('ðŸ” Basic Auth preparado')

    // 3. Trocar cÃ³digo por access token (seguindo doc oficial exatamente)
    const tokenData = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI
    })

    console.log('ðŸ“¤ Enviando para ContaAzul:', {
      url: 'https://auth.contaazul.com/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
        'Accept': 'application/json'
      },
      body: tokenData.toString()
    })

    const tokenResponse = await fetch('https://auth.contaazul.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
        'Accept': 'application/json'
      },
      body: tokenData.toString()
    })

    const tokenResult = await tokenResponse.json()
    
    console.log('ðŸ“¥ Resposta do ContaAzul:', {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      headers: Object.fromEntries(tokenResponse.headers.entries()),
      body: tokenResult
    })

    if (!tokenResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao trocar cÃ³digo por token',
        status: tokenResponse.status,
        details: tokenResult
      })
    }

    // 4. Buscar informaÃ§Ãµes da empresa (usando Bearer token)
    const empresaResponse = await fetch('https://api-v2.contaazul.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenResult.access_token}`,
        'Accept': 'application/json'
      }
    })

    let empresaInfo = null
    if (empresaResponse.ok) {
      empresaInfo = await empresaResponse.json()
      console.log('ðŸ¢ Info da empresa:', empresaInfo)
    } else {
      console.log('âš ï¸ Erro ao buscar info da empresa:', empresaResponse.status, await empresaResponse.text())
    }

    // 5. Salvar configuraÃ§Ã£o no banco
    const expiresAt = new Date(Date.now() + (tokenResult.expires_in * 1000))
    
    const { data: configData, error: configError } = await supabase
      .from('contaazul_config')
      .upsert({
        bar_id: bar_id,
        access_token: tokenResult.access_token,
        refresh_token: tokenResult.refresh_token,
        expires_at: expiresAt.toISOString(),
        empresa_id: empresaInfo?.id?.toString() || null,
        ultima_sync: new Date().toISOString()
      }, {
        onConflict: 'bar_id'
      })
      .select()

    if (configError) {
      console.error('âŒ Erro ao salvar config:', configError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao salvar configuraÃ§Ã£o',
        details: configError
      })
    }

    console.log('âœ… ConfiguraÃ§Ã£o salva:', configData)

    return NextResponse.json({
      success: true,
      message: 'ContaAzul conectado com sucesso!',
      data: {
        empresa: empresaInfo,
        expires_at: expiresAt.toISOString(),
        config_id: configData[0]?.id,
        token_info: {
          expires_in: tokenResult.expires_in,
          token_type: tokenResult.token_type
        }
      }
    })

  } catch (error) {
    console.error('âŒ Erro no callback manual:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
} 
