const https = require('https');

const data = JSON.stringify({
  numbers: ["+5561998483434"],
  message: "🚀 TESTE SGB - Sistema funcionando!"
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

console.log('🧪 Teste simples de WhatsApp...');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  
  res.on('end', () => {
    console.log('Resposta:', responseBody);
  });
});

req.on('error', (error) => {
  console.error('Erro:', error);
});

req.write(data);
req.end(); 