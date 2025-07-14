const https = require('https');

const options = {
  hostname: 'sgbv2.vercel.app',
  port: 443,
  path: '/api/webhooks/evolution',
  method: 'GET'
};

console.log('🔍 Testando webhook Evolution...');

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

req.end(); 