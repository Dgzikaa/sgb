// Teste Detalhado da API Yuzer - Explorando Endpoints Específicos
// Baseado no teste anterior que funcionou

const fs = require('fs');

// Carregar .env.local
try {
  require('dotenv').config({ path: '../../frontend/.env.local' });
  console.log('🔧 .env.local carregado');
} catch (error) {
  console.log('⚠️  Usando configuração hardcoded');
}

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

// Função para fazer requisições à API Yuzer
async function makeYuzerRequest(endpoint, method = 'GET', body = null, salesPanelId = null) {
  const config = getYuzerConfig();
  
  // Substituir {salesPanelId} no endpoint se fornecido
  let finalEndpoint = endpoint;
  if (salesPanelId && endpoint.includes('{salesPanelId}')) {
    finalEndpoint = endpoint.replace('{salesPanelId}', salesPanelId);
  }
  
  const url = `${config.baseUrl}${finalEndpoint}`;
  
  console.log(`🔗 ${method} ${url}`);
  
  const options = {
    method: method,
    headers: config.headers
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
    console.log(`📤 Body: ${JSON.stringify(body, null, 2)}`);
  }
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status} - ${errorText}`);
    }
    
    const responseText = await response.text();
    
    if (!responseText || responseText.trim() === '') {
      return { empty: true, message: 'Resposta vazia' };
    }
    
    const data = JSON.parse(responseText);
    console.log(`✅ Sucesso: ${Object.keys(data).length} propriedades na resposta`);
    
    return data;
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    return { error: true, message: error.message };
  }
}

// Função para buscar Sales Panels
async function buscarSalesPanels() {
  console.log('\n📋 Buscando Sales Panels...');
  
  // Tentar diferentes métodos para buscar sales panels
  const metodosParaTestar = [
    {
      nome: 'POST /api/salesPanels',
      endpoint: '/api/salesPanels',
      method: 'POST',
      body: {}
    },
    {
      nome: 'POST /api/salesPanels com período',
      endpoint: '/api/salesPanels',
      method: 'POST',
      body: {
        from: new Date('2025-01-01T00:00:00.000Z').toISOString(),
        to: new Date('2025-12-31T23:59:59.999Z').toISOString()
      }
    },
    {
      nome: 'POST /api/dashboards/recentEvents/search',
      endpoint: '/api/dashboards/recentEvents/search',
      method: 'POST',
      body: {
        from: new Date('2025-01-01T00:00:00.000Z').toISOString(),
        to: new Date('2025-12-31T23:59:59.999Z').toISOString()
      }
    },
    {
      nome: 'POST /api/dashboards/ongoing',
      endpoint: '/api/dashboards/ongoing',
      method: 'POST',
      body: {}
    },
    {
      nome: 'POST /api/dashboards/salesPanels/statistics (do script original)',
      endpoint: '/api/dashboards/salesPanels/statistics',
      method: 'POST',
      body: {
        from: new Date('2025-01-01T00:00:00.000Z').toISOString(),
        to: new Date('2025-12-31T23:59:59.999Z').toISOString()
      }
    }
  ];
  
  for (const metodo of metodosParaTestar) {
    console.log(`\n🔍 Tentando: ${metodo.nome}`);
    
    try {
      const response = await makeYuzerRequest(metodo.endpoint, metodo.method, metodo.body);
      
      if (response.error) {
        console.log(`   ❌ ${response.message}`);
        continue;
      }
      
      if (response.empty) {
        console.log(`   ⚠️ Resposta vazia`);
        continue;
      }
      
      // Verificar se a resposta contém dados úteis
      let salesPanels = [];
      
      if (Array.isArray(response)) {
        salesPanels = response;
      } else if (response.content && Array.isArray(response.content)) {
        salesPanels = response.content;
      } else if (response.data && Array.isArray(response.data)) {
        salesPanels = response.data;
      } else if (response.events && Array.isArray(response.events)) {
        salesPanels = response.events;
      } else {
        console.log(`   ⚠️ Estrutura não reconhecida:`, Object.keys(response));
        continue;
      }
      
      if (salesPanels.length > 0) {
        console.log(`   ✅ Encontrados ${salesPanels.length} sales panels`);
        
        // Mostrar informações básicas dos sales panels
        salesPanels.forEach((panel, index) => {
          const id = panel.id || panel.salesPanelId || panel.eventId;
          const nome = panel.name || panel.title || panel.eventName || 'Sem nome';
          const status = panel.status || panel.state || 'N/A';
          console.log(`      ${index + 1}. ID: ${id} - Nome: ${nome} - Status: ${status}`);
        });
        
        return salesPanels;
      }
      
    } catch (error) {
      console.log(`   ❌ Erro inesperado: ${error.message}`);
    }
  }
  
  console.log('\n❌ Não foi possível encontrar sales panels por nenhum método');
  return [];
}

// Função para encontrar o sales panel do evento de 27/07/2025
function encontrarSalesPanelDoEvento(salesPanels) {
  console.log('\n🎯 Procurando sales panel do evento de 27/07/2025...');
  
  // Procurar por padrões que indiquem o evento de 27/07
  const padroesBusca = [
    /27\/07/,
    /27\/7/,
    /2025-07-27/,
    /jul.*27/i,
    /ordinário.*27/i,
    /27.*jul/i
  ];
  
  for (const panel of salesPanels) {
    // Diferentes campos possíveis para nome e descrição
    const campos = [
      panel.name,
      panel.title,
      panel.eventName,
      panel.description,
      panel.eventDescription
    ].filter(Boolean);
    
    const textoCompleto = campos.join(' ').toLowerCase();
    
    for (const padrao of padroesBusca) {
      if (padrao.test(textoCompleto)) {
        const id = panel.id || panel.salesPanelId || panel.eventId;
        const nome = panel.name || panel.title || panel.eventName || 'Sem nome';
        console.log(`✅ Encontrado: ID ${id} - ${nome}`);
        return {
          id: id,
          name: nome,
          status: panel.status || panel.state || 'N/A',
          originalData: panel
        };
      }
    }
  }
  
  // Se não encontrar por data, pegar o primeiro ativo
  const statusAtivos = ['ACTIVE', 'ONGOING', 'OPEN', 'RUNNING'];
  const panelAtivo = salesPanels.find(p => {
    const status = (p.status || p.state || '').toUpperCase();
    return statusAtivos.includes(status);
  });
  
  if (panelAtivo) {
    const id = panelAtivo.id || panelAtivo.salesPanelId || panelAtivo.eventId;
    const nome = panelAtivo.name || panelAtivo.title || panelAtivo.eventName || 'Sem nome';
    console.log(`⚠️ Não encontrou por data, usando primeiro ativo: ID ${id} - ${nome}`);
    return {
      id: id,
      name: nome,
      status: panelAtivo.status || panelAtivo.state || 'N/A',
      originalData: panelAtivo
    };
  }
  
  // Se não encontrar nenhum ativo, pegar o primeiro
  if (salesPanels.length > 0) {
    const primeiro = salesPanels[0];
    const id = primeiro.id || primeiro.salesPanelId || primeiro.eventId;
    const nome = primeiro.name || primeiro.title || primeiro.eventName || 'Sem nome';
    console.log(`⚠️ Usando primeiro disponível: ID ${id} - ${nome}`);
    return {
      id: id,
      name: nome,
      status: primeiro.status || primeiro.state || 'N/A',
      originalData: primeiro
    };
  }
  
  return null;
}

// Função para testar endpoint específico com detalhes
async function testarEndpoint(nome, endpoint, method, body, salesPanelId) {
  console.log(`\n🧪 Testando: ${nome}`);
  console.log(`   Endpoint: ${method} ${endpoint}`);
  
  const resultado = await makeYuzerRequest(endpoint, method, body, salesPanelId);
  
  if (resultado.error) {
    console.log(`   ❌ Falhou: ${resultado.message}`);
    return { nome, status: 'erro', erro: resultado.message };
  }
  
  if (resultado.empty) {
    console.log(`   ⚠️ Resposta vazia`);
    return { nome, status: 'vazio' };
  }
  
  // Analisar estrutura da resposta
  const analise = analisarEstrutura(resultado);
  console.log(`   ✅ Estrutura: ${analise.resumo}`);
  
  if (analise.dadosInteressantes.length > 0) {
    console.log(`   💡 Dados interessantes:`);
    analise.dadosInteressantes.forEach(item => {
      console.log(`      - ${item}`);
    });
  }
  
  return {
    nome,
    status: 'sucesso',
    estrutura: analise,
    amostra: resultado
  };
}

// Função para analisar a estrutura dos dados retornados
function analisarEstrutura(data) {
  const tipo = Array.isArray(data) ? 'array' : typeof data;
  let resumo = '';
  let dadosInteressantes = [];
  
  if (Array.isArray(data)) {
    resumo = `Array com ${data.length} itens`;
    if (data.length > 0) {
      const primeiroItem = data[0];
      const propriedades = Object.keys(primeiroItem);
      resumo += `, propriedades: ${propriedades.join(', ')}`;
      
      // Procurar por dados financeiros
      const camposFinanceiros = propriedades.filter(p => 
        p.includes('total') || p.includes('price') || p.includes('value') || 
        p.includes('amount') || p.includes('cost') || p.includes('revenue')
      );
      if (camposFinanceiros.length > 0) {
        dadosInteressantes.push(`Campos financeiros: ${camposFinanceiros.join(', ')}`);
      }
      
      // Procurar por dados de quantidade
      const camposQuantidade = propriedades.filter(p => 
        p.includes('count') || p.includes('quantity') || p.includes('amount') || p.includes('number')
      );
      if (camposQuantidade.length > 0) {
        dadosInteressantes.push(`Campos de quantidade: ${camposQuantidade.join(', ')}`);
      }
      
      // Procurar por dados temporais
      const camposTempo = propriedades.filter(p => 
        p.includes('date') || p.includes('time') || p.includes('created') || 
        p.includes('updated') || p.includes('hour') || p.includes('day')
      );
      if (camposTempo.length > 0) {
        dadosInteressantes.push(`Campos temporais: ${camposTempo.join(', ')}`);
      }
    }
  } else if (typeof data === 'object' && data !== null) {
    const propriedades = Object.keys(data);
    resumo = `Objeto com ${propriedades.length} propriedades: ${propriedades.join(', ')}`;
    
    // Verificar se tem dados aninhados
    const propriedadesComArrays = propriedades.filter(p => Array.isArray(data[p]));
    if (propriedadesComArrays.length > 0) {
      dadosInteressantes.push(`Arrays aninhados: ${propriedadesComArrays.map(p => `${p}(${data[p].length})`).join(', ')}`);
    }
    
    // Verificar valores numéricos interessantes
    const valoresNumericos = propriedades.filter(p => typeof data[p] === 'number' && data[p] > 0);
    if (valoresNumericos.length > 0) {
      dadosInteressantes.push(`Valores numéricos: ${valoresNumericos.map(p => `${p}: ${data[p]}`).join(', ')}`);
    }
  } else {
    resumo = `Tipo: ${tipo}, valor: ${data}`;
  }
  
  return { resumo, dadosInteressantes };
}

// Função para salvar resultados em arquivo
function salvarResultados(resultados, salesPanelInfo) {
  const relatorio = {
    timestamp: new Date().toISOString(),
    salesPanel: salesPanelInfo,
    testes: resultados,
    resumo: {
      total: resultados.length,
      sucessos: resultados.filter(r => r.status === 'sucesso').length,
      erros: resultados.filter(r => r.status === 'erro').length,
      vazios: resultados.filter(r => r.status === 'vazio').length
    }
  };
  
  const nomeArquivo = `teste-yuzer-endpoints-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(nomeArquivo, JSON.stringify(relatorio, null, 2));
  console.log(`\n💾 Resultados salvos em: ${nomeArquivo}`);
  
  return relatorio;
}

