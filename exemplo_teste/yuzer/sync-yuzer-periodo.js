// Script Yuzer para Sync de Período Específico - Versão Backlog
// Uso: node sync-yuzer-periodo.js [data_inicio] [data_fim]
// Exemplo: node sync-yuzer-periodo.js 2025-07-01 2025-08-31

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

// Configuração teste
const BAR_ID = 3; // ID do bar no sistema

// Argumentos da linha de comando
const args = process.argv.slice(2);
let dataInicio, dataFim;

if (args.length >= 2) {
  dataInicio = args[0];
  dataFim = args[1];
} else if (args.length === 1) {
  // Se só uma data, usar o mesmo dia
  dataInicio = args[0];
  dataFim = args[0];
} else {
  // Usar últimos 30 dias como padrão
  const hoje = new Date();
  const inicioMes = new Date(hoje);
  inicioMes.setDate(hoje.getDate() - 30);
  
  dataInicio = inicioMes.toISOString().split('T')[0];
  dataFim = hoje.toISOString().split('T')[0];
}

console.log(`🎯 PROCESSANDO PERÍODO: ${dataInicio} até ${dataFim}`);

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
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`❌ Error ${response.status} em ${method} ${url}:`, errorText);
    throw new Error(`${response.status} - ${errorText}`);
  }
  
  const responseData = await response.json();
  return responseData;
}

// Função para gerar datas no período
function gerarDatasNoPeriodo(inicio, fim) {
  const datas = [];
  const dataAtual = new Date(inicio);
  const dataFinal = new Date(fim);
  
  while (dataAtual <= dataFinal) {
    datas.push(dataAtual.toISOString().split('T')[0]);
    dataAtual.setDate(dataAtual.getDate() + 1);
  }
  
  return datas;
}

// Função para criar período UTC do evento (10h do dia até 10h do dia seguinte)
function criarPeriodoEvento(dataEvento) {
  const data = new Date(dataEvento);
  
  // Início: 10h do dia do evento (UTC)
  const inicio = new Date(data);
  inicio.setUTCHours(13, 0, 0, 0); // 10h Brasil = 13h UTC
  
  // Fim: 10h do dia seguinte (UTC)
  const fim = new Date(data);
  fim.setDate(data.getDate() + 1);
  fim.setUTCHours(13, 0, 0, 0); // 10h Brasil = 13h UTC
  
  return {
    from: inicio.toISOString(),
    to: fim.toISOString()
  };
}

// 1. BUSCAR EVENTOS POR PERÍODO
async function buscarEventosPorPeriodo(dataEvento) {
  const periodo = criarPeriodoEvento(dataEvento);
  
  console.log(`\n🎯 BUSCANDO EVENTOS PARA ${dataEvento}...`);
  console.log(`   📅 Período: ${new Date(periodo.from).toLocaleString('pt-BR')} até ${new Date(periodo.to).toLocaleString('pt-BR')} (10h-10h)`);
  
  try {
    const response = await yuzerFetch('/api/dashboards/salesPanels/statistics', 'POST', periodo);
    
    if (!response || !response.data) {
      console.log(`   ⚠️ Nenhum evento encontrado para ${dataEvento}`);
      return [];
    }
    
    const salesPanels = response.data;
    console.log(`   ✅ Encontrados ${salesPanels.length} eventos no período`);
    
    // Filtrar eventos com dados
    const eventosComDados = salesPanels.filter(evento => {
      const temDados = (evento.total && evento.total > 0) || (evento.count && evento.count > 0);
      return temDados;
    });
    
    console.log(`   📊 Eventos com dados: ${eventosComDados.length} de ${salesPanels.length}`);
    
    // Log dos eventos encontrados
    eventosComDados.forEach(evento => {
      console.log(`      🎪 ${evento.name || evento.title} (ID: ${evento.id || evento.salesPanelId})`);
    });
    
    return eventosComDados;
    
  } catch (error) {
    console.log(`   ❌ Erro ao buscar eventos para ${dataEvento}:`, error.message);
    return [];
  }
}

