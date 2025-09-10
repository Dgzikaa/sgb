// Teste simples de login no ContaHub
const CONTAHUB_EMAIL = 'digao@3768';
const CONTAHUB_PASSWORD = 'Geladeira@001';
const contahubBaseUrl = 'https://sp.contahub.com';

// Função para gerar timestamp dinâmico
function generateDynamicTimestamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(now.getMilliseconds()).padStart(3, '0')}`;
}

async function testeLogin() {
  console.log('🔐 Testando login no ContaHub...');
  
  // Hash SHA-1 da senha
  const encoder = new TextEncoder();
  const data = encoder.encode(CONTAHUB_PASSWORD);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const passwordSha1 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  console.log('🔑 Password SHA-1:', passwordSha1);
  
  const loginData = new URLSearchParams({
    "usr_email": CONTAHUB_EMAIL,
    "usr_password_sha1": passwordSha1
  });
  
  const loginTimestamp = generateDynamicTimestamp();
  const loginUrl = `${contahubBaseUrl}/rest/contahub.cmds.UsuarioCmd/login/${loginTimestamp}?emp=0`;
  
  console.log('🔗 Login URL:', loginUrl);
  console.log('📝 Login Data:', loginData.toString());
  
  const loginResponse = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    },
    body: loginData,
  });
  
  console.log('📊 Login Status:', loginResponse.status);
  console.log('📋 Login Headers:', Object.fromEntries(loginResponse.headers.entries()));
  
  const loginText = await loginResponse.text();
  console.log('📄 Login Response:', loginText);
  
  if (!loginResponse.ok) {
    throw new Error(`Erro no login ContaHub: ${loginResponse.statusText}`);
  }
  
  const setCookieHeaders = loginResponse.headers.get('set-cookie');
  if (!setCookieHeaders) {
    throw new Error('Cookies de sessão não encontrados no login');
  }
  
  console.log('🍪 Cookies:', setCookieHeaders);
  
  // Testar uma query simples
  console.log('\n🧪 Testando query com cookies...');
  const queryTimestamp = generateDynamicTimestamp();
  const testUrl = `${contahubBaseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=95&d0=2025-09-06&d1=2025-09-06&prod=&grupo=&turno=&emp=3768&nfe=1`;
  
  console.log('🔗 Test URL:', testUrl);
  
  const testResponse = await fetch(testUrl, {
    method: 'GET',
    headers: {
      'Cookie': setCookieHeaders,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    }
  });
  
  console.log('📊 Test Status:', testResponse.status);
  const testText = await testResponse.text();
  console.log('📄 Test Response (first 500 chars):', testText.substring(0, 500));
  
  if (testResponse.ok && testText !== 'Sem sessão') {
    console.log('✅ Login e query funcionaram!');
    
    // Tentar parsear como JSON
    try {
      const jsonData = JSON.parse(testText);
      console.log('📊 Dados encontrados:', Array.isArray(jsonData) ? jsonData.length : 'Não é array');
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        console.log('🔍 Primeiro item:', JSON.stringify(jsonData[0], null, 2));
      }
    } catch (e) {
      console.log('⚠️ Resposta não é JSON válido');
    }
  } else {
    console.log('❌ Falha na query ou sessão perdida');
  }
}

testeLogin().catch(console.error);
