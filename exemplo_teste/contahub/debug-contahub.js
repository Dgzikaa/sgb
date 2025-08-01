// Script de debug para testar ContaHub API + Batch Sizes
const { createClient } = require('@supabase/supabase-js');
// Usando fetch nativo do Node.js 18+

// Configurações
const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTExNjYsImV4cCI6MjA2Njg4NzE2Nn0.59x53jDOpNe9yVevnP-TcXr6Dkj0QjU8elJb636xV6M';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Credenciais ContaHub (mesmo que na Edge Function)
const CONTAHUB_EMAIL = 'digao@3768';
const CONTAHUB_PASSWORD = 'Geladeira@001';
const CONTAHUB_BASE_URL = 'https://sp.contahub.com';

// Função para gerar timestamp dinâmico (igual à Edge Function)
function generateDynamicTimestamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(now.getMilliseconds()).padStart(3, '0')}`;
}

// Função para hash SHA1 (igual à Edge Function)
async function sha1Hash(text) {
  const crypto = require('crypto');
  return crypto.createHash('sha1').update(text).digest('hex');
}

// Função para fazer login no ContaHub (exatamente como na Edge Function)
async function loginContaHub() {
  console.log('🔑 Fazendo login no ContaHub via API REST...');
  
  try {
    // Criar hash SHA1 da senha (como na Edge Function)
    const passwordSha1 = await sha1Hash(CONTAHUB_PASSWORD);
    console.log(`🔑 Password SHA1: ${passwordSha1.substring(0, 10)}...`);
    
    // Criar dados de login em URLSearchParams (como na Edge Function)
    const loginData = new URLSearchParams({
      "usr_email": CONTAHUB_EMAIL,
      "usr_password_sha1": passwordSha1
    });
    
    // Gerar timestamp dinâmico (como na Edge Function)
    const loginTimestamp = generateDynamicTimestamp();
    const loginUrl = `${CONTAHUB_BASE_URL}/rest/contahub.cmds.UsuarioCmd/login/${loginTimestamp}?emp=0`;
    console.log(`🌐 URL: ${loginUrl}`);
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      body: loginData
    });

    console.log(`📊 Status da resposta: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Resposta de erro: ${errorText}`);
      throw new Error(`Login falhou: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const sessionData = await response.text();
    console.log('📝 Resposta do login (primeiros 200 chars):', sessionData.substring(0, 200));
    
    // Extrair cookies do header (como na Edge Function)
    const setCookieHeaders = response.headers.get('set-cookie');
    console.log('🍪 Set-Cookie headers:', setCookieHeaders);

    if (response.status === 200) {
      console.log('✅ Login bem-sucedido - API REST retornou 200');
      return setCookieHeaders; // Retornar cookies para usar nas próximas requisições
    } else {
      throw new Error('Login não retornou status 200');
    }

  } catch (error) {
    console.error('❌ Erro detalhado no login:', {
      message: error.message,
      cause: error.cause
    });
    throw error;
  }
}

// Função para fazer requisições ao ContaHub (igual à Edge Function)
async function fetchContaHubData(url, sessionToken) {
  console.log(`🔗 Fazendo requisição: ${url}`);
  console.log(`🍪 Cookies: ${sessionToken?.substring(0, 100)}...`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cookie': sessionToken, // sessionToken já são os cookies completos
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    },
  });
  
  console.log(`📡 Status da resposta: ${response.status}`);
  console.log(`📄 Headers da resposta:`, Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`❌ Erro na resposta: ${errorText.substring(0, 200)}`);
    throw new Error(`Erro na requisição ContaHub: ${response.statusText}`);
  }
  
  const responseText = await response.text();
  console.log(`📄 Resposta (primeiros 200 chars): ${responseText.substring(0, 200)}`);
  
  return JSON.parse(responseText);
}

// Função para buscar dados analíticos (exatamente como na Edge Function)
async function fetchAnaliticoData(sessionToken, dataFormatted = '31.07.2025') {
  console.log('📊 Buscando dados analíticos...');
  
  const start_date = dataFormatted.split('.').reverse().join('-');
  const end_date = dataFormatted.split('.').reverse().join('-');
  const queryTimestamp = generateDynamicTimestamp();
  const analiticUrl = `${CONTAHUB_BASE_URL}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=77&d0=${start_date}&d1=${end_date}&produto=&grupo=&local=&turno=&mesa=&emp=3768&nfe=1`;
  
  console.log(`🔗 URL Analítico: ${analiticUrl}`);
  
  try {
    const analiticData = await fetchContaHubData(analiticUrl, sessionToken);
    console.log('✅ Dados analíticos obtidos do ContaHub');
    
    // Debug: verificar tamanho e estrutura dos dados
    const dataSize = JSON.stringify(analiticData).length;
    const recordCount = Array.isArray(analiticData) ? analiticData.length : (analiticData?.list?.length || 0);
    console.log(`📊 Debug - Tamanho: ${dataSize} chars, Registros: ${recordCount}`);
    
    return analiticData;
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados analíticos:', JSON.stringify(error, null, 2));
    throw error;
  }
}

