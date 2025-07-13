import { NextRequest, NextResponse } from 'next/server'

// ========================================
// 🔍 POST /api/getin/analyze-spa - Análise de SPA do GetIn
// ========================================
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🔍 === ANALISANDO SPA DO GETIN ===')
  console.log('   ⏰ Timestamp:', new Date().toISOString())
  
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }

    // Passo 1: Analisar página principal
    console.log('📄 Passo 1: Analisando HTML da SPA...')
    
    const mainResponse = await fetch('https://painel-reserva.getinapp.com.br/login', {
      method: 'GET',
      headers: headers
    })
    
    const mainHtml = await mainResponse.text()
    console.log('   📊 Tamanho do HTML principal:', mainHtml.length)
    
    // Passo 2: Extrair scripts e assets
    console.log('📜 Passo 2: Extraindo scripts JavaScript...')
    
    // Encontrar todos os scripts
    const scriptMatches = mainHtml.match(/<script[^>]*src="([^"]*)"[^>]*>/g) || []
    const inlineScripts = mainHtml.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || []
    
    console.log('   📜 Scripts externos encontrados:', scriptMatches.length)
    console.log('   📜 Scripts inline encontrados:', inlineScripts.length)
    
    // Extrair URLs dos scripts
    const scriptUrls = scriptMatches
      .map(script => {
        const match = script.match(/src="([^"]*)"/)
        return match ? match[1] : null
      })
      .filter((url): url is string => Boolean(url))
      .map(url => url.startsWith('http') ? url : `https://painel-reserva.getinapp.com.br${url}`)
    
    console.log('   🔗 URLs dos scripts:', scriptUrls)
    
    // Passo 3: Analisar scripts em busca de APIs
    console.log('🔍 Passo 3: Analisando scripts em busca de endpoints...')
    
    const apiEndpoints = new Set()
    const apiPatterns = [
      /['"](\/api\/[^'"]*)['"]/g,
      /['"](https?:\/\/[^'"]*\.getinapp[^'"]*)['"]/g,
      /['"](\/auth[^'"]*)['"]/g,
      /['"](\/login[^'"]*)['"]/g,
      /['"](\/reservation[^'"]*)['"]/g,
      /axios\.post\(['"']([^'"']*)['"']/g,
      /fetch\(['"']([^'"']*)['"']/g,
      /\.post\(['"']([^'"']*)['"']/g,
      /\.get\(['"']([^'"']*)['"']/g
    ]
    
    // Analisar scripts inline
    for (const script of inlineScripts) {
      for (const pattern of apiPatterns) {
        let match
        while ((match = pattern.exec(script)) !== null) {
          if (match[1] && !match[1].includes('facebook') && !match[1].includes('google')) {
            apiEndpoints.add(match[1])
          }
        }
      }
    }
    
    // Buscar por main.js ou bundle.js
    const mainScriptUrls = scriptUrls.filter(url => 
      url.includes('main.') || 
      url.includes('bundle.') || 
      url.includes('app.') ||
      url.includes('static/js/')
    )
    
    console.log('   🎯 Scripts principais identificados:', mainScriptUrls.length)
    
    // Analisar alguns scripts principais
    for (const scriptUrl of mainScriptUrls.slice(0, 3)) {
      try {
        console.log(`   📜 Analisando: ${scriptUrl}`)
        
        const scriptResponse = await fetch(scriptUrl, {
          headers: { 'User-Agent': headers['User-Agent'] }
        })
        
        if (scriptResponse.ok) {
          const scriptContent = await scriptResponse.text()
          console.log(`     📊 Tamanho: ${scriptContent.length} caracteres`)
          
          // Buscar APIs no script
          for (const pattern of apiPatterns) {
            let match
            while ((match = pattern.exec(scriptContent)) !== null) {
              if (match[1] && !match[1].includes('facebook') && !match[1].includes('google')) {
                apiEndpoints.add(match[1])
              }
            }
          }
          
          // Buscar padrões específicos do GetIn - ANÁLISE AVANÇADA
          console.log(`     🔍 Análise avançada do script...`)
          
          // Buscar URLs base da API
          const baseApiMatches = scriptContent.match(/baseURL['"]*:\s*['"]([^'"]*)['"]/g) ||
                                scriptContent.match(/apiUrl['"]*:\s*['"]([^'"]*)['"]/g) ||
                                scriptContent.match(/API_BASE['"]*:\s*['"]([^'"]*)['"]/g)
          
          if (baseApiMatches) {
            console.log(`     📍 Base URLs encontradas:`, baseApiMatches)
            for (const match of baseApiMatches) {
              const urlMatch = match.match(/['"]([^'"]*)['"]/);
              if (urlMatch) {
                apiEndpoints.add(urlMatch[1])
              }
            }
          }
          
          // Buscar configurações de axios/fetch
          const axiosConfigMatches = scriptContent.match(/axios\.defaults\.baseURL\s*=\s*['"]([^'"]*)['"]/g) ||
                                   scriptContent.match(/defaults\.baseURL\s*=\s*['"]([^'"]*)['"]/g)
          
          if (axiosConfigMatches) {
            console.log(`     ⚙️ Configurações axios encontradas:`, axiosConfigMatches)
            for (const match of axiosConfigMatches) {
              const urlMatch = match.match(/['"]([^'"]*)['"]/);
              if (urlMatch) {
                apiEndpoints.add(urlMatch[1])
              }
            }
          }
          
          // Buscar variáveis de ambiente ou constantes
          const envMatches = scriptContent.match(/REACT_APP_API[^=]*=\s*['"]([^'"]*)['"]/g) ||
                           scriptContent.match(/process\.env\.[^=]*=\s*['"]([^'"]*)['"]/g) ||
                           scriptContent.match(/API_URL[^=]*=\s*['"]([^'"]*)['"]/g)
          
          if (envMatches) {
            console.log(`     🌍 Variáveis de ambiente encontradas:`, envMatches)
            for (const match of envMatches) {
              const urlMatch = match.match(/['"]([^'"]*)['"]/);
              if (urlMatch) {
                apiEndpoints.add(urlMatch[1])
              }
            }
          }
          
          // Buscar endpoints específicos em funções
          const functionApiMatches = scriptContent.match(/['"`](https?:\/\/[^'"`]*api[^'"`]*\/[^'"`]*?)['"`]/g)
          
          if (functionApiMatches) {
            console.log(`     🔧 APIs em funções encontradas:`, functionApiMatches.slice(0, 5))
            for (const match of functionApiMatches) {
              const cleanUrl = match.replace(/['"`]/g, '')
              if (cleanUrl.includes('getinapp') || cleanUrl.includes('getin') || cleanUrl.includes('/api/')) {
                apiEndpoints.add(cleanUrl)
              }
            }
          }
          
          // Buscar padrões de rota específicos do GetIn
          const getinPatterns = [
            /"(\/api\/v\d+\/[^"]*)"/, 
            /"(\/manager\/[^"]*)"/, 
            /"(\/dashboard\/[^"]*)"/, 
            /"(\/user\/[^"]*)"/, 
            /"(\/session\/[^"]*)"/, 
            /"(\/authenticate[^"]*)"/, 
            /"(\/v\d+\/[^"]*)"/, 
            /"(https:\/\/[^"]*\.getinapp\.com\.br[^"]*)"/, 
            /"(https:\/\/api[^"]*\.getin[^"]*)"/, 
            /"(\/auth\/v\d+\/[^"]*)"/, 
            /"(\/reservation\/v\d+\/[^"]*)"/, 
            /"(\/units\/[^"]*)"/, 
            /"(\/bookings\/[^"]*)"/ 
          ]
          
          for (const pattern of getinPatterns) {
            const matches = scriptContent.match(pattern)
            if (matches) {
              console.log(`     ✅ Padrão GetIn encontrado:`, matches[1])
              apiEndpoints.add(matches[1])
            }
          }
          
          // Análise de objetos de configuração
          const configObjectMatches = scriptContent.match(/\{[^}]*api[^}]*\}/gi)
          if (configObjectMatches) {
            console.log(`     📋 ${configObjectMatches.length} objetos de config encontrados`)
            for (const configMatch of configObjectMatches.slice(0, 3)) { // Limitar para não sobrecarregar
              const urlMatches = configMatch.match(/['"]([^'"]*\/api[^'"]*)['"]/g)
              if (urlMatches) {
                for (const urlMatch of urlMatches) {
                  const cleanUrl = urlMatch.replace(/['"]/g, '')
                  apiEndpoints.add(cleanUrl)
                }
              }
            }
          }
        }
      } catch (scriptError) {
        console.log(`     ❌ Erro ao carregar script: ${scriptError}`)
      }
    }
    
    // Passo 4: Testar endpoints encontrados
    console.log('🧪 Passo 4: Testando endpoints encontrados...')
    
    const foundApis = Array.from(apiEndpoints) as string[]
    console.log('   📋 APIs encontradas:', foundApis)
    
    const workingEndpoints: Array<{
      url: string
      method: string
      status: number
      accessible: boolean
      content_type?: string | null
    }> = []
    
    for (const endpoint of foundApis.slice(0, 10)) { // Limitar a 10 para não sobrecarregar
      try {
        const testUrl = endpoint.startsWith('http') ? endpoint : 
                      endpoint.startsWith('/') ? `https://painel-reserva.getinapp.com.br${endpoint}` :
                      `https://painel-reserva.getinapp.com.br/${endpoint}`
        
        console.log(`   🧪 Testando: ${testUrl}`)
        
        // Teste GET primeiro
        const getResponse = await fetch(testUrl, {
          method: 'GET',
          headers: headers,
          signal: AbortSignal.timeout(5000)
        })
        
        if (getResponse.ok || getResponse.status === 401 || getResponse.status === 403) {
          workingEndpoints.push({
            url: testUrl,
            method: 'GET',
            status: getResponse.status,
            accessible: true
          })
          console.log(`     ✅ GET ${testUrl} - Status: ${getResponse.status}`)
        }
        
        // Teste POST se parece ser API de login
        if (endpoint.includes('login') || endpoint.includes('auth') || endpoint.includes('session')) {
          const postResponse = await fetch(testUrl, {
            method: 'POST',
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({}),
            signal: AbortSignal.timeout(5000)
          })
          
          if (postResponse.status !== 405) { // Se não for Method Not Allowed
            workingEndpoints.push({
              url: testUrl,
              method: 'POST',
              status: postResponse.status,
              accessible: true,
              content_type: postResponse.headers.get('content-type')
            })
            console.log(`     ✅ POST ${testUrl} - Status: ${postResponse.status}`)
          }
        }
        
      } catch (testError) {
        const errorMessage = testError instanceof Error ? testError.message : String(testError)
        console.log(`     ❌ Erro ao testar ${endpoint}:`, errorMessage)
      }
    }
    
    const duration = Date.now() - startTime
    console.log('🎉 === ANÁLISE SPA CONCLUÍDA ===')
    console.log('   ⏱️ Duração:', duration + 'ms')
    console.log('   📊 APIs encontradas:', foundApis.length)
    console.log('   ✅ Endpoints funcionais:', workingEndpoints.length)
    
    return NextResponse.json({
      success: true,
      analysis: {
        html_size: mainHtml.length,
        scripts_found: scriptUrls.length,
        apis_discovered: foundApis,
        working_endpoints: workingEndpoints,
        main_scripts: mainScriptUrls
      },
      recommendations: workingEndpoints.length > 0 ? 
        'Endpoints funcionais encontrados! Use-os para tentar login.' :
        'Aplicação SPA complexa. Considere usar Puppeteer ou Playwright.',
      performance: {
        duration_ms: duration,
        analysis_depth: 'full_spa_analysis'
      }
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ === ERRO NA ANÁLISE SPA ===')
    console.error('   ⏱️ Duração até erro:', duration + 'ms')
    console.error('   📝 Erro:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro na análise da SPA',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      debug_info: {
        duration_ms: duration,
        error_type: error instanceof Error ? error.constructor.name : typeof error
      }
    }, { status: 500 })
  }
} 