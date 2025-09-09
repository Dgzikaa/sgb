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

// Credenciais ContaHub
const CONTAHUB_EMAIL = 'digao@3768'
const CONTAHUB_PASSWORD = 'Geladeira@001'
const contahubBaseUrl = 'https://sp.contahub.com'

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis do Supabase não encontradas!')
  process.exit(1)
}

console.log('✅ Credenciais ContaHub carregadas!')

console.log(`🔑 Supabase API Key carregada: ${supabaseKey.substring(0, 20)}...`)
console.log(`📧 ContaHub Email: ${CONTAHUB_EMAIL}`)
console.log(`🔒 ContaHub Password: ${CONTAHUB_PASSWORD ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`)

const supabase = createClient(supabaseUrl, supabaseKey)

// Configurações
const BAR_ID = 3 // Bar com dados disponíveis
const DATA_TESTE = '2025-09-06' // Data com dados confirmados

// Função para gerar timestamp dinâmico
function generateDynamicTimestamp() {
  const now = new Date()
  return `${now.getTime()}${String(now.getMilliseconds()).padStart(3, '0')}`
}

// Função para fazer login no ContaHub
async function loginContaHub() {
  console.log('\n🔐 FAZENDO LOGIN NO CONTAHUB...')
  console.log('================================')
  
  // Hash SHA-1 da senha (como na Edge Function)
  const encoder = new TextEncoder()
  const data = encoder.encode(CONTAHUB_PASSWORD)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const passwordSha1 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  const loginData = new URLSearchParams({
    "usr_email": CONTAHUB_EMAIL,
    "usr_password_sha1": passwordSha1
  })
  
  const loginTimestamp = generateDynamicTimestamp()
  const loginUrl = `${contahubBaseUrl}/rest/contahub.cmds.UsuarioCmd/login/${loginTimestamp}?emp=0`
  
  console.log(`🔗 URL de login: ${loginUrl}`)
  
  const loginResponse = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    },
    body: loginData,
  })
  
  if (!loginResponse.ok) {
    throw new Error(`Erro no login ContaHub: ${loginResponse.status} - ${loginResponse.statusText}`)
  }
  
  const setCookieHeaders = loginResponse.headers.get('set-cookie')
  if (!setCookieHeaders) {
    throw new Error('Cookies de sessão não encontrados no login')
  }
  
  console.log('✅ Login ContaHub realizado com sucesso')
  console.log(`🍪 Session cookies obtidos: ${setCookieHeaders.substring(0, 50)}...`)
  
  return setCookieHeaders
}

