// Script para testar o processor com timestamps corrigidos
const fs = require('fs');
const path = require('path');
const { createClient } = require('../../frontend/node_modules/@supabase/supabase-js');

// Tentar carregar variáveis do .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '../../frontend/.env.local');
    console.log(`🔍 Procurando .env.local em: ${envPath}`);
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            envVars[key] = valueParts.join('=').replace(/"/g, '');
          }
        }
      });
      
      // Aplicar as variáveis ao process.env
      Object.assign(process.env, envVars);
      console.log('✅ Arquivo .env.local carregado com sucesso!');
      return true;
    } else {
      console.log('❌ Arquivo .env.local não encontrado');
    }
  } catch (error) {
    console.log('⚠️ Não foi possível carregar .env.local:', error.message);
  }
  return false;
}

// Carregar variáveis de ambiente
loadEnvFile();

// Configuração do Supabase
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqtgsvujwcbymjmvkjhy.supabase.co').replace(/"/g, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '') || '';

if (!SUPABASE_KEY) {
  console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não encontrada!');
  process.exit(1);
}

console.log(`🔑 API Key carregada: ${SUPABASE_KEY.substring(0, 20)}...`);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função para testar o processor
async function testProcessor(rawDataId) {
  console.log(`\n🧪 Testando processor com Raw ID: ${rawDataId}`);
  
  try {
    const { data, error } = await supabase.functions.invoke('contahub_processor', {
      body: {
        raw_data_id: rawDataId
      }
    });

    if (error) {
      console.error(`❌ Erro no processor:`, error);
      return null;
    }

    console.log(`📊 Resultado do processor:`, JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error(`❌ Erro na chamada do processor:`, err.message);
    return null;
  }
}

// Função para verificar dados processados
async function checkProcessedData() {
  console.log('\n📋 Verificando dados processados na tabela tempo...');
  
  const { data, error } = await supabase
    .from('contahub_tempo')
    .select('t0_lancamento, t1_prodini, t2_prodfim, t3_entrega, t0_t1, t0_t2, t0_t3, grp_desc, prd_desc')
    .eq('bar_id', 3)
    .gte('data', '2025-02-01')
    .order('data', { ascending: false })
    .limit(3);
  
  if (error) {
    console.error('❌ Erro ao verificar dados processados:', error);
  } else {
    console.log(`📊 Últimos ${data.length} registros processados:`, data);
  }
}

async function main() {
  console.log('🧪 Teste do Processor - Timestamps Corrigidos');
  
  // Verificar dados antes
  await checkProcessedData();
  
  // Testar processamento do raw_data_id 2130 (tempo com 431 registros)
  const result = await testProcessor(2130);
  
  if (result && result.success) {
    console.log(`✅ Processamento concluído: ${result.inserted_records} registros inseridos`);
  } else {
    console.log(`❌ Falha no processamento`);
  }
  
  // Verificar dados após processamento
  console.log('\n📋 Verificando dados após processamento...');
  await checkProcessedData();
}

main().catch(console.error);
