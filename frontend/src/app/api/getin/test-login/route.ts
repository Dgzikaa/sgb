import { NextRequest, NextResponse } from 'next/server'

// ========================================
// 🧪 POST /api/getin/test-login - Teste de login direto
// ========================================
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('🧪 Testando login direto no GetIn')
    console.log('📧 Email:', email)
    console.log('🔒 Senha:', password ? '***' : 'vazio')
    
    // Teste com diferentes variações de headers
    const variations = [
      {
        name: 'Headers Básicos',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
      {
        name: 'Headers com User-Agent',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      },
      {
        name: 'Headers Completos',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': 'https://agent.getin.com.br',
          'Referer': 'https://agent.getin.com.br/login'
        }
      }
    ]
    
    const results = []
    
    for (const variation of variations) {
      console.log(`\n🔄 Testando: ${variation.name}`)
      
      try {
        const response = await fetch('https://painel-reserva.getinapp.com.br/login', {
          method: 'POST',
          headers: variation.headers as HeadersInit,
          body: JSON.stringify({
            login: email, // GetIn usa 'login' não 'email'
            password: password
          })
        })
        
        const data = await response.json()
        
        results.push({
          variation: variation.name,
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          data: data
        })
        
        console.log(`✅ ${variation.name} - Status: ${response.status}`)
        console.log(`📊 Resposta:`, data)
        
      } catch (error) {
        console.log(`❌ ${variation.name} - Erro:`, error)
        results.push({
          variation: variation.name,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      results: results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 