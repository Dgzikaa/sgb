const fs = require('fs');

// Carregar o script de coleta gradual
const coletaScript = fs.readFileSync('coleta_historica_gradual.js', 'utf8');
eval(coletaScript);

console.log('🔥 MEGA COLETA ABRIL & MAIO - FOCO TOTAL');
console.log('🎯 Prioridade: Meses com dados confirmados');
console.log('⚡ Processamento rápido e eficiente\n');

// Datas de abril e maio que estão faltando (já confirmamos que tem dados)
const datasAbrilMaio = [
  // Abril (29 dias faltando)
  '2025-04-01', '2025-04-02', '2025-04-03', '2025-04-04', '2025-04-05', '2025-04-06',
  '2025-04-07', '2025-04-08', '2025-04-09', '2025-04-10', '2025-04-11', '2025-04-12',
  '2025-04-13', '2025-04-14', '2025-04-16', '2025-04-17', '2025-04-18', '2025-04-19',
  '2025-04-20', '2025-04-21', '2025-04-22', '2025-04-23', '2025-04-24', '2025-04-25',
  '2025-04-26', '2025-04-27', '2025-04-28', '2025-04-29', '2025-04-30',
  
  // Maio (31 dias faltando)
  '2025-05-01', '2025-05-02', '2025-05-03', '2025-05-04', '2025-05-05', '2025-05-06',
  '2025-05-07', '2025-05-08', '2025-05-09', '2025-05-10', '2025-05-11', '2025-05-12',
  '2025-05-13', '2025-05-14', '2025-05-15', '2025-05-16', '2025-05-17', '2025-05-18',
  '2025-05-19', '2025-05-20', '2025-05-21', '2025-05-22', '2025-05-23', '2025-05-24',
  '2025-05-25', '2025-05-26', '2025-05-27', '2025-05-28', '2025-05-29', '2025-05-30',
  '2025-05-31'
];

console.log(`📊 Total de datas: ${datasAbrilMaio.length}`);
console.log(`📅 Abril: 29 datas`);
console.log(`📅 Maio: 31 datas`);
console.log(`🚀 Processamento: 3 datas simultâneas\n`);

// Função para processar lote de datas
async function processarLoteAbrilMaio(lote, loteNumero, totalLotes) {
  console.log(`\n🔥 LOTE ${loteNumero}/${totalLotes} - Processando ${lote.length} datas...`);
  
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

// Função principal para coletar abril e maio
async function coletarAbrilMaio() {
  const TAMANHO_LOTE = 3; // Processar 3 datas por vez (mais estável)
  const lotes = [];
  
  // Dividir datas em lotes
  for (let i = 0; i < datasAbrilMaio.length; i += TAMANHO_LOTE) {
    lotes.push(datasAbrilMaio.slice(i, i + TAMANHO_LOTE));
  }
  
  console.log(`🚀 INICIANDO MEGA COLETA ABRIL & MAIO...`);
  console.log(`📦 Total de lotes: ${lotes.length}`);
  console.log(`⚡ Processamento: ${TAMANHO_LOTE} datas por lote\n`);
  
  let sucessos = 0;
  let erros = 0;
  let totalRegistros = 0;
  let datasSemDados = [];
  let datasComDados = [];
  let datasAbril = [];
  let datasMaio = [];
  
  const inicioTempo = Date.now();
  
  for (let i = 0; i < lotes.length; i++) {
    const lote = lotes[i];
    const resultados = await processarLoteAbrilMaio(lote, i + 1, lotes.length);
    
    // Processar resultados do lote
    resultados.forEach(resultado => {
      if (resultado.sucesso) {
        if (resultado.temDados) {
          sucessos++;
          totalRegistros += resultado.registros;
          datasComDados.push(resultado.data);
          
          // Separar por mês
          if (resultado.data.startsWith('2025-04')) {
            datasAbril.push(resultado.data);
          } else if (resultado.data.startsWith('2025-05')) {
            datasMaio.push(resultado.data);
          }
        } else {
          datasSemDados.push(resultado.data);
        }
      } else {
        erros++;
      }
    });
    
    // Pausa entre lotes
    if (i < lotes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  const tempoTotal = (Date.now() - inicioTempo) / 1000;
  
  console.log('\n' + '='.repeat(70));
  console.log('🎯 MEGA COLETA ABRIL & MAIO - RELATÓRIO FINAL');
  console.log('='.repeat(70));
  console.log(`⏱️  Tempo total: ${tempoTotal.toFixed(1)} segundos`);
  console.log(`📊 Datas processadas: ${datasAbrilMaio.length}`);
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`⚪ Sem dados: ${datasSemDados.length}`);
  console.log(`📈 Total de registros coletados: ${totalRegistros.toLocaleString()}`);
  console.log(`📅 Abril coletado: ${datasAbril.length}/29 datas`);
  console.log(`📅 Maio coletado: ${datasMaio.length}/31 datas`);
  console.log(`🚀 Velocidade média: ${(datasAbrilMaio.length / tempoTotal).toFixed(1)} datas/segundo`);
  
  if (datasAbril.length > 0) {
    console.log(`\n📋 ABRIL coletado (${datasAbril.length} datas):`);
    datasAbril.forEach(data => console.log(`  • ${data}`));
  }
  
  if (datasMaio.length > 0) {
    console.log(`\n📋 MAIO coletado (${datasMaio.length} datas):`);
    datasMaio.forEach(data => console.log(`  • ${data}`));
  }
  
  if (datasSemDados.length > 0) {
    console.log(`\n⚪ Datas sem dados - restaurante fechado (${datasSemDados.length}):`);
    datasSemDados.forEach(data => console.log(`  • ${data}`));
  }
  
  console.log('\n🎉 MEGA COLETA ABRIL & MAIO FINALIZADA!');
  
  if (sucessos > 0) {
    console.log('📋 Próximo passo: Executar processamento dos dados pendentes');
    console.log('🔥 Depois executar a coleta completa para fevereiro, março e junho');
  }
  
  return {
    sucessos,
    erros,
    totalRegistros,
    datasComDados,
    datasSemDados,
    datasAbril,
    datasMaio,
    tempoTotal
  };
}

// Executar coleta
console.log('🔥 Pressione Ctrl+C para interromper se necessário...\n');
coletarAbrilMaio().catch(console.error); 