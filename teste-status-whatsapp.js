const https = require('https');

const options = {
  hostname: 'sgbv2.vercel.app',
  port: 443,
  path: '/api/whatsapp/send',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('🔍 Verificando status da conexão WhatsApp...');

const req = https.request(options, (res) => {
  console.log(`✅ Status HTTP: ${res.statusCode}`);
  
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(responseBody);
      console.log('📊 Status da conexão:', JSON.stringify(response, null, 2));
      
      if (response.connected) {
        console.log('🎉 WhatsApp está conectado!');
        console.log(`📱 Instância: ${response.instance}`);
        console.log(`⭐ Status: ${response.status}`);
      } else {
        console.log('❌ WhatsApp NÃO está conectado!');
        console.log('🔧 Peça para o funcionário conectar novamente.');
      }
    } catch (e) {
      console.log('📝 Resposta bruta:', responseBody);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error);
});

req.end(); 