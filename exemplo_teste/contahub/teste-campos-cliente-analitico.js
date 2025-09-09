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

console.log(`🔑 API Key carregada: ${supabaseKey.substring(0, 20)}...`)

const supabase = createClient(supabaseUrl, supabaseKey)

// Configurações
const BAR_ID = 3 // Bar com dados disponíveis
const DATA_TESTE = '2025-09-08' // Data de ontem (menos movimentada)

async function testarCamposCliente() {
  console.log('\n🧪 TESTE: CAMPOS DE CLIENTE NO CONTAHUB ANALÍTICO')
  console.log('=================================================')
  console.log(`📅 Data de teste: ${DATA_TESTE}`)
  console.log(`🏢 Bar ID: ${BAR_ID}`)
  
  try {
    // 1. Verificar estrutura da tabela
    console.log('\n📋 1. VERIFICANDO ESTRUTURA DA TABELA...')
    console.log('----------------------------------------')
    
    const { data: colunas, error: errorColunas } = await supabase
      .rpc('sql', {
        query: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'contahub_analitico' 
          ORDER BY ordinal_position
        `
      })

    if (errorColunas) {
      console.error('❌ Erro ao verificar estrutura:', errorColunas)
      // Tentar método alternativo
      console.log('🔄 Tentando método alternativo...')
      
      const { data: sample, error: sampleError } = await supabase
        .from('contahub_analitico')
        .select('*')
        .limit(1)
        
      if (sampleError) {
        console.error('❌ Erro ao buscar amostra:', sampleError)
        return
      }
      
      if (sample && sample.length > 0) {
        console.log('📊 Colunas encontradas na amostra:')
        Object.keys(sample[0]).forEach(col => {
          console.log(`   - ${col}`)
        })
      }
    } else {
      console.log('📊 Estrutura da tabela contahub_analitico:')
      colunas.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`)
      })
    }

    // 2. Verificar se existem campos relacionados a cliente
    console.log('\n🔍 2. PROCURANDO CAMPOS RELACIONADOS A CLIENTE...')
    console.log('------------------------------------------------')
    
    const { data: sample, error: sampleError } = await supabase
      .from('contahub_analitico')
      .select('*')
      .eq('bar_id', BAR_ID)
      .eq('trn_dtgerencial', DATA_TESTE)
      .limit(5)
      
    if (sampleError) {
      console.error('❌ Erro ao buscar dados:', sampleError)
      return
    }
    
    if (!sample || sample.length === 0) {
      console.log('⚠️ Nenhum dado encontrado para a data especificada')
      
      // Tentar buscar qualquer data disponível
      console.log('🔄 Buscando dados de qualquer data...')
      const { data: anySample, error: anyError } = await supabase
        .from('contahub_analitico')
        .select('*')
        .eq('bar_id', BAR_ID)
        .limit(5)
        
      if (anyError || !anySample || anySample.length === 0) {
        console.log('❌ Nenhum dado encontrado na tabela para este bar')
        return
      }
      
      console.log(`✅ Encontrados ${anySample.length} registros de exemplo`)
      sample = anySample
    } else {
      console.log(`✅ Encontrados ${sample.length} registros para ${DATA_TESTE}`)
    }

    // 3. Analisar campos disponíveis
    console.log('\n📊 3. ANÁLISE DOS CAMPOS DISPONÍVEIS')
    console.log('-----------------------------------')
    
    const primeiroRegistro = sample[0]
    const campos = Object.keys(primeiroRegistro)
    
    console.log(`📈 Total de campos: ${campos.length}`)
    console.log('\n🔍 Campos que podem conter informações de cliente:')
    
    const camposCliente = campos.filter(campo => 
      campo.toLowerCase().includes('cli') || 
      campo.toLowerCase().includes('client') ||
      campo.toLowerCase().includes('customer') ||
      campo.toLowerCase().includes('nome') ||
      campo.toLowerCase().includes('fone') ||
      campo.toLowerCase().includes('phone') ||
      campo.toLowerCase().includes('tel')
    )
    
    if (camposCliente.length > 0) {
      console.log('✅ Campos relacionados a cliente encontrados:')
      camposCliente.forEach(campo => {
        const valor = primeiroRegistro[campo]
        console.log(`   - ${campo}: ${valor}`)
      })
    } else {
      console.log('❌ Nenhum campo relacionado a cliente encontrado')
    }

    // 4. Verificar campos específicos solicitados
    console.log('\n🎯 4. VERIFICAÇÃO DOS CAMPOS ESPECÍFICOS')
    console.log('---------------------------------------')
    
    const camposSolicitados = ['cli', 'cli_fone', 'cli_nome']
    
    camposSolicitados.forEach(campo => {
      if (campos.includes(campo)) {
        const valor = primeiroRegistro[campo]
        console.log(`✅ ${campo}: EXISTE - Valor: ${valor}`)
      } else {
        console.log(`❌ ${campo}: NÃO EXISTE`)
      }
    })

    // 5. Mostrar estrutura completa do primeiro registro
    console.log('\n📋 5. ESTRUTURA COMPLETA DO PRIMEIRO REGISTRO')
    console.log('--------------------------------------------')
    console.log('JSON completo:')
    console.log(JSON.stringify(primeiroRegistro, null, 2))

    // 6. Testar consulta via API (simulando frontend)
    console.log('\n🌐 6. TESTE VIA API (SIMULANDO FRONTEND)')
    console.log('---------------------------------------')
    
    try {
      // Simular chamada da API
      const response = await fetch(`${supabaseUrl.replace('/v1', '')}/rest/v1/contahub_analitico?bar_id=eq.${BAR_ID}&trn_dtgerencial=eq.${DATA_TESTE}&limit=3`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const apiData = await response.json()
        console.log(`✅ API respondeu com ${apiData.length} registros`)
        
        if (apiData.length > 0) {
          console.log('📊 Campos disponíveis via API:')
          Object.keys(apiData[0]).forEach(campo => {
            console.log(`   - ${campo}`)
          })
          
          // Verificar campos específicos via API
          console.log('\n🎯 Campos específicos via API:')
          camposSolicitados.forEach(campo => {
            if (apiData[0].hasOwnProperty(campo)) {
              console.log(`✅ ${campo}: ${apiData[0][campo]}`)
            } else {
              console.log(`❌ ${campo}: NÃO DISPONÍVEL`)
            }
          })
        }
      } else {
        console.log(`❌ API retornou erro: ${response.status} - ${response.statusText}`)
      }
    } catch (apiError) {
      console.log(`⚠️ Erro ao testar API: ${apiError.message}`)
    }

    // 7. Estatísticas gerais
    console.log('\n📈 7. ESTATÍSTICAS GERAIS')
    console.log('------------------------')
    
    const { count, error: countError } = await supabase
      .from('contahub_analitico')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', BAR_ID)
      .eq('trn_dtgerencial', DATA_TESTE)
      
    if (!countError) {
      console.log(`📊 Total de registros para ${DATA_TESTE}: ${count}`)
    }
    
    const { count: totalCount, error: totalError } = await supabase
      .from('contahub_analitico')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', BAR_ID)
      
    if (!totalError) {
      console.log(`📊 Total de registros no bar ${BAR_ID}: ${totalCount}`)
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

// Executar teste
console.log('🚀 INICIANDO TESTE DE CAMPOS DE CLIENTE')
console.log('======================================')

testarCamposCliente()
  .then(() => {
    console.log('\n🎉 TESTE CONCLUÍDO!')
    console.log('===================')
  })
  .catch(error => {
    console.error('❌ Erro fatal no teste:', error)
    process.exit(1)
  })
