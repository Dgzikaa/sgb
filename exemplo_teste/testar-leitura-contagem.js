/**
 * Script de Teste - Leitura de Contagem do Sheets
 * 
 * Testa a leitura dos dados sem fazer importação
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

async function testarLeitura() {
  try {
    const dataTestar = process.argv[2] || '2025-11-08';
    console.log(`🔍 Testando leitura da data: ${dataTestar}\n`);
    
    // Buscar estrutura da planilha
    const range = 'INSUMOS!A1:ZZZ200';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao acessar planilha: ${response.status}`);
    }
    
    const data = await response.json();
    const linhas = data.values || [];
    
    console.log(`✅ ${linhas.length} linhas lidas da planilha\n`);
    
    // Linha 4 = datas
    const linhaDatas = linhas[3] || [];
    
    // Encontrar coluna da data
    let colunaData = -1;
    let totalDatas = 0;
    
    for (let i = 0; i < linhaDatas.length; i++) {
      const valor = linhaDatas[i];
      if (valor && valor.includes('/')) {
        const dataFormatada = converterData(valor);
        if (dataFormatada) {
          totalDatas++;
          if (dataFormatada === dataTestar) {
            colunaData = i;
          }
        }
      }
    }
    
    console.log(`📅 Total de datas na planilha: ${totalDatas}`);
    
    if (colunaData === -1) {
      console.log(`❌ Data ${dataTestar} não encontrada na planilha\n`);
      console.log('📋 Datas disponíveis (últimas 10):');
      
      const datasEncontradas = [];
      linhaDatas.forEach(valor => {
        if (valor && valor.includes('/')) {
          const dataFormatada = converterData(valor);
          if (dataFormatada) datasEncontradas.push(dataFormatada);
        }
      });
      
      datasEncontradas.slice(-10).forEach(d => console.log(`   - ${d}`));
      return;
    }
    
    console.log(`✅ Data ${dataTestar} encontrada na coluna ${colunaData}\n`);
    
    // Processar insumos
    const insumosComContagem = [];
    
    for (let i = 6; i < Math.min(linhas.length, 50); i++) {
      const linha = linhas[i];
      if (!linha || linha.length < 7) continue;
      
      const codigo = linha[3]?.toString().trim();
      const nome = linha[6]?.toString().trim();
      
      if (!codigo || !nome) continue;
      
      const estoqueFechado = parseFloat(linha[colunaData]) || null;
      const pedido = parseFloat(linha[colunaData + 2]) || null;
      
      if (estoqueFechado !== null && estoqueFechado > 0) {
        insumosComContagem.push({
          codigo,
          nome,
          estoque_fechado: estoqueFechado,
          pedido: pedido || 0,
        });
      }
    }
    
    console.log(`✅ ${insumosComContagem.length} insumos com contagem para ${dataTestar}`);
    console.log('\n📋 Exemplos (primeiros 10):\n');
    
    insumosComContagem.slice(0, 10).forEach(insumo => {
      console.log(`   ${insumo.codigo.padEnd(10)} | ${insumo.nome.padEnd(30).substring(0, 30)} | Est: ${insumo.estoque_fechado} | Ped: ${insumo.pedido}`);
    });
    
    console.log('\n✅ Teste concluído!\n');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  }
}

testarLeitura();

