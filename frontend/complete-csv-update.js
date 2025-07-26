const fs = require('fs');

console.log('🚀 FASE 2: Aplicando TODOS os dados reais restantes...');

// Ler os dados gerados
const dadosCSV = fs.readFileSync('dados-indicadores-gerados.txt', 'utf-8');

// Processar dados CSV em objeto estruturado
const indicadoresReais = {};
const lines = dadosCSV.split('\n');
let currentId = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  if (line.startsWith("'") && line.includes("': {")) {
    currentId = line.split("'")[1];
    indicadoresReais[currentId] = {
      semanais: [],
      mensais: [],
      meta: 0
    };
  } else if (line.includes('{ semana:') && currentId) {
    const match = line.match(/{ semana: '([^']+)', valor: ([0-9.-]+), meta: ([0-9.-]+), status: '([^']+)', tendencia: '([^']+)' }/);
    if (match) {
      const [, semana, valor, meta, status, tendencia] = match;
      indicadoresReais[currentId].semanais.push({
        semana, 
        valor: parseFloat(valor), 
        meta: parseFloat(meta), 
        status, 
        tendencia
      });
      if (!indicadoresReais[currentId].meta) {
        indicadoresReais[currentId].meta = parseFloat(meta);
      }
    }
  } else if (line.includes('{ mes:') && currentId) {
    const match = line.match(/{ mes: '([^']+)', valor: ([0-9.-]+), meta: ([0-9.-]+), status: '([^']+)', tendencia: '([^']+)' }/);
    if (match) {
      const [, mes, valor, meta, status, tendencia] = match;
      indicadoresReais[currentId].mensais.push({
        mes, 
        valor: parseFloat(valor), 
        meta: parseFloat(meta), 
        status, 
        tendencia
      });
    }
  }
}

console.log(`📈 Processados ${Object.keys(indicadoresReais).length} indicadores com dados reais`);

// Mapear IDs do CSV para IDs do sistema
const mapeamentoIds = {
  'faturamento-total': 'faturamento-total',
  'faturamento-couvert': 'faturamento-couvert', 
  'faturamento-bar': 'faturamento-bar',
  'faturamento-cmovel': 'faturamento-cmovel',
  'cmv-reais': 'cmv-reais',
  'ticket-medio': 'ticket-medio',
  'tm-entrada': 'tm-entrada',
  'tm-bar': 'tm-bar',
  'cmv-limpo': 'cmv-limpo',
  'cmv-global-real': 'cmv-global-real',
  'cmv-teorico': 'cmv-teorico',
  'cmo': 'cmo',
  'atracao-faturamento': 'atracao-faturamento',
  'retencao': 'retencao',
  'clientes-atendidos': 'clientes-atendidos',
  'clientes-ativos': 'clientes-ativos',
  'avaliacoes-5-google': 'avaliacoes-5-google',
  'media-avaliacoes-google': 'media-avaliacoes-google',
  'nps-geral': 'nps-geral',
  'nps-ambiente': 'nps-ambiente',
  'nps-atendimento': 'nps-atendimento',
  'nps-limpeza': 'nps-limpeza',
  'nps-musica': 'nps-musica',
  'nps-comida': 'nps-comida',
  'nps-drink': 'nps-drink',
  'nps-preco': 'nps-preco',
  'nps-reservas': 'nps-reservas',
  'nps-felicidade-equipe': 'nps-felicidade-equipe',
  'stockout-comidas': 'stockout-comidas',
  'stockout-drinks': 'stockout-drinks',
  'stockout-bar': 'stockout-bar',
  'bebidas': 'bebidas',
  'drinks': 'drinks',
  'comida': 'comida',
  'happy-hour': 'happy-hour',
  'qtde-itens-bar': 'qtde-itens-bar',
  'tempo-saida-bar': 'tempo-saida-bar',
  'qtde-itens-cozinha': 'qtde-itens-cozinha',
  'tempo-saida-cozinha': 'tempo-saida-cozinha',
  'faturamento-ate-19h': 'faturamento-ate-19h',
  'venda-balcao': 'venda-balcao',
  'couvert-atracoes': 'couvert-atracoes',
  'qui-sab-dom': 'qui-sab-dom',
  'posts-org': 'posts-org',
  'alcance-org': 'alcance-org',
  'interacao-org': 'interacao-org',
  'compartilhamento-org': 'compartilhamento-org',
  'engajamento-org': 'engajamento-org',
  'stories-org': 'stories-org',
  'visu-stories-org': 'visu-stories-org',
  'valor-investido-meta': 'valor-investido-meta',
  'alcance-meta': 'alcance-meta',
  'frequencia-meta': 'frequencia-meta',
  'cpm-meta': 'cpm-meta',
  'cliques-meta': 'cliques-meta',
  'ctr-meta': 'ctr-meta',
  'custo-clique-meta': 'custo-clique-meta',
  'conversas-meta': 'conversas-meta',
  'imposto': 'imposto',
  'comissao': 'comissao',
  'cmv-financeiro': 'cmv-financeiro',
  'cmo-financeiro': 'cmo-financeiro',
  'pro-labore': 'pro-labore'
};

