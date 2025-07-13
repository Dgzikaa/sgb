import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ========================================
// 🕷️ POST /api/getin/scraper - Web Scraping GetIn
// ========================================
export async function POST(request: NextRequest) {
  try {
    const { action, start_date, end_date } = await request.json()
    
    console.log('🕷️ Iniciando web scraping do GetIn')
    console.log('   - Ação:', action)
    console.log('   - Data início:', start_date)
    console.log('   - Data fim:', end_date)
    
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
    
    // Simular navegador real
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none'
    }
    
    let cookieJar = ''
    let sessionData: any = {}
    
    try {
      // Passo 1: Acessar página de login
      console.log('🔑 Passo 1: Acessando página de login...')
      const loginPageResponse = await fetch('https://agent.getin.com.br/login', {
        method: 'GET',
        headers: headers
      })
      
      if (!loginPageResponse.ok) {
        throw new Error(`Erro ao acessar página de login: ${loginPageResponse.status}`)
      }
      
      // Extrair cookies da resposta
      const setCookies = loginPageResponse.headers.get('set-cookie')
      if (setCookies) {
        cookieJar = setCookies.split(',').map(c => c.split(';')[0]).join('; ')
        console.log('🍪 Cookies obtidos:', cookieJar ? 'Sim' : 'Não')
      }
      
      const loginPageHtml = await loginPageResponse.text()
      
      // Tentar extrair CSRF token ou outros dados necessários
      const csrfMatch = loginPageHtml.match(/name="csrf[_-]?token"[^>]*value="([^"]*)"/)
      const csrfToken = csrfMatch ? csrfMatch[1] : null
      
      const tokenMatch = loginPageHtml.match(/name="_token"[^>]*value="([^"]*)"/)
      const token = tokenMatch ? tokenMatch[1] : null
      
      console.log('🔐 CSRF Token:', csrfToken ? 'Encontrado' : 'Não encontrado')
      console.log('🎫 _token:', token ? 'Encontrado' : 'Não encontrado')
      
      // Passo 2: Fazer login
      console.log('🚪 Passo 2: Fazendo login...')
      
      const loginData = new URLSearchParams({
        email: credentials.username,
        password: credentials.password,
        ...(csrfToken && { csrf_token: csrfToken }),
        ...(token && { _token: token })
      })
      
      const loginResponse = await fetch('https://agent.getin.com.br/login', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://agent.getin.com.br/login',
          'Origin': 'https://agent.getin.com.br',
          ...(cookieJar && { Cookie: cookieJar })
        },
        body: loginData.toString(),
        redirect: 'manual' // Para capturar redirecionamentos
      })
      
      console.log('📊 Status do login:', loginResponse.status)
      console.log('📍 Redirecionamento:', loginResponse.headers.get('location'))
      
      // Atualizar cookies após login
      const loginSetCookies = loginResponse.headers.get('set-cookie')
      if (loginSetCookies) {
        const newCookies = loginSetCookies.split(',').map(c => c.split(';')[0]).join('; ')
        cookieJar = cookieJar ? `${cookieJar}; ${newCookies}` : newCookies
      }
      
      // Se foi redirecionado, seguir o redirect
      let dashboardUrl = 'https://agent.getin.com.br/dashboard'
      if (loginResponse.status >= 300 && loginResponse.status < 400) {
        const location = loginResponse.headers.get('location')
        if (location) {
          dashboardUrl = location.startsWith('http') ? location : `https://agent.getin.com.br${location}`
        }
      }
      
      // Passo 3: Acessar dashboard/reservas
      console.log('📋 Passo 3: Acessando dados das reservas...')
      
      const reservasUrls = [
        `${dashboardUrl}/reservas`,
        `${dashboardUrl}/reservations`,
        'https://agent.getin.com.br/reservas',
        'https://agent.getin.com.br/reservations',
        'https://agent.getin.com.br/dashboard/reservas',
        'https://agent.getin.com.br/dashboard/reservations'
      ]
      
      let reservasData = null
      let workingUrl = null
      
      for (const url of reservasUrls) {
        try {
          console.log(`   Tentando: ${url}`)
          
          const reservasResponse = await fetch(url, {
            method: 'GET',
            headers: {
              ...headers,
              'Referer': dashboardUrl,
              ...(cookieJar && { Cookie: cookieJar })
            }
          })
          
          if (reservasResponse.ok) {
            const html = await reservasResponse.text()
            
                         // Tentar extrair dados JSON das reservas
             const jsonMatches = html.match(/var\s+reservas\s*=\s*(\[.*?\]);/) ||
                                html.match(/reservations["\']?\s*:\s*(\[.*?\])/) ||
                                html.match(/"reservas":\s*(\[.*?\])/)
            
            if (jsonMatches) {
              try {
                reservasData = JSON.parse(jsonMatches[1])
                workingUrl = url
                console.log('✅ Dados encontrados em:', url)
                break
              } catch (parseError) {
                console.log('❌ Erro ao fazer parse do JSON em:', url)
              }
            }
            
                         // Se não encontrou JSON, procurar tabelas HTML
             const tableMatch = html.match(/<table[^>]*class="[^"]*reserva[^"]*"[^>]*>[\s\S]*?<\/table>/i)
            if (tableMatch) {
              console.log('📊 Tabela de reservas encontrada em:', url)
              workingUrl = url
              // Aqui poderia fazer parsing da tabela HTML
              // Por simplicidade, vamos retornar que encontramos a página
              reservasData = { html_found: true, url: url }
              break
            }
          }
        } catch (urlError) {
          console.log(`❌ Erro ao acessar ${url}:`, urlError)
        }
      }
      
      if (reservasData) {
        return NextResponse.json({
          success: true,
          method: 'web_scraping',
          data: reservasData,
          found_at: workingUrl,
          session_info: {
            cookies_set: !!cookieJar,
            login_status: loginResponse.status,
            dashboard_url: dashboardUrl
          }
        })
      } else {
        return NextResponse.json({
          success: false,
          error: 'Não foi possível encontrar dados de reservas após login bem-sucedido',
          session_info: {
            cookies_set: !!cookieJar,
            login_status: loginResponse.status,
            dashboard_url: dashboardUrl,
            tried_urls: reservasUrls
          }
        }, { status: 404 })
      }
      
    } catch (scrapingError) {
      console.error('❌ Erro no web scraping:', scrapingError)
      return NextResponse.json({
        success: false,
        error: 'Erro durante o processo de web scraping',
        details: scrapingError instanceof Error ? scrapingError.message : 'Erro desconhecido'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno no scraper',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 