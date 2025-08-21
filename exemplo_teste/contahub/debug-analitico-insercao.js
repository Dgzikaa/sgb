// Script para debugar inserção do analítico registro por registro
const fs = require('fs');
const path = require('path');
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

async function debugAnaliticoInsercao() {
  console.log('🔍 DEBUGANDO INSERÇÃO DO ANALÍTICO');
  console.log('==================================');
  
  // 1. Buscar dados raw mais recente
  const { data: rawData, error: rawError } = await supabase
    .from('contahub_raw_data')
    .select('raw_json, id')
    .eq('data_type', 'analitico')
    .eq('bar_id', 3)
    .eq('data_date', '2025-02-01')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (rawError) {
    console.error('❌ Erro ao buscar raw data:', rawError);
    return;
  }
  
  const rawList = rawData.raw_json.list;
  console.log(`📊 Total de registros no raw: ${rawList.length}`);
  
  // 2. Processar dados como o processor faz
  console.log('\n🔄 Processando dados...');
  
  const processedRecords = rawList.map((item, index) => {
    const dataRaw = item.trn_dtgerencial || '';
    const data = String(dataRaw).split('T')[0] || null;
    
    return {
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
      itemorigem: String(item.itemorigem || ''),
      bar_id: 3,
      idempotency_key: `analitico_${rawData.id}_${index}_${Date.now()}`
    };
  });
  
  console.log(`✅ Registros processados: ${processedRecords.length}`);
  
  // 3. Tentar inserir em lotes pequenos para identificar problemas
  console.log('\n💾 Testando inserção em lotes pequenos...');
  
  const batchSize = 10;
  let totalInserted = 0;
  let totalErrors = 0;
  const errorDetails = [];
  
  for (let i = 0; i < processedRecords.length; i += batchSize) {
    const batch = processedRecords.slice(i, i + batchSize);
    
    console.log(`\n🔄 Testando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(processedRecords.length/batchSize)} (${batch.length} registros)...`);
    
    const { data, error } = await supabase
      .from('contahub_analitico')
      .insert(batch)
      .select('id');
    
    if (error) {
      console.error(`❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, error);
      totalErrors += batch.length;
      
      errorDetails.push({
        batchIndex: Math.floor(i/batchSize) + 1,
        batchSize: batch.length,
        error: error,
        firstRecord: batch[0]
      });
      
      // Tentar inserir um por um para identificar registros problemáticos
      console.log(`🔍 Testando registros individuais do lote ${Math.floor(i/batchSize) + 1}...`);
      
      for (let j = 0; j < batch.length; j++) {
        const record = batch[j];
        const { data: singleData, error: singleError } = await supabase
          .from('contahub_analitico')
          .insert([record])
          .select('id');
        
        if (singleError) {
          console.error(`  ❌ Registro ${i + j + 1}: ${singleError.message}`);
          console.error(`     Dados:`, JSON.stringify(record, null, 2));
        } else {
          console.log(`  ✅ Registro ${i + j + 1}: Inserido com sucesso`);
          totalInserted++;
        }
      }
    } else {
      const inserted = data ? data.length : 0;
      totalInserted += inserted;
      console.log(`✅ Lote ${Math.floor(i/batchSize) + 1}: ${inserted}/${batch.length} registros inseridos`);
    }
    
    // Pausa entre lotes
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 4. Resumo final
  console.log('\n🎯 RESUMO FINAL:');
  console.log('================');
  console.log(`📊 Total de registros: ${processedRecords.length}`);
  console.log(`✅ Inseridos com sucesso: ${totalInserted}`);
  console.log(`❌ Erros: ${totalErrors}`);
  console.log(`📉 Taxa de sucesso: ${((totalInserted / processedRecords.length) * 100).toFixed(1)}%`);
  
  if (errorDetails.length > 0) {
    console.log('\n❌ DETALHES DOS ERROS:');
    errorDetails.forEach((detail, i) => {
      console.log(`\nErro ${i + 1}:`);
      console.log(`  Lote: ${detail.batchIndex}`);
      console.log(`  Tamanho: ${detail.batchSize}`);
      console.log(`  Erro: ${detail.error.message}`);
      console.log(`  Código: ${detail.error.code}`);
      if (detail.error.details) {
        console.log(`  Detalhes: ${detail.error.details}`);
      }
    });
  }
}

debugAnaliticoInsercao().catch(console.error);
