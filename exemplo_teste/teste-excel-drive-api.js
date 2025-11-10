/**
 * Script de Teste - Google Drive API para ler Excel
 * 
 * Lê arquivos Excel (.xlsx) diretamente usando Google Drive API
 * e converte para formato compatível
 * 
 * Como usar:
 * node exemplo_teste/teste-excel-drive-api.js
 */

const fs = require('fs');
const path = require('path');

// Carregar credenciais
const credentialsPath = path.join(__dirname, 'credentials_deboche_ordinario.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

const FILE_ID = '1sYIKzphim9bku0jl_J6gSDEqrIhYMxAn';

// Função para criar JWT
function createJWT(clientEmail, privateKey, scopes) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

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

async function testarDriveAPI() {
  console.log('🔍 Testando Google Drive API para ler Excel...\n');
  
  try {
    // 1. Obter Access Token com escopo do Drive
    console.log('⏳ Obtendo Access Token...');
    const accessToken = await getAccessToken([
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/spreadsheets.readonly'
    ]);
    console.log('✅ Access Token obtido!\n');

    // 2. Obter metadados do arquivo
    console.log('📡 Buscando informações do arquivo...');
    const metadataUrl = `https://www.googleapis.com/drive/v3/files/${FILE_ID}?fields=id,name,mimeType,size,createdTime,modifiedTime`;
    
    const metadataResponse = await fetch(metadataUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!metadataResponse.ok) {
      const errorData = await metadataResponse.json();
      console.error('\n❌ Erro ao acessar arquivo:');
      console.error(JSON.stringify(errorData, null, 2));
      
      if (metadataResponse.status === 403 || metadataResponse.status === 404) {
        console.error('\n⚠️ ERRO DE PERMISSÃO:');
        console.error('   O arquivo precisa ser compartilhado com:');
        console.error(`   ${credentials.client_email}`);
        console.error('\n📝 Como compartilhar:');
        console.error('   1. Abra o arquivo no Google Drive');
        console.error('   2. Clique em "Compartilhar"');
        console.error('   3. Cole o email acima e dê permissão de "Visualizador"');
      }
      
      return;
    }

    const metadata = await metadataResponse.json();
    
    console.log('✅ Arquivo acessível!\n');
    console.log('📋 Informações do arquivo:');
    console.log(`   - Nome: ${metadata.name}`);
    console.log(`   - Tipo: ${metadata.mimeType}`);
    console.log(`   - Tamanho: ${(metadata.size / 1024).toFixed(2)} KB`);
    console.log(`   - Modificado: ${new Date(metadata.modifiedTime).toLocaleString('pt-BR')}`);

    // 3. Exportar como CSV (Google Drive pode converter Excel para CSV)
    console.log('\n📡 Tentando exportar como Google Sheets...');
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${FILE_ID}/export?mimeType=text/csv`;
    
    const exportResponse = await fetch(exportUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (exportResponse.ok) {
      const csvData = await exportResponse.text();
      const lines = csvData.split('\n').filter(line => line.trim());
      
      console.log('✅ Dados exportados com sucesso!\n');
      console.log(`📊 Total de linhas: ${lines.length}`);
      console.log('\n📝 Primeiras 5 linhas:');
      lines.slice(0, 5).forEach((line, index) => {
        console.log(`   ${index + 1}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
      });

      // Tentar parsear dados
      console.log('\n🔍 Analisando estrutura dos dados...');
      if (lines.length > 1) {
        const header = lines[0].split(',');
        console.log(`   Colunas detectadas: ${header.length}`);
        console.log(`   Cabeçalhos: ${header.slice(0, 8).join(' | ')}`);
      }

      console.log('\n✅ SUCESSO! Podemos usar esta abordagem para sincronização automática!');
      
    } else {
      const errorData = await exportResponse.json();
      console.error('\n❌ Erro ao exportar:');
      console.error(JSON.stringify(errorData, null, 2));
      
      // Tentar baixar o arquivo diretamente
      console.log('\n📡 Tentando download direto do arquivo...');
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${FILE_ID}?alt=media`;
      
      const downloadResponse = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (downloadResponse.ok) {
        const buffer = await downloadResponse.arrayBuffer();
        console.log(`✅ Arquivo baixado! Tamanho: ${(buffer.byteLength / 1024).toFixed(2)} KB`);
        console.log('\n⚠️ Arquivo é Excel binário (.xlsx)');
        console.log('   Precisaremos usar uma biblioteca como "xlsx" para processar');
        console.log('\n📝 Próximo passo: Instalar biblioteca xlsx no Edge Function');
      } else {
        console.error('❌ Não foi possível baixar o arquivo');
      }
    }

  } catch (error) {
    console.error('\n❌ ERRO:');
    console.error(error.message);
    console.error('\nStack:', error.stack);
  }
}

testarDriveAPI();

