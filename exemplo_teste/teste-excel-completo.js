/**
 * Script de Teste - Ler Excel do Google Drive e processar
 * 
 * Baixa o arquivo Excel e processa usando biblioteca xlsx
 * 
 * Instalação: npm install xlsx
 * Uso: node exemplo_teste/teste-excel-completo.js
 */

const fs = require('fs');
const path = require('path');

// Carregar credenciais
const credentialsPath = path.join(__dirname, 'credentials_deboche_ordinario.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

const FILE_ID = '1sYIKzphim9bku0jl_J6gSDEqrIhYMxAn';
const SHEET_NAME = 'Pesq. da Felicidade'; // Nome da aba

// Verificar se xlsx está instalado
let XLSX;
try {
  XLSX = require('xlsx');
} catch (e) {
  console.error('❌ Biblioteca "xlsx" não encontrada!');
  console.error('\n📦 Instale com: npm install xlsx');
  console.error('   ou: cd F:\\Zykor && npm install xlsx');
  process.exit(1);
}

// Função para criar JWT
function createJWT(clientEmail, privateKey, scopes) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const crypto = require('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${base64Header}.${base64Payload}`);
  const signature = sign.sign(privateKey, 'base64url');

  return `${base64Header}.${base64Payload}.${signature}`;
}

// Função para obter Access Token
async function getAccessToken(scopes) {
  const jwt = createJWT(credentials.client_email, credentials.private_key, scopes);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`Erro ao obter token: ${data.error_description || data.error}`);
  }
  return data.access_token;
}

async function processarExcel() {
  console.log('🔍 Processando Excel do Google Drive...\n');
  
  try {
    // 1. Obter Access Token
    console.log('⏳ Obtendo Access Token...');
    const accessToken = await getAccessToken([
      'https://www.googleapis.com/auth/drive.readonly'
    ]);
    console.log('✅ Token obtido!\n');

    // 2. Baixar arquivo
    console.log('📥 Baixando arquivo Excel...');
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${FILE_ID}?alt=media`;
    
    const response = await fetch(downloadUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Erro ao baixar: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`✅ Arquivo baixado! (${(buffer.length / 1024).toFixed(2)} KB)\n`);

    // 3. Processar com xlsx
    console.log('📊 Processando planilha...');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    console.log('✅ Planilha carregada!\n');
    console.log('📑 Abas disponíveis:');
    workbook.SheetNames.forEach((name, index) => {
      console.log(`   ${index + 1}. "${name}"`);
    });

    // 4. Buscar aba específica
    let targetSheet = null;
    let targetSheetName = '';

    // Tentar encontrar a aba (com ou sem ".")
    const possibleNames = [
      'Pesq. da Felicidade',
      'Pesq da Felicidade',
      'Pesquisa da Felicidade',
      'Pesquisa',
    ];

    for (const name of possibleNames) {
      if (workbook.SheetNames.includes(name)) {
        targetSheet = workbook.Sheets[name];
        targetSheetName = name;
        break;
      }
    }

    if (!targetSheet) {
      console.warn('\n⚠️ Aba "Pesq. da Felicidade" não encontrada!');
      console.log('   Usando primeira aba disponível...');
      targetSheetName = workbook.SheetNames[0];
      targetSheet = workbook.Sheets[targetSheetName];
    }

    console.log(`\n📄 Processando aba: "${targetSheetName}"`);

    // 5. Converter para JSON
    const jsonData = XLSX.utils.sheet_to_json(targetSheet, { 
      header: 1, // Retorna array de arrays
      defval: '', // Valor padrão para células vazias
      raw: false // Formatar valores
    });

    console.log(`✅ ${jsonData.length} linhas encontradas\n`);

    // 6. Processar dados (pular cabeçalho - linha 0 a 3)
    const dadosProcessados = [];
    
    // Assumindo que dados começam na linha 4 (índice 3)
    for (let i = 3; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      // Pular linhas vazias
      if (!row[0] || row[0].trim() === '') continue;

      try {
        // Processar data
        let dataFormatada = '';
        if (row[0]) {
          // Pode vir como data Excel ou string DD/MM/YYYY
          if (typeof row[0] === 'number') {
            // Data Excel (número de dias desde 1900)
            const date = XLSX.SSF.parse_date_code(row[0]);
            dataFormatada = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
          } else {
            // String DD/MM/YYYY
            const parts = row[0].split('/');
            if (parts.length === 3) {
              dataFormatada = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
        }

        if (!dataFormatada) continue;

        // Converter percentuais
        const parsePercentual = (val) => {
          if (!val) return 0;
          const str = String(val).replace('%', '').replace(',', '.');
          const num = parseFloat(str);
          // Se já está em decimal (0.xx), retornar direto, senão dividir por 100
          return num > 1 ? num / 100 : num;
        };

        const registro = {
          bar_id: 3,
          data_pesquisa: dataFormatada,
          setor: row[1] || 'TODOS',
          quorum: parseInt(row[2]) || 0,
          eu_comigo_engajamento: parsePercentual(row[3]),
          eu_com_empresa_pertencimento: parsePercentual(row[4]),
          eu_com_colega_relacionamento: parsePercentual(row[5]),
          eu_com_gestor_lideranca: parsePercentual(row[6]),
          justica_reconhecimento: parsePercentual(row[7]),
          funcionario_nome: 'Equipe',
        };

        dadosProcessados.push(registro);
      } catch (error) {
        console.error(`⚠️ Erro ao processar linha ${i + 1}:`, error.message);
      }
    }

    console.log('📊 Dados processados:\n');
    console.log(`   Total de registros válidos: ${dadosProcessados.length}`);
    
    if (dadosProcessados.length > 0) {
      console.log('\n📝 Exemplo de registro (primeiro):');
      console.log(JSON.stringify(dadosProcessados[0], null, 2));
      
      console.log('\n📝 Exemplo de registro (último):');
      console.log(JSON.stringify(dadosProcessados[dadosProcessados.length - 1], null, 2));

      console.log('\n✅ SUCESSO! Dados prontos para inserir no Supabase!');
      console.log(`   ${dadosProcessados.length} registros para sincronizar`);
    } else {
      console.warn('\n⚠️ Nenhum registro válido encontrado!');
    }

  } catch (error) {
    console.error('\n❌ ERRO:');
    console.error(error.message);
    console.error('\nStack:', error.stack);
  }
}

processarExcel();

