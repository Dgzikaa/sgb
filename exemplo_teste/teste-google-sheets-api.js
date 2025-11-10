/**
 * Script de Teste - Google Sheets API
 * 
 * Este script testa a conexão com o Google Sheets API
 * usando a API Key fornecida.
 * 
 * Como usar:
 * 1. Coloque a API Key no lugar de 'SUA_API_KEY_AQUI'
 * 2. Execute: node exemplo_teste/teste-google-sheets-api.js
 */

// Configurações
const SPREADSHEET_ID = '1sYIKzphim9bku0jl_J6gSDEqrIhYMxAn';
const RANGE = 'Pesq. da Felicidade!A4:K100'; // Range da planilha
const API_KEY = 'AIzaSyBKprFuR1gpvoTB4hV16rKlBk3oF0v1BhQ';

async function testarConexaoGoogleSheets() {
  console.log('🔍 Testando conexão com Google Sheets API...\n');
  
  try {
    // Construir URL da API
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(RANGE)}?key=${API_KEY}`;
    
    console.log('📡 URL da requisição:');
    console.log(url.replace(API_KEY, 'API_KEY_OCULTA'));
    console.log('');
    
    // Fazer requisição
    console.log('⏳ Fazendo requisição...\n');
    const response = await fetch(url);
    
    // Verificar status
    console.log(`📊 Status HTTP: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('\n❌ Erro na API:');
      console.error(JSON.stringify(errorData, null, 2));
      
      if (response.status === 403) {
        console.error('\n⚠️ ERRO 403: Verifique se:');
        console.error('   1. A API Key está correta');
        console.error('   2. A Google Sheets API está habilitada no projeto');
        console.error('   3. A planilha está compartilhada publicamente ou com a service account');
      }
      
      return;
    }
    
    // Processar dados
    const data = await response.json();
    
    console.log('\n✅ CONEXÃO ESTABELECIDA COM SUCESSO!\n');
    console.log('📋 Informações da planilha:');
    console.log(`   - Range: ${data.range}`);
    console.log(`   - Linhas encontradas: ${data.values?.length || 0}`);
    
    if (data.values && data.values.length > 0) {
      console.log('\n📊 Primeiras 3 linhas (exemplo):');
      data.values.slice(0, 3).forEach((row, index) => {
        console.log(`   Linha ${index + 1}:`, row.slice(0, 5).join(' | '), '...');
      });
      
      console.log('\n✅ Dados prontos para importação!');
      console.log(`   Total de registros: ${data.values.length}`);
      
      // Exemplo de como seria processado
      console.log('\n📝 Exemplo de registro processado:');
      if (data.values[0]) {
        const primeiraLinha = data.values[0];
        const exemplo = {
          data_pesquisa: primeiraLinha[0] || 'N/A',
          setor: primeiraLinha[1] || 'Geral',
          quorum: primeiraLinha[2] || '0',
          engajamento: primeiraLinha[3] || '0',
          pertencimento: primeiraLinha[4] || '0',
          relacionamento: primeiraLinha[5] || '0',
          lideranca: primeiraLinha[6] || '0',
          reconhecimento: primeiraLinha[7] || '0',
        };
        console.log(JSON.stringify(exemplo, null, 2));
      }
    } else {
      console.log('\n⚠️ Nenhum dado encontrado no range especificado.');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO AO CONECTAR:');
    console.error(error.message);
    
    if (error.message.includes('fetch')) {
      console.error('\n⚠️ Erro de rede. Verifique sua conexão com a internet.');
    }
  }
}

// Verificar se a API Key foi configurada
if (API_KEY === 'SUA_API_KEY_AQUI') {
  console.error('❌ ERRO: API Key não configurada!');
  console.error('\n📝 Como configurar:');
  console.error('   1. Abra este arquivo: exemplo_teste/teste-google-sheets-api.js');
  console.error('   2. Substitua "SUA_API_KEY_AQUI" pela API Key real');
  console.error('   3. Execute novamente: node exemplo_teste/teste-google-sheets-api.js');
  console.error('\n🔑 API Key deve estar em: exemplo_teste/credentials_deboche_ordinario');
  process.exit(1);
}

// Executar teste
testarConexaoGoogleSheets();

