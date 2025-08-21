// Script para debugar chaves de idempotência duplicadas
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('../../frontend/node_modules/@supabase/supabase-js');

function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '../../frontend/.env.local');
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
      
      Object.assign(process.env, envVars);
      console.log('✅ Arquivo .env.local carregado!');
      return true;
    }
  } catch (error) {
    console.log('⚠️ Erro ao carregar .env.local:', error.message);
  }
  return false;
}

loadEnvFile();

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqtgsvujwcbymjmvkjhy.supabase.co').replace(/"/g, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '') || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Simular a função de geração de idempotency_key do processor
function generateIdempotencyKey(record, barId, dataType) {
  const keyData = `${dataType}_${barId}_${JSON.stringify(record)}`;
  return crypto.createHash('md5').update(keyData).digest('hex');
}

async function debugIdempotencyKeys() {
  console.log('🔍 DEBUGANDO CHAVES DE IDEMPOTÊNCIA');
  console.log('===================================');
  
  // 1. Buscar dados raw
  const { data: rawData, error: rawError } = await supabase
    .from('contahub_raw_data')
    .select('raw_json')
    .eq('id', 2151)
    .single();
  
  if (rawError) {
    console.error('❌ Erro ao buscar raw data:', rawError);
    return;
  }
  
  const rawList = rawData.raw_json.list;
  console.log(`📊 Total de registros no raw: ${rawList.length}`);
  
  // 2. Simular processamento e gerar chaves de idempotência
  console.log('\n🔄 Gerando chaves de idempotência...');
  
  const processedRecords = [];
  const idempotencyKeys = new Map(); // key -> array of indices
  
  rawList.forEach((item, index) => {
    // Simular o mesmo processamento da função parseAnaliticoData
    const dataRaw = item.trn_dtgerencial || '';
    const data = String(dataRaw).split('T')[0] || null;
    
    const processedRecord = {
      vd_mesadesc: String(item.vd_mesadesc || ''),
      vd_localizacao: String(item.vd_localizacao || ''),
      itm: parseInt(item.itm) || null,
      trn: parseInt(item.trn) || null,
      trn_desc: String(item.trn_desc || ''),
      prefixo: String(item.prefixo || ''),
      tipo: String(item.tipo || ''),
      tipovenda: String(item.tipovenda || ''),
      ano: parseInt(item.ano) || null,
      mes: parseInt(String(item.mes).split('-')[1]) || null,
      trn_dtgerencial: data,
      usr_lancou: String(item.usr_lancou || ''),
      prd: String(item.prd || ''),
      prd_desc: String(item.prd_desc || ''),
      grp_desc: String(item.grp_desc || ''),
      loc_desc: String(item.loc_desc || ''),
      qtd: parseFloat(item.qtd) || 0,
      desconto: parseFloat(item.desconto) || 0,
      valorfinal: parseFloat(item.valorfinal) || 0,
      custo: parseFloat(item.custo) || 0,
      itm_obs: String(item.itm_obs || ''),
      comandaorigem: String(item.comandaorigem || ''),
      itemorigem: String(item.itemorigem || '')
    };
    
    // Gerar chave de idempotência (simulando o processor)
    const idempotencyKey = generateIdempotencyKey(processedRecord, 3, 'analitico');
    
    processedRecords.push({
      index,
      original: item,
      processed: processedRecord,
      idempotencyKey
    });
    
    // Rastrear duplicatas
    if (!idempotencyKeys.has(idempotencyKey)) {
      idempotencyKeys.set(idempotencyKey, []);
    }
    idempotencyKeys.get(idempotencyKey).push(index);
  });
  
  // 3. Identificar duplicatas
  const duplicateKeys = Array.from(idempotencyKeys.entries()).filter(([key, indices]) => indices.length > 1);
  
  console.log(`🔑 Total de chaves únicas: ${idempotencyKeys.size}`);
  console.log(`🔄 Chaves duplicadas: ${duplicateKeys.length}`);
  
  if (duplicateKeys.length > 0) {
    console.log('\n🔄 CHAVES DUPLICADAS ENCONTRADAS:');
    
    let totalDuplicates = 0;
    duplicateKeys.forEach(([key, indices], i) => {
      console.log(`\n--- Duplicata ${i + 1} ---`);
      console.log(`Chave: ${key}`);
      console.log(`Índices: ${indices.join(', ')}`);
      console.log(`Quantidade: ${indices.length} registros`);
      totalDuplicates += indices.length - 1; // -1 porque um será inserido
      
      // Mostrar os registros duplicados
      indices.forEach((idx, j) => {
        console.log(`\nRegistro ${j + 1} (índice ${idx}):`);
        console.log(JSON.stringify(processedRecords[idx].original, null, 2));
      });
    });
    
    console.log(`\n📉 Total de registros que serão rejeitados por duplicata: ${totalDuplicates}`);
  }
  
  // 4. Verificar se as chaves existentes no banco coincidem
  console.log('\n🔍 Verificando chaves existentes no banco...');
  
  const { data: existingKeys, error: keysError } = await supabase
    .from('contahub_analitico')
    .select('idempotency_key')
    .eq('bar_id', 3)
    .eq('trn_dtgerencial', '2025-02-01');
  
  if (keysError) {
    console.error('❌ Erro ao buscar chaves existentes:', keysError);
  } else {
    console.log(`📋 Chaves no banco: ${existingKeys.length}`);
    
    // Verificar se alguma chave gerada já existe no banco
    const existingKeySet = new Set(existingKeys.map(k => k.idempotency_key));
    const generatedKeys = Array.from(idempotencyKeys.keys());
    
    const alreadyExists = generatedKeys.filter(key => existingKeySet.has(key));
    console.log(`🔄 Chaves que já existem no banco: ${alreadyExists.length}`);
    
    if (alreadyExists.length > 0) {
      console.log('Chaves existentes:', alreadyExists.slice(0, 5)); // Mostrar apenas as primeiras 5
    }
  }
  
  // 5. Resumo final
  console.log('\n🎯 RESUMO FINAL:');
  console.log('================');
  console.log(`📊 Total no raw: ${rawList.length}`);
  console.log(`🔑 Chaves únicas geradas: ${idempotencyKeys.size}`);
  console.log(`🔄 Chaves duplicadas: ${duplicateKeys.length}`);
  
  if (duplicateKeys.length > 0) {
    const totalDuplicates = duplicateKeys.reduce((sum, [key, indices]) => sum + indices.length - 1, 0);
    console.log(`📉 Registros rejeitados por duplicata: ${totalDuplicates}`);
    console.log(`🎯 Esperado inserido: ${rawList.length - totalDuplicates}`);
    console.log(`📋 Realmente inserido: 414`);
    
    if ((rawList.length - totalDuplicates) === 414) {
      console.log('✅ PROBLEMA IDENTIFICADO: Duplicatas de idempotency_key explicam a diferença!');
    } else {
      console.log('⚠️ AINDA HÁ DISCREPÂNCIA: Pode haver outro problema.');
    }
  }
}

debugIdempotencyKeys().catch(console.error);
