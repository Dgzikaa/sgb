/**
 * Script de teste da API GET IN
 * Testa conectividade e busca informações básicas
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente do .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '../../frontend/.env.local');
  
  console.log('🔍 Procurando arquivo .env.local em:', envPath);
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    let keysLoaded = 0;
    envLines.forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=').trim();
          
          // Remover aspas duplas se existirem
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          
          if (!process.env[key]) {
            process.env[key] = value;
            keysLoaded++;
            if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
              console.log(`✅ SUPABASE_SERVICE_ROLE_KEY carregada: ${value.substring(0, 20)}...`);
            }
          }
        }
      }
    });
    
    console.log(`✅ ${keysLoaded} variáveis de ambiente carregadas do .env.local`);
  } else {
    console.log('⚠️  Arquivo .env.local não encontrado em:', envPath);
  }
}

// Carregar variáveis de ambiente
loadEnvFile();

// Configuração do Supabase
const supabaseUrl = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔑 Verificando chave do Supabase...');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Chave encontrada: ${supabaseKey ? 'Sim' : 'Não'}`);
if (supabaseKey) {
  console.log(`   Chave (primeiros 20 chars): ${supabaseKey.substring(0, 20)}...`);
}

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente');
  console.error('💡 Certifique-se de que o arquivo frontend/.env.local existe e contém a chave');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Busca credenciais do GET IN no banco
 */
async function getGetInCredentials(barId = 3) {
  try {
    console.log(`🔍 Buscando credenciais GET IN para bar_id: ${barId}`);
    
    const { data, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', barId)
      .eq('sistema', 'getin')
      .eq('ativo', true)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar credenciais:', error);
      return null;
    }

    if (!data) {
      console.error('❌ Credenciais GET IN não encontradas');
      return null;
    }

    console.log('✅ Credenciais encontradas:', {
      id: data.id,
      bar_id: data.bar_id,
      sistema: data.sistema,
      ambiente: data.ambiente,
      base_url: data.base_url,
      username: data.username,
      api_token: data.api_token ? `${data.api_token.substring(0, 10)}...` : 'não encontrado'
    });

    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar credenciais:', error);
    return null;
  }
}

/**
 * Testa a API GET IN - busca todas as unidades
 */
async function testGetInAPI(credentials) {
  try {
    console.log('\n🧪 Testando API GET IN - Endpoint /units');
    
    // Usar sempre a URL da API, não a do painel
    const baseUrl = 'https://api.getinapis.com';
    const apiUrl = `${baseUrl}/apis/v2/units`;
    
    console.log(`📡 Fazendo requisição para: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': credentials.api_token,
        'Accept': 'application/json'
      }
    });

    console.log(`📊 Status da resposta: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API:', errorText);
      return null;
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('❌ Resposta não é JSON válido. Primeiros 200 caracteres:');
      const text = await response.text();
      console.error(text.substring(0, 200));
      return null;
    }
    
    console.log('✅ Resposta da API recebida com sucesso!');
    
    // Verificar se é uma resposta de sucesso do GET IN
    if (data.success && data.data) {
      console.log(`📈 Total de unidades encontradas: ${data.data.length || 0}`);
      
      if (data.data.length > 0) {
        console.log('\n📋 Primeira unidade (exemplo):');
        console.log(JSON.stringify(data.data[0], null, 2));
      }
      
      return data.data;
    } else {
      console.log(`📈 Total de unidades encontradas: ${data.length || 0}`);
      
      if (data.length > 0) {
        console.log('\n📋 Primeira unidade (exemplo):');
        console.log(JSON.stringify(data[0], null, 2));
      }
      
      return data;
    }
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
    return null;
  }
}

/**
 * Testa busca de uma unidade específica
 */
async function testGetInUnit(credentials, unitId) {
  try {
    console.log(`\n🧪 Testando API GET IN - Endpoint /units/${unitId}`);
    
    // Usar sempre a URL da API, não a do painel
    const baseUrl = 'https://api.getinapis.com';
    const apiUrl = `${baseUrl}/apis/v2/units/${unitId}`;
    
    console.log(`📡 Fazendo requisição para: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': credentials.api_token,
        'Accept': 'application/json'
      }
    });

    console.log(`📊 Status da resposta: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('✅ Dados da unidade recebidos com sucesso!');
    console.log(JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar unidade:', error);
    return null;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando teste da API GET IN');
  console.log('=' .repeat(50));

  // 1. Buscar credenciais
  const credentials = await getGetInCredentials();
  if (!credentials) {
    console.error('❌ Não foi possível obter as credenciais. Encerrando teste.');
    return;
  }

  // 2. Testar API - listar unidades
  const units = await testGetInAPI(credentials);
  if (!units || units.length === 0) {
    console.error('❌ Não foi possível obter dados das unidades. Encerrando teste.');
    return;
  }

  // 3. Testar busca de unidade específica (primeira da lista)
  if (units[0] && units[0].id) {
    await testGetInUnit(credentials, units[0].id);
  }

  console.log('\n✅ Teste concluído com sucesso!');
  console.log('=' .repeat(50));
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getGetInCredentials,
  testGetInAPI,
  testGetInUnit
};
