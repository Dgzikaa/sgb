// Script de Teste Yuzer → Banco de Dados - NOVA VERSÃO COMPLETA
// Baseado na conversa: 4 tabelas com endpoints específicos

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../frontend/.env.local' });

// Configuração Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração Yuzer
const YUZER_CONFIG = {
  baseUrl: 'https://api.eagle.yuzer.com.br',
  token: 'd3237ab2-4a68-4624-8ae4-16bc68929499',
  headers: {
    'Content-Type': 'application/json',
    'yuzer': 'd3237ab2-4a68-4624-8ae4-16bc68929499'
  }
};

// CONSTANTES PARA CÁLCULO VALOR LÍQUIDO
const TAXA_CREDITO = 0.035;        // 3.5%
const TAXA_DEBITO_PIX = 0.015;     // 1.5%
const ALUGUEL_EQUIPAMENTOS = 500;  // R$ 500 fixos

// Configuração teste
const BAR_ID = 3; // ID do bar no sistema

// Função auxiliar para fetch
async function yuzerFetch(endpoint, method = 'GET', body = null) {
  const url = `${YUZER_CONFIG.baseUrl}${endpoint}`;
  
  const options = {
    method,
    headers: YUZER_CONFIG.headers
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  // Log apenas em caso de erro ou debug
  // console.log(`🔗 ${method} ${url}`);
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`❌ Error ${response.status} em ${method} ${url}:`, errorText);
    throw new Error(`${response.status} - ${errorText}`);
  }
  
  const responseData = await response.json();
  
  return responseData;
}

