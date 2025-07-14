const https = require('https');

const data = JSON.stringify({
  numbers: ["+5561998483434"],
  type: "checklist_notification",
  checklist_data: {
    checklist_id: "teste-001",
    checklist_nome: "Limpeza da Cozinha - TESTE SGB",
    bar_nome: "Ordinário Bar",
    deadline: "2025-01-14T14:00:00-03:00",
    responsavel: "Administrador",
    status: "agendado",
    prioridade: "normal"
  }
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

console.log('🚀 Enviando mensagem de teste WhatsApp...');
console.log('📱 Para: +5561998483434');
console.log('📋 Checklist: Limpeza da Cozinha - TESTE');

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
        console.log('🎉 SUCESSO! Mensagem enviada!');
        console.log(`📬 Total enviado: ${response.total_sent}`);
        console.log(`❌ Total erros: ${response.total_errors}`);
      } else {
        console.log('❌ ERRO:', response.error);
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