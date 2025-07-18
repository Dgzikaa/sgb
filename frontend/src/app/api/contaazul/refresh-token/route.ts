import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server'
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
      return NextResponse.json({ error: 'barId Ã¡Â© obrigatÃ¡Â³rio' }, { status: 400 })
    }

    console.log(`Ã°Å¸â€â€ž RENOVAÃ¡â€¡Ã¡Æ’O TOKEN - Iniciando para bar ${barId}`)

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
      console.error('ÂÅ’ Credenciais nÃ¡Â£o encontradas:', dbError)
      return NextResponse.json({ 
        success: false, 
        error: 'Credenciais nÃ¡Â£o encontradas' 
      }, { status: 404 })
    }

    // 2. Verificar se temos refresh token
    if (!credentials.refresh_token) {
      console.error('ÂÅ’ Refresh token nÃ¡Â£o disponÃ¡Â­vel')
      return NextResponse.json({ 
        success: false, 
        error: 'Refresh token nÃ¡Â£o disponÃ¡Â­vel. Ã¡â€° necessÃ¡Â¡rio fazer nova autorizaÃ¡Â§Ã¡Â£o.' 
      }, { status: 400 })
    }

    // 3. Verificar se jÃ¡Â¡ temos um token vÃ¡Â¡lido
    const agora = new Date()
    const expiraEm = new Date(credentials.expires_at)
    const tokenValido = expiraEm > agora

    if (tokenValido) {
      console.log('Å“â€¦ Token ainda vÃ¡Â¡lido, retornando sucesso')
      return NextResponse.json({
        success: true,
        message: 'Token jÃ¡Â¡ estÃ¡Â¡ vÃ¡Â¡lido',
        conectado: true,
        expires_at: credentials.expires_at,
        empresa_id: credentials.empresa_id
      })
    }

    console.log('Ã°Å¸â€â€ž Token expirado, renovando...')

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
      console.error('ÂÅ’ Erro na renovaÃ¡Â§Ã¡Â£o:', data)
      return NextResponse.json({ 
        success: false, 
        error: data.error || 'Erro ao renovar token. Pode ser necessÃ¡Â¡rio fazer nova autorizaÃ¡Â§Ã¡Â£o.' 
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
      console.error('ÂÅ’ Erro ao salvar token renovado:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao salvar token renovado' 
      }, { status: 500 })
    }

    console.log('Å“â€¦ Token renovado com sucesso!')

    return NextResponse.json({
      success: true,
      message: 'Token renovado com sucesso!',
      conectado: true,
      expires_at: novaExpiracao.toISOString(),
      empresa_id: credentials.empresa_id,
      nova_expiracao: novaExpiracao.toLocaleString('pt-BR')
    })

  } catch (error) {
    console.error('ÂÅ’ Erro interno na renovaÃ¡Â§Ã¡Â£o:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 

