// Script para importar dados ContaHub de 31/01/2025 até 31/07/2025
const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Função para executar o sync
async function executarSync(dataInicio, dataFim) {
  console.log(`\n🔄 Executando sync de ${dataInicio} até ${dataFim}...`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/contahub-sync-automatico`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data_inicio: dataInicio,
        data_fim: dataFim,
        bars: [3] // Bar ID 3
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Sync executado com sucesso!');
      console.log(`📊 Dados coletados: ${JSON.stringify(result.summary || result, null, 2)}`);
      return true;
    } else {
      console.error('❌ Erro no sync:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return false;
  }
}

// Função para aguardar processamento
async function aguardarProcessamento(maxTentativas = 60) {
  console.log('\n⏳ Aguardando processamento dos dados...');
  
  for (let i = 0; i < maxTentativas; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Aguardar 5 segundos
    
    try {
      // Verificar status via SQL
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql_query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          sql: `SELECT COUNT(*) as pendentes FROM contahub_processing_queue WHERE status IN ('pending', 'processing')`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const pendentes = data[0]?.pendentes || 0;
        
        if (pendentes === 0) {
          console.log('✅ Processamento concluído!');
          return true;
        } else {
          console.log(`⏳ Ainda processando... ${pendentes} jobs pendentes`);
        }
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar status:', error.message);
    }
  }
  
  console.log('⚠️ Timeout no processamento, continuando mesmo assim...');
  return true;
}

// Função principal
async function importarDadosCompletos() {
  console.log('🚀 INICIANDO IMPORTAÇÃO COMPLETA CONTAHUB');
  console.log('📅 Período: 31/01/2025 até 31/07/2025');
  console.log('🏢 Bar ID: 3');
  
  const meses = [
    { nome: 'Janeiro (apenas 31)', inicio: '2025-01-31', fim: '2025-01-31' },
    { nome: 'Fevereiro', inicio: '2025-02-01', fim: '2025-02-28' },
    { nome: 'Março', inicio: '2025-03-01', fim: '2025-03-31' },
    { nome: 'Abril', inicio: '2025-04-01', fim: '2025-04-30' },
    { nome: 'Maio', inicio: '2025-05-01', fim: '2025-05-31' },
    { nome: 'Junho', inicio: '2025-06-01', fim: '2025-06-30' },
    { nome: 'Julho', inicio: '2025-07-01', fim: '2025-07-31' }
  ];
  
  const resultados = [];
  
  for (const mes of meses) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📅 PROCESSANDO ${mes.nome.toUpperCase()}`);
    console.log(`${'='.repeat(50)}`);
    
    const inicio = Date.now();
    
    // Executar sync
    const syncOk = await executarSync(mes.inicio, mes.fim);
    
    if (syncOk) {
      // Aguardar um pouco antes de processar
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Executar orchestrator
      console.log('\n🎯 Executando orchestrator...');
      try {
        const orchResponse = await fetch(`${SUPABASE_URL}/functions/v1/contahub-orchestrator`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            source: `import_${mes.nome.toLowerCase()}`
          })
        });
        
        const orchResult = await orchResponse.json();
        console.log('✅ Orchestrator executado:', orchResult.message);
        
        // Aguardar processamento
        await aguardarProcessamento();
      } catch (error) {
        console.error('❌ Erro no orchestrator:', error);
      }
    }
    
    const tempo = Math.round((Date.now() - inicio) / 1000);
    resultados.push({
      mes: mes.nome,
      sucesso: syncOk,
      tempo: `${tempo}s`
    });
    
    // Pequena pausa entre meses
    if (mes !== meses[meses.length - 1]) {
      console.log('\n⏸️ Aguardando 10 segundos antes do próximo mês...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  // Resumo final
  console.log(`\n${'='.repeat(50)}`);
  console.log('📊 RESUMO DA IMPORTAÇÃO');
  console.log(`${'='.repeat(50)}`);
  
  resultados.forEach(r => {
    const status = r.sucesso ? '✅' : '❌';
    console.log(`${status} ${r.mes}: ${r.tempo}`);
  });
  
  console.log('\n✅ IMPORTAÇÃO COMPLETA!');
  console.log('📝 Próximos passos:');
  console.log('1. Verificar integridade dos dados no banco');
  console.log('2. Executar queries de validação');
  console.log('3. Gerar relatórios de teste');
}

// Executar importação
importarDadosCompletos().catch(console.error);
