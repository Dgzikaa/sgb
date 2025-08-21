/**
 * Script de teste específico para endpoint de reservas GET IN
 * Testa diferentes combinações de URL e parâmetros
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente do .env.local
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
          
          // Remover aspas duplas se existirem
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }
}

loadEnvFile();

const supabase = createClient(
  'https://uqtgsvujwcbymjmvkjhy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Busca credenciais do GET IN
 */
async function getGetInCredentials() {
  const { data, error } = await supabase
    .from('api_credentials')
    .select('*')
    .eq('bar_id', 3)
    .eq('sistema', 'getin')
    .eq('ativo', true)
    .single();

  if (error || !data) {
    console.error('❌ Credenciais não encontradas:', error);
    return null;
  }

  return data;
}

/**
 * Testa diferentes URLs e parâmetros para reservas
 */
async function testReservationsEndpoint(credentials) {
  const unitId = 'M1mAGM13'; // ID da unidade do Ordinário
  
  // Diferentes combinações para testar
  const testCases = [
    {
      name: 'API com unit_id e período',
      baseUrl: 'https://api.getinapis.com',
      endpoint: '/apis/v2/reservations',
      params: {
        unit_id: unitId,
        start_date: '2024-08-01',
        end_date: '2024-08-20',
        per_page: 10
      }
    },
    {
      name: 'API com apenas unit_id',
      baseUrl: 'https://api.getinapis.com',
      endpoint: '/apis/v2/reservations',
      params: {
        unit_id: unitId,
        per_page: 10
      }
    },
    {
      name: 'API com busca vazia',
      baseUrl: 'https://api.getinapis.com',
      endpoint: '/apis/v2/reservations',
      params: {
        search: '',
        per_page: 10
      }
    },
    {
      name: 'Painel com unit_id',
      baseUrl: 'https://painel-reserva.getinapp.com.br',
      endpoint: '/apis/v2/reservations',
      params: {
        unit_id: unitId,
        per_page: 10
      }
    },
    {
      name: 'API sem parâmetros obrigatórios',
      baseUrl: 'https://api.getinapis.com',
      endpoint: '/apis/v2/reservations',
      params: {
        per_page: 10
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testando: ${testCase.name}`);
    console.log('=' .repeat(60));
    
    const queryParams = new URLSearchParams();
    Object.entries(testCase.params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const url = `${testCase.baseUrl}${testCase.endpoint}?${queryParams.toString()}`;
    console.log(`📡 URL: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apiKey': credentials.api_token,
          'Accept': 'application/json',
          'User-Agent': 'SGB-Integration/1.0'
        }
      });

      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      const responseText = await response.text();
      
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Resposta JSON válida:');
        
        if (data.success) {
          console.log(`📈 Sucesso: ${data.data?.length || 0} reservas encontradas`);
          if (data.pagination) {
            console.log(`📄 Paginação: ${data.pagination.current_page}/${data.pagination.last_page} (total: ${data.pagination.total})`);
          }
          if (data.data && data.data.length > 0) {
            console.log('📋 Primeira reserva:');
            console.log(`   ID: ${data.data[0].id}`);
            console.log(`   Nome: ${data.data[0].name}`);
            console.log(`   Data: ${data.data[0].date} ${data.data[0].time}`);
            console.log(`   Status: ${data.data[0].status}`);
          }
        } else {
          console.log('❌ Erro na resposta:');
          console.log(JSON.stringify(data, null, 2));
        }
      } catch (jsonError) {
        console.log('❌ Resposta não é JSON válido:');
        console.log(responseText.substring(0, 300));
      }
      
    } catch (error) {
      console.error('❌ Erro na requisição:', error.message);
    }
    
    // Pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Testando endpoint de reservas GET IN');
  console.log('=' .repeat(80));

  const credentials = await getGetInCredentials();
  if (!credentials) {
    console.error('❌ Não foi possível obter credenciais');
    return;
  }

  console.log('✅ Credenciais encontradas:');
  console.log(`   Sistema: ${credentials.sistema}`);
  console.log(`   Ambiente: ${credentials.ambiente}`);
  console.log(`   Username: ${credentials.username}`);
  console.log(`   API Token: ${credentials.api_token.substring(0, 15)}...`);
  console.log(`   Base URL: ${credentials.base_url}`);

  await testReservationsEndpoint(credentials);
  
  console.log('\n✅ Testes concluídos!');
}

if (require.main === module) {
  main().catch(console.error);
}
