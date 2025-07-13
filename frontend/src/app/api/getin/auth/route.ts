import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ========================================
// 🔐 POST /api/getin/auth - Autenticação getIn
// ========================================
export async function POST(request: NextRequest) {
  try {
    const { email, password, bar_id } = await request.json()
    
    console.log('🔐 Iniciando autenticação getIn para email:', email)
    
    // Tentar login no getIn
    const loginResponse = await fetch('https://agent.getinapis.com/auth/v1/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        email,
        password
      })
    })
    
    const loginData = await loginResponse.json()
    console.log('📊 Resposta do login getIn:', loginData)
    
    if (!loginResponse.ok || !loginData.success) {
      return NextResponse.json({
        success: false,
        error: loginData.message || 'Erro ao autenticar no getIn'
      }, { status: 401 })
    }
    
    // Extrair token e dados do usuário
    const token = loginData.data?.access_token || loginData.access_token
    const userData = loginData.data?.user || loginData.user
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token não encontrado na resposta do getIn'
      }, { status: 401 })
    }
    
    // Buscar unidades/estabelecimentos do usuário
    const unitsResponse = await fetch('https://agent.getinapis.com/reservation/v1/units', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    const unitsData = await unitsResponse.json()
    console.log('🏢 Unidades encontradas:', unitsData)
    
    // Salvar credenciais no banco
    const credentials = {
      bar_id,
      sistema: 'getin',
      access_token: token,
      refresh_token: loginData.data?.refresh_token || null,
      configuracoes: {
        email,
        user_id: userData?.id,
        user_name: userData?.name,
        units: unitsData.data || [],
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
        created_at: new Date().toISOString()
      },
      ativo: true
    }
    
    const { data: savedCredentials, error } = await supabase
      .from('api_credentials')
      .upsert(credentials)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Erro ao salvar credenciais:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao salvar credenciais no banco'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Autenticação realizada com sucesso',
      data: {
        token,
        user: userData,
        units: unitsData.data || [],
        expires_at: credentials.configuracoes.expires_at
      }
    })
    
  } catch (error) {
    console.error('❌ Erro na autenticação getIn:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno na autenticação'
    }, { status: 500 })
  }
}

// ========================================
// 🔄 GET /api/getin/auth - Verificar token
// ========================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('bar_id')
    
    if (!barId) {
      return NextResponse.json({
        success: false,
        error: 'bar_id é obrigatório'
      }, { status: 400 })
    }
    
    // Buscar credenciais
    const { data: credentials, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'getin')
      .eq('ativo', true)
      .single()
    
    if (error || !credentials) {
      return NextResponse.json({
        success: false,
        error: 'Credenciais getIn não encontradas'
      }, { status: 404 })
    }
    
    // Verificar se token ainda é válido
    const expiresAt = new Date(credentials.configuracoes.expires_at)
    const now = new Date()
    
    if (now > expiresAt) {
      return NextResponse.json({
        success: false,
        error: 'Token expirado',
        expired: true
      }, { status: 401 })
    }
    
    // Testar token com API
    const testResponse = await fetch('https://agent.getinapis.com/reservation/v1/units', {
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`,
        'Accept': 'application/json'
      }
    })
    
    if (!testResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'Token inválido',
        expired: true
      }, { status: 401 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        authenticated: true,
        user: credentials.configuracoes.user_name,
        units: credentials.configuracoes.units,
        expires_at: credentials.configuracoes.expires_at
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao verificar token:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar autenticação'
    }, { status: 500 })
  }
} 