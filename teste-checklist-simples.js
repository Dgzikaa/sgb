const https = require('https');

// Mensagem simples mas representativa
const mensagem = `SGB - Checklist AGENDADO

Checklist: Limpeza da Cozinha - TESTE
Bar: Ordinario Bar  
Responsavel: Administrador
Prazo: hoje 16:00

Responda "ok" quando concluir!`;

const data = JSON.stringify({
  numbers: ["5561998483434"],
  message: mensagem
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

console.log('📋 Teste checklist SIMPLES...');
console.log('💬 Mensagem:', mensagem);

const req = https.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  
  res.on('end', () => {
    console.log('📝 Resposta:', responseBody);
  });
});

req.on('error', (error) => {
  console.error('❌ Erro:', error);
});

req.write(data);
req.end(); 