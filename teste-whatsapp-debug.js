const https = require('https');

// Teste com dados mínimos obrigatórios
const data = JSON.stringify({
  numbers: ["5561998483434"], // Sem + para testar
  message: "Teste SGB"
});

const options = {
  hostname: 'sgbv2.vercel.app',
  port: 443,
  path: '/api/whatsapp/send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🧪 Teste debug WhatsApp...');
console.log('📞 Número formatado: 5561998483434');
console.log('💬 Mensagem: "Teste SGB"');

const req = https.request(options, (res) => {
  console.log(`🔍 Status HTTP: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  
  res.on('end', () => {
    console.log('📝 Resposta completa:', responseBody);
    
    try {
      const response = JSON.parse(responseBody);
      console.log('📊 JSON parseado:', JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('❌ Erro ao parsear JSON:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error);
});

console.log('📤 Enviando dados:', data);
req.write(data);
req.end(); 