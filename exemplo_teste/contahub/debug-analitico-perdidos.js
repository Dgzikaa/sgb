// Script para debugar os 17 registros perdidos do analítico
const fs = require('fs');
const path = require('path');
const { createClient } = require('../../frontend/node_modules/@supabase/supabase-js');

// Tentar carregar variáveis do .env.local
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
      console.log('✅ Arquivo .env.local carregado com sucesso!');
      return true;
    }
  } catch (error) {
    console.log('⚠️ Não foi possível carregar .env.local:', error.message);
  }
  return false;
}

loadEnvFile();

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqtgsvujwcbymjmvkjhy.supabase.co').replace(/"/g, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugAnaliticoPerdidos() {
  console.log('🔍 DEBUGANDO REGISTROS PERDIDOS DO ANALÍTICO');
  console.log('==============================================');
  
  // 1. Buscar dados raw
  console.log('\n📋 Buscando dados raw...');
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
  
  // 2. Simular processamento e identificar problemas
  console.log('\n🔄 Simulando processamento...');
  
  const validRecords = [];
  const invalidRecords = [];
  
  rawList.forEach((item, index) => {
    try {
      // Simular o mesmo processamento da função parseAnaliticoData
      const dataRaw = item.trn_dtgerencial || '';
      const data = String(dataRaw).split('T')[0] || null;
      
      const processedRecord = {
        index,
        original: item,
        processed: {
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
        }
      };
      
      // Verificar se há problemas óbvios
      const problems = [];
      
      if (!processedRecord.processed.trn_dtgerencial) {
        problems.push('Data inválida');
      }
      
      if (!processedRecord.processed.itm) {
        problems.push('ITM inválido');
      }
      
      if (!processedRecord.processed.trn) {
        problems.push('TRN inválido');
      }
      
      if (isNaN(processedRecord.processed.qtd)) {
        problems.push('Quantidade inválida');
      }
      
      if (isNaN(processedRecord.processed.valorfinal)) {
        problems.push('Valor final inválido');
      }
      
      if (problems.length > 0) {
        invalidRecords.push({
          ...processedRecord,
          problems
        });
      } else {
        validRecords.push(processedRecord);
      }
      
    } catch (error) {
      invalidRecords.push({
        index,
        original: item,
        error: error.message
      });
    }
  });
  
  console.log(`✅ Registros válidos: ${validRecords.length}`);
  console.log(`❌ Registros inválidos: ${invalidRecords.length}`);
  
  // 3. Mostrar registros inválidos
  if (invalidRecords.length > 0) {
    console.log('\n❌ REGISTROS INVÁLIDOS:');
    invalidRecords.forEach((record, i) => {
      console.log(`\n--- Registro inválido ${i + 1} (índice ${record.index}) ---`);
      if (record.problems) {
        console.log(`Problemas: ${record.problems.join(', ')}`);
        console.log(`Original:`, JSON.stringify(record.original, null, 2));
      } else if (record.error) {
        console.log(`Erro: ${record.error}`);
        console.log(`Original:`, JSON.stringify(record.original, null, 2));
      }
    });
  }
  
  // 4. Verificar duplicatas por chave única
  console.log('\n🔍 Verificando duplicatas...');
  const uniqueKeys = new Set();
  const duplicates = [];
  
  validRecords.forEach((record, i) => {
    // Criar chave única baseada nos campos principais
    const uniqueKey = `${record.processed.trn_dtgerencial}_${record.processed.itm}_${record.processed.trn}_${record.processed.vd_mesadesc}`;
    
    if (uniqueKeys.has(uniqueKey)) {
      duplicates.push({
        index: record.index,
        uniqueKey,
        record: record.original
      });
    } else {
      uniqueKeys.add(uniqueKey);
    }
  });
  
  console.log(`🔑 Chaves únicas: ${uniqueKeys.size}`);
  console.log(`🔄 Duplicatas: ${duplicates.length}`);
  
  if (duplicates.length > 0) {
    console.log('\n🔄 REGISTROS DUPLICADOS:');
    duplicates.forEach((dup, i) => {
      console.log(`\n--- Duplicata ${i + 1} (índice ${dup.index}) ---`);
      console.log(`Chave: ${dup.uniqueKey}`);
      console.log(`Registro:`, JSON.stringify(dup.record, null, 2));
    });
  }
  
  // 5. Resumo final
  console.log('\n🎯 RESUMO FINAL:');
  console.log('================');
  console.log(`📊 Total no raw: ${rawList.length}`);
  console.log(`✅ Válidos: ${validRecords.length}`);
  console.log(`❌ Inválidos: ${invalidRecords.length}`);
  console.log(`🔄 Duplicatas: ${duplicates.length}`);
  console.log(`🎯 Esperado inserido: ${validRecords.length - duplicates.length}`);
  console.log(`📋 Realmente inserido: 414`);
  console.log(`📉 Diferença: ${(validRecords.length - duplicates.length) - 414}`);
  
  // 6. Verificar se a diferença bate
  const expectedInserted = validRecords.length - duplicates.length;
  if (expectedInserted === 414) {
    console.log('✅ PROBLEMA IDENTIFICADO: Duplicatas ou registros inválidos explicam a diferença!');
  } else {
    console.log('⚠️ AINDA HÁ DISCREPÂNCIA: Pode haver outro problema na inserção.');
  }
}

debugAnaliticoPerdidos().catch(console.error);