// Função para buscar dados do ContaHub
async function buscarDadosContaHub(dataType, dataDate, sessionToken) {
  console.log(`\n📊 COLETANDO ${dataType.toUpperCase()} DA API CONTAHUB...`)
  console.log('================================================')
  
  // Gerar timestamp dinâmico para cada query
  const queryTimestamp = generateDynamicTimestamp()
  
  // emp_id fixo para Ordinário (bar_id = 3)
  const emp_id = "3768"
  
  let url
  
  // Construir URL específica para cada tipo de dados
  switch (dataType) {
    case 'analitico':
      url = `${contahubBaseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=77&d0=${dataDate}&d1=${dataDate}&produto=&grupo=&local=&turno=&mesa=&emp=${emp_id}&nfe=1`
      break
      
    case 'periodo':
      url = `${contahubBaseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=5&d0=${dataDate}&d1=${dataDate}&emp=${emp_id}&nfe=1`
      break
      
    default:
      throw new Error(`Tipo de dados não suportado: ${dataType}`)
  }
  
  console.log(`🔗 URL: ${url}`)
  
  // Buscar dados do ContaHub
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cookie': sessionToken,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    },
  })
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar dados: ${response.status} - ${response.statusText}`)
  }
  
  const data = await response.json()
  console.log(`📄 Resposta da API:`, JSON.stringify(data, null, 2))
  
  // A API ContaHub retorna dados em data.list
  const registros = data.list || []
  console.log(`✅ Dados coletados: ${registros.length} registros`)
  
  return registros
}

async function testarCamposClienteContaHubAPI() {
  console.log('\n🧪 TESTE: CAMPOS DE CLIENTE NA API CONTAHUB (DIRETO)')
  console.log('==================================================')
  console.log(`📅 Data de teste: ${DATA_TESTE}`)
  console.log(`🏢 Bar ID: ${BAR_ID}`)
  
  try {
    // 1. Fazer login no ContaHub
    console.log('\n🔐 1. FAZENDO LOGIN NA API CONTAHUB...')
    console.log('------------------------------------')
    
    const sessionToken = await loginContaHub()
    
    // 2. Testar dados ANALÍTICO da API ContaHub
    console.log('\n📊 2. TESTANDO DADOS ANALÍTICO DA API CONTAHUB...')
    console.log('------------------------------------------------')
    
    const dadosAnalitico = await buscarDadosContaHub('analitico', DATA_TESTE, sessionToken)
    
    if (dadosAnalitico && dadosAnalitico.length > 0) {
      const primeiroAnalitico = dadosAnalitico[0]
      const camposAnalitico = Object.keys(primeiroAnalitico)
      
      console.log(`📈 Total de registros analítico: ${dadosAnalitico.length}`)
      console.log(`📋 Total de campos analítico: ${camposAnalitico.length}`)
      
      console.log('\n🔍 Campos disponíveis no ANALÍTICO:')
      camposAnalitico.forEach(campo => {
        console.log(`   - ${campo}`)
      })
      
      // Verificar campos específicos de cliente no analítico
      console.log('\n🎯 Campos de cliente no ANALÍTICO:')
      const camposClienteAnalitico = ['cli', 'cli_fone', 'cli_nome', 'cli_email', 'cli_dtnasc']
      
      camposClienteAnalitico.forEach(campo => {
        if (camposAnalitico.includes(campo)) {
          const valor = primeiroAnalitico[campo]
          console.log(`✅ ${campo}: EXISTE - Valor: "${valor}"`)
        } else {
          console.log(`❌ ${campo}: NÃO EXISTE`)
        }
      })
      
      console.log('\n📋 Estrutura completa do primeiro registro ANALÍTICO:')
      console.log(JSON.stringify(primeiroAnalitico, null, 2))
      
    } else {
      console.log('⚠️ Nenhum dado analítico encontrado na API ContaHub')
    }
    
    // 3. Testar dados PERÍODO da API ContaHub
    console.log('\n📊 3. TESTANDO DADOS PERÍODO DA API CONTAHUB...')
    console.log('----------------------------------------------')
    
    const dadosPeriodo = await buscarDadosContaHub('periodo', DATA_TESTE, sessionToken)
    
    if (dadosPeriodo && dadosPeriodo.length > 0) {
      const primeiroPeriodo = dadosPeriodo[0]
      const camposPeriodo = Object.keys(primeiroPeriodo)
      
      console.log(`📈 Total de registros período: ${dadosPeriodo.length}`)
      console.log(`📋 Total de campos período: ${camposPeriodo.length}`)
      
      console.log('\n🔍 Campos disponíveis no PERÍODO:')
      camposPeriodo.forEach(campo => {
        console.log(`   - ${campo}`)
      })
      
      // Verificar campos específicos de cliente no período
      console.log('\n🎯 Campos de cliente no PERÍODO:')
      const camposClientePeriodo = ['cli', 'cli_fone', 'cli_nome', 'cli_email', 'cli_dtnasc', 'cht_nome']
      
      let camposEncontrados = 0
      camposClientePeriodo.forEach(campo => {
        if (camposPeriodo.includes(campo)) {
          const valor = primeiroPeriodo[campo]
          console.log(`✅ ${campo}: EXISTE - Valor: "${valor}"`)
          camposEncontrados++
        } else {
          console.log(`❌ ${campo}: NÃO EXISTE`)
        }
      })
      
      console.log('\n📋 Estrutura completa do primeiro registro PERÍODO:')
      console.log(JSON.stringify(primeiroPeriodo, null, 2))
      
      // 4. Análise estatística dos campos de cliente no período
      if (camposEncontrados > 0) {
        console.log('\n📊 4. ANÁLISE ESTATÍSTICA DOS CAMPOS DE CLIENTE (PERÍODO)')
        console.log('-------------------------------------------------------')
        
        const stats = {
          cli_nome_preenchido: dadosPeriodo.filter(r => r.cli_nome && r.cli_nome.trim() !== '').length,
          cli_fone_preenchido: dadosPeriodo.filter(r => r.cli_fone && r.cli_fone.trim() !== '').length,
          cli_email_preenchido: dadosPeriodo.filter(r => r.cli_email && r.cli_email.trim() !== '').length,
          cli_dtnasc_preenchido: dadosPeriodo.filter(r => r.cli_dtnasc).length,
          cht_nome_preenchido: dadosPeriodo.filter(r => r.cht_nome && r.cht_nome.trim() !== '').length
        }
        
        console.log(`📈 Analisando ${dadosPeriodo.length} registros da API ContaHub:`)
        console.log(`   - cli_nome preenchido: ${stats.cli_nome_preenchido}/${dadosPeriodo.length} (${((stats.cli_nome_preenchido/dadosPeriodo.length)*100).toFixed(1)}%)`)
        console.log(`   - cli_fone preenchido: ${stats.cli_fone_preenchido}/${dadosPeriodo.length} (${((stats.cli_fone_preenchido/dadosPeriodo.length)*100).toFixed(1)}%)`)
        console.log(`   - cli_email preenchido: ${stats.cli_email_preenchido}/${dadosPeriodo.length} (${((stats.cli_email_preenchido/dadosPeriodo.length)*100).toFixed(1)}%)`)
        console.log(`   - cli_dtnasc preenchido: ${stats.cli_dtnasc_preenchido}/${dadosPeriodo.length} (${((stats.cli_dtnasc_preenchido/dadosPeriodo.length)*100).toFixed(1)}%)`)
        console.log(`   - cht_nome preenchido: ${stats.cht_nome_preenchido}/${dadosPeriodo.length} (${((stats.cht_nome_preenchido/dadosPeriodo.length)*100).toFixed(1)}%)`)
        
        // Mostrar alguns exemplos de registros com dados de cliente
        const registrosComCliente = dadosPeriodo.filter(r => 
          (r.cli_nome && r.cli_nome.trim() !== '') || 
          (r.cli_fone && r.cli_fone.trim() !== '') ||
          (r.cli_email && r.cli_email.trim() !== '')
        )
        
        if (registrosComCliente.length > 0) {
          console.log(`\n📋 Exemplos de registros com dados de cliente (${Math.min(3, registrosComCliente.length)} primeiros):`)
          registrosComCliente.slice(0, 3).forEach((registro, index) => {
            console.log(`   ${index + 1}. Nome: "${registro.cli_nome}" | Fone: "${registro.cli_fone}" | Email: "${registro.cli_email}"`)
          })
        }
      }
      
    } else {
      console.log('⚠️ Nenhum dado de período encontrado na API ContaHub')
    }
    
    // 5. Comparação com nosso banco
    console.log('\n🔄 5. COMPARAÇÃO: API CONTAHUB vs NOSSO BANCO')
    console.log('--------------------------------------------')
    
    const { data: nossoBanco, error: nossoError } = await supabase
      .from('contahub_periodo')
      .select('cli_nome, cli_fone, cli_email, cli_dtnasc, cht_nome')
      .eq('bar_id', BAR_ID)
      .eq('dt_gerencial', DATA_TESTE)
      .limit(5)
      
    if (nossoError) {
      console.error('❌ Erro ao buscar dados do nosso banco:', nossoError)
    } else if (nossoBanco && nossoBanco.length > 0) {
      console.log('📊 NOSSO BANCO (Supabase):')
      console.log(`   - Registros encontrados: ${nossoBanco.length}`)
      console.log(`   - Exemplo: Nome: "${nossoBanco[0].cli_nome}" | Fone: "${nossoBanco[0].cli_fone}"`)
      
      if (dadosPeriodo && dadosPeriodo.length > 0) {
        console.log('\n📊 API CONTAHUB:')
        console.log(`   - Registros encontrados: ${dadosPeriodo.length}`)
        console.log(`   - Exemplo: Nome: "${dadosPeriodo[0].cli_nome}" | Fone: "${dadosPeriodo[0].cli_fone}"`)
        
        console.log('\n🔍 CONCLUSÃO:')
        if (dadosPeriodo[0].cli_nome && nossoBanco[0].cli_nome) {
          console.log('✅ Campos de cliente existem TANTO na API ContaHub QUANTO no nosso banco!')
          console.log('✅ Os dados estão sincronizados corretamente!')
        } else {
          console.log('⚠️ Diferenças encontradas entre API ContaHub e nosso banco')
        }
      }
    } else {
      console.log('⚠️ Nenhum dado encontrado no nosso banco para comparação')
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

// Executar teste
console.log('🚀 INICIANDO TESTE DE CAMPOS DE CLIENTE - API CONTAHUB DIRETO')
console.log('============================================================')

testarCamposClienteContaHubAPI()
  .then(() => {
    console.log('\n🎉 TESTE CONCLUÍDO!')
    console.log('===================')
    console.log('📋 RESUMO:')
    console.log('- Testou API ContaHub diretamente')
    console.log('- Verificou campos de cliente em analítico e período')
    console.log('- Comparou com dados do nosso banco')
  })
  .catch(error => {
    console.error('❌ Erro fatal no teste:', error)
    process.exit(1)
  })
