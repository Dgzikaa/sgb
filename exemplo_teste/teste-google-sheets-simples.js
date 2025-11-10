/**
 * Script de Teste SIMPLES - Google Sheets API
 * 
 * Testa usando API Key pública (método mais simples)
 * Requer que a planilha esteja compartilhada publicamente
 * 
 * Como usar:
 * node exemplo_teste/teste-google-sheets-simples.js
 */

const SPREADSHEET_ID = '1sYIKzphim9bku0jl_J6gSDEqrIhYMxAn';

async function testarConexao() {
  console.log('🔍 Testando acesso ao Google Sheets (sem API Key)...\n');
  
  try {
    // Primeiro, vamos tentar obter metadados da planilha
    console.log('📡 Buscando informações da planilha...');
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;
    
    const metadataResponse = await fetch(metadataUrl);
    
    if (!metadataResponse.ok) {
      const errorData = await metadataResponse.json();
      console.error('\n❌ Erro ao acessar planilha:');
      console.error(JSON.stringify(errorData, null, 2));
      
      if (metadataResponse.status === 403 || metadataResponse.status === 401) {
        console.error('\n⚠️ ERRO DE PERMISSÃO:');
        console.error('   A planilha precisa estar compartilhada publicamente OU');
        console.error('   Precisamos usar uma API Key válida.');
        console.error('\n📝 Opções:');
        console.error('   1. Compartilhar planilha como "Qualquer pessoa com o link pode visualizar"');
        console.error('   2. OU criar uma API Key no Google Cloud Console');
      }
      
      return;
    }

    const metadata = await metadataResponse.json();
    
    console.log('✅ Planilha acessível!\n');
    console.log('📋 Informações da planilha:');
    console.log(`   - Título: ${metadata.properties?.title || 'N/A'}`);
    console.log(`   - Abas disponíveis:`);
    
    if (metadata.sheets) {
      metadata.sheets.forEach((sheet, index) => {
        console.log(`      ${index + 1}. "${sheet.properties.title}" (${sheet.properties.gridProperties.rowCount} linhas)`);
      });
    }

    // Tentar buscar dados de uma aba específica
    console.log('\n📡 Tentando buscar dados...');
    
    // Tentar diferentes nomes de aba
    const possiveisNomes = [
      'Pesq. da Felicidade',
      'Pesquisa da Felicidade',
      'Pesquisa',
      metadata.sheets?.[0]?.properties?.title // Primeira aba
    ];

    for (const nomeAba of possiveisNomes) {
      if (!nomeAba) continue;
      
      console.log(`\n🔍 Testando aba: "${nomeAba}"`);
      const range = `${nomeAba}!A1:K10`;
      const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
      
      const dataResponse = await fetch(dataUrl);
      
      if (dataResponse.ok) {
        const data = await dataResponse.json();
        console.log(`✅ Aba encontrada! ${data.values?.length || 0} linhas`);
        
        if (data.values && data.values.length > 0) {
          console.log('\n📊 Primeiras 3 linhas:');
          data.values.slice(0, 3).forEach((row, index) => {
            console.log(`   ${index + 1}:`, row.slice(0, 5).join(' | '));
          });
        }
        
        console.log(`\n✅ USE ESTE RANGE: "${nomeAba}!A4:K100"`);
        break;
      } else {
        console.log(`❌ Aba não encontrada ou sem acesso`);
      }
    }

  } catch (error) {
    console.error('\n❌ ERRO:');
    console.error(error.message);
  }
}

testarConexao();

