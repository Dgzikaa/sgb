/**
 * Verificar tipo e estrutura do documento
 */

const SPREADSHEET_ID = '1sYIKzphim9bku0jl_J6gSDEqrIhYMxAn';
const API_KEY = 'AIzaSyBKprFuR1gpvoTB4hV16rKlBk3oF0v1BhQ';

async function verificarDocumento() {
  console.log('🔍 Verificando documento...\n');
  
  try {
    // Tentar obter metadados
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}`;
    
    console.log('📡 Buscando metadados...');
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('\n❌ Erro:');
      console.error(JSON.stringify(errorData, null, 2));
      
      if (errorData.error?.code === 404) {
        console.error('\n⚠️ Documento não encontrado ou não é um Google Sheets!');
        console.error('   Verifique se o link está correto.');
      } else if (errorData.error?.code === 403) {
        console.error('\n⚠️ Sem permissão de acesso!');
        console.error('   A planilha precisa estar compartilhada publicamente.');
      } else if (errorData.error?.code === 400) {
        console.error('\n⚠️ Documento não é compatível com Google Sheets API!');
        console.error('   Pode ser um arquivo Excel (.xlsx) importado.');
        console.error('\n📝 Solução:');
        console.error('   1. Abra o documento no Google Sheets');
        console.error('   2. Arquivo > Fazer uma cópia');
        console.error('   3. Use a cópia (será um Google Sheets nativo)');
      }
      
      return;
    }

    const data = await response.json();
    
    console.log('✅ Documento acessível!\n');
    console.log('📋 Informações:');
    console.log(`   - Título: ${data.properties?.title || 'N/A'}`);
    console.log(`   - Locale: ${data.properties?.locale || 'N/A'}`);
    console.log(`   - Timezone: ${data.properties?.timeZone || 'N/A'}`);
    console.log(`   - Total de abas: ${data.sheets?.length || 0}`);
    
    if (data.sheets) {
      console.log('\n📑 Abas disponíveis:');
      data.sheets.forEach((sheet, index) => {
        const props = sheet.properties;
        console.log(`   ${index + 1}. "${props.title}"`);
        console.log(`      - ID: ${props.sheetId}`);
        console.log(`      - Linhas: ${props.gridProperties?.rowCount || 0}`);
        console.log(`      - Colunas: ${props.gridProperties?.columnCount || 0}`);
      });
      
      // Tentar buscar dados da primeira aba
      console.log('\n📡 Tentando buscar dados da primeira aba...');
      const primeiraAba = data.sheets[0].properties.title;
      const range = `${primeiraAba}!A1:K10`;
      const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
      
      const dataResponse = await fetch(dataUrl);
      
      if (dataResponse.ok) {
        const sheetData = await dataResponse.json();
        console.log(`✅ Dados obtidos com sucesso!`);
        console.log(`   Range: ${sheetData.range}`);
        console.log(`   Linhas: ${sheetData.values?.length || 0}`);
        
        if (sheetData.values && sheetData.values.length > 0) {
          console.log('\n📊 Primeiras 3 linhas:');
          sheetData.values.slice(0, 3).forEach((row, index) => {
            console.log(`   ${index + 1}:`, row.join(' | '));
          });
        }
        
        console.log(`\n✅ TUDO FUNCIONANDO!`);
        console.log(`   Use o range: "${primeiraAba}!A4:K100"`);
      } else {
        const errorData = await dataResponse.json();
        console.error('\n❌ Erro ao buscar dados:');
        console.error(JSON.stringify(errorData, null, 2));
      }
    }

  } catch (error) {
    console.error('\n❌ ERRO:');
    console.error(error.message);
  }
}

verificarDocumento();

