/**
 * Script de Teste - Google Sheets API com Service Account
 * 
 * Testa a conexão usando Service Account (método OAuth2)
 * 
 * Como usar:
 * node exemplo_teste/teste-google-sheets-service-account.js
 */

const fs = require('fs');
const path = require('path');

// Carregar credenciais
const credentialsPath = path.join(__dirname, 'credentials_deboche_ordinario.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

// Configurações
const SPREADSHEET_ID = '1sYIKzphim9bku0jl_J6gSDEqrIhYMxAn';
const RANGE = 'Pesq. da Felicidade!A4:K100';

// Função para criar JWT
function createJWT(clientEmail, privateKey) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
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
async function getAccessToken() {
  const jwt = createJWT(credentials.client_email, credentials.private_key);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
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

// Função principal de teste
async function testarConexao() {
  console.log('🔍 Testando conexão com Google Sheets usando Service Account...\n');
  
  try {
    // 1. Obter Access Token
    console.log('⏳ Obtendo Access Token...');
    const accessToken = await getAccessToken();
    console.log('✅ Access Token obtido com sucesso!\n');

    // 2. Buscar dados da planilha
    console.log('📡 Buscando dados da planilha...');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(RANGE)}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('\n❌ Erro na API:');
      console.error(JSON.stringify(errorData, null, 2));
      
      if (response.status === 403) {
        console.error('\n⚠️ ERRO 403: A planilha precisa ser compartilhada com:');
        console.error(`   ${credentials.client_email}`);
        console.error('\n📝 Como compartilhar:');
        console.error('   1. Abra a planilha no Google Sheets');
        console.error('   2. Clique em "Compartilhar"');
        console.error('   3. Cole o email acima e dê permissão de "Visualizador"');
      }
      
      return;
    }

    const data = await response.json();

    console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO!\n');
    console.log('📋 Informações da planilha:');
    console.log(`   - Range: ${data.range}`);
    console.log(`   - Linhas encontradas: ${data.values?.length || 0}`);

    if (data.values && data.values.length > 0) {
      console.log('\n📊 Primeiras 3 linhas (exemplo):');
      data.values.slice(0, 3).forEach((row, index) => {
        console.log(`   Linha ${index + 1}:`, row.slice(0, 8).join(' | '));
      });

      console.log('\n✅ Dados prontos para importação!');
      console.log(`   Total de registros: ${data.values.length}`);

      // Exemplo de registro processado
      console.log('\n📝 Exemplo de registro processado:');
      if (data.values[0]) {
        const row = data.values[0];
        
        // Parsear data
        const dataParts = row[0]?.split('/') || [];
        let dataFormatada = 'N/A';
        if (dataParts.length === 3) {
          const dia = dataParts[0].padStart(2, '0');
          const mes = dataParts[1].padStart(2, '0');
          const ano = dataParts[2];
          dataFormatada = `${ano}-${mes}-${dia}`;
        }

        // Converter percentuais
        const parsePercentual = (val) => {
          if (!val) return 0;
          const num = parseFloat(val.replace('%', '').replace(',', '.'));
          return (num / 100).toFixed(4);
        };

        const exemplo = {
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
        console.log(JSON.stringify(exemplo, null, 2));
      }

      console.log('\n🎯 Próximos passos:');
      console.log('   1. ✅ Service Account funcionando');
      console.log('   2. ⏭️  Deploy da Edge Function no Supabase');
      console.log('   3. ⏭️  Configurar Cron Job para sync automático');
    } else {
      console.log('\n⚠️ Nenhum dado encontrado no range especificado.');
    }

  } catch (error) {
    console.error('\n❌ ERRO AO CONECTAR:');
    console.error(error.message);
    console.error('\nDetalhes:', error);
  }
}

// Executar teste
testarConexao();

