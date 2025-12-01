const { google } = require('googleapis');
const fs = require('fs');

// Credenciais
const credentialsBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64 || fs.readFileSync('certificates/google-service-account-base64.txt', 'utf8');
const credentials = JSON.parse(Buffer.from(credentialsBase64, 'base64').toString('utf8'));

const SPREADSHEET_ID = '1GSsU3G2uEl6RHkQUop_WDWjzLBsMVomJN-rf-_J8Sx4';
const SHEET_NAME = 'Respostas ao formulário 1';

async function debugDatas() {
  try {
    console.log('🔍 Conectando ao Google Sheets...\n');
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Buscar linhas 1041-1050 (primeiras 10 da Semana 45)
    console.log('📊 Buscando linhas 1041-1050 (Semana 45)...\n');
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1041:P1050`,
      valueRenderOption: 'UNFORMATTED_VALUE', // Retorna valores RAW (números, não strings)
    });
    
    const rows = response.data.values || [];
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('LINHA | TIPO COLUNA A | VALOR COLUNA A             | COLUNA O       | COLUNA P');
    console.log('═══════════════════════════════════════════════════════════════');
    
    rows.forEach((row, index) => {
      const lineNum = 1041 + index;
      const colA = row[0];
      const colO = row[14]; // Coluna O (Data ajustada)
      const colP = row[15]; // Coluna P (Semana)
      
      const tipo = typeof colA;
      let valorA = colA;
      
      // Se for número, converter para data Excel
      if (tipo === 'number') {
        const date = new Date((colA - 25569) * 86400 * 1000);
        valorA = `${colA} (Excel) → ${date.toISOString()}`;
      }
      
      console.log(`${String(lineNum).padStart(4)} | ${tipo.padEnd(13)} | ${String(valorA).substring(0, 26).padEnd(26)} | ${String(colO).padEnd(14)} | ${colP || 'N/A'}`);
    });
    
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Agora buscar com FORMATTED_VALUE
    console.log('📊 Buscando MESMAS linhas com FORMATTED_VALUE (como string)...\n');
    
    const response2 = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1041:P1050`,
      valueRenderOption: 'FORMATTED_VALUE', // Retorna valores formatados como string
    });
    
    const rows2 = response2.data.values || [];
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('LINHA | TIPO COLUNA A | VALOR COLUNA A (FORMATTED)');
    console.log('═══════════════════════════════════════════════════════════════');
    
    rows2.forEach((row, index) => {
      const lineNum = 1041 + index;
      const colA = row[0];
      const tipo = typeof colA;
      
      console.log(`${String(lineNum).padStart(4)} | ${tipo.padEnd(13)} | ${colA}`);
    });
    
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('✅ Debug concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  }
}

debugDatas();

