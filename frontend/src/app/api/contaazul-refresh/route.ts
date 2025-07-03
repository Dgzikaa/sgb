import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';

// Credenciais atualizadas do ContaAzul
const CLIENT_ID = '3fbc2hitnbp2995slac0bcs9l'
const CLIENT_SECRET = '1vnnilt0o6s6dk1tfbcr4afg7fbqmt99sa6tihth8vpuacq6pogj'
const CONTAAZUL_AUTH_URL = 'https://auth.contaazul.com'

export async function POST(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }
    const { bar_id } = await request.json()

    console.log('ðŸ”„ Renovando token ContaAzul para bar_id:', bar_id)

    // 1. Buscar configuraÃ§Ã£o atual
    const { data: config, error: configError } = await supabase
      .from('contaazul_config')
      .select('*')
      .eq('bar_id', bar_id)
      .single()

    if (configError || !config || !config.refresh_token) {
      return NextResponse.json({
        success: false,
        error: 'Refresh token nÃ£o encontrado. Reconecte a conta.'
      })
    }

    console.log('ðŸ“‹ ConfiguraÃ§Ã£o encontrada, renovando...')

    // 2. Preparar requisiÃ§Ã£o de refresh
    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')

    const refreshResponse = await fetch(`${CONTAAZUL_AUTH_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'grant_type': 'refresh_token',
        'refresh_token': config.refresh_token
      })
    })

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text()
      console.error('âŒ Erro ao renovar token:', errorText)
      
      return NextResponse.json({
        success: false,
        error: `Erro ao renovar token: ${refreshResponse.status}`,
        details: errorText
      })
    }

    const tokenData = await refreshResponse.json()
    console.log('âœ… Novo token obtido')

    // 3. Calcular nova data de expiraÃ§Ã£o
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000))

    // 4. Atualizar configuraÃ§Ã£o no banco
    const { error: updateError } = await supabase
      .from('contaazul_config')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || config.refresh_token, // Manter refresh se nÃ£o vier novo
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('bar_id', bar_id)

    if (updateError) {
      console.error('âŒ Erro ao atualizar token no banco:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao salvar novo token'
      })
    }

    console.log('âœ… Token renovado com sucesso!')

    return NextResponse.json({
      success: true,
      message: 'Token renovado com sucesso',
      expires_at: expiresAt.toISOString()
    })

  } catch (error) {
    console.error('âŒ Erro ao renovar token:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno'
    })
  }
} 
