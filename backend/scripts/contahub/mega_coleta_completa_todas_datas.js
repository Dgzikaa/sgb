const fs = require('fs');

// Carregar o script de coleta gradual
const coletaScript = fs.readFileSync('coleta_historica_gradual.js', 'utf8');
eval(coletaScript);

console.log('🔥 MEGA COLETA COMPLETA - TODAS AS DATAS FALTANDO');
console.log('📅 Período: 31/01/2025 até 04/07/2025');
console.log('🎯 Objetivo: Coletar TODAS as datas que estão faltando\n');

// Lista de datas que estão faltando (baseada na análise do banco)
const datasFaltando = [
  // Fevereiro
  '2025-02-02', '2025-02-09', '2025-02-10', '2025-02-12', '2025-02-16', '2025-02-17', 
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
console.log(`📋 Primeira data: ${datasFaltando[0]}`);
console.log(`📋 Última data: ${datasFaltando[datasFaltando.length - 1]}\n`);

// Função para coletar todas as datas faltando
async function coletarTodasDatasFaltando() {
  let sucessos = 0;
  let erros = 0;
  let totalRegistros = 0;
  let datasSemDados = [];
  let datasComDados = [];
  
  console.log('🚀 INICIANDO MEGA COLETA COMPLETA...\n');
  
  for (let i = 0; i < datasFaltando.length; i++) {
    const data = datasFaltando[i];
    const progresso = `${i + 1}/${datasFaltando.length}`;
    
    console.log(`\n📅 [${progresso}] Coletando ${data}...`);
    
    try {
      const resultado = await coletarDia(data);
      
      if (resultado.success) {
        const registros = resultado.resumo?.total_registros_encontrados || 0;
        const salvos = resultado.resumo?.salvos_raw || 0;
        
        if (registros > 0) {
          console.log(`✅ [${progresso}] ${data}: ${registros} registros, ${salvos} salvos`);
          sucessos++;
          totalRegistros += registros;
          datasComDados.push(data);
        } else {
          console.log(`⚪ [${progresso}] ${data}: Sem dados (restaurante fechado)`);
          datasSemDados.push(data);
        }
      } else {
        console.log(`❌ [${progresso}] ${data}: Erro na coleta`);
        erros++;
      }
    } catch (error) {
      console.log(`❌ [${progresso}] ${data}: Erro - ${error.message}`);
      erros++;
    }
    
    // Pausa entre coletas para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 MEGA COLETA COMPLETA - RELATÓRIO FINAL');
  console.log('='.repeat(60));
  console.log(`📊 Datas processadas: ${datasFaltando.length}`);
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`⚪ Sem dados: ${datasSemDados.length}`);
  console.log(`📈 Total de registros coletados: ${totalRegistros.toLocaleString()}`);
  console.log(`📅 Datas com dados: ${datasComDados.length}`);
  
  if (datasComDados.length > 0) {
    console.log(`\n📋 Datas com dados coletados:`);
    datasComDados.forEach(data => console.log(`  • ${data}`));
  }
  
  if (datasSemDados.length > 0) {
    console.log(`\n⚪ Datas sem dados (restaurante fechado):`);
    datasSemDados.slice(0, 10).forEach(data => console.log(`  • ${data}`));
    if (datasSemDados.length > 10) {
      console.log(`  ... e mais ${datasSemDados.length - 10} datas`);
    }
  }
  
  console.log('\n🎉 MEGA COLETA COMPLETA FINALIZADA!');
  console.log('📋 Próximo passo: Executar processamento dos dados pendentes');
}

// Executar coleta
coletarTodasDatasFaltando().catch(console.error); 