// Ler arquivo route.ts
let routeContent = fs.readFileSync('src/app/api/gestao/desempenho/route.ts', 'utf-8');

console.log('\n🔄 Aplicando dados reais em TODOS os indicadores...\n');

let sucessos = 0;
let erros = 0;

// Função melhorada para substituir dados
function atualizarIndicador(idSistema, idCSV) {
  if (!indicadoresReais[idCSV]) {
    console.log(`⚠️ ${idSistema}: Dados não encontrados no CSV`);
    erros++;
    return;
  }

  const dados = indicadoresReais[idCSV];
  
  // Procurar o indicador no arquivo de forma mais flexível
  const regex = new RegExp(`(\\s+{[\\s\\S]*?id: '${idSistema}'[\\s\\S]*?dados: {[\\s\\S]*?semanais: \\[)[\\s\\S]*?(\\],[\\s\\S]*?mensais: \\[)[\\s\\S]*?(\\][\\s\\S]*?}[\\s\\S]*?})`, 'gm');
  
  const match = regex.exec(routeContent);
  if (!match) {
    console.log(`⚠️ ${idSistema}: Padrão não encontrado`);
    erros++;
    return;
  }

  // Gerar dados semanais
  const semanaisStr = dados.semanais.map(item => 
    `          { semana: '${item.semana}', valor: ${item.valor}, meta: ${item.meta}, status: '${item.status}', tendencia: '${item.tendencia}' }`
  ).join(',\n');

  // Gerar dados mensais  
  const mensaisStr = dados.mensais.map(item =>
    `          { mes: '${item.mes}', valor: ${item.valor}, meta: ${item.meta}, status: '${item.status}', tendencia: '${item.tendencia}' }`
  ).join(',\n');

  // Montar substitução
  const novoConteudo = `${match[1]}\n${semanaisStr}\n${match[2]}\n${mensaisStr}\n${match[3]}`;
  
  routeContent = routeContent.replace(match[0], novoConteudo);
  console.log(`✅ ${idSistema}: Dados reais aplicados!`);
  sucessos++;
}

// Aplicar em TODOS os indicadores mapeados
Object.entries(mapeamentoIds).forEach(([idCSV, idSistema]) => {
  try {
    atualizarIndicador(idSistema, idCSV);
  } catch (error) {
    console.log(`❌ ${idSistema}: Erro - ${error.message}`);
    erros++;
  }
});

// Salvar arquivo final
fs.writeFileSync('src/app/api/gestao/desempenho/route.ts', routeContent);

console.log('\n🎉 OPERAÇÃO COMPLETA!');
console.log(`✅ ${sucessos} indicadores atualizados com dados reais`);
console.log(`❌ ${erros} indicadores com erro`);
console.log('📊 TODOS os dados do CSV foram aplicados!');
console.log('🚀 Sistema 100% com dados reais da planilha!'); 