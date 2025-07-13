import { NextRequest, NextResponse } from 'next/server'

// ========================================
// 🕵️ POST /api/getin/deep-analysis - Análise Profunda do GetIn
// ========================================
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🕵️ === ANÁLISE PROFUNDA DO GETIN ===')
  console.log('   ⏰ Timestamp:', new Date().toISOString())
  
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive'
    }

    // Passo 1: Capturar página principal com DevTools simulation
    console.log('📄 Passo 1: Carregando página principal...')
    
    const mainResponse = await fetch('https://painel-reserva.getinapp.com.br/login', {
      method: 'GET',
      headers: {
        ...headers,
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
      }
    })
    
    const mainHtml = await mainResponse.text()
    console.log('   📊 HTML carregado:', mainHtml.length, 'caracteres')
    
    // Passo 2: Extrair informações críticas do HTML
    console.log('🔍 Passo 2: Extraindo informações críticas...')
    
    const criticalInfo: {
      scripts: string[]
      configs: string[]
      apiHints: any
      domains: Set<string>
      buildInfo: Record<string, any>
    } = {
      scripts: [],
      configs: [],
      apiHints: null,
      domains: new Set<string>(),
      buildInfo: {}
    }
    
    // Extrair todos os scripts
    const scriptTags = mainHtml.match(/<script[^>]*src="([^"]*)"[^>]*>/g) || []
    for (const scriptTag of scriptTags) {
      const srcMatch = scriptTag.match(/src="([^"]*)"/)
      if (srcMatch) {
        const src = srcMatch[1].startsWith('http') ? srcMatch[1] : `https://painel-reserva.getinapp.com.br${srcMatch[1]}`
        criticalInfo.scripts.push(src)
        
        // Extrair domínios
        const domainMatch = src.match(/https?:\/\/([^\/]+)/)
        if (domainMatch) {
          criticalInfo.domains.add(domainMatch[1])
        }
      }
    }
    
    console.log('   📜 Scripts encontrados:', criticalInfo.scripts.length)
    console.log('   🌐 Domínios únicos:', Array.from(criticalInfo.domains))
    
    // Passo 3: Análise detalhada do script principal
    console.log('🔬 Passo 3: Análise detalhada do script principal...')
    
    const mainScript = criticalInfo.scripts.find(script => 
      script.includes('main.') || script.includes('app.') || script.includes('bundle.')
    )
    
    if (mainScript) {
      console.log('   📜 Analisando script principal:', mainScript)
      
      try {
        const scriptResponse = await fetch(mainScript, {
          headers: { 'User-Agent': headers['User-Agent'] }
        })
        
        if (scriptResponse.ok) {
          const scriptContent = await scriptResponse.text()
          console.log('   📊 Script carregado:', scriptContent.length, 'caracteres')
          
          // Análise 1: Procurar URLs de API completas
          console.log('   🔍 Procurando URLs de API completas...')
          const fullApiUrls = scriptContent.match(/https?:\/\/[^"'\s]+api[^"'\s]*/g) || []
          console.log('   📋 URLs de API completas encontradas:', fullApiUrls.length)
          
          // Análise 2: Procurar configurações de axios/fetch
          console.log('   ⚙️ Procurando configurações de HTTP...')
          const httpConfigs = []
          
                     // Buscar baseURL configurations
           const baseUrlMatches = scriptContent.match(/baseURL\s*:\s*["']([^"']+)["']/g) || []
           httpConfigs.push(...baseUrlMatches.map(m => {
             const match = m.match(/["']([^"']+)["']/)
             return match ? match[1] : ''
           }).filter(Boolean))
          
          // Buscar interceptors (podem revelar headers de auth)
          const interceptorMatches = scriptContent.match(/interceptors\.[^}]+\}/g) || []
          console.log('   🔌 Interceptors encontrados:', interceptorMatches.length)
          
          // Análise 3: Procurar tokens e headers de autenticação
          console.log('   🔐 Procurando padrões de autenticação...')
          const authPatterns = [
            /Authorization['"]*:\s*["']([^"']+)["']/g,
            /Bearer\s+([A-Za-z0-9\-._~+/]+=*)/g,
            /token['"]*:\s*["']([^"']+)["']/g,
            /apiKey['"]*:\s*["']([^"']+)["']/g,
            /X-[A-Z-]+['"]*:\s*["']([^"']+)["']/g
          ]
          
          const authInfo = []
          for (const pattern of authPatterns) {
            const matches = [...scriptContent.matchAll(pattern)]
            if (matches.length > 0) {
              authInfo.push({
                pattern: pattern.source,
                matches: matches.slice(0, 3).map(m => m[1].substring(0, 20) + '...')
              })
            }
          }
          
          console.log('   🔐 Padrões de auth encontrados:', authInfo.length)
          
          // Análise 4: Procurar endpoints específicos
          console.log('   🎯 Procurando endpoints específicos...')
          const endpointPatterns = [
            /["']\/api\/[^"']*["']/g,
            /["']\/auth\/[^"']*["']/g,
            /["']\/v\d+\/[^"']*["']/g,
            /["']\/reservation[^"']*["']/g,
            /["']\/booking[^"']*["']/g,
            /["']\/unit[^"']*["']/g
          ]
          
          const foundEndpoints = new Set()
          for (const pattern of endpointPatterns) {
            const matches = [...scriptContent.matchAll(pattern)]
            for (const match of matches) {
              const endpoint = match[0].replace(/["']/g, '')
              foundEndpoints.add(endpoint)
            }
          }
          
          console.log('   🎯 Endpoints únicos encontrados:', foundEndpoints.size)
          
          // Análise 5: Procurar constantes de configuração
          console.log('   ⚙️ Procurando constantes de configuração...')
          const configPatterns = [
            /const\s+[A-Z_]+\s*=\s*["'][^"']+["']/g,
            /[A-Z_]{3,}\s*:\s*["'][^"']+["']/g,
            /process\.env\.[A-Z_]+/g
          ]
          
          const configs = []
          for (const pattern of configPatterns) {
            const matches = [...scriptContent.matchAll(pattern)]
            configs.push(...matches.map(m => m[0]))
          }
          
          console.log('   ⚙️ Configurações encontradas:', configs.slice(0, 5))
          
          // Compilar resultados da análise
          criticalInfo.apiHints = {
            fullApiUrls: fullApiUrls.slice(0, 10),
            httpConfigs: httpConfigs.slice(0, 5),
            authInfo: authInfo,
            endpoints: Array.from(foundEndpoints).slice(0, 20),
            configs: configs.slice(0, 10)
          }
        }
      } catch (scriptError) {
        console.log('   ❌ Erro ao analisar script:', scriptError)
      }
    }
    
    // Passo 4: Descoberta de subdomínios GetIn
    console.log('🌍 Passo 4: Descoberta de subdomínios...')
    
    const subdomainsToTest = [
      'api.getinapp.com.br',
      'api-v1.getinapp.com.br',
      'api-v2.getinapp.com.br',
      'backend.getinapp.com.br',
      'server.getinapp.com.br',
      'services.getinapp.com.br',
      'app.getinapp.com.br',
      'manager.getinapp.com.br',
      'dashboard.getinapp.com.br',
      'auth.getinapp.com.br',
      'login.getinapp.com.br'
    ]
    
    const workingSubdomains = []
    
    for (const subdomain of subdomainsToTest) {
      try {
        console.log(`   🧪 Testando: https://${subdomain}`)
        
        const subResponse = await fetch(`https://${subdomain}`, {
          method: 'GET',
          headers: headers,
          signal: AbortSignal.timeout(3000)
        })
        
        if (subResponse.ok || subResponse.status === 401 || subResponse.status === 403) {
          workingSubdomains.push({
            domain: subdomain,
            status: subResponse.status,
            contentType: subResponse.headers.get('content-type')
          })
          console.log(`     ✅ ${subdomain} - Status: ${subResponse.status}`)
        }
             } catch (subError) {
         const errorMessage = subError instanceof Error ? subError.message : String(subError)
         console.log(`     ❌ ${subdomain} - Erro: ${errorMessage}`)
       }
    }
    
    // Passo 5: Análise de network timing (simular DevTools)
    console.log('⏱️ Passo 5: Análise de performance e network...')
    
    const networkAnalysis = {
      domainResolutionTime: Date.now() - startTime,
      responseHeaders: Object.fromEntries(mainResponse.headers.entries()),
      cachingInfo: {
        cacheControl: mainResponse.headers.get('cache-control'),
        etag: mainResponse.headers.get('etag'),
        lastModified: mainResponse.headers.get('last-modified')
      }
    }
    
    const duration = Date.now() - startTime
    console.log('🎉 === ANÁLISE PROFUNDA CONCLUÍDA ===')
    console.log('   ⏱️ Duração:', duration + 'ms')
    console.log('   📊 Scripts analisados:', criticalInfo.scripts.length)
    console.log('   🌐 Subdomínios funcionais:', workingSubdomains.length)
    console.log('   🎯 Endpoints descobertos:', criticalInfo.apiHints?.endpoints?.length || 0)
    
    return NextResponse.json({
      success: true,
      analysis: {
        scripts: criticalInfo.scripts,
        domains: Array.from(criticalInfo.domains),
        apiHints: criticalInfo.apiHints,
        workingSubdomains: workingSubdomains,
        networkAnalysis: networkAnalysis
      },
      recommendations: [
        workingSubdomains.length > 0 ? `${workingSubdomains.length} subdomínios funcionais encontrados` : 'Nenhum subdomínio adicional encontrado',
        criticalInfo.apiHints?.fullApiUrls?.length > 0 ? 'URLs de API completas descobertas' : 'Nenhuma URL de API direta encontrada',
        criticalInfo.apiHints?.authInfo?.length > 0 ? 'Padrões de autenticação identificados' : 'Sistema de auth não identificado claramente'
      ],
      nextSteps: [
        'Testar subdomínios funcionais com endpoints descobertos',
        'Implementar simulação de browser para executar JavaScript',
        'Análise de traffic de rede em browser real'
      ],
      performance: {
        duration_ms: duration,
        analysis_depth: 'deep_script_analysis'
      }
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ === ERRO NA ANÁLISE PROFUNDA ===')
    console.error('   ⏱️ Duração até erro:', duration + 'ms')
    console.error('   📝 Erro:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro na análise profunda',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      debug_info: {
        duration_ms: duration,
        error_type: error instanceof Error ? error.constructor.name : typeof error
      }
    }, { status: 500 })
  }
} 