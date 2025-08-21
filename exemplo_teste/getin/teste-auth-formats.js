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

async function testeFormatsAuth() {
  console.log('🧪 TESTE DE FORMATOS DE AUTENTICAÇÃO')
  console.log('====================================')
  
  // Buscar token
  const { data: credenciais } = await supabase
    .from('api_credentials')
    .select('api_token')
    .eq('sistema', 'getin')
    .eq('ambiente', 'producao')
    .single()

  const token = credenciais.api_token
  const apiUrl = 'https://api.getinapis.com/apis/v2/units'
  
  // Baseado no www-authenticate: Key, vamos tentar formatos específicos
  const testCases = [
    {
      name: 'Key header direto',
      headers: { 'Key': token }
    },
    {
      name: 'Authorization Key',
      headers: { 'Authorization': `Key ${token}` }
    },
    {
      name: 'Authorization Token',
      headers: { 'Authorization': `Token ${token}` }
    },
    {
      name: 'Authorization API-Key',
      headers: { 'Authorization': `API-Key ${token}` }
    },
    {
      name: 'apiKey (formato atual)',
      headers: { 'apiKey': token }
    },
    {
      name: 'X-Auth-Token',
      headers: { 'X-Auth-Token': token }
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`\n🔍 Testando: ${testCase.name}`)
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          ...testCase.headers,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      console.log(`   Status: ${response.status} ${response.statusText}`)
      
      if (response.status === 200) {
        console.log('   🎉 SUCESSO! Este formato funciona!')
        const data = await response.json()
        console.log(`   Dados recebidos: ${JSON.stringify(data).substring(0, 200)}...`)
        break
      } else if (response.status !== 401) {
        console.log('   ⚠️ Status diferente de 401 - pode ser progresso!')
        const text = await response.text()
        console.log(`   Resposta: ${text.substring(0, 100)}...`)
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`)
    }
  }
}

testeFormatsAuth()
