const https = require('https');

// Verificar mensagens recebidas via MCP
const https2 = require('https');

const options = {
  hostname: 'sgbv2.vercel.app',
  port: 443,
  path: '/api/test-db',
  method: 'GET'
};

console.log('🔍 Verificando se mensagens estão sendo recebidas...');
console.log('📱 Procurando mensagens do número: 5561998483434');
console.log('');

// Usar uma consulta direta para verificar
const data = JSON.stringify({
  query: "SELECT * FROM whatsapp_messages ORDER BY sent_at DESC LIMIT 5"
});

const req = https.request({
  hostname: 'sgbv2.vercel.app',
  port: 443,
  path: '/api/webhooks/evolution',
  method: 'GET'
}, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  
  res.on('end', () => {
    console.log('Webhook status:', responseBody);
  });
});

req.on('error', (error) => {
  console.error('Erro:', error);
});

req.end();

console.log('📋 INSTRUÇÕES:');
console.log('1. Envie "teste123" do seu WhatsApp para o WhatsApp da empresa');
console.log('2. Aguarde 5 segundos');
console.log('3. Execute: node verificar-mensagens.js');
console.log('4. Se não aparecer mensagem, o webhook não está funcionando!'); 