// Teste simples do token Sympla

const token = '2835b1e7099e748057c71a9c0c34b3a4ca1246b379687ebf8affa92cdc65a7a4';

async function testarToken() {
  console.log('🧪 Testando token Sympla...\n');
  
  // Teste 1: Endpoint básico de eventos
  console.log('📋 Teste 1: GET /public/v1.5.1/events (sem filtros)');
  try {
    const url1 = 'https://api.sympla.com.br/public/v1.5.1/events';
    console.log(`   URL: ${url1}`);
    
    const response1 = await fetch(url1, {
      method: 'GET',
      headers: {
        's_token': token,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${response1.status} ${response1.statusText}`);
    
    if (response1.ok) {
      const data = await response1.json();
      console.log(`   ✅ Sucesso! ${data.data?.length || 0} eventos retornados`);
      if (data.data && data.data.length > 0) {
        console.log(`   📊 Primeiro evento: ${data.data[0].name}`);
      }
    } else {
      const errorText = await response1.text();
      console.log(`   ❌ Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Exceção: ${error.message}`);
  }
  
  console.log('\n---\n');
  
  // Teste 2: Endpoint com página 1
  console.log('📋 Teste 2: GET /public/v1.5.1/events?page=1');
  try {
    const url2 = 'https://api.sympla.com.br/public/v1.5.1/events?page=1';
    console.log(`   URL: ${url2}`);
    
    const response2 = await fetch(url2, {
      method: 'GET',
      headers: {
        's_token': token,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${response2.status} ${response2.statusText}`);
    
    if (response2.ok) {
      const data = await response2.json();
      console.log(`   ✅ Sucesso! ${data.data?.length || 0} eventos retornados`);
    } else {
      const errorText = await response2.text();
      console.log(`   ❌ Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Exceção: ${error.message}`);
  }
  
  console.log('\n---\n');
  
  // Teste 3: Verificar estrutura da resposta
  console.log('📋 Teste 3: Verificar headers aceitos');
  try {
    const url3 = 'https://api.sympla.com.br/public/v1.5.1/events';
    
    const response3 = await fetch(url3, {
      method: 'OPTIONS',
      headers: {
        's_token': token
      }
    });
    
    console.log(`   Status: ${response3.status} ${response3.statusText}`);
    console.log(`   Headers disponíveis:`);
    response3.headers.forEach((value, key) => {
      console.log(`     ${key}: ${value}`);
    });
  } catch (error) {
    console.log(`   ❌ Exceção: ${error.message}`);
  }
  
  console.log('\n---\n');
  
  // Teste 4: Tentar outro formato de autenticação
  console.log('📋 Teste 4: Testar com Bearer token');
  try {
    const url4 = 'https://api.sympla.com.br/public/v1.5.1/events';
    console.log(`   URL: ${url4}`);
    
    const response4 = await fetch(url4, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${response4.status} ${response4.statusText}`);
    
    if (response4.ok) {
      const data = await response4.json();
      console.log(`   ✅ Sucesso! ${data.data?.length || 0} eventos retornados`);
    } else {
      const errorText = await response4.text();
      console.log(`   ❌ Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Exceção: ${error.message}`);
  }
}

console.log('🔑 Token: ' + token.substring(0, 10) + '...' + token.substring(token.length - 10));
console.log('');

testarToken()
  .then(() => {
    console.log('\n✅ Testes concluídos');
  })
  .catch(error => {
    console.error('\n❌ Erro nos testes:', error);
  });

