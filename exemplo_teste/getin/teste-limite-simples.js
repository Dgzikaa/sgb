const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

// Carregar .env.local
const envPath = path.join(__dirname, '../../frontend/.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const lines = envContent.split('\n')
  
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      process.env[key.trim()] = value
    }
  })
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function testeLimiteSimples() {
  console.log('🧪 TESTE DE LIMITE - REQUISIÇÕES SIMPLES')
  console.log('=======================================')
  
  // Buscar token
  const { data: credenciais } = await supabase
    .from('api_credentials')
    .select('api_token')
    .eq('sistema', 'getin')
    .eq('ambiente', 'producao')
    .single()

  const token = credenciais.api_token
  
  // Testar endpoints diferentes para ver se algum funciona
  const endpoints = [
    'https://api.getinapis.com/apis/v2/units',
    'https://api.getinapis.com/apis/v1/units', // Versão anterior
    'https://api.getinapis.com/health', // Health check
    'https://api.getinapis.com/status', // Status
    'https://api.getinapis.com/apis/v2/reservations?limit=1' // Limite mínimo
  ]
  
  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testando: ${endpoint}`)
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'apiKey': token,
          'Accept': 'application/json'
        }
      })
      
      console.log(`   Status: ${response.status} ${response.statusText}`)
      
      // Verificar headers de rate limit
      const rateLimitHeaders = {}
      for (const [key, value] of response.headers.entries()) {
        if (key.toLowerCase().includes('rate') || 
            key.toLowerCase().includes('limit') || 
            key.toLowerCase().includes('quota') ||
            key.toLowerCase().includes('remaining')) {
          rateLimitHeaders[key] = value
        }
      }
      
      if (Object.keys(rateLimitHeaders).length > 0) {
        console.log('   📊 Headers de Rate Limit:')
        Object.entries(rateLimitHeaders).forEach(([key, value]) => {
          console.log(`     ${key}: ${value}`)
        })
      }
      
      if (response.status === 200) {
        console.log('   🎉 SUCESSO! Este endpoint funciona!')
        break
      } else if (response.status === 429) {
        console.log('   ⚠️ Rate limit atingido!')
        const retryAfter = response.headers.get('retry-after')
        if (retryAfter) {
          console.log(`   ⏰ Retry after: ${retryAfter} segundos`)
        }
      } else if (response.status !== 401) {
        const text = await response.text()
        console.log(`   📄 Resposta: ${text.substring(0, 200)}...`)
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`)
    }
    
    // Pausa entre requisições para não bater rate limit
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n📋 ANÁLISE:')
  console.log('===========')
  console.log('Se TODOS retornaram 401: Token inválido')
  console.log('Se algum retornou 429: Rate limit atingido')
  console.log('Se algum retornou 200: Token válido, problema específico')
  console.log('Se algum retornou 403: Sem permissão para esse endpoint')
}

testeLimiteSimples()
