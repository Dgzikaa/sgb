const fs = require('fs');
const path = require('path');

// Função para limpar valores monetários e percentuais
function parseValue(value) {
  if (!value || value === '-' || value === '' || value === '#DIV/0!' || value === '#ERROR!') {
    return 0;
  }
  
  // Remove aspas, espaços, R$, %, parênteses
  let cleaned = value.toString()
    .replace(/["\s]/g, '')
    .replace(/R\$/, '')
    .replace(/%/, '')
    .replace(/[\(\)]/g, '')
    .replace(/,/g, '.');
  
  // Converte para número
  let num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Função para determinar categoria do indicador
function determineCategory(rowIndex, indicatorName) {
  if (rowIndex >= 6 && rowIndex <= 20) return 'guardrail';
  if (rowIndex >= 21 && rowIndex <= 25) return 'ovt';
  if (rowIndex >= 47 && rowIndex <= 58) return 'qualidade';
  if (rowIndex >= 60 && rowIndex <= 71) return 'produtos';
  if (rowIndex >= 73 && rowIndex <= 77) return 'vendas';
  if (rowIndex >= 79 && rowIndex <= 95) return 'marketing';
  
  // Backup por nome
  const name = indicatorName.toLowerCase();
  if (name.includes('faturamento') || name.includes('cmv') || name.includes('ticket') || name.includes('tm ')) return 'guardrail';
  if (name.includes('retenção') || name.includes('cliente') || name.includes('reserva')) return 'ovt';
  if (name.includes('nps') || name.includes('avaliação') || name.includes('google') || name.includes('felicidade')) return 'qualidade';
  if (name.includes('stockout') || name.includes('bebidas') || name.includes('drinks') || name.includes('comida') || name.includes('tempo') || name.includes('qtde')) return 'produtos';
  if (name.includes('faturamento até') || name.includes('venda balcão') || name.includes('couvert') || name.includes('qui+sáb+dom')) return 'vendas';
  if (name.includes('[o]') || name.includes('[m]') || name.includes('posts') || name.includes('alcance') || name.includes('engajamento')) return 'marketing';
  
  return 'guardrail';
}

// Lê o CSV
const csvPath = path.join(__dirname, '..', 'Planilha Estratégica Ordinário - Tab Desemp ContaHub.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n');

console.log('🚀 Iniciando extração completa de indicadores...');

// Headers das semanas (linha 3, colunas 3-28)
const weekHeaders = lines[2].split(',').slice(3, 29);
console.log(`📅 Semanas encontradas: ${weekHeaders.length} (${weekHeaders[0]} até ${weekHeaders[weekHeaders.length-1]})`);

// Headers dos meses (linha 4, colunas 30-35)
const monthHeaders = lines[3].split(',').slice(30, 36);
console.log(`📅 Meses encontrados: ${monthHeaders.length} (${monthHeaders.join(', ')})`);

// Todos os indicadores mapeados
const COMPLETE_INDICATORS = {
  // ===== GUARDRAIL =====
  'faturamento-total': {
    nome: 'Faturamento Total',
    meta: 930000,
    unidade: 'R$',
    rowIndex: 6
  },
  'faturamento-couvert': {
    nome: 'Faturamento Couvert', 
    meta: 160000,
    unidade: 'R$',
    rowIndex: 7
  },
  'faturamento-bar': {
    nome: 'Faturamento Bar',
    meta: 690000,
    unidade: 'R$',
    rowIndex: 8
  },
  'faturamento-cmovel': {
    nome: 'Faturamento CMvível',
    meta: null,
    unidade: 'R$',
    rowIndex: 9
  },
  'cmv-rs': {
    nome: 'CMV R$',
    meta: null,
    unidade: 'R$',
    rowIndex: 10
  },
  'ticket-medio-contahub': {
    nome: 'Ticket Médio ContaHub',
    meta: 93,
    unidade: 'R$',
    rowIndex: 11
  },
  'tm-entrada': {
    nome: 'TM Entrada',
    meta: 15.50,
    unidade: 'R$',
    rowIndex: 12
  },
  'tm-bar': {
    nome: 'TM Bar',
    meta: 77.50,
    unidade: 'R$',
    rowIndex: 13
  },
  'cmv-limpo-percent': {
    nome: 'CMV Limpo %',
    meta: 31,
    unidade: '%',
    rowIndex: 14
  },
  'cmv-global-real': {
    nome: 'CMV Global Real',
    meta: 27,
    unidade: '%',
    rowIndex: 15
  },
  'cmv-teorico': {
    nome: 'CMV Teórico',
    meta: 27,
    unidade: '%',
    rowIndex: 16
  },
  'cmo-percent': {
    nome: 'CMO%',
    meta: 23,
    unidade: '%',
    rowIndex: 17
  },
  'atracao-faturamento': {
    nome: 'Atração/Faturamento',
    meta: 17,
    unidade: '%',
    rowIndex: 18
  },

  // ===== OVT =====
  'retencao': {
    nome: 'Retenção',
    meta: null,
    unidade: '',
    rowIndex: 19
  },
  'clientes-atendidos': {
    nome: 'Clientes Atendidos',
    meta: 10000,
    unidade: '',
    rowIndex: 20
  },
  'clientes-ativos': {
    nome: 'Clientes Ativos',
    meta: 3000,
    unidade: '',
    rowIndex: 21
  },
  'reservas-totais': {
    nome: 'Reservas Totais',
    meta: 800,
    unidade: '',
    rowIndex: 22
  },
  'reservas-presentes': {
    nome: 'Reservas Presentes',
    meta: 650,
    unidade: '',
    rowIndex: 23
  },

  // ===== QUALIDADE =====
  'avaliacoes-5-google-trip': {
    nome: 'Avaliações 5 Google/Trip',
    meta: 300,
    unidade: '',
    rowIndex: 47
  },
  'media-avaliacoes-google': {
    nome: 'Média Avaliações Google',
    meta: 4.8,
    unidade: '',
    rowIndex: 48
  },
  'nps-geral': {
    nome: 'NPS Geral',
    meta: 70,
    unidade: '',
    rowIndex: 49
  },
  'nps-ambiente': {
    nome: 'NPS Ambiente',
    meta: 70,
    unidade: '',
    rowIndex: 50
  },
  'nps-atendimento': {
    nome: 'NPS Atendimento',
    meta: 70,
    unidade: '',
    rowIndex: 51
  },
  'nps-limpeza': {
    nome: 'NPS Limpeza',
    meta: 70,
    unidade: '',
    rowIndex: 52
  },
  'nps-musica': {
    nome: 'NPS Música',
    meta: 70,
    unidade: '',
    rowIndex: 53
  },
  'nps-comida': {
    nome: 'NPS Comida',
    meta: 70,
    unidade: '',
    rowIndex: 54
  },
  'nps-drink': {
    nome: 'NPS Drink',
    meta: 70,
    unidade: '',
    rowIndex: 55
  },
  'nps-preco': {
    nome: 'NPS Preço',
    meta: 70,
    unidade: '',
    rowIndex: 56
  },
  'nps-reservas': {
    nome: 'NPS Reservas',
    meta: 70,
    unidade: '',
    rowIndex: 57
  },
  'nps-felicidade-equipe': {
    nome: 'NPS Felicidade Equipe',
    meta: 60,
    unidade: '',
    rowIndex: 58
  },

  // ===== PRODUTOS =====
  'stockout-comidas': {
    nome: 'StockOut Comidas',
    meta: 3,
    unidade: '%',
    rowIndex: 60
  },
  'stockout-drinks': {
    nome: 'StockOut Drinks',
    meta: 3,
    unidade: '%',
    rowIndex: 61
  },
  'stockout-bar': {
    nome: 'Stockout Bar',
    meta: 1,
    unidade: '%',
    rowIndex: 62
  },
  'percent-bebidas': {
    nome: '% BEBIDAS',
    meta: null,
    unidade: '%',
    rowIndex: 63
  },
  'percent-drinks': {
    nome: '% DRINKS',
    meta: null,
    unidade: '%',
    rowIndex: 64
  },
  'percent-comida': {
    nome: '% COMIDA',
    meta: null,
    unidade: '%',
    rowIndex: 65
  },
  'percent-happyhour': {
    nome: '% HappyHour',
    meta: null,
    unidade: '%',
    rowIndex: 66
  },
  'qtde-itens-bar': {
    nome: 'Qtde Itens Bar',
    meta: null,
    unidade: '',
    rowIndex: 67
  },
  'tempo-saida-bar': {
    nome: 'Tempo Saída Bar',
    meta: 4,
    unidade: '',
    rowIndex: 68
  },
  'qtde-itens-cozinha': {
    nome: 'Qtde Itens Cozinha',
    meta: null,
    unidade: '',
    rowIndex: 69
  },
  'tempo-saida-cozinha': {
    nome: 'Tempo Saída Cozinha',
    meta: 12,
    unidade: '',
    rowIndex: 70
  },

  // ===== VENDAS =====
  'percent-faturamento-ate-19h': {
    nome: '% Faturamento até 19h',
    meta: 15,
    unidade: '%',
    rowIndex: 73
  },
  'venda-balcao': {
    nome: 'Venda Balcão',
    meta: null,
    unidade: 'R$',
    rowIndex: 74
  },
  'couvert-atracoes': {
    nome: 'Couvert / Atrações',
    meta: 112,
    unidade: '%',
    rowIndex: 75
  },
  'qui-sab-dom': {
    nome: 'QUI+SÁB+DOM',
    meta: 141000,
    unidade: 'R$',
    rowIndex: 76
  },

  // ===== MARKETING =====
  'o-num-posts': {
    nome: '[O] Nº de Posts',
    meta: null,
    unidade: '',
    rowIndex: 79
  },
  'o-alcance': {
    nome: '[O] Alcance',
    meta: null,
    unidade: '',
    rowIndex: 80
  },
  'o-interacao': {
    nome: '[O] Interação',
    meta: null,
    unidade: '',
    rowIndex: 81
  },
  'o-compartilhamento': {
    nome: '[O] Compartilhamento',
    meta: null,
    unidade: '',
    rowIndex: 82
  },
  'o-engajamento': {
    nome: '[O] Engajamento',
    meta: null,
    unidade: '%',
    rowIndex: 83
  },
  'o-num-stories': {
    nome: '[O] Nº Stories',
    meta: null,
    unidade: '',
    rowIndex: 84
  },
  'o-visu-stories': {
    nome: '[O] Visu Stories',
    meta: null,
    unidade: '',
    rowIndex: 85
  },
  'm-valor-investido': {
    nome: '[M] Valor Investido',
    meta: null,
    unidade: 'R$',
    rowIndex: 87
  },
  'm-alcance': {
    nome: '[M] Alcance',
    meta: null,
    unidade: '',
    rowIndex: 88
  },
  'm-frequencia': {
    nome: '[M] Frequencia',
    meta: null,
    unidade: '',
    rowIndex: 89
  },
  'm-cpm': {
    nome: '[M] CPM (Custo por Visu)',
    meta: null,
    unidade: 'R$',
    rowIndex: 90
  },
  'm-cliques': {
    nome: '[M] Cliques',
    meta: null,
    unidade: '',
    rowIndex: 91
  },
  'm-ctr': {
    nome: '[M] CTR (Taxa de Clique)',
    meta: null,
    unidade: '%',
    rowIndex: 92
  },
  'm-custo-clique': {
    nome: '[M] Custo por Clique',
    meta: null,
    unidade: 'R$',
    rowIndex: 93
  },
  'm-conversas-iniciadas': {
    nome: '[M] Conversas Iniciadas',
    meta: null,
    unidade: '',
    rowIndex: 94
  }
};

// Extrai dados do CSV
console.log('📊 Extraindo dados reais do CSV...');

const indicators = [];

Object.entries(COMPLETE_INDICATORS).forEach(([id, indicator]) => {
  const { nome, meta, unidade, rowIndex } = indicator;
  const category = determineCategory(rowIndex, nome);
  
  console.log(`📋 Processando: ${nome} (${category})`);
  
  // Busca a linha no CSV
  const csvRow = lines[rowIndex];
  if (!csvRow) {
    console.log(`⚠️  Linha ${rowIndex} não encontrada para ${nome}`);
    return;
  }
  
  const columns = csvRow.split(',');
  
  // Dados semanais (colunas 3-28 = Semana 05-29)
  const semanais = [];
  for (let i = 0; i < weekHeaders.length; i++) {
    const semana = weekHeaders[i];
    const valor = parseValue(columns[3 + i]);
    
    semanais.push({
      periodo: semana,
      valor: valor,
      status: meta ? (valor >= meta ? 'acima' : valor >= meta * 0.9 ? 'proximo' : 'abaixo') : 'neutro',
      tendencia: 'estavel'
    });
  }
  
  // Inverter ordem das semanas (mais recentes primeiro)
  semanais.reverse();
  
  // Dados mensais (colunas 30-35 = Fevereiro-Julho)
  const mensais = [];
  for (let i = 0; i < monthHeaders.length; i++) {
    const mes = monthHeaders[i];
    const valor = parseValue(columns[30 + i]);
    
    mensais.push({
      periodo: mes,
      valor: valor,
      status: meta ? (valor >= meta ? 'acima' : valor >= meta * 0.9 ? 'proximo' : 'abaixo') : 'neutro',
      tendencia: 'estavel'
    });
  }
  
  // Inverter ordem dos meses (mais recentes primeiro)
  mensais.reverse();
  
  // Adiciona o indicador
  indicators.push({
    id: id,
    categoria: category,
    nome: nome,
    descricao: `Indicador de ${nome}`,
    unidade: unidade,
    meta: meta,
    dados: {
      semanais: semanais,
      mensais: mensais
    }
  });
  
  console.log(`✅ ${nome}: ${semanais.length} semanas, ${mensais.length} meses`);
});

console.log(`🎯 Total de indicadores processados: ${indicators.length}`);

// Gera o código TypeScript
const generatedCode = `function gerarDadosMockados(): IndicadorDesempenho[] {
  return ${JSON.stringify(indicators, null, 2)};
}`;

// Lê o arquivo route.ts atual
const routePath = path.join(__dirname, 'src', 'app', 'api', 'gestao', 'desempenho', 'route.ts');
let routeContent = fs.readFileSync(routePath, 'utf-8');

// Encontra a função gerarDadosMockados e substitui
const functionStart = routeContent.indexOf('function gerarDadosMockados()');
const functionEnd = routeContent.indexOf('\n}', functionStart) + 2;

if (functionStart === -1) {
  console.error('❌ Função gerarDadosMockados não encontrada!');
  process.exit(1);
}

// Substitui a função
const newContent = routeContent.substring(0, functionStart) + 
                  generatedCode + 
                  routeContent.substring(functionEnd);

// Salva o arquivo
fs.writeFileSync(routePath, newContent, 'utf-8');

console.log('🚀 TODOS OS INDICADORES APLICADOS COM SUCESSO!');
console.log('');
console.log('📊 RESUMO FINAL:');
console.log(`📈 Total de indicadores: ${indicators.length}`);
console.log(`📅 Semanas: ${weekHeaders[weekHeaders.length-1]} → ${weekHeaders[0]} (${weekHeaders.length} semanas)`);
console.log(`📅 Meses: ${monthHeaders[monthHeaders.length-1]} → ${monthHeaders[0]} (${monthHeaders.length} meses)`);
console.log('');

// Conta por categoria
const categoryCounts = indicators.reduce((acc, ind) => {
  acc[ind.categoria] = (acc[ind.categoria] || 0) + 1;
  return acc;
}, {});

console.log('📋 INDICADORES POR CATEGORIA:');
Object.entries(categoryCounts).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count} indicadores`);
});

console.log('');
console.log('✅ PRONTO! Executar: npx next build'); 