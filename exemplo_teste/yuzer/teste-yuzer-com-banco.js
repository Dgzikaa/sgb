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
  
  // SISTEMA DE TAXA POR MÁQUINAS YUZER
  const TAXAS_MAQUINAS = {
    3: 255,   // 3 máquinas = R$ 255 (Reconvexa)
    6: 510,   // 6 máquinas = R$ 510
    7: 595,   // 7 máquinas = R$ 595 (Domingo)
    8: 680,   // 8 máquinas = R$ 680
    10: 1600  // 10 máquinas = R$ 1.600
  };
  
  // Função para calcular taxa baseada na quantidade de máquinas
  function calcularTaxaMaquinas(qtdMaquinas) {
    if (TAXAS_MAQUINAS[qtdMaquinas]) {
      return TAXAS_MAQUINAS[qtdMaquinas];
    }
    
    // Se não tiver valor exato, calcular baseado no padrão
    // Análise dos valores: parece ser ~85 por máquina com variações
    console.log(`⚠️ Quantidade de máquinas ${qtdMaquinas} não mapeada. Usando cálculo estimado.`);
    return Math.round(qtdMaquinas * 85); // Estimativa baseada nos valores conhecidos
  }
  


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
  console.log('\n🎯 1. BUSCANDO EVENTO RECONVEXA (09/08 17h-04h)...');
  
  // PERÍODO ESTENDIDO RECONVEXA: 09/08 12h até 10/08 07h (Brasil)
  const dataEspecifica = new Date('2025-08-09T15:00:00.000Z'); // 09/08 12h Brasil = 15h UTC
  const dataFim = new Date('2025-08-10T10:00:00.000Z'); // 10/08 07h Brasil = 10h UTC
  
  console.log(`📅 Período de busca: 09/08 12h até 10/08 07h`);
  
  // Usar apenas o método que funcionou
  const response = await yuzerFetch('/api/dashboards/salesPanels/statistics', 'POST', {
    from: dataEspecifica.toISOString(),
    to: dataFim.toISOString()
  });
  
  if (!response || !response.data) {
    console.log('❌ Nenhum evento encontrado para 09/08/2025');
    return [];
  }
  
  const salesPanels = response.data;
  console.log(`✅ Encontrados ${salesPanels.length} eventos no período RECONVEXA`);
  
  // Filtrar apenas RECONVEXA (09/08) - excluir ORDINÁRIO (10/08)
  const eventosComDados = salesPanels.filter(evento => {
    const temDados = (evento.total && evento.total > 0) || (evento.count && evento.count > 0);
    const nomeEvento = evento.name || evento.title || '';
    const ehReconvexa = nomeEvento.toLowerCase().includes('reconvexa') || 
                       (nomeEvento.includes('09/08') || nomeEvento.includes('09/8') || nomeEvento.includes('9/8'));
    // Excluir explicitamente ORDINÁRIO
    const naoEhOrdinario = !nomeEvento.toLowerCase().includes('ordinário') && !nomeEvento.toLowerCase().includes('ordinario');
    
    return temDados && ehReconvexa && naoEhOrdinario;
  });
  
  console.log(`📊 Eventos RECONVEXA encontrados: ${eventosComDados.length} de ${salesPanels.length}`);
  
  // Log dos eventos encontrados
  eventosComDados.forEach(evento => {
    console.log(`   🎪 ${evento.name || evento.title} (ID: ${evento.id || evento.salesPanelId})`);
  });
  
  return eventosComDados;
}