// Função para testar salvamento em batch com dados do ContaHub
async function testBatchWithContaHubData(batchSize, contaHubData) {
  console.log(`\n🧪 TESTE: Batch de ${batchSize} registros do ContaHub`);
  
  if (!contaHubData || !contaHubData.list || contaHubData.list.length === 0) {
    console.log('❌ Sem dados do ContaHub para testar');
    return false;
  }
  
  // Pegar só os registros necessários para o teste
  const dataToTest = contaHubData.list.slice(0, batchSize);
  
  const testData = {
    bar_id: 3,
    data_type: `batch_test_${batchSize}`,
    data_date: '2025-08-01',
    raw_json: { list: dataToTest },
    processed: false
  };
  
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('contahub_raw_data')
      .insert(testData);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (error) {
      console.error(`❌ FALHOU: Batch ${batchSize} - Erro:`, error.message);
      return false;
    }
    
    console.log(`✅ SUCESSO: Batch ${batchSize} em ${duration}ms`);
    
    // Limpar dados de teste
    await supabase
      .from('contahub_raw_data')
      .delete()
      .eq('data_type', `batch_test_${batchSize}`);
    
    return true;
  } catch (err) {
    console.error(`❌ EXCEÇÃO: Batch ${batchSize} -`, err.message);
    return false;
  }
}

// Executar teste completo: ContaHub API → Batch Size Testing
async function runCompleteTest() {
  console.log('🚀 TESTE COMPLETO: ContaHub API + Batch Sizes\n');
  
  try {
    // 1. Login no ContaHub
    const sessionToken = await loginContaHub();
    
    // 2. Buscar dados analíticos
    const contaHubData = await fetchAnaliticoData(sessionToken, '31.07.2025');
    
    if (!contaHubData || !contaHubData.list || contaHubData.list.length === 0) {
      console.log('❌ Nenhum dado encontrado no ContaHub para testar');
      return;
    }
    
    console.log(`\n📊 DADOS OBTIDOS: ${contaHubData.list.length} registros`);
    console.log('📝 Estrutura do primeiro registro:', JSON.stringify(contaHubData.list[0], null, 2));
    
    // 3. Testar batch sizes progressivos com dados reais
    console.log('\n🧪 TESTANDO BATCH SIZES...\n');
    
    const batchSizes = [10, 50, 100, 200, 500, 1000];
    const results = {};
    
    for (const size of batchSizes) {
      // Verificar se temos registros suficientes
      if (size > contaHubData.list.length) {
        console.log(`⚠️  Batch ${size}: Pulando (só temos ${contaHubData.list.length} registros)`);
        break;
      }
      
      const success = await testBatchWithContaHubData(size, contaHubData);
      results[size] = success;
      
      if (!success) {
        console.log(`🚨 LIMITE ENCONTRADO: Batch size ${size} falhou!`);
        break;
      }
      
      // Pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 4. Resumo dos resultados
    console.log('\n📊 RESUMO DOS TESTES:');
    for (const [size, success] of Object.entries(results)) {
      console.log(`${success ? '✅' : '❌'} Batch ${size}: ${success ? 'OK' : 'FALHOU'}`);
    }
    
    // 5. Recomendação
    const workingSizes = Object.entries(results)
      .filter(([size, success]) => success)
      .map(([size]) => parseInt(size));
    
    if (workingSizes.length > 0) {
      const maxWorking = Math.max(...workingSizes);
      console.log(`\n🎯 RECOMENDAÇÃO: Use batch size até ${maxWorking}`);
      
      // 6. Teste final simulando Edge Function
      console.log(`\n🧪 TESTE FINAL: Simulando salvamento completo...`);
      await testCompleteDataSave(contaHubData, maxWorking);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste completo:', error.message);
  }
  
  console.log('\n🏁 Teste completo finalizado!');
}

// Função para testar salvamento completo dos dados (como na Edge Function)
async function testCompleteDataSave(contaHubData, batchSize) {
  console.log(`📦 Salvando todos os ${contaHubData.list.length} registros em batches de ${batchSize}...`);
  
  const startTime = Date.now();
  let totalSaved = 0;
  let batchNumber = 1;
  
  // Dividir em batches e salvar (como na saveRawData da Edge Function)
  for (let i = 0; i < contaHubData.list.length; i += batchSize) {
    const batch = contaHubData.list.slice(i, i + batchSize);
    const totalBatches = Math.ceil(contaHubData.list.length / batchSize);
    
    console.log(`💾 Salvando batch ${batchNumber}/${totalBatches} (${batch.length} registros)...`);
    
    const testData = {
      bar_id: 3,
      data_type: `analitico_batch_${batchNumber}`,
      data_date: '2025-07-31',
      raw_json: { list: batch },
      processed: false
    };
    
    try {
      const { error } = await supabase
        .from('contahub_raw_data')
        .insert(testData);
      
      if (error) {
        console.error(`❌ Falhou no batch ${batchNumber}:`, error.message);
        return false;
      }
      
      totalSaved += batch.length;
      console.log(`✅ Batch ${batchNumber} salvo (${batch.length} registros)`);
      
      // Pausa entre batches (como na Edge Function)
      if (i + batchSize < contaHubData.list.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (err) {
      console.error(`❌ Exceção no batch ${batchNumber}:`, err.message);
      return false;
    }
    
    batchNumber++;
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`\n📊 RESULTADO FINAL:`);
  console.log(`- Total salvo: ${totalSaved} registros`);
  console.log(`- Tempo total: ${duration}ms (${Math.round(duration/1000)}s)`);
  console.log(`- Batches criados: ${batchNumber - 1}`);
  console.log(`- Média por batch: ${Math.round(duration/(batchNumber-1))}ms`);
  
  return true;
}

// Executar
runCompleteTest().catch(console.error);