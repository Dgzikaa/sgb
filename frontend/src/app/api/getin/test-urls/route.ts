import { NextRequest, NextResponse } from 'next/server'

// ========================================
// 🔍 POST /api/getin/test-urls - Testar diferentes URLs da API
// ========================================
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('🔍 Testando diferentes URLs da API GetIn')
    
    // Possíveis URLs da API GetIn
    const urlsToTest = [
      // URLs atuais e variações
      'https://agent.getinapis.com/auth/v1/login',
      'https://agent.getinapis.com/api/auth/v1/login',
      'https://agent.getinapis.com/v1/auth/login',
      'https://agent.getinapis.com/login',
      'https://agent.getinapis.com/api/login',
      
      // URLs com diferentes domínios
      'https://api.getin.com.br/auth/v1/login',
      'https://api.getin.com.br/v1/auth/login',
      'https://api.getin.com.br/login',
      
      // URLs com agent no domínio
      'https://agent.getin.com.br/api/auth/v1/login',
      'https://agent.getin.com.br/auth/v1/login',
      'https://agent.getin.com.br/api/login',
      'https://agent.getin.com.br/login',
      
      // URLs sem versão
      'https://agent.getinapis.com/auth/login',
      'https://agent.getinapis.com/api/auth/login',
      
      // URLs com diferentes versões
      'https://agent.getinapis.com/auth/v2/login',
      'https://agent.getinapis.com/api/auth/v2/login',
    ]
    
    const results = []
    
    for (const url of urlsToTest) {
      console.log(`\n🔄 Testando URL: ${url}`)
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          body: JSON.stringify({
            email: email,
            password: password
          })
        })
        
        let data
        try {
          data = await response.json()
        } catch (jsonError) {
          data = { error: 'Resposta não é JSON válido' }
        }
        
        results.push({
          url: url,
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: data,
          isJson: typeof data === 'object' && data !== null
        })
        
        console.log(`   Status: ${response.status} - ${response.statusText}`)
        if (response.ok) {
          console.log(`   ✅ URL funcionou!`)
        } else if (response.status === 404) {
          console.log(`   ❌ Endpoint não encontrado`)
        } else if (response.status === 401) {
          console.log(`   🔐 Credenciais rejeitadas`)
        } else {
          console.log(`   ⚠️  Outro erro: ${response.status}`)
        }
        
      } catch (error) {
        console.log(`   ❌ Erro de conexão: ${error}`)
        results.push({
          url: url,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          networkError: true
        })
      }
      
      // Pequena pausa entre requisições para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Analisar resultados
    const workingUrls = results.filter(r => r.ok)
    const authErrors = results.filter(r => r.status === 401)
    const notFoundErrors = results.filter(r => r.status === 404)
    const networkErrors = results.filter(r => r.networkError)
    
    console.log('\n📊 Resumo dos testes:')
    console.log(`   ✅ URLs funcionando: ${workingUrls.length}`)
    console.log(`   🔐 Erros de autenticação: ${authErrors.length}`)
    console.log(`   ❌ Não encontrados: ${notFoundErrors.length}`)
    console.log(`   🌐 Erros de rede: ${networkErrors.length}`)
    
    return NextResponse.json({
      success: true,
      results: results,
      summary: {
        total: results.length,
        working: workingUrls.length,
        authErrors: authErrors.length,
        notFound: notFoundErrors.length,
        networkErrors: networkErrors.length
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Erro no teste de URLs:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 