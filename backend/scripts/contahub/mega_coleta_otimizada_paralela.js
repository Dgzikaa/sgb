const fs = require('fs');

// Carregar o script de coleta gradual
const coletaScript = fs.readFileSync('coleta_historica_gradual.js', 'utf8');
eval(coletaScript);

console.log('🚀 MEGA COLETA OTIMIZADA - PROCESSAMENTO PARALELO');
console.log('⚡ Coleta múltiplas datas simultaneamente para máxima velocidade');
console.log('📅 Período: 31/01/2025 até 04/07/2025\n');

// Lista de datas que estão faltando (baseada na análise do banco)
const datasFaltando = [
  // Fevereiro
  '2025-02-02', '2025-02-09', '2025-02-10', '2025-02-12', '2025-02-17', 
  '2025-02-18', '2025-02-19', '2025-02-20', '2025-02-21', '2025-02-22', '2025-02-23',
  '2025-02-24', '2025-02-25', '2025-02-26', '2025-02-27', '2025-02-28',
  
  // Março
  '2025-03-01', '2025-03-02', '2025-03-03', '2025-03-04', '2025-03-05', '2025-03-06',
  '2025-03-07', '2025-03-08', '2025-03-09', '2025-03-10', '2025-03-11', '2025-03-12',
  '2025-03-13', '2025-03-14', '2025-03-16', '2025-03-17', '2025-03-18', '2025-03-19',
  '2025-03-20', '2025-03-21', '2025-03-22', '2025-03-23', '2025-03-24', '2025-03-25',
  '2025-03-26', '2025-03-27', '2025-03-28', '2025-03-29', '2025-03-30', '2025-03-31',
  
  // Abril
  '2025-04-01', '2025-04-02', '2025-04-03', '2025-04-04', '2025-04-05', '2025-04-06',
  '2025-04-07', '2025-04-08', '2025-04-09', '2025-04-10', '2025-04-11', '2025-04-12',
  '2025-04-13', '2025-04-14', '2025-04-16', '2025-04-17', '2025-04-18', '2025-04-19',
  '2025-04-20', '2025-04-21', '2025-04-22', '2025-04-23', '2025-04-24', '2025-04-25',
  '2025-04-26', '2025-04-27', '2025-04-28', '2025-04-29', '2025-04-30',
  
  // Maio
  '2025-05-01', '2025-05-02', '2025-05-03', '2025-05-04', '2025-05-05', '2025-05-06',
  '2025-05-07', '2025-05-08', '2025-05-09', '2025-05-10', '2025-05-11', '2025-05-12',
  '2025-05-13', '2025-05-14', '2025-05-15', '2025-05-16', '2025-05-17', '2025-05-18',
  '2025-05-19', '2025-05-20', '2025-05-21', '2025-05-22', '2025-05-23', '2025-05-24',
  '2025-05-25', '2025-05-26', '2025-05-27', '2025-05-28', '2025-05-29', '2025-05-30',
  '2025-05-31',
  
  // Junho
  '2025-06-01', '2025-06-02', '2025-06-03', '2025-06-04', '2025-06-05', '2025-06-06',
  '2025-06-07', '2025-06-08', '2025-06-09', '2025-06-10', '2025-06-11', '2025-06-12',
  '2025-06-13', '2025-06-14', '2025-06-15', '2025-06-16', '2025-06-17', '2025-06-18',
  '2025-06-19', '2025-06-20', '2025-06-21', '2025-06-22', '2025-06-23', '2025-06-24',
  '2025-06-25', '2025-06-26', '2025-06-27', '2025-06-28', '2025-06-29', '2025-06-30',
  
  // Julho
  '2025-07-01', '2025-07-02', '2025-07-03'
];

console.log(`📊 Total de datas faltando: ${datasFaltando.length}`);
console.log(`🔥 Processamento paralelo: 5 datas simultâneas\n`);

