// MEGA COLETA ABRIL - Otimizado para velocidade máxima
const fs = require('fs');
const script = fs.readFileSync('coleta_historica_gradual.js', 'utf8');
eval(script);

async function megaColetaAbril() {
  console.log('🚀 MEGA COLETA ABRIL: 30 dias em alta velocidade!');
  console.log('⚡ Intervalo mínimo: 1s entre coletas');
  
  // Gerar todas as datas de abril
  const datas = [];
  for (let dia = 1; dia <= 30; dia++) {
    datas.push('2025-04-' + dia.toString().padStart(2, '0'));
  }
  
  let sucessos = 0;
  let erros = 0;
  let totalRegistros = 0;
  
  for (const data of datas) {
    try {
      console.log(`📅 ${data} ...`);
      const resultado = await coletarDia(data);
      
      if (resultado.success && resultado.resumo?.salvos_raw > 0) {
        const registros = resultado.resumo.total_registros_encontrados || 0;
        const salvos = resultado.resumo.salvos_raw || 0;
        console.log(`✅ ${data}: ${registros} registros, ${salvos} salvos`);
        sucessos++;
        totalRegistros += registros;
      } else {
        console.log(`⚠️  ${data}: Sem dados ou duplicata`);
      }
      
      // Pausa mínima para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (err) {
      console.error(`❌ ${data}: ${err.message}`);
      erros++;
    }
  }
  
  console.log(`\n🎉 ABRIL CONCLUÍDO!`);
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📊 Total registros: ${totalRegistros}`);
  console.log(`\n🔄 Iniciando processamento via SQL...`);
}

megaColetaAbril(); 