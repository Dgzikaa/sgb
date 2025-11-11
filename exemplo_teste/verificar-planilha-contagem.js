/**
 * Script para Verificar Estrutura da Planilha de Contagem
 */

const SPREADSHEET_ID = '1QhuD52kQrdCv4XMfKR5NSRMttx6NzVBZO0S8ajQK1H8';
const API_KEY = 'AIzaSyBKprFuR1gpvoTB4hV16rKlBk3oF0v1BhQ';

async function verificarPlanilha() {
  try {
    console.log('🔍 Verificando estrutura da planilha...\n');
    
    // 1. Buscar metadados da planilha
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}`;
    const metaResponse = await fetch(metaUrl);
    
    if (!metaResponse.ok) {
      const error = await metaResponse.json();
      console.error('❌ Erro ao acessar planilha:', error);
      return;
    }
    
    const metaData = await metaResponse.json();
    
    console.log('📊 Abas disponíveis:');
    metaData.sheets.forEach(sheet => {
      console.log(`   - ${sheet.properties.title} (ID: ${sheet.properties.sheetId}, ${sheet.properties.gridProperties.rowCount} linhas x ${sheet.properties.gridProperties.columnCount} colunas)`);
    });
    
    // 2. Buscar aba INSUMOS (header)
    console.log('\n📋 Verificando aba INSUMOS...\n');
    
    // Buscar primeiras linhas para entender estrutura
    const headerRange = 'INSUMOS!A1:ZZ10';
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(headerRange)}?key=${API_KEY}`;
    const headerResponse = await fetch(headerUrl);
    const headerData = await headerResponse.json();
    
    if (!headerData.values) {
      console.error('❌ Nenhum dado encontrado na aba INSUMOS');
      return;
    }
    
    console.log('📍 Estrutura das primeiras linhas:\n');
    
    // Linha 1-3
    console.log('Linha 1:', headerData.values[0]?.slice(0, 10).join(' | '));
    console.log('Linha 2:', headerData.values[1]?.slice(0, 10).join(' | '));
    console.log('Linha 3:', headerData.values[2]?.slice(0, 10).join(' | '));
    
    // Linha 4 - Datas (IMPORTANTE)
    console.log('\n📅 Linha 4 (DATAS):');
    const linha4 = headerData.values[3] || [];
    console.log('Primeiras colunas:', linha4.slice(0, 15).join(' | '));
    
    // Identificar colunas com datas
    const colunasComDatas = [];
    linha4.forEach((valor, indice) => {
      if (valor && (valor.includes('/2025') || valor.includes('/2024'))) {
        colunasComDatas.push({ indice, data: valor });
      }
    });
    
    console.log(`\n✅ Encontradas ${colunasComDatas.length} colunas com datas:`);
    colunasComDatas.slice(0, 5).forEach(col => {
      console.log(`   - Coluna ${col.indice}: ${col.data}`);
    });
    
    // Linha 6 - Cabeçalhos
    console.log('\n📋 Linha 6 (CABEÇALHOS):');
    const linha6 = headerData.values[5] || [];
    console.log('Primeiras colunas:', linha6.slice(0, 15).join(' | '));
    
    // Linha 7 - Primeiro insumo
    console.log('\n🔹 Linha 7 (PRIMEIRO INSUMO):');
    const linha7 = headerData.values[6] || [];
    console.log('Dados:', linha7.slice(0, 15).join(' | '));
    
    // Buscar última linha com dados
    console.log('\n📊 Buscando extensão dos dados...');
    const fullRange = 'INSUMOS!A1:E200';
    const fullUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(fullRange)}?key=${API_KEY}`;
    const fullResponse = await fetch(fullUrl);
    const fullData = await fullResponse.json();
    
    const totalLinhas = fullData.values?.length || 0;
    console.log(`✅ Total de linhas com dados: ${totalLinhas}`);
    
    // Última linha com insumo
    if (fullData.values && fullData.values.length > 0) {
      const ultimaLinha = fullData.values[fullData.values.length - 1];
      console.log(`📍 Última linha: ${ultimaLinha.slice(0, 5).join(' | ')}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ANÁLISE CONCLUÍDA!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  }
}

verificarPlanilha();

