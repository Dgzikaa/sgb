/**
 * Script de SYNC RETROATIVO - Deboche Bar
 * Sincroniza dados históricos do ContaHub para o Deboche Bar (bar_id = 4)
 * 
 * Uso: node scripts/sync-deboche-retroativo.js
 * 
 * IMPORTANTE: O script roda dia por dia para evitar timeout
 * A API do ContaHub não tem paginação - retorna todos os dados de cada dia de uma vez
 */

const BAR_ID = 4; // Deboche Bar
const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0';

// Período de dados a sincronizar
const START_DATE = '2024-10-03'; // Data de início do Deboche
const END_DATE = '2025-12-08';   // Até hoje

// Delay entre requisições para não sobrecarregar a API (ms)
const DELAY_BETWEEN_DAYS = 3000; // 3 segundos entre cada dia

// Gerar lista de datas
function generateDateRange(start, end) {
  const dates = [];
  const current = new Date(start);
  const endDate = new Date(end);
  
  while (current <= endDate) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// Função de delay
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função principal de sync
async function syncDay(date) {
  try {
    const url = `${SUPABASE_URL}/functions/v1/contahub-sync-automatico`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify({
        bar_id: BAR_ID,
        data_date: date
      })
    });
    
    const result = await response.json();
    
    return {
      date,
      success: result.success,
      collected: result.summary?.collected_count || 0,
      records: result.summary?.total_records_collected || 0,
      errors: result.summary?.error_count || 0,
      details: result.details?.processed || []
    };
    
  } catch (error) {
    return {
      date,
      success: false,
      error: error.message
    };
  }
}

// Executar sync retroativo
async function runRetroactiveSync() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║   🔄 SYNC RETROATIVO - DEBOCHE BAR (bar_id = 4)                    ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📅 Período: ${START_DATE} até ${END_DATE}`);
  console.log(`⏱️ Delay entre dias: ${DELAY_BETWEEN_DAYS}ms`);
  console.log('');
  
  const dates = generateDateRange(START_DATE, END_DATE);
  console.log(`📊 Total de dias a processar: ${dates.length}`);
  console.log('');
  console.log('─'.repeat(70));
  
  const results = {
    success: 0,
    failed: 0,
    totalRecords: 0,
    errors: []
  };
  
  const startTime = Date.now();
  
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const progress = `[${String(i + 1).padStart(3)}/${dates.length}]`;
    
    process.stdout.write(`${progress} ${date} ... `);
    
    const result = await syncDay(date);
    
    if (result.success) {
      results.success++;
      results.totalRecords += result.records;
      
      // Mostrar detalhes de cada tipo processado
      const details = result.details.map(d => 
        `${d.data_type.substring(0, 3)}:${d.result?.count || 0}`
      ).join(' | ');
      
      console.log(`✅ ${result.collected}/5 tipos | ${result.records} reg | ${details}`);
    } else {
      results.failed++;
      results.errors.push({ date, error: result.error });
      console.log(`❌ ERRO: ${result.error || 'Falha desconhecida'}`);
    }
    
    // Delay entre requisições (exceto última)
    if (i < dates.length - 1) {
      await sleep(DELAY_BETWEEN_DAYS);
    }
  }
  
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  
  console.log('');
  console.log('─'.repeat(70));
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                         📊 RESUMO FINAL                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`   ✅ Dias com sucesso:    ${results.success}`);
  console.log(`   ❌ Dias com erro:       ${results.failed}`);
  console.log(`   📈 Total de registros:  ${results.totalRecords.toLocaleString()}`);
  console.log(`   ⏱️ Tempo total:         ${minutes}m ${seconds}s`);
  console.log('');
  
  if (results.errors.length > 0) {
    console.log('─'.repeat(70));
    console.log('❌ ERROS ENCONTRADOS:');
    console.log('─'.repeat(70));
    results.errors.forEach(e => {
      console.log(`   ${e.date}: ${e.error}`);
    });
    console.log('');
  }
  
  console.log('🏁 Sync retroativo finalizado!');
  console.log('');
}

// Executar
runRetroactiveSync();
