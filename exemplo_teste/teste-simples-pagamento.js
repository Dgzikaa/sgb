/**
 * 🧪 TESTE SUPER SIMPLES - MERCADO PAGO
 * 
 * Execute este script para identificar exatamente onde está o problema
 */

// Configuração
const API_BASE = 'http://localhost:3000/api';

// Dados mínimos para teste
const dadosTeste = {
  membro_id: 'teste_123',
  valor: 100.00
};

console.log('🚀 === TESTE SIMPLES MERCADO PAGO ===');
console.log('📍 URL Base:', API_BASE);
console.log('📦 Dados de teste:', dadosTeste);
console.log('─'.repeat(50));

// Função para testar PIX
async function testarPIX() {
  console.log('\n1️⃣ Testando PIX...');
  
  try {
    const response = await fetch(`${API_BASE}/fidelidade/pagamento/mercado-pago`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dadosTeste)
    });

    console.log('📡 Status da resposta:', response.status);
    console.log('📡 Status OK?', response.ok);

    const resultado = await response.json();
    console.log('📄 Resposta completa:');
    console.log(JSON.stringify(resultado, null, 2));

    if (resultado.demo_mode) {
      console.log('⚠️ MODO DEMO ATIVO - Variáveis de ambiente não configuradas');
      return false;
    }

    if (response.ok) {
      console.log('✅ PIX funcionando!');
      return true;
    } else {
      console.log('❌ PIX com erro:', resultado.error);
      return false;
    }

  } catch (error) {
    console.log('💥 ERRO FATAL no PIX:');
    console.log('   Tipo:', error.name);
    console.log('   Mensagem:', error.message);
    console.log('   Stack:', error.stack);
    return false;
  }
}

// Função para testar Cartão  
async function testarCartao() {
  console.log('\n2️⃣ Testando Cartão...');
  
  try {
    const response = await fetch(`${API_BASE}/fidelidade/pagamento/mercado-pago`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...dadosTeste,
        payment_method: 'credit_card'
      })
    });

    console.log('📡 Status da resposta:', response.status);
    const resultado = await response.json();
    console.log('📄 Resposta:', JSON.stringify(resultado, null, 2));

    if (response.status === 501) {
      console.log('ℹ️ Cartão não implementado (esperado)');
      return true;
    }

    return response.ok;

  } catch (error) {
    console.log('💥 ERRO no Cartão:', error.message);
    return false;
  }
}

// Executar testes
async function executar() {
  console.log('\n🏁 Iniciando testes...\n');

  // Verificar se o servidor está rodando
  try {
    const healthCheck = await fetch(`${API_BASE}/usuarios`);
    console.log('✅ Servidor respondendo:', healthCheck.status);
  } catch (error) {
    console.log('❌ SERVIDOR NÃO ESTÁ RODANDO!');
    console.log('   Execute: npm run dev');
    return;
  }

  // Testar PIX
  const pixOK = await testarPIX();

  // Testar Cartão
  const cartaoOK = await testarCartao();

  // Resumo
  console.log('\n📊 === RESUMO ===');
  console.log('PIX:', pixOK ? '✅ OK' : '❌ ERRO');
  console.log('Cartão:', cartaoOK ? '✅ OK' : '❌ ERRO');

  if (!pixOK) {
    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('1. Verificar logs do servidor (terminal npm run dev)');
    console.log('2. Verificar variáveis MERCADO_PAGO_ACCESS_TOKEN');
    console.log('3. Verificar conexão com Supabase');
    console.log('4. Verificar se o membro existe no banco');
  }

  console.log('\n🏁 Teste finalizado!');
}

// Executar se for chamado diretamente
if (typeof require !== 'undefined' && require.main === module) {
  executar();
}

// Exportar para uso em outros scripts
if (typeof module !== 'undefined') {
  module.exports = { testarPIX, testarCartao, executar };
}
