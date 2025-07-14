const https = require('https');

// Mensagem formatada como o sistema faria
const mensagem = `📅 *SGB - Checklist AGENDADO*

📋 *Checklist:* Limpeza da Cozinha - TESTE
🏢 *Bar:* Ordinário Bar
👤 *Responsável:* Administrador
⏰ *Prazo:* ${new Date(Date.now() + 2*60*60*1000).toLocaleString('pt-BR')}
🟡 *Prioridade:* NORMAL

👆 *Acesse o sistema para executar*

_Sistema de Gestão de Bares_`;

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

console.log('📋 Enviando notificação de checklist manual...');
console.log('💬 Mensagem preview:');
console.log(mensagem.substring(0, 100) + '...');

const req = https.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(responseBody);
      console.log('📊 Resposta:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('🎉 SUCESSO! Notificação de checklist enviada!');
        console.log(`📬 Total enviado: ${response.total_sent}`);
      }
    } catch (e) {
      console.log('📝 Resposta bruta:', responseBody);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error);
});

req.write(data);
req.end(); 