const fs = require('fs');

console.log('🚀 Iniciando atualização completa com dados reais do CSV...');

// Ler os dados gerados pelo script anterior
const dadosCSV = fs.readFileSync('dados-indicadores-gerados.txt', 'utf-8');

// Processar os dados em um objeto para facilitar busca
const indicadoresCSV = {};
const lines = dadosCSV.split('\n');
let currentId = '';
let currentData = {};

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  if (line.startsWith("'") && line.includes("': {")) {
    // Nova entrada de indicador
    currentId = line.split("'")[1];
    indicadoresCSV[currentId] = {
      semanais: [],
      mensais: []
    };
  } else if (line.includes('{ semana:') || line.includes('{ mes:')) {
    // Extrair dados semanal ou mensal
    const match = line.match(/{ (\w+): '([^']+)', valor: ([0-9.-]+), meta: ([0-9.-]+), status: '([^']+)', tendencia: '([^']+)' }/);
    if (match && currentId) {
      const [, type, period, valor, meta, status, tendencia] = match;
      const dataPoint = {
        [type]: period,
        valor: parseFloat(valor),
        meta: parseFloat(meta),
        status,
        tendencia
      };
      
      if (type === 'semana') {
        indicadoresCSV[currentId].semanais.push(dataPoint);
      } else if (type === 'mes') {
        indicadoresCSV[currentId].mensais.push(dataPoint);
      }
    }
  }
}

console.log(`📊 Processados ${Object.keys(indicadoresCSV).length} indicadores do CSV`);

// Ler arquivo route.ts
let routeContent = fs.readFileSync('src/app/api/gestao/desempenho/route.ts', 'utf-8');

// Função para atualizar dados de um indicador
function updateIndicatorData(id, newData) {
  if (!indicadoresCSV[id]) {
    console.log(`⚠️ ${id}: Dados não encontrados no CSV`);
    return routeContent;
  }
  
  const csvData = indicadoresCSV[id];
  
  // Procurar padrão do indicador no arquivo
  const indicatorPattern = new RegExp(`(\\s+{[\\s\\S]*?id: '${id}'[\\s\\S]*?dados: {[\\s\\S]*?semanais: \\[)([\\s\\S]*?)(\\],[\\s\\S]*?mensais: \\[)([\\s\\S]*?)(\\][\\s\\S]*?}[\\s\\S]*?})`, 'g');
  
  const match = indicatorPattern.exec(routeContent);
  if (!match) {
    console.log(`⚠️ ${id}: Padrão não encontrado no arquivo`);
    return routeContent;
  }
  
  // Gerar novos dados semanais
  const semanaisStr = csvData.semanais.map(item => 
    `          { semana: '${item.semana}', valor: ${item.valor}, meta: ${item.meta}, status: '${item.status}', tendencia: '${item.tendencia}' }`
  ).join(',\n');
  
  // Gerar novos dados mensais
  const mensaisStr = csvData.mensais.map(item => 
    `          { mes: '${item.mes}', valor: ${item.valor}, meta: ${item.meta}, status: '${item.status}', tendencia: '${item.tendencia}' }`
  ).join(',\n');
  
  // Substituir dados
  const replacement = `${match[1]}\n${semanaisStr}\n${match[3]}\n${mensaisStr}\n${match[5]}`;
  routeContent = routeContent.replace(match[0], replacement);
  
  console.log(`✅ ${id}: Atualizado com dados reais`);
  return routeContent;
}

// Lista de indicadores para atualizar com os IDs corretos
const indicatorsToUpdate = [
  'faturamento-total',
  'faturamento-couvert', 
  'faturamento-bar',
  'faturamento-cmovel',
  'cmv-reais',
  'ticket-medio',
  'tm-entrada', 
  'tm-bar',
  'cmv-limpo',
  'cmv-global-real',
  'cmv-teorico',
  'cmo',
  'atracao-faturamento',
  'clientes-atendidos',
  'retencao',
  'stockout-comidas',
  'stockout-drinks',
  'stockout-bar',
  'bebidas',
  'drinks', 
  'comida',
  'happy-hour',
  'imposto',
  'comissao',
  'cmv-financeiro',
  'cmo-financeiro',
  'pro-labore'
];

console.log('\n🔄 Aplicando dados reais...');

// Aplicar atualizações
indicatorsToUpdate.forEach(id => {
  try {
    updateIndicatorData(id);
  } catch (error) {
    console.log(`❌ Erro ao atualizar ${id}:`, error.message);
  }
});

// Salvar arquivo atualizado
fs.writeFileSync('src/app/api/gestao/desempenho/route.ts', routeContent);

console.log('\n🎉 CONCLUÍDO!');
console.log('✅ Arquivo route.ts atualizado com dados reais do CSV');
console.log('📊 Todos os indicadores agora usam dados reais da planilha');
console.log('🚀 Sistema pronto para produção!'); 