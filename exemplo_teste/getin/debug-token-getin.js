const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

// Carregar .env.local
const envPath = path.join(__dirname, '../../frontend/.env.local')
console.log(`🔍 Procurando .env.local em: ${envPath}`)

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
  console.log('✅ Arquivo .env.local carregado com sucesso!')
} else {
  console.error('❌ Arquivo .env.local não encontrado!')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis do Supabase não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugTokenGetin() {
  console.log('\n🔍 DEBUG TOKEN GETIN')
  console.log('===================')
  
  try {
    // Buscar credenciais
    const { data: credenciais, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'getin')
      .eq('ambiente', 'producao')
      .single()

    if (error || !credenciais) {
      console.error('❌ Erro ao buscar credenciais:', error)
      return
    }

    console.log('📋 Credenciais encontradas:')
    console.log(`   Sistema: ${credenciais.sistema}`)
    console.log(`   Ambiente: ${credenciais.ambiente}`)
    console.log(`   Username: ${credenciais.username}`)
    console.log(`   Token (primeiros 10 chars): ${credenciais.api_token?.substring(0, 10)}...`)
    console.log(`   Token (últimos 5 chars): ...${credenciais.api_token?.slice(-5)}`)
    console.log(`   Token length: ${credenciais.api_token?.length} chars`)
    console.log(`   Base URL: ${credenciais.base_url}`)
    console.log(`   Ativo: ${credenciais.ativo}`)

    // Teste 1: Endpoint simples
    console.log('\n🧪 TESTE 1: Endpoint /units')
    console.log('============================')
    
    const apiUrl = 'https://api.getinapis.com/apis/v2/units'
    console.log(`📡 URL: ${apiUrl}`)
    
    const headers = {
      'apiKey': credenciais.api_token,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'SGB-Debug/1.0'
    }
    
    console.log('📋 Headers enviados:')
    Object.entries(headers).forEach(([key, value]) => {
      if (key === 'apiKey') {
        console.log(`   ${key}: ${value.substring(0, 10)}...${value.slice(-5)}`)
      } else {
        console.log(`   ${key}: ${value}`)
      }
    })

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers
    })

    console.log(`\n📊 Resposta:`)
    console.log(`   Status: ${response.status} ${response.statusText}`)
    console.log(`   Headers:`)
    for (const [key, value] of response.headers.entries()) {
      console.log(`     ${key}: ${value}`)
    }

    const responseText = await response.text()
    console.log(`   Body (primeiros 500 chars):`)
    console.log(`   ${responseText.substring(0, 500)}`)

    if (response.status === 401) {
      console.log('\n🚨 ANÁLISE DO ERRO 401:')
      console.log('========================')
      console.log('Possíveis causas:')
      console.log('1. Token expirado ou inválido')
      console.log('2. Formato do header incorreto')
      console.log('3. IP bloqueado')
      console.log('4. Conta suspensa')
      console.log('5. API mudou de versão')
      
      // Teste com diferentes formatos de header
      console.log('\n🧪 TESTE 2: Diferentes formatos de header')
      console.log('==========================================')
      
      const testHeaders = [
        { 'Authorization': `Bearer ${credenciais.api_token}` },
        { 'X-API-Key': credenciais.api_token },
        { 'api-key': credenciais.api_token },
        { 'API-KEY': credenciais.api_token }
      ]
      
      for (let i = 0; i < testHeaders.length; i++) {
        const testHeader = { ...testHeaders[i], 'Accept': 'application/json' }
        console.log(`\nTeste ${i + 1}: ${Object.keys(testHeader)[0]}`)
        
        try {
          const testResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: testHeader
          })
          console.log(`   Status: ${testResponse.status} ${testResponse.statusText}`)
        } catch (error) {
          console.log(`   Erro: ${error.message}`)
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro no debug:', error)
  }
}

// Executar debug
debugTokenGetin()
