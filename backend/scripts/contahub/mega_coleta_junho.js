// MEGA COLETA JUNHO - Velocidade máxima
const fs = require('fs');
const script = fs.readFileSync('coleta_historica_gradual.js', 'utf8');
eval(script);

async function megaColetaJunho() {
  console.log('🚀 MEGA COLETA JUNHO: 30 dias em alta velocidade!');
  
  const datas = [];
  for (let dia = 1; dia <= 30; dia++) {
    datas.push('2025-06-' + dia.toString().padStart(2, '0'));
  }
  
  let sucessos = 0;
  let totalRegistros = 0;
  
  for (const data of datas) {
    try {
      console.log(`📅 ${data} ...`);
      const resultado = await coletarDia(data);
      
      if (resultado.success && resultado.resumo?.salvos_raw > 0) {
        const registros = resultado.resumo.total_registros_encontrados || 0;
        console.log(`✅ ${data}: ${registros} registros`);
        sucessos++;
        totalRegistros += registros;
      } else {
        console.log(`⚠️  ${data}: Sem dados`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
    } catch (err) {
      console.error(`❌ ${data}: ${err.message}`);
    }
  }
  
  console.log(`\n🎉 JUNHO CONCLUÍDO! ${sucessos} dias, ${totalRegistros} registros`);
}

megaColetaJunho(); 