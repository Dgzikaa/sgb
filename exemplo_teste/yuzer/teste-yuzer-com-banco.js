// Teste da API Yuzer + Inserção no Banco Supabase
// Baseado no teste anterior que funcionou

const fs = require('fs');

// Carregar .env.local
try {
  require('dotenv').config({ path: '../../frontend/.env.local' });
  console.log('🔧 .env.local carregado');
} catch (error) {
  console.log('⚠️  Usando configuração hardcoded');
}

// Importar Supabase client
const { createClient } = require('@supabase/supabase-js');

// Configuração da API Yuzer
function getYuzerConfig() {
  // Token que funcionou no teste anterior
  const token = 'd3237ab2-4a68-4624-8ae4-16bc68929499';
  
  return {
    baseUrl: 'https://api.eagle.yuzer.com.br',
    token: token,
    headers: {
      'Content-Type': 'application/json',
      'yuzer': token
    }
  };
}

// Configuração do Supabase
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Variáveis do Supabase não configuradas');
  }
  
  return { supabaseUrl, serviceRoleKey };
}

// Função para fazer requisições à API Yuzer
async function makeYuzerRequest(endpoint, method = 'GET', body = null) {
  const config = getYuzerConfig();
  const url = `${config.baseUrl}${endpoint}`;
  
  console.log(`🔗 ${method} ${url}`);
  
  const options = {
    method: method,
    headers: config.headers
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Yuzer API error: ${response.status} - ${errorText}`);
  }
  
  const responseText = await response.text();
  
  if (!responseText || responseText.trim() === '') {
    throw new Error('Resposta vazia da API');
  }
  
  return JSON.parse(responseText);
}

// Função para buscar estatísticas
async function buscarEstatisticas(dataInicio, dataFim) {
  const payload = {
    currency: null,
    from: dataInicio.toISOString(),
    to: dataFim.toISOString()
  };
  
  console.log(`📊 Buscando estatísticas de ${dataInicio.toISOString()} até ${dataFim.toISOString()}`);
  const response = await makeYuzerRequest('/api/dashboards/salesPanels/statistics', 'POST', payload);
  
  console.log(`✅ Estatísticas: Total R$ ${response.total}, Count ${response.count}, Itens ${response.data?.length || 0}`);
  return response;
}

// Função para buscar pedidos com paginação
async function buscarTodosPedidos(dataInicio, dataFim) {
  let todosPedidos = [];
  let page = 1;
  let totalPages = 1;

  console.log(`🛒 Buscando pedidos de ${dataInicio.toISOString()} até ${dataFim.toISOString()}`);

  do {
    console.log(`   📄 Página ${page}/${totalPages}...`);
    
    const payload = {
      from: dataInicio.toISOString(),
      to: dataFim.toISOString(),
      addTaxInTotal: false,
      page: page,
      perPage: 100,
      sort: "desc",
      sortColumn: "createdAt",
      status: "ALL"
    };
    
    const response = await makeYuzerRequest('/api/orders/search', 'POST', payload);
    
    if (response.content && response.content.length > 0) {
      todosPedidos = todosPedidos.concat(response.content);
      totalPages = response.totalPages;
      console.log(`   ✅ Página ${page}: ${response.content.length} pedidos (Total: ${response.totalElements})`);
    } else {
      break;
    }
    
    page++;
    
  } while (page <= totalPages);

  console.log(`✅ Total coletado: ${todosPedidos.length} pedidos`);
  return todosPedidos;
}

// Função para inserir estatísticas no banco
async function inserirEstatisticas(supabase, barId, estatisticas, dataInicio, dataFim) {
  console.log(`📊 Inserindo estatísticas no banco...`);
  
  // Deletar estatísticas anteriores do período
  await supabase
    .from('yuzer_estatisticas')
    .delete()
    .eq('bar_id', barId)
    .gte('data_evento', dataInicio.toISOString().split('T')[0])
    .lte('data_evento', dataFim.toISOString().split('T')[0]);
  
  if (!estatisticas.data || estatisticas.data.length === 0) {
    console.log('⚠️ Nenhuma estatística para inserir');
    return 0;
  }
  
  const estatisticasParaInserir = estatisticas.data.map(item => {
    // Extrair data do nome do evento (ex: "ORDINÁRIO 27/07/25")
    let dataEvento = null;
    const matchData = item.name.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (matchData) {
      const dia = matchData[1].padStart(2, '0');
      const mes = matchData[2].padStart(2, '0');
      let ano = matchData[3];
      if (ano.length === 2) ano = '20' + ano;
      dataEvento = `${ano}-${mes}-${dia}`;
    }
    
    return {
      bar_id: barId,
      estatistica_id: 1,
      item_id: item.id,
      nome: item.name,
      total: item.total,
      count: item.count,
      percent: item.percent,
      data_evento: dataEvento,
      periodo_inicio: dataInicio.toISOString(),
      periodo_fim: dataFim.toISOString(),
      raw_data: item
    };
  });
  
  const { data, error } = await supabase
    .from('yuzer_estatisticas')
    .insert(estatisticasParaInserir)
    .select('id');
  
  if (error) {
    console.error('❌ Erro ao inserir estatísticas:', error);
    return 0;
  }
  
  console.log(`✅ ${data?.length || 0} estatísticas inseridas`);
  return data?.length || 0;
}

// Função para inserir pedidos no banco
async function inserirPedidos(supabase, barId, pedidos) {
  console.log(`🛒 Inserindo ${pedidos.length} pedidos no banco...`);
  
  if (pedidos.length === 0) {
    console.log('⚠️ Nenhum pedido para inserir');
    return { pedidos: 0, produtos: 0 };
  }
  
  // Deletar pedidos anteriores do período
  const primeiroPedido = new Date(pedidos[0].createdAt);
  const ultimoPedido = new Date(pedidos[pedidos.length - 1].createdAt);
  
  const dataInicio = primeiroPedido.toISOString().split('T')[0];
  const dataFim = ultimoPedido.toISOString().split('T')[0];
  
  await supabase
    .from('yuzer_pedidos')
    .delete()
    .eq('bar_id', barId)
    .gte('data_pedido', dataInicio)
    .lte('data_pedido', dataFim);
  
  // Preparar dados dos pedidos
  const pedidosParaInserir = pedidos.map(pedido => ({
    bar_id: barId,
    pedido_id: pedido.id,
    data_pedido: new Date(pedido.createdAt).toISOString().split('T')[0],
    data_hora_pedido: pedido.createdAt,
    status_pagamento: pedido.paymentStatus || 'UNKNOWN',
    valor_total: pedido.cart?.total || 0,
    valor_bruto: pedido.cart?.grossTotal || 0,
    subtotal: pedido.cart?.subTotal || 0,
    taxa: pedido.cart?.tax || 0,
    quantidade_produtos: pedido.cart?.productsAmount || 0,
    metodos_pagamento: pedido.paymentMethods?.join(', ') || '',
    metodos_pagamento_online: pedido.onlinePaymentMethods?.join(', ') || '',
    caixa_id: pedido.cashier?.id || null,
    caixa_nome: pedido.cashier?.name || null,
    caixa_serial: pedido.cashier?.serial || null,
    operacao_id: pedido.operation?.id?.toString() || null,
    operacao_nome: pedido.operation?.name || null,
    operacao_descricao: pedido.operation?.description || null,
    pedido_validado: pedido.validated || false,
    raw_data: pedido
  }));
  
  // Inserir pedidos em lotes
  const loteSize = 100;
  let totalPedidosInseridos = 0;
  
  for (let i = 0; i < pedidosParaInserir.length; i += loteSize) {
    const lote = pedidosParaInserir.slice(i, i + loteSize);
    
    const { data, error } = await supabase
      .from('yuzer_pedidos')
      .upsert(lote, {
        onConflict: 'pedido_id',
        ignoreDuplicates: false
      })
      .select('id');
    
    if (!error) {
      totalPedidosInseridos += data?.length || 0;
      console.log(`   ✅ Lote ${Math.floor(i/loteSize) + 1}: ${data?.length || 0} pedidos`);
    } else {
      console.log(`   ❌ Erro no lote ${Math.floor(i/loteSize) + 1}: ${error.message}`);
    }
  }
  
  // Preparar e inserir produtos
  console.log(`📦 Inserindo produtos dos pedidos...`);
  
  const produtos = [];
  for (const pedido of pedidos) {
    if (!pedido.cart?.products?.length) continue;
    
    const dataPedido = new Date(pedido.createdAt).toISOString().split('T')[0];
    
    for (const product of pedido.cart.products) {
      produtos.push({
        bar_id: barId,
        pedido_id: pedido.id,
        produto_id: product.productId?.toString() || product.id,
        produto_nome: product.name || 'Produto sem nome',
        produto_descricao: product.description || '',
        quantidade: product.quantity || 0,
        preco_unitario: product.price || 0,
        valor_total: product.total || 0,
        valor_bruto: product.grossTotal || product.total || 0,
        marca_id: product.brand?.id?.toString() || null,
        marca_nome: product.brand?.name || null,
        tipo_produto: product.type || 'UNKNOWN',
        imagem_produto: product.image || null,
        data_pedido: dataPedido,
        raw_data: product
      });
    }
  }
  
  // Deletar produtos anteriores do período
  await supabase
    .from('yuzer_produtos')
    .delete()
    .eq('bar_id', barId)
    .gte('data_pedido', dataInicio)
    .lte('data_pedido', dataFim);
  
  // Inserir produtos em lotes
  let totalProdutosInseridos = 0;
  
  for (let i = 0; i < produtos.length; i += loteSize) {
    const lote = produtos.slice(i, i + loteSize);
    
    const { data, error } = await supabase
      .from('yuzer_produtos')
      .insert(lote)
      .select('id');
    
    if (!error) {
      totalProdutosInseridos += data?.length || 0;
      console.log(`   ✅ Lote produtos ${Math.floor(i/loteSize) + 1}: ${data?.length || 0} produtos`);
    } else {
      console.log(`   ❌ Erro no lote produtos ${Math.floor(i/loteSize) + 1}: ${error.message}`);
    }
  }
  
  console.log(`✅ TOTAL: ${totalPedidosInseridos} pedidos, ${totalProdutosInseridos} produtos inseridos`);
  
  return { 
    pedidos: totalPedidosInseridos, 
    produtos: totalProdutosInseridos 
  };
}

// Função para registrar log de sincronização
async function registrarLogSync(supabase, barId, tipoSync, status, detalhes = {}) {
  await supabase
    .from('yuzer_sync_logs')
    .insert({
      bar_id: barId,
      tipo_sync: tipoSync,
      status: status,
      periodo_inicio: detalhes.periodo_inicio || null,
      periodo_fim: detalhes.periodo_fim || null,
      registros_processados: detalhes.registros_processados || 0,
      registros_inseridos: detalhes.registros_inseridos || 0,
      tempo_execucao_ms: detalhes.tempo_execucao_ms || 0,
      detalhes: detalhes,
      erro: detalhes.erro || null
    });
}

// Função principal de teste
async function testarYuzerComBanco() {
  const startTime = Date.now();
  
  console.log('🎯 TESTE YUZER + BANCO SUPABASE\n');
  
  try {
    // Configurações
    const barId = 1; // ID do bar para teste
    
    // Conectar ao Supabase
    const supabaseConfig = getSupabaseConfig();
    const supabase = createClient(supabaseConfig.supabaseUrl, supabaseConfig.serviceRoleKey);
    console.log('✅ Conectado ao Supabase');
    
    // Período específico: 31/01/2025 até 27/07/2025
    const dataInicio = new Date('2025-01-31T00:00:00.000Z');
    const dataFim = new Date('2025-07-27T23:59:59.999Z');
    
    console.log(`📅 Período: ${dataInicio.toISOString()} até ${dataFim.toISOString()}\n`);
    
    // 1. Buscar e inserir estatísticas
    await registrarLogSync(supabase, barId, 'estatisticas', 'processando');
    
    const estatisticas = await buscarEstatisticas(dataInicio, dataFim);
    const estatisticasInseridas = await inserirEstatisticas(supabase, barId, estatisticas, dataInicio, dataFim);
    
    await registrarLogSync(supabase, barId, 'estatisticas', 'sucesso', {
      periodo_inicio: dataInicio.toISOString().split('T')[0],
      periodo_fim: dataFim.toISOString().split('T')[0],
      registros_processados: estatisticas.data?.length || 0,
      registros_inseridos: estatisticasInseridas
    });
    
    // 2. Buscar e inserir pedidos
    await registrarLogSync(supabase, barId, 'pedidos', 'processando');
    
    const pedidos = await buscarTodosPedidos(dataInicio, dataFim);
    const resultadoPedidos = await inserirPedidos(supabase, barId, pedidos);
    
    await registrarLogSync(supabase, barId, 'pedidos', 'sucesso', {
      periodo_inicio: dataInicio.toISOString().split('T')[0],
      periodo_fim: dataFim.toISOString().split('T')[0],
      registros_processados: pedidos.length,
      registros_inseridos: resultadoPedidos.pedidos + resultadoPedidos.produtos
    });
    
    // 3. Verificar dados no banco
    console.log('\n📊 Verificando dados inseridos...');
    
    const { count: totalEstatisticas } = await supabase
      .from('yuzer_estatisticas')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', barId);
    
    const { count: totalPedidos } = await supabase
      .from('yuzer_pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', barId);
    
    const { count: totalProdutos } = await supabase
      .from('yuzer_produtos')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', barId);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Log final
    await registrarLogSync(supabase, barId, 'sync_completo', 'sucesso', {
      periodo_inicio: dataInicio.toISOString().split('T')[0],
      periodo_fim: dataFim.toISOString().split('T')[0],
      registros_processados: (estatisticas.data?.length || 0) + pedidos.length,
      registros_inseridos: estatisticasInseridas + resultadoPedidos.pedidos + resultadoPedidos.produtos,
      tempo_execucao_ms: executionTime
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log(`📊 Estatísticas no banco: ${totalEstatisticas}`);
    console.log(`🛒 Pedidos no banco: ${totalPedidos}`);
    console.log(`📦 Produtos no banco: ${totalProdutos}`);
    console.log(`⏱️ Tempo de execução: ${executionTime}ms`);
    console.log('✅ API Yuzer funcionando');
    console.log('✅ Dados inseridos no Supabase');
    console.log('✅ Logs de sincronização criados');
    
  } catch (error) {
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    console.error('\n❌ ERRO NO TESTE:', error.message);
    
    // Log de erro
    try {
      const supabaseConfig = getSupabaseConfig();
      const supabase = createClient(supabaseConfig.supabaseUrl, supabaseConfig.serviceRoleKey);
      
      await registrarLogSync(supabase, 1, 'sync_completo', 'erro', {
        tempo_execucao_ms: executionTime,
        erro: error.message
      });
    } catch (logError) {
      console.error('❌ Erro ao registrar log:', logError.message);
    }
  }
}

// Verificar configurações
console.log('🔧 Verificando configurações...');

const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('\n❌ Variáveis de ambiente não configuradas:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n📋 Configure no arquivo .env.local e tente novamente');
  process.exit(1);
}

// Executar teste
console.log('✅ Configurações OK!');
console.log('🎯 Iniciando teste em 2 segundos...\n');
setTimeout(testarYuzerComBanco, 2000); 