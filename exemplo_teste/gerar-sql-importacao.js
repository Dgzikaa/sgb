/**
 * Gera SQL para importar contagens via Edge Function
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

async function buscarDatasDisponiveis() {
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
}

async function main() {
  const dataInicial = process.argv[2] || '2025-01-26';
  const dataFinal = process.argv[3] || '2025-12-31';
  
  console.log('-- SQL para importação de contagens');
  console.log(`-- Período: ${dataInicial} até ${dataFinal}\n`);
  
  const todasDatas = await buscarDatasDisponiveis();
  const datasParaProcessar = todasDatas.filter(d => d >= dataInicial && d <= dataFinal);
  
  console.log(`-- Total de ${datasParaProcessar.length} datas\n`);
  
  // Gerar em lotes de 50 datas
  const BATCH_SIZE = 50;
  
  for (let i = 0; i < datasParaProcessar.length; i += BATCH_SIZE) {
    const batch = datasParaProcessar.slice(i, i + BATCH_SIZE);
    
    console.log(`-- Lote ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} datas)`);
    console.log('DO $$');
    console.log('BEGIN');
    
    batch.forEach(data => {
      console.log(`  PERFORM net.http_post(
    url := 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/sync-contagem-sheets?data=${data}',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );`);
    });
    
    console.log('END $$;\n');
  }
  
  console.log('-- Verificar resultado:');
  console.log('SELECT COUNT(*) FROM contagem_estoque_insumos;');
}

main();

