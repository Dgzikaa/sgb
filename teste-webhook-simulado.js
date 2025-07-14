const https = require('https');

// Simular uma mensagem recebida via webhook
const webhookData = {
  event: 'messages.upsert',
  instance: 'sgb-principal',
  data: {
    key: {
      remoteJid: '5561998483434@s.whatsapp.net',
      fromMe: false,
      id: 'teste123'
    },
    message: {
      conversation: 'ok'
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
    pushName: 'Usuario Teste'
  }
};

const data = JSON.stringify(webhookData);

const options = {
  hostname: 'sgbv2.vercel.app',
  port: 443,
  path: '/api/webhooks/evolution',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🧪 Simulando webhook recebendo sua mensagem "ok"...');
console.log('📱 De: 5561998483434');
console.log('💬 Mensagem: "ok"');

const req = https.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  
  res.on('end', () => {
    console.log('📊 Resposta:', responseBody);
    
    if (res.statusCode === 200) {
      console.log('🎉 Webhook processado com sucesso!');
      console.log('🔍 Agora vou verificar se marcou checklist como concluído...');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro:', error);
});

req.write(data);
req.end(); 