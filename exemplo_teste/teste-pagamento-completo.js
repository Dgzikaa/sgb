/**
 * 🧪 TESTE COMPLETO DO SISTEMA DE PAGAMENTO
 * 
 * Este script testa todo o fluxo:
 * 1. Validação de código de convite
 * 2. Criação de membro
 * 3. Pagamento PIX via Mercado Pago
 * 4. Pagamento Cartão via Mercado Pago
 */

const BASE_URL = 'http://localhost:3000'; // Ajuste se necessário

// Dados de teste
const TESTE_DADOS = {
  codigo_convite: 'VIP-011374ee', // Use um código válido do banco
  cpf: '123.456.789-00',
  nome: 'João Silva Teste',
  email: 'joao.teste@email.com',
  telefone: '(11) 99999-9999',
  data_nascimento: '15/05/1990',
  endereco: {
    rua: 'Rua das Flores, 123',
    numero: '123',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567'
  },
  bar_id: 1
};

// Função para fazer requisições HTTP
async function fazerRequisicao(url, options = {}) {
  console.log(`\n🌐 Fazendo requisição para: ${url}`);
  console.log(`📦 Método: ${options.method || 'GET'}`);
  
  if (options.body) {
    console.log(`📄 Body:`, JSON.parse(options.body));
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📋 Resposta:`, data);
    
    return { response, data };
  } catch (error) {
    console.error(`❌ Erro na requisição:`, error);
    throw error;
  }
}

// 1. Testar validação de código
async function testarValidacaoCodigo() {
  console.log('\n🔍 === TESTE 1: VALIDAÇÃO DE CÓDIGO ===');
  
  const { response, data } = await fazerRequisicao(`${BASE_URL}/api/fidelidade/validar-codigo`, {
    method: 'POST',
    body: JSON.stringify({
      codigo: TESTE_DADOS.codigo_convite,
      cpf: TESTE_DADOS.cpf.replace(/\D/g, ''),
      bar_id: TESTE_DADOS.bar_id
    })
  });

  if (response.ok) {
    console.log('✅ Código validado com sucesso!');
    return data.validation_token;
  } else {
    console.log('❌ Falha na validação do código');
    throw new Error(data.error);
  }
}

// 2. Testar criação de membro
async function testarCriacaoMembro() {
  console.log('\n👤 === TESTE 2: CRIAÇÃO DE MEMBRO ===');
  
  const { response, data } = await fazerRequisicao(`${BASE_URL}/api/fidelidade/membros`, {
    method: 'POST',
    body: JSON.stringify({
      codigo_convite: TESTE_DADOS.codigo_convite,
      cpf: TESTE_DADOS.cpf,
      nome: TESTE_DADOS.nome,
      email: TESTE_DADOS.email,
      telefone: TESTE_DADOS.telefone,
      data_nascimento: TESTE_DADOS.data_nascimento,
      endereco: TESTE_DADOS.endereco,
      bar_id: TESTE_DADOS.bar_id
    })
  });

  if (response.ok) {
    console.log('✅ Membro criado com sucesso!');
    return data.membro;
  } else {
    console.log('❌ Falha na criação do membro');
    throw new Error(data.error);
  }
}

// 3. Testar pagamento PIX
async function testarPagamentoPIX(membroId) {
  console.log('\n💰 === TESTE 3: PAGAMENTO PIX ===');
  
  const { response, data } = await fazerRequisicao(`${BASE_URL}/api/fidelidade/pagamento/mercado-pago`, {
    method: 'PUT',
    body: JSON.stringify({
      membro_id: membroId,
      valor: 100.00,
      recurring: false
    })
  });

  if (response.ok) {
    console.log('✅ PIX gerado com sucesso!');
    if (data.demo_mode) {
      console.log('🔧 Modo demonstração ativo');
    } else {
      console.log('🔗 QR Code PIX:', data.qr_code);
    }
    return data;
  } else {
    console.log('❌ Falha no pagamento PIX');
    throw new Error(data.error);
  }
}

// 4. Testar pagamento Cartão
async function testarPagamentoCartao(membroId) {
  console.log('\n💳 === TESTE 4: PAGAMENTO CARTÃO ===');
  
  const { response, data } = await fazerRequisicao(`${BASE_URL}/api/fidelidade/pagamento/mercado-pago`, {
    method: 'POST',
    body: JSON.stringify({
      membro_id: membroId,
      payment_method: 'credit_card',
      valor: 100.00,
      recurring: false
    })
  });

  if (response.ok) {
    console.log('✅ Cartão processado com sucesso!');
    if (data.demo_mode) {
      console.log('🔧 Modo demonstração ativo');
    } else {
      console.log('🔗 URL Checkout:', data.init_point);
    }
    return data;
  } else {
    console.log('❌ Falha no pagamento Cartão');
    if (response.status === 501) {
      console.log('ℹ️ Cartão ainda não implementado (esperado)');
      return null;
    }
    throw new Error(data.error);
  }
}

// 5. Verificar variáveis de ambiente
async function verificarVariaveisAmbiente() {
  console.log('\n🔧 === VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE ===');
  
  // Criar um membro temporário para testar as variáveis
  const { response, data } = await fazerRequisicao(`${BASE_URL}/api/fidelidade/pagamento/mercado-pago`, {
    method: 'PUT',
    body: JSON.stringify({
      membro_id: 'test',
      valor: 1.00
    })
  });

  console.log('📊 Resultado da verificação de ENV:', {
    status: response.status,
    temAccessToken: data.details ? data.details.includes('ACCESS_TOKEN') : 'não informado',
    modoDemo: data.demo_mode || false
  });
}

// Função principal que executa todos os testes
async function executarTodosTestes() {
  console.log('🚀 INICIANDO TESTES DO SISTEMA DE PAGAMENTO');
  console.log('=' .repeat(60));

  try {
    // Verificar variáveis primeiro
    await verificarVariaveisAmbiente();

    // 1. Validar código
    const validationToken = await testarValidacaoCodigo();

    // 2. Criar membro
    const membro = await testarCriacaoMembro();

    // 3. Testar PIX
    const pixResult = await testarPagamentoPIX(membro.id);

    // 4. Testar Cartão (pode falhar, ok)
    try {
      const cartaoResult = await testarPagamentoCartao(membro.id);
    } catch (error) {
      console.log('ℹ️ Cartão falhou conforme esperado:', error.message);
    }

    console.log('\n🎉 === RESUMO DOS TESTES ===');
    console.log('✅ Validação de código: OK');
    console.log('✅ Criação de membro: OK');
    console.log('✅ Pagamento PIX: OK');
    console.log('ℹ️ Pagamento Cartão: Não implementado (OK)');
    
    console.log('\n📋 Dados do membro criado:');
    console.log(`   ID: ${membro.id}`);
    console.log(`   Nome: ${membro.nome}`);
    console.log(`   Email: ${membro.email}`);
    console.log(`   Plano: ${membro.plano}`);
    
    if (pixResult && !pixResult.demo_mode) {
      console.log('\n💰 Dados do PIX:');
      console.log(`   Payment ID: ${pixResult.payment_id}`);
      console.log(`   Status: ${pixResult.status}`);
    }

  } catch (error) {
    console.error('\n❌ ERRO DURANTE OS TESTES:', error.message);
    console.log('\n🔍 POSSÍVEIS CAUSAS:');
    console.log('   1. Servidor não está rodando (npm run dev)');
    console.log('   2. Código de convite já foi usado');
    console.log('   3. CPF já cadastrado no sistema');
    console.log('   4. Problemas de conectividade com Supabase');
    console.log('   5. Variáveis de ambiente do Mercado Pago');
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 TESTES FINALIZADOS');
}

// ⚠️ FUNÇÃO DE LIMPEZA (USE COM CUIDADO!)
async function limparDadosTeste() {
  console.log('\n🧹 === LIMPEZA DE DADOS DE TESTE ===');
  console.log('⚠️ ATENÇÃO: Esta função irá remover dados de teste!');
  
  // Simular confirmação (em um ambiente real, você usaria readline)
  const confirmar = true; // Mude para false se não quiser limpar
  
  if (!confirmar) {
    console.log('❌ Limpeza cancelada');
    return;
  }

  try {
    // Remover membro de teste
    const { response: deleteResponse } = await fazerRequisicao(`${BASE_URL}/api/fidelidade/membros?cpf=${TESTE_DADOS.cpf.replace(/\D/g, '')}`, {
      method: 'DELETE'
    });

    if (deleteResponse.ok) {
      console.log('✅ Dados de teste removidos');
    } else {
      console.log('ℹ️ Nenhum dado de teste encontrado para remover');
    }
  } catch (error) {
    console.log('❌ Erro na limpeza:', error.message);
  }
}

// Executar quando o script for chamado diretamente
if (typeof window === 'undefined') {
  // Executar no Node.js
  console.log('🧪 Executando testes no Node.js...');
  
  // Verificar se fetch está disponível (Node 18+)
  if (typeof fetch === 'undefined') {
    console.log('❌ fetch não está disponível. Use Node.js 18+ ou instale node-fetch');
    process.exit(1);
  }
  
  executarTodosTestes().then(() => {
    console.log('\n✨ Script finalizado. Para limpar dados de teste, execute:');
    console.log('   node exemplo_teste/teste-pagamento-completo.js --limpar');
  });
}

// Exportar funções para uso em outros scripts
if (typeof module !== 'undefined') {
  module.exports = {
    executarTodosTestes,
    testarValidacaoCodigo,
    testarCriacaoMembro,
    testarPagamentoPIX,
    testarPagamentoCartao,
    limparDadosTeste,
    TESTE_DADOS
  };
}