// 2. SALVAR DADOS DO EVENTO
async function salvarEventos(eventos) {
  console.log('\n🎯 2. SALVANDO EVENTOS NO BANCO...');
  
  // Preparar dados de todos os eventos
  const eventosData = [];
  
  for (const evento of eventos) {
    const eventoId = evento.id || evento.salesPanelId || evento.eventId;
    if (!eventoId) continue;
    
    // Usar dados básicos primeiro, buscar detalhes só se necessário
    const eventoData = {
      bar_id: BAR_ID,
      evento_id: eventoId,
      nome_evento: evento.name || evento.title || `Evento ${eventoId}`,
      data_inicio: null, // Será extraído do nome se possível
      data_fim: null,
      status: evento.status || 'UNKNOWN',
      company_name: null,
      company_document: null,
      raw_data: evento,
      updated_at: new Date().toISOString()
    };
    
    // Tentar extrair data do nome do evento
    const regex = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/;
    const match = eventoData.nome_evento.match(regex);
    if (match) {
      let [, dia, mes, ano] = match;
      if (ano.length === 2) {
        ano = parseInt(ano) < 50 ? `20${ano}` : `19${ano}`;
      }
      const dataEvento = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      eventoData.data_inicio = `${dataEvento}T18:00:00.000Z`; // Estimar início às 18h
      eventoData.data_fim = `${dataEvento}T23:59:59.999Z`;   // Estimar fim às 23h59
    }
    
    eventosData.push(eventoData);
  }
  
  // Inserir todos os eventos em lote
  const inseridos = await insertBatch('yuzer_eventos', eventosData, 'evento_id');
  console.log(`✅ ${inseridos} eventos salvos no banco`);
}