// Função para processar um lote de datas
async function processarLote(lote, loteNumero, totalLotes) {
  console.log(`\n🔥 LOTE ${loteNumero}/${totalLotes} - Processando ${lote.length} datas simultaneamente...`);
  
  const promessas = lote.map(async (data) => {
    try {
      const resultado = await coletarDia(data);
      
      if (resultado.success) {
        const registros = resultado.resumo?.total_registros_encontrados || 0;
        const salvos = resultado.resumo?.salvos_raw || 0;
        
        if (registros > 0) {
          console.log(`✅ ${data}: ${registros} registros, ${salvos} salvos`);
          return { data, sucesso: true, registros, salvos, temDados: true };
        } else {
          console.log(`⚪ ${data}: Sem dados (fechado)`);
          return { data, sucesso: true, registros: 0, salvos: 0, temDados: false };
        }
      } else {
        console.log(`❌ ${data}: Erro na coleta`);
        return { data, sucesso: false, registros: 0, salvos: 0, temDados: false };
      }
    } catch (error) {
      console.log(`❌ ${data}: Erro - ${error.message}`);
      return { data, sucesso: false, registros: 0, salvos: 0, temDados: false };
    }
  });
  
  const resultados = await Promise.all(promessas);
  return resultados;
}

// Função principal para coletar todas as datas com processamento paralelo
async function coletarTodasDatasParalelo() {
  const TAMANHO_LOTE = 5; // Processar 5 datas por vez
  const lotes = [];
  
  // Dividir datas em lotes
  for (let i = 0; i < datasFaltando.length; i += TAMANHO_LOTE) {
    lotes.push(datasFaltando.slice(i, i + TAMANHO_LOTE));
  }
  
  console.log(`🚀 INICIANDO MEGA COLETA OTIMIZADA...`);
  console.log(`📦 Total de lotes: ${lotes.length}`);
  console.log(`⚡ Processamento paralelo: ${TAMANHO_LOTE} datas por lote\n`);
  
  let sucessos = 0;
  let erros = 0;
  let totalRegistros = 0;
  let datasSemDados = [];
  let datasComDados = [];
  
  const inicioTempo = Date.now();
  
  for (let i = 0; i < lotes.length; i++) {
    const lote = lotes[i];
    const resultados = await processarLote(lote, i + 1, lotes.length);
    
    // Processar resultados do lote
    resultados.forEach(resultado => {
      if (resultado.sucesso) {
        if (resultado.temDados) {
          sucessos++;
          totalRegistros += resultado.registros;
          datasComDados.push(resultado.data);
        } else {
          datasSemDados.push(resultado.data);
        }
      } else {
        erros++;
      }
    });
    
    // Pausa entre lotes para não sobrecarregar
    if (i < lotes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  const tempoTotal = (Date.now() - inicioTempo) / 1000;
  
  console.log('\n' + '='.repeat(70));
  console.log('🎯 MEGA COLETA OTIMIZADA - RELATÓRIO FINAL');
  console.log('='.repeat(70));
  console.log(`⏱️  Tempo total: ${tempoTotal.toFixed(1)} segundos`);
  console.log(`📊 Datas processadas: ${datasFaltando.length}`);
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`⚪ Sem dados: ${datasSemDados.length}`);
  console.log(`📈 Total de registros coletados: ${totalRegistros.toLocaleString()}`);
  console.log(`📅 Datas com dados: ${datasComDados.length}`);
  console.log(`🚀 Velocidade média: ${(datasFaltando.length / tempoTotal).toFixed(1)} datas/segundo`);
  
  if (datasComDados.length > 0) {
    console.log(`\n📋 Datas com dados coletados (${datasComDados.length}):`);
    datasComDados.forEach(data => console.log(`  • ${data}`));
  }
  
  if (datasSemDados.length > 0) {
    console.log(`\n⚪ Datas sem dados - restaurante fechado (${datasSemDados.length}):`);
    datasSemDados.slice(0, 15).forEach(data => console.log(`  • ${data}`));
    if (datasSemDados.length > 15) {
      console.log(`  ... e mais ${datasSemDados.length - 15} datas`);
    }
  }
  
  console.log('\n🎉 MEGA COLETA OTIMIZADA FINALIZADA!');
  console.log('📋 Próximo passo: Executar processamento dos dados pendentes');
  
  return {
    sucessos,
    erros,
    totalRegistros,
    datasComDados,
    datasSemDados,
    tempoTotal
  };
}

// Executar coleta
console.log('🔥 Pressione Ctrl+C para interromper se necessário...\n');
coletarTodasDatasParalelo().catch(console.error); 