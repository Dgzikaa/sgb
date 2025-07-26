const fs = require('fs');

console.log('🔧 FASE 3: Corrigindo os 33 indicadores restantes...');

// Ler os dados gerados
const dadosCSV = fs.readFileSync('dados-indicadores-gerados.txt', 'utf-8');

// Processar dados CSV
const indicadoresDisponiveis = {};
const lines = dadosCSV.split('\n');
let currentId = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  if (line.startsWith("'") && line.includes("': {")) {
    currentId = line.split("'")[1];
    indicadoresDisponiveis[currentId] = {
      semanais: [],
      mensais: [],
      meta: 0
    };
  } else if (line.includes('{ semana:') && currentId) {
    const match = line.match(/{ semana: '([^']+)', valor: ([0-9.-]+), meta: ([0-9.-]+), status: '([^']+)', tendencia: '([^']+)' }/);
    if (match) {
      const [, semana, valor, meta, status, tendencia] = match;
      indicadoresDisponiveis[currentId].semanais.push({
        semana, 
        valor: parseFloat(valor), 
        meta: parseFloat(meta), 
        status, 
        tendencia
      });
      indicadoresDisponiveis[currentId].meta = parseFloat(meta);
    }
  } else if (line.includes('{ mes:') && currentId) {
    const match = line.match(/{ mes: '([^']+)', valor: ([0-9.-]+), meta: ([0-9.-]+), status: '([^']+)', tendencia: '([^']+)' }/);
    if (match) {
      const [, mes, valor, meta, status, tendencia] = match;
      indicadoresDisponiveis[currentId].mensais.push({
        mes, 
        valor: parseFloat(valor), 
        meta: parseFloat(meta), 
        status, 
        tendencia
      });
    }
  }
}

console.log(`📊 ${Object.keys(indicadoresDisponiveis).length} indicadores disponíveis no CSV`);

// Mapear APENAS os indicadores que realmente existem no CSV
const mapeamentoRestantes = {
  // GUARDRAIL que ainda não foram aplicados
  'faturamento-cmovel': 'faturamento-cmovel',
  'cmv-reais': 'cmv-reais', 
  'tm-entrada': 'tm-entrada',
  'tm-bar': 'tm-bar',
  'cmv-limpo': 'cmv-limpo',
  'cmv-global-real': 'cmv-global-real', 
  'cmv-teorico': 'cmv-teorico',
  'cmo': 'cmo',
  'atracao-faturamento': 'atracao-faturamento',
  
  // OVT
  'clientes-ativos': 'clientes-ativos',
  'reservas-totais': 'reservas-totais',
  'reservas-presentes': 'reservas-presentes',
  
  // QUALIDADE
  'avaliacoes-5-google': 'avaliacoes-5-google',
  'media-avaliacoes-google': 'media-avaliacoes-google',
  'nps-geral': 'nps-geral',
  'nps-ambiente': 'nps-ambiente',
  'nps-comida': 'nps-comida',
  'nps-drink': 'nps-drink',
  
  // FINANCEIRO
  'imposto': 'imposto',
  'comissao': 'comissao',
  'cmv-financeiro': 'cmv',
  'cmo-financeiro': 'cmo',
  'pro-labore': 'pro-labore'
};

// Ler arquivo route.ts
let routeContent = fs.readFileSync('src/app/api/gestao/desempenho/route.ts', 'utf-8');

console.log('\n🔄 Aplicando correções nos indicadores restantes...\n');

let sucessos = 0;
let erros = 0;

// Função de atualização mais robusta
function atualizarIndicadorSeguro(idSistema, idCSV) {
  if (!indicadoresDisponiveis[idCSV]) {
    console.log(`⚠️ ${idSistema}: Dados não disponíveis no CSV`);
    return;
  }

  const dados = indicadoresDisponiveis[idCSV];
  
  try {
    // Buscar de forma mais precisa o indicador específico
    const pattern = `id: '${idSistema}'`;
    const startPos = routeContent.indexOf(pattern);
    
    if (startPos === -1) {
      console.log(`⚠️ ${idSistema}: ID não encontrado no arquivo`);
      erros++;
      return;
    }
    
    // Encontrar a seção de dados deste indicador específico
    const dadosStart = routeContent.indexOf('dados: {', startPos);
    const semanaisStart = routeContent.indexOf('semanais: [', dadosStart);
    const semanaisEnd = routeContent.indexOf('],', semanaisStart);
    const mensaisStart = routeContent.indexOf('mensais: [', semanaisEnd);
    const mensaisEnd = routeContent.indexOf(']', mensaisStart);
    
    if (dadosStart === -1 || semanaisStart === -1 || mensaisStart === -1) {
      console.log(`⚠️ ${idSistema}: Estrutura de dados não encontrada`);
      erros++;
      return;
    }
    
    // Gerar novos dados semanais
    const semanaisStr = dados.semanais.map(item => 
      `          { semana: '${item.semana}', valor: ${item.valor}, meta: ${item.meta}, status: '${item.status}', tendencia: '${item.tendencia}' }`
    ).join(',\n');

    // Gerar novos dados mensais
    const mensaisStr = dados.mensais.map(item =>
      `          { mes: '${item.mes}', valor: ${item.valor}, meta: ${item.meta}, status: '${item.status}', tendencia: '${item.tendencia}' }`
    ).join(',\n');

    // Substituir dados semanais
    const beforeSemanais = routeContent.substring(0, semanaisStart + 11); // 11 = length of 'semanais: ['
    const afterSemanais = routeContent.substring(semanaisEnd);
    
    routeContent = beforeSemanais + '\n' + semanaisStr + '\n        ' + afterSemanais;
    
    // Recalcular posições após primeira substituição
    const newMensaisStart = routeContent.indexOf('mensais: [', dadosStart);
    const newMensaisEnd = routeContent.indexOf(']', newMensaisStart);
    
    // Substituir dados mensais
    const beforeMensais = routeContent.substring(0, newMensaisStart + 10); // 10 = length of 'mensais: ['
    const afterMensais = routeContent.substring(newMensaisEnd);
    
    routeContent = beforeMensais + '\n' + mensaisStr + '\n        ' + afterMensais;
    
    console.log(`✅ ${idSistema}: Dados reais aplicados com sucesso!`);
    sucessos++;
    
  } catch (error) {
    console.log(`❌ ${idSistema}: Erro - ${error.message}`);
    erros++;
  }
}

// Aplicar correções nos indicadores restantes
Object.entries(mapeamentoRestantes).forEach(([idSistema, idCSV]) => {
  atualizarIndicadorSeguro(idSistema, idCSV);
});

// Salvar arquivo final
fs.writeFileSync('src/app/api/gestao/desempenho/route.ts', routeContent);

console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
console.log(`✅ ${sucessos} indicadores corrigidos com dados reais`);
console.log(`❌ ${erros} indicadores ainda com problemas`);
console.log('📊 Máximo possível de dados reais aplicados!');
console.log('🚀 Sistema com todos os dados disponíveis do CSV!'); 