// 2. SALVAR DADOS DO EVENTO
async function salvarEventos(eventos, dataEvento) {
  if (!eventos || eventos.length === 0) return;
  
  console.log(`\n🎯 SALVANDO ${eventos.length} EVENTOS NO BANCO...`);
  
  const eventosData = [];
  
  for (const evento of eventos) {
    const eventoId = evento.id || evento.salesPanelId || evento.eventId;
    if (!eventoId) continue;
    
    const eventoData = {
      bar_id: BAR_ID,
      evento_id: eventoId,
      nome_evento: evento.name || evento.title || `Evento ${eventoId}`,
      data_inicio: `${dataEvento}T18:00:00.000Z`,
      data_fim: `${dataEvento}T23:59:59.999Z`,
      status: evento.status || 'UNKNOWN',
      company_name: null,
      company_document: null,
      raw_data: evento,
      updated_at: new Date().toISOString()
    };
    
    eventosData.push(eventoData);
  }
  
  const inseridos = await insertBatch('yuzer_eventos', eventosData, 'evento_id');
  console.log(`   ✅ ${inseridos} eventos salvos no banco`);
}

// 3. SALVAR FATURAMENTO POR HORA
async function salvarFaturamentoPorHora(eventoId, nomeEvento, dataEvento) {
  console.log(`   🎯 Salvando faturamento por hora - ${nomeEvento}...`)
  
  const periodo = criarPeriodoEvento(dataEvento);
  console.log(`      📅 Período: ${new Date(periodo.from).toLocaleString('pt-BR')} até ${new Date(periodo.to).toLocaleString('pt-BR')} (10h-10h)`);
  
  try {
    const response = await yuzerFetch(
      `/api/salesPanels/${eventoId}/dashboards/earningsAndSells/hour`, 
      'POST', 
      periodo
    );
    
    if (!response || !response.categories || !response.series) {
      console.log(`      ⚠️ Sem dados de faturamento por hora`);
      return;
    }
    
    const categories = response.categories;
    const seriesData = response.series[0]?.data || [];
    
    if (categories.length === 0 || seriesData.length === 0) {
      console.log(`      ⚠️ Dados vazios`);
      return;
    }
    
    const totalFaturamento = seriesData.reduce((sum, item) => {
      const valor = item && typeof item === 'object' ? (item.total || 0) : (Number(item) || 0);
      return sum + valor;
    }, 0);
    
    console.log(`      💰 Total faturamento: R$ ${(totalFaturamento || 0).toFixed(2)}`);
    
    if (!totalFaturamento || totalFaturamento === 0) {
      console.log(`      ⚠️ Faturamento por hora zerado`);
      return;
    }
    
    const dadosFatHora = categories.map((categoria, index) => {
      const item = seriesData[index];
      return {
        bar_id: BAR_ID,
        evento_id: eventoId,
        data_evento: dataEvento,
        hora: index,
        hora_formatada: categoria,
        faturamento: item && typeof item === 'object' ? (item.total || 0) : (Number(item) || 0),
        vendas: item && typeof item === 'object' ? (item.sells || 0) : 0,
        raw_data: item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    const inseridos = await insertBatch('yuzer_fatporhora', dadosFatHora, 'bar_id,evento_id,data_evento,hora');
    console.log(`      ✅ Faturamento por hora: ${inseridos} registros`);
    
  } catch (error) {
    console.log(`      ❌ Erro ao salvar faturamento por hora:`, error.message);
  }
}

// 4. SALVAR DADOS DE PAGAMENTO
async function salvarDadosPagamento(eventoId, nomeEvento, dataEvento) {
  console.log(`   🎯 Salvando dados de pagamento - ${nomeEvento}...`);
  
  const periodo = criarPeriodoEvento(dataEvento);
  
  try {
    const response = await yuzerFetch(
      `/api/salesPanels/${eventoId}/dashboards/payments/statistics`, 
      'POST', 
      periodo
    );
      
    if (!response || !response.methods || !response.total || response.total === 0) {
      console.log(`      ⚠️ Sem dados de pagamento`);
      return;
    }
    
    const methods = response.methods;
    const credito = methods.find(m => m.name === 'CREDIT_CARD')?.total || 0;
    const debito = methods.find(m => m.name === 'DEBIT_CARD')?.total || 0;
    const pix = methods.find(m => m.name === 'PIX')?.total || 0;
    const dinheiro = methods.find(m => m.name === 'CASH')?.total || 0;
    const producao = methods.find(m => m.name === 'PRODUCTION')?.total || 0;
    const cancelado = methods.find(m => m.name === 'CANCELLED')?.total || 0;

    const descontoCredito = credito * TAXA_CREDITO;
    const descontoDebitoPix = (debito + pix) * TAXA_DEBITO_PIX;
    const totalDescontos = descontoCredito + descontoDebitoPix;
    const faturamentoBruto = response.total || 0;
    const valorLiquido = faturamentoBruto - totalDescontos;
    
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
      aluguel_equipamentos: 0,
      valor_liquido: valorLiquido,
      qtd_maquinas: 0, // Padrão 0 até preenchimento manual
      // taxa_maquinas_calculada: Calculado automaticamente pelo banco
      // repasse_liquido: Calculado automaticamente pelo banco
      total_cancelado: cancelado,
      quantidade_pedidos: response.count || 0,
      raw_data: response,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('yuzer_pagamento')
      .upsert(pagamentoData, { onConflict: 'bar_id,evento_id,data_evento' });
    
    if (error) throw error;
    
    console.log(`      ✅ Pagamento: Bruto R$ ${faturamentoBruto.toFixed(2)} | Líquido R$ ${valorLiquido.toFixed(2)}`);
    
  } catch (error) {
    console.log(`      ❌ Erro ao salvar dados de pagamento:`, error.message);
  }
}

// 5. SALVAR PRODUTOS
async function salvarProdutos(eventoId, nomeEvento, dataEvento) {
  console.log(`   🎯 Salvando produtos - ${nomeEvento}...`);
  
  const periodo = criarPeriodoEvento(dataEvento);
  
  try {
    const response = await yuzerFetch(
      `/api/salesPanels/${eventoId}/dashboards/products/statistics`, 
      'POST', 
      periodo
    );
    
    if (!response || !response.data || !Array.isArray(response.data) || response.data.length === 0) {
      console.log(`      ⚠️ Sem dados de produtos`);
      return;
    }
    
    const produtos = response.data;
    const totalVendas = response.total || 0;
    
    console.log(`      💰 Total vendas: R$ ${totalVendas.toFixed(2)} | ${produtos.length} produtos`);
    
    if (totalVendas === 0) {
      console.log(`      ⚠️ Vendas de produtos zeradas`);
      return;
    }
    
    const dadosProdutos = produtos.map(produto => {
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
    
    // Adicionar produto do aluguel de equipamentos
    const aluguelProdutoId = parseInt(`99${eventoId}`);
    
    const produtoAluguel = {
      bar_id: BAR_ID,
      evento_id: eventoId,
      data_evento: dataEvento,
      produto_id: aluguelProdutoId,
      produto_nome: 'Aluguel de Equipamentos',
      quantidade: 1,
      valor_total: -500,
      percentual: 0,
      categoria: 'SERVICO',
      eh_ingresso: false,
      raw_data: {
        tipo: 'aluguel_equipamentos',
        descricao: 'Taxa fixa de aluguel de equipamentos Yuzer',
        valor: -500,
        evento_referencia: eventoId
      },
      updated_at: new Date().toISOString()
    };
    
    dadosProdutos.push(produtoAluguel);
    
    const inseridos = await insertBatch('yuzer_produtos', dadosProdutos, 'bar_id,evento_id,data_evento,produto_id');
    console.log(`      ✅ Produtos: ${inseridos} itens (incluindo aluguel -R$ 500)`);
    
    // Mostrar ingressos
    const ingressos = produtos.filter(p => (p.name || '').toUpperCase().includes('INGRESSO'));
    if (ingressos.length > 0) {
      ingressos.forEach(ing => {
        console.log(`         🎫 ${ing.name}: ${ing.count} vendidos (R$ ${(ing.total || 0).toFixed(2)})`);
      });
    }
    
  } catch (error) {
    console.log(`      ❌ Erro ao salvar produtos:`, error.message);
  }
}

// Função auxiliar para inserção em lotes
async function insertBatch(tabela, dados, conflictColumn = null) {
  if (!dados || dados.length === 0) {
    return 0;
  }

  const BATCH_SIZE = 90;
  let totalInseridos = 0;
  
  for (let i = 0; i < dados.length; i += BATCH_SIZE) {
    const lote = dados.slice(i, i + BATCH_SIZE);
    
    try {
      let query = supabase.from(tabela);
      
      if (conflictColumn) {
        query = query.upsert(lote, { onConflict: conflictColumn });
      } else {
        query = query.insert(lote);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error(`      ❌ Erro no lote:`, error.message);
        continue;
      }
      
      totalInseridos += lote.length;
      
    } catch (error) {
      console.error(`      ❌ Exceção no lote:`, error.message);
    }
  }
  
  return totalInseridos;
}

// FUNÇÃO PRINCIPAL
async function main() {
  const inicioTempo = Date.now();
  console.log('🚀 INICIANDO SYNC YUZER PARA PERÍODO ESPECÍFICO\n');
  
  console.log(`📅 Período: ${dataInicio} até ${dataFim}`);
  console.log(`🏢 Bar ID: ${BAR_ID}`);
  console.log('');
  
  try {
    // Gerar lista de datas no período
    const datas = gerarDatasNoPeriodo(dataInicio, dataFim);
    console.log(`📊 Total de dias para processar: ${datas.length}`);
    
    let totalEventos = 0;
    
    // Processar cada data
    for (const dataEvento of datas) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📅 PROCESSANDO ${dataEvento}`);
      console.log(`${'='.repeat(60)}`);
      
      // 1. Buscar eventos para a data
      const eventos = await buscarEventosPorPeriodo(dataEvento);
      
      if (eventos.length === 0) {
        console.log(`   ⚠️ Nenhum evento encontrado para ${dataEvento}`);
        continue;
      }
      
      // 2. Salvar eventos no banco
      await salvarEventos(eventos, dataEvento);
      
      // 3. Para cada evento, buscar dados detalhados
      for (const evento of eventos) {
        const eventoId = evento.id || evento.salesPanelId || evento.eventId;
        const eventoNome = evento.name || evento.title || `Evento ${eventoId}`;
        
        if (!eventoId) {
          console.log(`   ⚠️ Pulando evento sem ID válido`);
          continue;
        }
        
        console.log(`\n   📊 PROCESSANDO: ${eventoNome} (ID: ${eventoId})`);
        
        // Processar dados do evento
        await salvarFaturamentoPorHora(eventoId, eventoNome, dataEvento);
        await salvarDadosPagamento(eventoId, eventoNome, dataEvento);
        await salvarProdutos(eventoId, eventoNome, dataEvento);
        
        totalEventos++;
      }
      
      // Pausa entre dias
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const tempoTotal = Date.now() - inicioTempo;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ SYNC YUZER PERÍODO CONCLUÍDO');
    console.log(`${'='.repeat(60)}`);
    console.log(`📊 ${totalEventos} eventos processados em ${datas.length} dias`);
    console.log(`⏱️ Tempo total: ${Math.round(tempoTotal / 1000)}s`);
    
  } catch (error) {
    console.error('\n❌ ERRO NO SYNC:', error.message);
    process.exit(1);
  }
}

// Executar
main();
