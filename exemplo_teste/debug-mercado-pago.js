/**
 * 🔧 DEBUG ESPECÍFICO MERCADO PAGO
 * 
 * Script focado apenas no debug do Mercado Pago
 */

const BASE_URL = 'http://localhost:3000';

// Função para testar diretamente a API do Mercado Pago
async function debugMercadoPago() {
  console.log('🔍 === DEBUG MERCADO PAGO ===\n');

  // Teste 1: Verificar variáveis de ambiente
  console.log('📋 Teste 1: Verificando variáveis de ambiente...');
  try {
    const response = await fetch(`${BASE_URL}/api/fidelidade/pagamento/mercado-pago`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        membro_id: 'debug_test',
        valor: 1.00
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Resposta:', JSON.stringify(data, null, 2));

    if (data.demo_mode) {
      console.log('⚠️ MODO DEMONSTRAÇÃO ATIVO - Variáveis não configuradas');
    } else {
      console.log('✅ Variáveis configuradas corretamente');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }

  // Teste 2: Criar um membro teste para o pagamento
  console.log('\n📋 Teste 2: Criando membro teste...');
  try {
    const membroResponse = await fetch(`${BASE_URL}/api/fidelidade/membros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo_convite: 'VIP-011374ee', // Use um código válido
        cpf: '12345678900',
        nome: 'Debug Test User',
        email: 'debug@test.com',
        telefone: '11999999999',
        data_nascimento: '01/01/1990',
        endereco: {
          rua: 'Rua Debug',
          numero: '123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234567'
        },
        bar_id: 1
      })
    });

    const membroData = await membroResponse.json();
    console.log('Status Membro:', membroResponse.status);
    console.log('Resposta Membro:', JSON.stringify(membroData, null, 2));

    if (membroResponse.ok) {
      const membroId = membroData.membro.id;
      console.log(`✅ Membro criado com ID: ${membroId}`);

      // Teste 3: PIX com membro real
      console.log('\n📋 Teste 3: Testando PIX com membro real...');
      const pixResponse = await fetch(`${BASE_URL}/api/fidelidade/pagamento/mercado-pago`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membro_id: membroId,
          valor: 100.00,
          recurring: false
        })
      });

      const pixData = await pixResponse.json();
      console.log('Status PIX:', pixResponse.status);
      console.log('Resposta PIX:', JSON.stringify(pixData, null, 2));

    } else {
      console.log('❌ Falha ao criar membro para teste');
    }

  } catch (error) {
    console.error('❌ Erro no teste de membro:', error.message);
  }

  // Teste 4: Verificar logs do console no servidor
  console.log('\n📋 Teste 4: Verificando logs...');
  console.log('🔍 Verifique o console do servidor (terminal onde roda npm run dev)');
  console.log('   Devem aparecer logs detalhados com 🔍 DEBUG e 🚨 ERRO');
}

// Função para limpar dados de debug
async function limparDebug() {
  console.log('\n🧹 Limpando dados de debug...');
  // Aqui você pode adicionar lógica para remover dados de teste
  console.log('ℹ️ Para limpar, remova manualmente o membro com email "debug@test.com"');
}

// Executar
console.log('🚀 Iniciando debug do Mercado Pago...');
console.log('⚠️ Certifique-se que o servidor está rodando (npm run dev)\n');

debugMercadoPago().then(() => {
  console.log('\n✅ Debug finalizado!');
  console.log('📊 Análise dos resultados:');
  console.log('   - Se status 500: problema no servidor/banco');
  console.log('   - Se demo_mode: true: variáveis não configuradas');
  console.log('   - Se status 200: tudo funcionando!');
});