// 3. SALVAR FATURAMENTO POR HORA
async function salvarFaturamentoPorHora(eventoId, nomeEvento) {
  console.log(`\n🎯 3. SALVANDO FATURAMENTO POR HORA - ${nomeEvento}...`);
  
  // Usar período estendido do evento RECONVEXA (12h-07h)
  const dataInicio = new Date('2025-08-09T15:00:00.000Z'); // 09/08 12h Brasil
  const dataFim = new Date('2025-08-10T10:00:00.000Z'); // 10/08 07h Brasil
  
      console.log(`   📅 Período: 09/08 12h-07h (${dataInicio.toLocaleDateString('pt-BR')})`);
  
  const bodyPeriodo = {
    from: dataInicio.toISOString(),
    to: dataFim.toISOString()
  };
  
    try {
    // Tentar primeiro com período específico
    let response = await yuzerFetch(
      `/api/salesPanels/${eventoId}/dashboards/earningsAndSells/hour`, 
      'POST', 
      bodyPeriodo
    );
    
    // Se não funcionar com período específico, tentar com body vazio
    if (!response || !response.categories || (response.categories && response.categories.length === 0)) {
      console.log('   🔄 Período específico vazio, tentando body vazio...');
      response = await yuzerFetch(
        `/api/salesPanels/${eventoId}/dashboards/earningsAndSells/hour`, 
        'POST', 
        {}
      );
    }
    
    // Se ainda não funcionar, tentar período mais amplo (mês inteiro)
    if (!response || !response.categories || (response.categories && response.categories.length === 0)) {
      console.log('   🔄 Body vazio falhou, tentando período mensal...');
      const dataEventoObj = new Date(dataEvento);
      const inicioMes = new Date(dataEventoObj.getFullYear(), dataEventoObj.getMonth(), 1);
      const fimMes = new Date(dataEventoObj.getFullYear(), dataEventoObj.getMonth() + 1, 0, 23, 59, 59);
      
      const bodyMensal = {
        from: inicioMes.toISOString(),
        to: fimMes.toISOString()
      };
      
      response = await yuzerFetch(
        `/api/salesPanels/${eventoId}/dashboards/earningsAndSells/hour`, 
        'POST', 
        bodyMensal
      );
    }
    
    if (!response) {
      console.log('⚠️ Resposta vazia em todas as tentativas');
      return;
    }
    
    // Estrutura correta: { categories: [...], series: [{ data: [...] }] }
    if (!response.categories || !response.series || !Array.isArray(response.series)) {
      console.log('⚠️ Estrutura inválida:', Object.keys(response));
      console.log('⚠️ Dados de response:', JSON.stringify(response, null, 2));
      return;
    }
    
    const categories = response.categories;
    const seriesData = response.series[0]?.data || [];
    
    if (categories.length === 0 || seriesData.length === 0) {
      console.log('⚠️ Dados vazios');
      return;
    }
    
    // Verificar se tem dados não zerados
    // Dados vêm como objetos: { total: X, sells: Y }
    const totalFaturamento = seriesData.reduce((sum, item) => {
      const valor = item && typeof item === 'object' ? (item.total || 0) : (Number(item) || 0);
      return sum + valor;
    }, 0);
    console.log(`   💰 Total faturamento: R$ ${(totalFaturamento || 0).toFixed(2)}`);
    
    if (!totalFaturamento || totalFaturamento === 0) {
      console.log('⚠️ Faturamento por hora zerado');
      return;
    }
    
    // Determinar data do evento baseado no nome (ex: "ORDINÁRIO 27/07/25")
    const dataEvento = extrairDataDoNomeEvento(nomeEvento);
    
    // Preparar todos os dados para inserção em lote
    const dadosFatHora = categories.map((categoria, index) => {
      const item = seriesData[index];
      return {
        bar_id: BAR_ID,
        evento_id: eventoId,
        data_evento: dataEvento,
        hora: index, // 0-23
        hora_formatada: categoria, // Ex: "27/07/2025 18:00"
        faturamento: item && typeof item === 'object' ? (item.total || 0) : (Number(item) || 0),
        vendas: item && typeof item === 'object' ? (item.sells || 0) : 0, // Agora temos vendas também!
        raw_data: item, // Objeto completo { total: X, sells: Y }
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
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
  
  // Usar período estendido do evento RECONVEXA (12h-07h)
  const dataInicio = new Date('2025-08-09T15:00:00.000Z'); // 09/08 12h Brasil
  const dataFim = new Date('2025-08-10T10:00:00.000Z'); // 10/08 07h Brasil
  
  const bodyPeriodo = {
    from: dataInicio.toISOString(),
    to: dataFim.toISOString()
  };
  
  try {
    const response = await yuzerFetch(
      `/api/salesPanels/${eventoId}/dashboards/payments/statistics`, 
      'POST', 
      bodyPeriodo
    );
      
      if (!response || !response.methods) {
        console.log('⚠️ Sem dados de pagamento');
        return;
      }
      
      // Verificar se tem faturamento
      if (!response.total || response.total === 0) {
        console.log('⚠️ Faturamento zerado');
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

    // CALCULAR VALOR LÍQUIDO (apenas descontos de pagamento, aluguel agora é produto)
    const descontoCredito = credito * TAXA_CREDITO;
    const descontoDebitoPix = (debito + pix) * TAXA_DEBITO_PIX;
    const totalDescontos = descontoCredito + descontoDebitoPix;
    const faturamentoBruto = response.total || 0;
    const valorLiquido = faturamentoBruto - totalDescontos; // Sem aluguel aqui
    
    // SISTEMA DE MÁQUINAS E REPASSE
    // Quantidade de máquinas será preenchida manualmente no banco
    // Taxa será calculada automaticamente por coluna calculada
    const qtdMaquinas = 0; // Padrão 0 até preenchimento manual
    
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
      aluguel_equipamentos: 0, // Agora é produto, não desconto
      valor_liquido: valorLiquido,
      
      // NOVAS COLUNAS - SISTEMA DE MÁQUINAS E REPASSE
      qtd_maquinas: qtdMaquinas,
      // taxa_maquinas_calculada: Calculado automaticamente pelo banco
      // repasse_liquido: Calculado automaticamente pelo banco
      
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
    console.log(`   🎟️ Quantidade Pedidos: ${response.count || 0}`);
    console.log(`   💳 Crédito: R$ ${credito.toFixed(2)} (desc: R$ ${descontoCredito.toFixed(2)})`);
    console.log(`   💰 Débito: R$ ${debito.toFixed(2)} + PIX: R$ ${pix.toFixed(2)} (desc: R$ ${descontoDebitoPix.toFixed(2)})`);
    console.log(`   💵 Dinheiro: R$ ${dinheiro.toFixed(2)}`);
    console.log(`   📦 Produção: R$ ${producao.toFixed(2)}`);
    console.log(`   ❌ Cancelado: R$ ${cancelado.toFixed(2)}`);
    console.log(`   📊 Total Descontos: R$ ${totalDescontos.toFixed(2)}`);
    console.log(`   ✅ VALOR LÍQUIDO: R$ ${valorLiquido.toFixed(2)}`);
    console.log(`   🔧 Máquinas: A preencher manualmente no banco`);
    console.log(`   💸 REPASSE: Será calculado automaticamente (Líquido - Dinheiro - Taxa Máquinas)`);
    
  } catch (error) {
    console.error(`❌ Erro ao salvar dados de pagamento:`, error.message);
  }
}

// 5. SALVAR PRODUTOS
async function salvarProdutos(eventoId, nomeEvento) {
  console.log(`\n🎯 5. SALVANDO PRODUTOS - ${nomeEvento}...`);
  
  // Usar período estendido do evento RECONVEXA (12h-07h)
  const dataInicio = new Date('2025-08-09T15:00:00.000Z'); // 09/08 12h Brasil
  const dataFim = new Date('2025-08-10T10:00:00.000Z'); // 10/08 07h Brasil
  
  const bodyPeriodo = {
    from: dataInicio.toISOString(),
    to: dataFim.toISOString()
  };
  
    try {
    const response = await yuzerFetch(
      `/api/salesPanels/${eventoId}/dashboards/products/statistics`, 
      'POST', 
      bodyPeriodo
    );
    
    if (!response) {
      console.log('⚠️ Resposta vazia');
      return;
    }
    
    // Estrutura correta: { total: 41889.5, count: 2277, data: [...] }
    if (!response.data || !Array.isArray(response.data)) {
      console.log('⚠️ Estrutura inválida:', Object.keys(response));
      return;
    }
    
    const produtos = response.data;
    
    if (produtos.length === 0) {
      console.log('⚠️ Array de produtos vazio');
      return;
    }
    
    // Verificar se tem vendas
    const totalVendas = response.total || 0;
    console.log(`   💰 Total vendas: R$ ${totalVendas.toFixed(2)}`);
    console.log(`   📦 Produtos: ${produtos.length} itens`);
    
    if (totalVendas === 0) {
      console.log('⚠️ Vendas de produtos zeradas');
      return;
    }
    
    const dataEvento = extrairDataDoNomeEvento(nomeEvento);
    
    // Preparar todos os dados para inserção em lote
    const dadosProdutos = produtos.map(produto => {
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
    
    // Adicionar produto do aluguel de equipamentos (-R$ 500)
    // ID único baseado no evento_id para evitar conflitos
    const aluguelProdutoId = parseInt(`99${eventoId}`); // Ex: evento 13963 → 9913963
    
    const produtoAluguel = {
      bar_id: BAR_ID,
      evento_id: eventoId,
      data_evento: dataEvento,
      produto_id: aluguelProdutoId, // ID único por evento
      produto_nome: 'Aluguel de Equipamentos',
      quantidade: 1,
      valor_total: -500, // Valor negativo
      percentual: 0,
      categoria: 'SERVICO',
      eh_ingresso: false,
      raw_data: {
        tipo: 'aluguel_equipamentos',
        descricao: 'Taxa fixa de aluguel de equipamentos Yuzer',
        valor: -250,
        evento_referencia: eventoId
      },
      updated_at: new Date().toISOString()
    };
    
    dadosProdutos.push(produtoAluguel);
    
    // Inserir em lote com UPSERT
    const inseridos = await insertBatch('yuzer_produtos', dadosProdutos, 'bar_id,evento_id,data_evento,produto_id');
    console.log(`✅ Produtos salvos: ${inseridos} itens (incluindo aluguel -R$ 500)`);
    
    // Mostrar ingressos encontrados
    const ingressos = produtos.filter(p => (p.name || '').toUpperCase().includes('INGRESSO'));
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
      
      const { data, error } = await query;
      
      if (error) {
        console.error(`   ❌ Erro no lote ${loteNum}:`, error.message);
        continue;
      }
      
      const inseridos = lote.length; // Assumir que todos foram inseridos se não há erro
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