// 1. BUSCAR SALES PANELS (para encontrar eventos)
async function buscarEventos() {
  console.log('\n🎯 1. BUSCANDO EVENTOS...');
  
  // Período: sempre de 01/01/2025 até hoje
  const dataInicio = new Date('2025-01-01T00:00:00.000Z');
  const dataHoje = new Date();
  dataHoje.setHours(23, 59, 59, 999); // Fim do dia atual
  
  console.log(`📅 Período de busca: ${dataInicio.toLocaleDateString('pt-BR')} até ${dataHoje.toLocaleDateString('pt-BR')}`);
  
  // Tentar diferentes métodos para buscar sales panels
  const metodosParaTestar = [
    {
      nome: 'POST /api/dashboards/ongoing (body vazio)',
      endpoint: '/api/dashboards/ongoing',
      method: 'POST',
      body: {}
    },
    {
      nome: 'POST /api/dashboards/salesPanels/statistics (que funcionou)',
      endpoint: '/api/dashboards/salesPanels/statistics',
      method: 'POST',
      body: {
        from: dataInicio.toISOString(),
        to: new Date('2025-12-31T23:59:59.999Z').toISOString()
      }
    },
    {
      nome: 'POST /api/dashboards/ongoing (com parâmetros)',
      endpoint: '/api/dashboards/ongoing',
      method: 'POST',
      body: {
        from: dataInicio.toISOString(),
        to: dataHoje.toISOString(),
        addTaxInTotal: false,
        currency: null,
        page: 0,
        perPage: 100,
        q: "",
        sort: "desc",
        sortColumn: "dateStart",
        operationIds: [],
        companiesIds: [],
        status: "ALL",
        idsNotIn: [],
        channels: [],
        expandCombo: false
      }
    },
    {
      nome: 'POST /api/dashboards/recentEvents/search',
      endpoint: '/api/dashboards/recentEvents/search',
      method: 'POST',
      body: {
        from: dataInicio.toISOString(),
        to: dataHoje.toISOString(),
        page: 0,
        perPage: 50
      }
    }
  ];
  
  for (const metodo of metodosParaTestar) {
    try {
      console.log(`🔍 ${metodo.nome}...`);
      const response = await yuzerFetch(metodo.endpoint, metodo.method, metodo.body);
      
      if (!response) {
        console.log(`   ❌ Resposta vazia`);
        continue;
      }
      
      // Tentar diferentes estruturas de resposta
      let salesPanels = [];
      
      if (Array.isArray(response)) {
        // /api/dashboards/ongoing retorna array direto
        salesPanels = response;
      } else if (response.salesPanels && Array.isArray(response.salesPanels)) {
        salesPanels = response.salesPanels;
      } else if (response.content && Array.isArray(response.content)) {
        salesPanels = response.content;
      } else if (response.data && Array.isArray(response.data)) {
        // /api/dashboards/salesPanels/statistics retorna { data: [...] }
        salesPanels = response.data;
      } else if (response.events && Array.isArray(response.events)) {
        salesPanels = response.events;
      }
      
      if (salesPanels.length > 0) {
        console.log(`✅ Encontrados ${salesPanels.length} eventos via ${metodo.nome}`);
        
        // Mostrar resumo dos eventos encontrados
        console.log(`   📋 Eventos: ${salesPanels.slice(0, 3).map(e => e.name || 'Sem nome').join(', ')}${salesPanels.length > 3 ? '...' : ''}`);
        console.log(`   🎯 Usando evento principal: ${(salesPanels.find(e => e.name?.includes('27/07')) || salesPanels[0]).name}`);
        
        return salesPanels;
      }
      
      console.log(`   ❌ Nenhum evento encontrado neste método`);
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }
  
  console.log('❌ Nenhum evento encontrado em nenhum método');
  return [];
}

// 2. SALVAR DADOS DO EVENTO
async function salvarEventos(eventos) {
  console.log('\n🎯 2. SALVANDO EVENTOS NO BANCO...');
  
  for (const evento of eventos) {
    try {
      // Identificar ID do evento
      const eventoId = evento.id || evento.salesPanelId || evento.eventId;
      if (!eventoId) {
        console.log(`⚠️ Evento sem ID válido:`, evento);
        continue;
      }
      
      let detalhes = {};
      
      // Tentar buscar detalhes completos do evento
      try {
        detalhes = await yuzerFetch(`/api/salesPanels/${eventoId}`);
      } catch (detailError) {
        console.log(`⚠️ Não foi possível buscar detalhes do evento ${eventoId}: ${detailError.message}`);
        // Usar dados básicos do evento se não conseguir buscar detalhes
        detalhes = evento;
      }
      
      const eventoData = {
        bar_id: BAR_ID,
        evento_id: eventoId,
        nome_evento: evento.name || evento.title || detalhes.name || `Evento ${eventoId}`,
        data_inicio: detalhes.dateStart ? new Date(detalhes.dateStart).toISOString() : null,
        data_fim: detalhes.dateEnd ? new Date(detalhes.dateEnd).toISOString() : null,
        status: evento.status || detalhes.status || 'UNKNOWN',
        company_name: detalhes.company?.name || null,
        company_document: detalhes.company?.document || null,
        raw_data: detalhes,
        updated_at: new Date().toISOString()
      };
      
      // UPSERT no banco
      const { data, error } = await supabase
        .from('yuzer_eventos')
        .upsert(eventoData, { onConflict: 'evento_id' })
        .select();
      
      if (error) throw error;
      
      console.log(`✅ Evento salvo: ${eventoData.nome_evento} (ID: ${eventoId})`);
      
    } catch (error) {
      console.error(`❌ Erro ao salvar evento:`, error.message);
    }
  }
}

// 3. SALVAR FATURAMENTO POR HORA
async function salvarFaturamentoPorHora(eventoId, nomeEvento) {
  console.log(`\n🎯 3. SALVANDO FATURAMENTO POR HORA - ${nomeEvento}...`);
  
  try {
    const response = await yuzerFetch(
      `/api/salesPanels/${eventoId}/dashboards/earningsAndSells/hour`, 
      'POST', 
      {}
    );
    
    if (!response || !Array.isArray(response)) {
      console.log('❌ Dados de faturamento por hora não encontrados');
      return;
    }
    
    // Determinar data do evento baseado no nome (ex: "ORDINÁRIO 27/07/25")
    const dataEvento = extrairDataDoNomeEvento(nomeEvento);
    
    // Preparar todos os dados para inserção em lote
    const dadosFatHora = response.map((horario, index) => ({
      bar_id: BAR_ID,
      evento_id: eventoId,
      data_evento: dataEvento,
      hora: index, // 0-23
      hora_formatada: `${dataEvento} ${index.toString().padStart(2, '0')}:00`,
      faturamento: horario.total || 0,
      vendas: horario.sells || 0,
      raw_data: horario,
      updated_at: new Date().toISOString()
    }));
    
    // Inserir em lote com UPSERT
    const inseridos = await insertBatch('yuzer_fatporhora', dadosFatHora, 'bar_id,evento_id,data_evento,hora');
    console.log(`✅ Faturamento por hora salvo: ${inseridos} registros`);
    
  } catch (error) {
    console.error(`❌ Erro ao salvar faturamento por hora:`, error.message);
  }
}

// 4. SALVAR DADOS DE PAGAMENTO (com cálculo valor líquido)
async function salvarDadosPagamento(eventoId, nomeEvento) {
  console.log(`\n🎯 4. SALVANDO DADOS DE PAGAMENTO - ${nomeEvento}...`);
  
  try {
    const response = await yuzerFetch(
      `/api/salesPanels/${eventoId}/dashboards/payments/statistics`, 
      'POST', 
      {}
    );
    
    if (!response || !response.methods) {
      console.log('❌ Dados de pagamento não encontrados');
      return;
    }
    
    // Extrair valores por método
    const methods = response.methods;
    const credito = methods.find(m => m.name === 'CREDIT_CARD')?.total || 0;
    const debito = methods.find(m => m.name === 'DEBIT_CARD')?.total || 0;
    const pix = methods.find(m => m.name === 'PIX')?.total || 0;
    const dinheiro = methods.find(m => m.name === 'CASH')?.total || 0;
    const producao = methods.find(m => m.name === 'PRODUCTION')?.total || 0;
    const cancelado = methods.find(m => m.name === 'CANCELLED')?.total || 0;
    
    // CALCULAR VALOR LÍQUIDO
    const descontoCredito = credito * TAXA_CREDITO;
    const descontoDebitoPix = (debito + pix) * TAXA_DEBITO_PIX;
    const totalDescontos = descontoCredito + descontoDebitoPix;
    const faturamentoBruto = response.total || 0;
    const valorLiquido = faturamentoBruto - totalDescontos - ALUGUEL_EQUIPAMENTOS;
    
    const dataEvento = extrairDataDoNomeEvento(nomeEvento);
    
    const pagamentoData = {
      bar_id: BAR_ID,
      evento_id: eventoId,
      data_evento: dataEvento,
      faturamento_bruto: faturamentoBruto,
      credito: credito,
      debito: debito,
      pix: pix,
      dinheiro: dinheiro,
      producao: producao,
      desconto_credito: descontoCredito,
      desconto_debito_pix: descontoDebitoPix,
      total_descontos: totalDescontos,
      aluguel_equipamentos: ALUGUEL_EQUIPAMENTOS,
      valor_liquido: valorLiquido,
      total_cancelado: cancelado,
      quantidade_pedidos: response.count || 0,
      raw_data: response,
      updated_at: new Date().toISOString()
    };
    
    // UPSERT no banco
    const { error } = await supabase
      .from('yuzer_pagamento')
      .upsert(pagamentoData, { onConflict: 'bar_id,evento_id,data_evento' });
    
    if (error) throw error;
    
    console.log(`✅ Dados de pagamento salvos:`);
    console.log(`   💰 Faturamento Bruto: R$ ${faturamentoBruto.toFixed(2)}`);
    console.log(`   💳 Crédito: R$ ${credito.toFixed(2)} (desc: R$ ${descontoCredito.toFixed(2)})`);
    console.log(`   💰 Débito: R$ ${debito.toFixed(2)}`);
    console.log(`   🔄 PIX: R$ ${pix.toFixed(2)}`);
    console.log(`   💵 Dinheiro: R$ ${dinheiro.toFixed(2)}`);
    console.log(`   📦 Produção: R$ ${producao.toFixed(2)}`);
    console.log(`   ❌ Cancelado: R$ ${cancelado.toFixed(2)}`);
    console.log(`   🏛️ Aluguel: R$ ${ALUGUEL_EQUIPAMENTOS.toFixed(2)}`);
    console.log(`   ✅ VALOR LÍQUIDO: R$ ${valorLiquido.toFixed(2)}`);
    
  } catch (error) {
    console.error(`❌ Erro ao salvar dados de pagamento:`, error.message);
  }
}

// 5. SALVAR PRODUTOS
async function salvarProdutos(eventoId, nomeEvento) {
  console.log(`\n🎯 5. SALVANDO PRODUTOS - ${nomeEvento}...`);
  
  try {
    const response = await yuzerFetch(
      `/api/salesPanels/${eventoId}/dashboards/products/statistics`, 
      'POST', 
      {}
    );
    
    if (!response || !Array.isArray(response)) {
      console.log('❌ Dados de produtos não encontrados');
      return;
    }
    
    const dataEvento = extrairDataDoNomeEvento(nomeEvento);
    
    // Preparar todos os dados para inserção em lote
    const dadosProdutos = response.map(produto => {
      // Categorização automática
      const nomeUpper = (produto.name || '').toUpperCase();
      const ehIngresso = nomeUpper.includes('INGRESSO');
      let categoria = 'OUTROS';
      
      if (ehIngresso) categoria = 'INGRESSO';
      else if (nomeUpper.includes('CERVEJA') || nomeUpper.includes('DRINK') || nomeUpper.includes('VODKA')) categoria = 'BEBIDA';
      else if (nomeUpper.includes('PASTEL') || nomeUpper.includes('COMIDA') || nomeUpper.includes('LANCHE')) categoria = 'COMIDA';
      
      return {
        bar_id: BAR_ID,
        evento_id: eventoId,
        data_evento: dataEvento,
        produto_id: produto.id,
        produto_nome: produto.name,
        quantidade: produto.count || 0,
        valor_total: produto.total || 0,
        percentual: produto.percent || 0,
        categoria: categoria,
        eh_ingresso: ehIngresso,
        raw_data: produto,
        updated_at: new Date().toISOString()
      };
    });
    
    // Inserir em lote com UPSERT
    const inseridos = await insertBatch('yuzer_produtos', dadosProdutos, 'bar_id,evento_id,data_evento,produto_id');
    console.log(`✅ Produtos salvos: ${inseridos} itens`);
    
    // Mostrar ingressos encontrados
    const ingressos = response.filter(p => (p.name || '').toUpperCase().includes('INGRESSO'));
    if (ingressos.length > 0) {
      console.log(`🎫 Ingressos encontrados:`);
      ingressos.forEach(ing => {
        console.log(`   - ${ing.name}: ${ing.count} vendidos (R$ ${(ing.total || 0).toFixed(2)})`);
      });
    }
    
  } catch (error) {
    console.error(`❌ Erro ao salvar produtos:`, error.message);
  }
}

// Função auxiliar para extrair data do nome do evento
function extrairDataDoNomeEvento(nomeEvento) {
  // Tentar extrair data do formato "ORDINÁRIO 27/07/25"
  const regex = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/;
  const match = nomeEvento.match(regex);
  
  if (match) {
    let [, dia, mes, ano] = match;
    
    // Converter ano de 2 dígitos para 4 dígitos
    if (ano.length === 2) {
      ano = parseInt(ano) < 50 ? `20${ano}` : `19${ano}`;
    }
    
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  
  // Fallback: usar data atual
  return new Date().toISOString().split('T')[0];
}

// Função auxiliar para inserção em lotes (paginação)
async function insertBatch(tabela, dados, conflictColumn = null) {
  if (!dados || dados.length === 0) {
    console.log(`⚠️ Nenhum dado para inserir na tabela ${tabela}`);
    return 0;
  }

  const BATCH_SIZE = 90; // Limite seguro (menor que 100)
  let totalInseridos = 0;
  
  console.log(`📦 Inserindo ${dados.length} registros em lotes de ${BATCH_SIZE}...`);
  
  for (let i = 0; i < dados.length; i += BATCH_SIZE) {
    const lote = dados.slice(i, i + BATCH_SIZE);
    const loteNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalLotes = Math.ceil(dados.length / BATCH_SIZE);
    
    console.log(`   📄 Lote ${loteNum}/${totalLotes}: ${lote.length} registros...`);
    
    try {
      let query = supabase.from(tabela);
      
      if (conflictColumn) {
        query = query.upsert(lote, { onConflict: conflictColumn });
      } else {
        query = query.insert(lote);
      }
      
      const { data, error } = await query.select('id');
      
      if (error) {
        console.error(`   ❌ Erro no lote ${loteNum}:`, error.message);
        continue;
      }
      
      const inseridos = data?.length || 0;
      totalInseridos += inseridos;
      console.log(`   ✅ Lote ${loteNum}: ${inseridos} registros inseridos`);
      
    } catch (error) {
      console.error(`   ❌ Exceção no lote ${loteNum}:`, error.message);
    }
  }
  
  console.log(`✅ Total inserido na ${tabela}: ${totalInseridos} registros`);
  return totalInseridos;
}

// Log de sincronização
async function logSync(tipoSync, status, detalhes = {}) {
  const logData = {
    bar_id: BAR_ID,
    tipo_sync: tipoSync,
    status: status,
    registros_processados: detalhes.processados || 0,
    registros_inseridos: detalhes.inseridos || 0,
    tempo_execucao_ms: detalhes.tempo || 0,
    detalhes: detalhes,
    erro: detalhes.erro || null
  };
  
  await supabase.from('yuzer_sync_logs').insert(logData);
}

// FUNÇÃO PRINCIPAL
async function main() {
  const inicioTempo = Date.now();
  console.log('🚀 INICIANDO SYNC COMPLETO YUZER → BANCO DE DADOS\n');
  
  // Debug: Verificar configurações
  console.log('🔧 Verificando configurações...');
  console.log(`📍 Base URL: ${YUZER_CONFIG.baseUrl}`);
  console.log(`🔑 Token: ${YUZER_CONFIG.token ? YUZER_CONFIG.token.substring(0, 8) + '...' : 'NÃO ENCONTRADO'}`);
  console.log(`🏢 Bar ID: ${BAR_ID}`);
  console.log('');
  
  try {
    await logSync('sync_completo', 'processando', { inicio: new Date().toISOString() });
    
    // 1. Buscar eventos
    const eventos = await buscarEventos();
    if (eventos.length === 0) {
      throw new Error('Nenhum evento encontrado');
    }
    
    // 2. Salvar eventos no banco
    await salvarEventos(eventos);
    
    // 3. Para cada evento, buscar dados detalhados
    for (const evento of eventos) {
      const eventoId = evento.id || evento.salesPanelId || evento.eventId;
      const eventoNome = evento.name || evento.title || `Evento ${eventoId}`;
      
      if (!eventoId) {
        console.log(`⚠️ Pulando evento sem ID válido`);
        continue;
      }
      
      console.log(`\n📊 PROCESSANDO EVENTO: ${eventoNome} (ID: ${eventoId})`);
      
      // Faturamento por hora
      await salvarFaturamentoPorHora(eventoId, eventoNome);
      
      // Dados de pagamento
      await salvarDadosPagamento(eventoId, eventoNome);
      
      // Produtos
      await salvarProdutos(eventoId, eventoNome);
    }
    
    const tempoTotal = Date.now() - inicioTempo;
    
    await logSync('sync_completo', 'sucesso', {
      fim: new Date().toISOString(),
      eventos_processados: eventos.length,
      tempo_execucao_ms: tempoTotal
    });
    
    console.log(`\n✅ SYNC COMPLETO FINALIZADO EM ${tempoTotal}ms`);
    console.log(`📊 ${eventos.length} eventos processados com sucesso!`);
    
  } catch (error) {
    const tempoTotal = Date.now() - inicioTempo;
    
    await logSync('sync_completo', 'erro', {
      erro: error.message,
      tempo_execucao_ms: tempoTotal
    });
    
    console.error('\n❌ ERRO NO SYNC:', error.message);
    process.exit(1);
  }
}

// Executar
main(); 