// Função principal de teste
async function testarEndpointsDetalhados() {
  console.log('🎯 TESTE DETALHADO DOS ENDPOINTS YUZER\n');
  
  try {
    // 1. Buscar Sales Panels
    const salesPanels = await buscarSalesPanels();
    if (!salesPanels || salesPanels.length === 0) {
      console.log('❌ Nenhum sales panel encontrado. Abortando teste.');
      return;
    }
    
    // 2. Encontrar o sales panel do evento de 27/07/2025
    const salesPanel = encontrarSalesPanelDoEvento(salesPanels);
    if (!salesPanel) {
      console.log('❌ Nenhum sales panel adequado encontrado. Abortando teste.');
      return;
    }
    
    const salesPanelId = salesPanel.id;
    console.log(`\n🎯 Usando Sales Panel ID: ${salesPanelId}`);
    
    // 3. Período para testes (evento de 27/07/2025)
    const dataInicio = new Date('2025-07-27T00:00:00.000Z');
    const dataFim = new Date('2025-07-27T23:59:59.999Z');
    
    const bodyPadrao = {
      from: dataInicio.toISOString(),
      to: dataFim.toISOString()
    };
    
    // 4. Lista de endpoints para testar
    const endpointsParaTestar = [
      // Sales Panel específico
      {
        nome: 'Sales Panel Details',
        endpoint: '/api/salesPanels/{salesPanelId}',
        method: 'GET'
      },
      {
        nome: 'Sales Panel Sales',
        endpoint: '/api/salesPanels/{salesPanelId}/sales',
        method: 'POST',
        body: bodyPadrao
      },
      
      // Dashboards do Sales Panel
      {
        nome: 'Earnings And Sells Hour',
        endpoint: '/api/salesPanels/{salesPanelId}/dashboards/earningsAndSells/hour',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Products Statistics',
        endpoint: '/api/salesPanels/{salesPanelId}/dashboards/products/statistics',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Payments Statistics',
        endpoint: '/api/salesPanels/{salesPanelId}/dashboards/payments/statistics',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Payments Partial Statistics',
        endpoint: '/api/salesPanels/{salesPanelId}/dashboards/payments/partial/statistics',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Operations Statistics',
        endpoint: '/api/salesPanels/{salesPanelId}/dashboards/operations/statistics',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Online Statistics',
        endpoint: '/api/salesPanels/{salesPanelId}/dashboards/online/statistics',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Earnings And Sells Day V2',
        endpoint: '/api/salesPanels/{salesPanelId}/dashboards/earningsAndSells/day/v2',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Categories Statistics',
        endpoint: '/api/salesPanels/{salesPanelId}/dashboards/categories/statistics',
        method: 'POST',
        body: bodyPadrao
      },
      
      // Produtos e Validações
      {
        nome: 'Validated Products By User Search',
        endpoint: '/api/salesPanels/{salesPanelId}/validatedProductsByUser/search',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Validated Products Search',
        endpoint: '/api/salesPanels/{salesPanelId}/validatedProducts/search',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Returned Products Search',
        endpoint: '/api/salesPanels/{salesPanelId}/returnedProducts/search',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Products By Operation Search',
        endpoint: '/api/salesPanels/{salesPanelId}/productsByOperation/search',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Sales Panel Seed',
        endpoint: '/api/salesPanels/{salesPanelId}/seed',
        method: 'POST',
        body: bodyPadrao
      },
      
      // Dashboards Gerais
      {
        nome: 'Subcategories Statistics',
        endpoint: '/api/dashboards/subcategories/statistics',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'General Statistics',
        endpoint: '/api/dashboards/statistics',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Recent Events Search',
        endpoint: '/api/dashboards/recentEvents/search',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Ranking',
        endpoint: '/api/dashboards/ranking',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'QR Codes Statistics',
        endpoint: '/api/dashboards/qrcodes/statistics',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Global Products Statistics',
        endpoint: '/api/dashboards/products/statistics',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Global Payments Statistics',
        endpoint: '/api/dashboards/payments/statistics',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Ongoing Events',
        endpoint: '/api/dashboards/ongoing',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Global Earnings And Sells Day V2',
        endpoint: '/api/dashboards/earningsAndSells/day/v2',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Customers Statistics',
        endpoint: '/api/dashboards/customers/statistics',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Global Categories Statistics',
        endpoint: '/api/dashboards/categories/statistics',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Card Brand Types Statistics',
        endpoint: '/api/dashboards/cardBrandTypes/statistics',
        method: 'POST',
        body: bodyPadrao
      },
      {
        nome: 'Brands Statistics',
        endpoint: '/api/dashboards/brands/statistics',
        method: 'POST',
        body: bodyPadrao
      }
    ];
    
    // 5. Executar testes
    console.log(`\n🧪 Testando ${endpointsParaTestar.length} endpoints...\n`);
    
    const resultados = [];
    
    for (let i = 0; i < endpointsParaTestar.length; i++) {
      const teste = endpointsParaTestar[i];
      console.log(`\n[${i + 1}/${endpointsParaTestar.length}] ==========================================`);
      
      const resultado = await testarEndpoint(
        teste.nome,
        teste.endpoint,
        teste.method,
        teste.body,
        salesPanelId
      );
      
      resultados.push(resultado);
      
      // Pequena pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 6. Salvar resultados e mostrar resumo
    const relatorio = salvarResultados(resultados, {
      id: salesPanel.id,
      nome: salesPanel.name,
      status: salesPanel.status
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 TESTE DETALHADO CONCLUÍDO!');
    console.log(`📊 Total de endpoints testados: ${relatorio.resumo.total}`);
    console.log(`✅ Sucessos: ${relatorio.resumo.sucessos}`);
    console.log(`❌ Erros: ${relatorio.resumo.erros}`);
    console.log(`⚠️ Respostas vazias: ${relatorio.resumo.vazios}`);
    
    // Mostrar endpoints mais promissores
    const endpointsPromissores = resultados.filter(r => 
      r.status === 'sucesso' && 
      r.estrutura && 
      r.estrutura.dadosInteressantes.length > 0
    );
    
    if (endpointsPromissores.length > 0) {
      console.log('\n💡 ENDPOINTS MAIS PROMISSORES:');
      endpointsPromissores.forEach(endpoint => {
        console.log(`   ✨ ${endpoint.nome}`);
        console.log(`      ${endpoint.estrutura.resumo}`);
        endpoint.estrutura.dadosInteressantes.forEach(info => {
          console.log(`      - ${info}`);
        });
      });
    }
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error(error.stack);
  }
}

// Verificar se tem as dependências necessárias
console.log('🔧 Verificando dependências...');

try {
  require('node-fetch');
} catch (error) {
  console.log('⚠️ node-fetch não encontrado, usando fetch nativo (Node 18+)');
  if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
  }
}

// Executar teste
console.log('✅ Dependências OK!');
console.log('🎯 Iniciando teste detalhado em 2 segundos...\n');
setTimeout(testarEndpointsDetalhados, 2000); 