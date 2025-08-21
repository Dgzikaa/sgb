/**
 * Script completo para testar toda a cadeia de sincronização do Getin
 * 1. Testa a Edge Function diretamente
 * 2. Testa a API route do trigger
 * 3. Verifica os dados no banco
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente
function loadEnvFile() {
  const envPath = path.join(__dirname, '../../frontend/.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    envLines.forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=').trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    });
  }
}

async function testEdgeFunction() {
  console.log('🧪 1. Testando Edge Function diretamente...')
  console.log('-'.repeat(50))
  
  try {
    const functionUrl = process.env.SUPABASE_FUNCTION_URL + '/getin-sync-continuous'
    console.log(`📡 URL: ${functionUrl}`)
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Edge Function funcionando!')
      console.log(`📊 Encontradas: ${result.stats?.total_encontrados || 0}`)
      console.log(`📊 Salvas: ${result.stats?.total_salvos || 0}`)
      return true
    } else {
      console.log('❌ Edge Function com erro:', response.status)
      return false
    }
  } catch (error) {
    console.log('❌ Erro na Edge Function:', error.message)
    return false
  }
}

async function testApiRoute() {
  console.log('\n🧪 2. Testando API Route do trigger...')
  console.log('-'.repeat(50))
  
  try {
    // URL local ou produção
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/trigger-getin-sync`
      : 'http://localhost:3000/api/trigger-getin-sync'
    
    console.log(`📡 URL: ${apiUrl}`)
    
    const response = await fetch(apiUrl)

    if (response.ok) {
      const result = await response.json()
      console.log('✅ API Route funcionando!')
      console.log(`📊 Resultado:`, result)
      return true
    } else {
      console.log('❌ API Route com erro:', response.status)
      const errorText = await response.text()
      console.log('📋 Erro:', errorText)
      return false
    }
  } catch (error) {
    console.log('❌ Erro na API Route:', error.message)
    return false
  }
}

async function checkDatabase() {
  console.log('\n🧪 3. Verificando dados no banco...')
  console.log('-'.repeat(50))
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Verificar total de reservas
    const { data: totalData, error: totalError } = await supabase
      .from('getin_reservations')
      .select('id', { count: 'exact', head: true })

    if (totalError) {
      console.log('❌ Erro ao consultar total:', totalError.message)
      return false
    }

    console.log(`📊 Total de reservas no banco: ${totalData?.length || 0}`)

    // Verificar reservas recentes (últimas 24h)
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)
    const ontemStr = ontem.toISOString().split('T')[0]

    const { data: recentData, error: recentError } = await supabase
      .from('getin_reservations')
      .select('reservation_id, customer_name, reservation_date, status')
      .gte('reservation_date', ontemStr)
      .order('reservation_date', { ascending: false })
      .limit(5)

    if (recentError) {
      console.log('❌ Erro ao consultar recentes:', recentError.message)
      return false
    }

    console.log(`📊 Reservas desde ${ontemStr}: ${recentData?.length || 0}`)
    
    if (recentData && recentData.length > 0) {
      console.log('📋 Últimas 5 reservas:')
      recentData.forEach((reserva, index) => {
        console.log(`   ${index + 1}. ${reserva.customer_name} - ${reserva.reservation_date} (${reserva.status})`)
      })
    }

    return true
  } catch (error) {
    console.log('❌ Erro no banco:', error.message)
    return false
  }
}

async function runCompleteTest() {
  console.log('🚀 TESTE COMPLETO - SINCRONIZAÇÃO GETIN')
  console.log('='.repeat(60))
  console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`)
  
  // Carregar variáveis de ambiente
  loadEnvFile()
  console.log('✅ Variáveis de ambiente carregadas')

  const results = {
    edgeFunction: false,
    apiRoute: false,
    database: false
  }

  // Teste 1: Edge Function
  results.edgeFunction = await testEdgeFunction()

  // Teste 2: API Route (opcional, pode não estar rodando localmente)
  results.apiRoute = await testApiRoute()

  // Teste 3: Banco de dados
  results.database = await checkDatabase()

  // Resumo
  console.log('\n🎯 RESUMO DOS TESTES')
  console.log('='.repeat(60))
  console.log(`📡 Edge Function: ${results.edgeFunction ? '✅ OK' : '❌ ERRO'}`)
  console.log(`🔗 API Route: ${results.apiRoute ? '✅ OK' : '❌ ERRO'}`)
  console.log(`🗄️  Banco de Dados: ${results.database ? '✅ OK' : '❌ ERRO'}`)

  const successCount = Object.values(results).filter(Boolean).length
  const totalTests = Object.keys(results).length

  console.log(`\n📊 Resultado: ${successCount}/${totalTests} testes passaram`)

  if (successCount === totalTests) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente.')
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique os logs acima.')
  }

  console.log(`⏰ Concluído em: ${new Date().toLocaleString('pt-BR')}`)
}

// Executar se chamado diretamente
if (require.main === module) {
  runCompleteTest().catch(console.error)
}

module.exports = { runCompleteTest }
