/**
 * Lista todas as datas disponíveis na planilha
 */

const SPREADSHEET_ID = '1QhuD52kQrdCv4XMfKR5NSRMttx6NzVBZO0S8ajQK1H8';
const API_KEY = 'AIzaSyBKprFuR1gpvoTB4hV16rKlBk3oF0v1BhQ';

function converterData(dataStr) {
  if (!dataStr || !dataStr.includes('/')) return null;
  const partes = dataStr.split('/');
  if (partes.length !== 3) return null;
  const [dia, mes, ano] = partes;
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

async function listarDatas() {
  try {
    console.log('🔍 Listando datas disponíveis na planilha...\n');
    
    const range = 'INSUMOS!A1:ZZZ200';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    const linhas = data.values || [];
    
    const linhaDatas = linhas[3] || [];
    
    const datasComDados = [];
    
    for (let i = 0; i < linhaDatas.length; i++) {
      const valor = linhaDatas[i];
      if (valor && valor.includes('/')) {
        const dataFormatada = converterData(valor);
        if (dataFormatada) {
          // Contar quantos insumos têm dados
          let contador = 0;
          for (let j = 6; j < Math.min(linhas.length, 200); j++) {
            const linha = linhas[j];
            if (linha && linha[i]) {
              const val = parseFloat(linha[i]);
              if (val && val > 0) contador++;
            }
          }
          
          if (contador > 0) {
            datasComDados.push({ data: dataFormatada, insumos: contador });
          }
        }
      }
    }
    
    console.log(`✅ ${datasComDados.length} datas com dados\n`);
    console.log('📅 Últimas 20 datas:\n');
    
    datasComDados.slice(-20).forEach(item => {
      console.log(`   ${item.data} - ${item.insumos} insumos`);
    });
    
    console.log(`\n📊 Período: ${datasComDados[0]?.data} até ${datasComDados[datasComDados.length - 1]?.data}`);
    console.log(`📦 Total de contagens: ${datasComDados.reduce((sum, item) => sum + item.insumos, 0)}\n`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

listarDatas();

