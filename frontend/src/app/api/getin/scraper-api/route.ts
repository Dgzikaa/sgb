import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ========================================
// 🚀 POST /api/getin/scraper-api - Scraper usando APIs Reais do GetIn
// ========================================
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🚀 === SCRAPER API REAL DO GETIN ===')
  console.log('   ⏰ Timestamp:', new Date().toISOString())
  
  try {
    // Buscar credenciais do banco
    const { data: credentials, error: credError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'getin')
      .eq('ativo', true)
      .single()
    
    if (credError || !credentials) {
      return NextResponse.json({
        success: false,
        error: 'Credenciais GetIn não encontradas'
      }, { status: 404 })
    }
    
    console.log('✅ Credenciais encontradas:', credentials.username)
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Origin': 'https://painel-reserva.getinapp.com.br',
      'Referer': 'https://painel-reserva.getinapp.com.br/'
    }
    
    let authToken = null
    let sessionCookie = null
    
    // Passo 1: Tentar autenticação na API de auth separada
    console.log('🔑 Passo 1: Testando API de autenticação separada...')
    
    try {
      console.log('   🌐 Tentando: https://auth.getinapp.com.br/login')
      const authResponse = await fetch('https://auth.getinapp.com.br/login', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          email: credentials.username,
          login: credentials.username
        })
      })
      
      console.log('   📊 Status da auth API:', authResponse.status)
      console.log('   📋 Headers da resposta:', Object.fromEntries(authResponse.headers.entries()))
      
      if (authResponse.ok) {
        const authData = await authResponse.json()
        console.log('   ✅ Resposta da auth API:', authData)
        
        // Extrair token se existir
        if (authData.token || authData.access_token || authData.jwt) {
          authToken = authData.token || authData.access_token || authData.jwt
          console.log('   🎫 Token extraído:', authToken.substring(0, 20) + '...')
        }
        
        // Extrair cookies de sessão
        const setCookie = authResponse.headers.get('set-cookie')
        if (setCookie) {
          sessionCookie = setCookie.split(',').map(c => c.split(';')[0]).join('; ')
          console.log('   🍪 Session cookie extraído:', sessionCookie.substring(0, 50) + '...')
        }
      } else {
        const errorText = await authResponse.text()
        console.log('   ❌ Erro na auth API:', errorText.substring(0, 200))
      }
    } catch (authError) {
      console.log('   ❌ Erro ao chamar auth API:', authError)
    }
    
    // Passo 2: Tentar APIs de login alternativas
    console.log('🔄 Passo 2: Testando APIs de login alternativas...')
    
    const loginEndpoints = [
      'https://painel-reserva.getinapp.com.br/api/login',
      'https://painel-reserva.getinapp.com.br/api/auth',
      'https://painel-reserva.getinapp.com.br/api/auth/login',
      'https://painel-reserva.getinapp.com.br/auth/login',
      'https://admin.getinapp.com.br/api/login',
      'https://admin.getinapp.com.br/auth/login'
    ]
    
    for (const endpoint of loginEndpoints) {
      if (authToken) break // Se já temos token, parar
      
      try {
        console.log(`   🧪 Testando: ${endpoint}`)
        
        const loginResponse: Response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            ...(sessionCookie && { Cookie: sessionCookie })
          },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
            email: credentials.username,
            login: credentials.username
          })
        })
        
        console.log(`     📊 Status: ${loginResponse.status}`)
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json()
          console.log(`     ✅ Resposta: ${JSON.stringify(loginData).substring(0, 100)}...`)
          
          if (loginData.token || loginData.access_token || loginData.jwt) {
            authToken = loginData.token || loginData.access_token || loginData.jwt
            console.log(`     🎫 Token encontrado em ${endpoint}`)
            break
          }
          
          // Atualizar cookies se disponível
          const setCookie: string | null = loginResponse.headers.get('set-cookie')
          if (setCookie && !sessionCookie) {
            sessionCookie = setCookie.split(',').map((c: string) => c.split(';')[0]).join('; ')
          }
        } else if (loginResponse.status !== 405) {
          const errorText = await loginResponse.text()
          console.log(`     ❌ Erro: ${errorText.substring(0, 100)}`)
        }
      } catch (endpointError) {
        console.log(`     ❌ Erro ao testar ${endpoint}:`, endpointError)
      }
    }
    
    // Passo 3: Buscar reservas usando as APIs descobertas
    console.log('📋 Passo 3: Buscando reservas nas APIs descobertas...')
    
    const authHeaders = {
      ...headers,
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...(sessionCookie && { Cookie: sessionCookie })
    }
    
    const reservationsEndpoints = [
      'https://painel-reserva.getinapp.com.br/api/reservations?start_date=2025-01-10&end_date=2025-01-20',
      'https://painel-reserva.getinapp.com.br/reservations?start_date=2025-01-10&end_date=2025-01-20',
      'https://painel-reserva.getinapp.com.br/reservation/v1/units/',
      'https://painel-reserva.getinapp.com.br/api/reservation/v1/units/',
      'https://painel-reserva.getinapp.com.br/api/reservations',
      'https://admin.getinapp.com.br/api/reservations',
      'https://painel-reserva.getinapp.com.br/reservations'
    ]
    
    let reservationsData = null
    let workingEndpoint = null
    
    for (const endpoint of reservationsEndpoints) {
      try {
        console.log(`   🔍 Testando: ${endpoint}`)
        
        const reservationsResponse = await fetch(endpoint, {
          method: 'GET',
          headers: authHeaders
        })
        
        console.log(`     📊 Status: ${reservationsResponse.status}`)
        console.log(`     📝 Content-Type: ${reservationsResponse.headers.get('content-type')}`)
        
        if (reservationsResponse.ok) {
          const contentType = reservationsResponse.headers.get('content-type')
          
          if (contentType && contentType.includes('application/json')) {
            const data = await reservationsResponse.json()
            console.log(`     ✅ JSON recebido: ${JSON.stringify(data).substring(0, 200)}...`)
            
            // Verificar se contém dados de reservas
            if (data && (Array.isArray(data) || data.reservations || data.data || data.items)) {
              reservationsData = Array.isArray(data) ? data : 
                               data.reservations || data.data || data.items || [data]
              workingEndpoint = endpoint
              console.log(`     🎉 Dados de reservas encontrados! Total: ${reservationsData.length}`)
              break
            } else {
              console.log(`     ℹ️ Resposta JSON válida mas sem dados de reservas`)
            }
          } else {
            const textData = await reservationsResponse.text()
            console.log(`     📄 Resposta text: ${textData.substring(0, 200)}...`)
          }
        } else if (reservationsResponse.status === 401) {
          console.log(`     🔒 Não autorizado - token pode estar inválido`)
        } else if (reservationsResponse.status === 403) {
          console.log(`     🚫 Acesso negado - permissões insuficientes`)
        }
      } catch (endpointError) {
        console.log(`     ❌ Erro ao testar ${endpoint}:`, endpointError)
      }
    }
    
    // Passo 4: Processar dados encontrados
    const duration = Date.now() - startTime
    
    if (reservationsData && reservationsData.length > 0) {
      console.log('🎉 === SUCESSO COM API REAL ===')
      console.log('   ⏱️ Duração:', duration + 'ms')
      console.log('   🎯 Endpoint funcional:', workingEndpoint)
      console.log('   📊 Reservas encontradas:', reservationsData.length)
      
      // Processar dados das reservas
      const processedReservas = reservationsData.map((reserva: any, index: number) => ({
        id: reserva.id || `api_${Date.now()}_${index}`,
        id_externo: reserva.id || reserva.reservation_id || `api_${Date.now()}_${index}`,
        data_reserva: reserva.date || reserva.reservation_date || reserva.start_date || '2025-01-15',
        horario: reserva.time || reserva.reservation_time || reserva.start_time || '20:00',
        nome_cliente: reserva.customer_name || reserva.name || reserva.client_name || 'Cliente via API',
        email_cliente: reserva.customer_email || reserva.email || '',
        telefone_cliente: reserva.customer_phone || reserva.phone || '',
        pessoas: reserva.guests || reserva.people || reserva.party_size || 2,
        mesa: reserva.table || reserva.table_number || '',
        status: reserva.status || 'confirmada',
        observacoes: reserva.notes || reserva.observations || '',
        valor_total: reserva.total || reserva.amount || 0,
        valor_entrada: reserva.deposit || 0,
        source: 'getin_api_real',
        raw_data: reserva
      }))
      
      return NextResponse.json({
        success: true,
        method: 'api_real',
        data: processedReservas,
        found_at: workingEndpoint,
        authentication: {
          token_found: !!authToken,
          session_found: !!sessionCookie,
          auth_method: authToken ? 'token' : sessionCookie ? 'session' : 'none'
        },
        performance: {
          duration_ms: duration,
          endpoints_tested: loginEndpoints.length + reservationsEndpoints.length,
          successful_endpoint: workingEndpoint
        }
      })
    } else {
      console.log('❌ === NENHUM DADO ENCONTRADO ===')
      console.log('   ⏱️ Duração:', duration + 'ms')
      console.log('   🔍 Endpoints testados:', loginEndpoints.length + reservationsEndpoints.length)
      console.log('   🎫 Token obtido:', !!authToken)
      console.log('   🍪 Session obtida:', !!sessionCookie)
      
      return NextResponse.json({
        success: false,
        error: 'APIs descobertas mas sem dados de reservas',
        debug_info: {
          endpoints_tested: [...loginEndpoints, ...reservationsEndpoints],
          authentication_status: {
            token_found: !!authToken,
            session_found: !!sessionCookie
          },
          recommendations: authToken || sessionCookie ? 
            'Autenticação parcial obtida. Verificar permissões de usuário.' :
            'Nenhuma autenticação obtida. Verificar credenciais.'
        }
      }, { status: 404 })
    }
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ === ERRO NO SCRAPER API REAL ===')
    console.error('   ⏱️ Duração até erro:', duration + 'ms')
    console.error('   📝 Erro:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro no scraper API real',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      debug_info: {
        duration_ms: duration,
        error_type: error instanceof Error ? error.constructor.name : typeof error
      }
    }, { status: 500 })
  }
} 