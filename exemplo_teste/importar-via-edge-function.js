/**
 * 📊 IMPORTAÇÃO VIA EDGE FUNCTION
 * 
 * Usa a Edge Function sync-contagem-sheets para importar
 */

const EDGE_FUNCTION_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/sync-contagem-sheets';
const SPREADSHEET_ID = '1QhuD52kQrdCv4XMfKR5NSRMttx6NzVBZO0S8ajQK1H8';
const API_KEY = 'AIzaSyBKprFuR1gpvoTB4hV16rKlBk3oF0v1BhQ';

function converterData(dataStr) {
  if (!dataStr || !dataStr.includes('/')) return null;
  const partes = dataStr.split('/');
  if (partes.length !== 3) return null;
  const [dia, mes, ano] = partes;
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

async function buscarDatasDisponiveis() {
  try {
    const range = 'INSUMOS!A1:ZZZ10';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    const linhas = data.values || [];
    const linhaDatas = linhas[3] || [];
    
    const datas = [];
    linhaDatas.forEach(valor => {
      if (valor && valor.includes('/')) {
        const dataFormatada = converterData(valor);
        if (dataFormatada) datas.push(dataFormatada);
      }
    });
    
    return datas;
  } catch (error) {
    console.error('Erro ao buscar datas:', error.message);
    throw error;
  }
}

async function importarData(data) {
  try {
    const response = await fetch(`${EDGE_FUNCTION_URL}?data=${data}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  const dataInicial = process.argv[2];
  const dataFinal = process.argv[3];
  
  console.log('🚀 IMPORTAÇÃO VIA EDGE FUNCTION\n');
  console.log('='.repeat(60));
  console.log(`📡 Edge Function: sync-contagem-sheets`);
  console.log(`📊 Planilha: ${SPREADSHEET_ID}`);
  
  if (dataInicial && dataFinal) {
    console.log(`📅 Período: ${dataInicial} até ${dataFinal}`);
  } else {
    console.log(`📅 Período: TODAS as datas`);
  }
  
  console.log('='.repeat(60));
  console.log('');
  
  // Buscar datas disponíveis
  console.log('🔍 Buscando datas disponíveis...\n');
  const todasDatas = await buscarDatasDisponiveis();
  
  let datasParaProcessar = todasDatas;
  if (dataInicial && dataFinal) {
    datasParaProcessar = todasDatas.filter(d => d >= dataInicial && d <= dataFinal);
  }
  
  console.log(`✅ ${datasParaProcessar.length} datas para processar\n`);
  console.log('📊 Iniciando importação...\n');
  
  const stats = {
    total: 0,
    sucesso: 0,
    erro: 0,
    semDados: 0,
  };
  
  for (const data of datasParaProcessar) {
    process.stdout.write(`📅 ${data}... `);
    
    const resultado = await importarData(data);
    stats.total++;
    
    if (resultado.success) {
      const imported = resultado.data?.sucesso || 0;
      if (imported > 0) {
        console.log(`✅ ${imported} contagens`);
        stats.sucesso++;
      } else {
        console.log(`⚪ sem dados`);
        stats.semDados++;
      }
    } else {
      console.log(`❌ erro`);
      stats.erro++;
    }
    
    // Aguardar entre requisições
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO');
  console.log('='.repeat(60));
  console.log(`📅 Datas processadas: ${stats.total}`);
  console.log(`✅ Com dados: ${stats.sucesso}`);
  console.log(`⚪ Sem dados: ${stats.semDados}`);
  console.log(`❌ Erro: ${stats.erro}`);
  console.log('\n✅ Importação concluída!\n');
}

main().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});

