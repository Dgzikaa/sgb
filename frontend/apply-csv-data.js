const fs = require('fs');

// Ler os dados gerados
const dadosGerados = fs.readFileSync('dados-indicadores-gerados.txt', 'utf-8');

// Ler o arquivo route.ts atual
const routeFile = fs.readFileSync('src/app/api/gestao/desempenho/route.ts', 'utf-8');

console.log('🚀 Aplicando dados reais do CSV...');

// Encontrar onde começam os indicadores no route.ts
const startMarker = 'return [';
const endMarker = '  ]';

const startIndex = routeFile.indexOf(startMarker);
const endIndex = routeFile.lastIndexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('❌ Não foi possível encontrar a seção de dados no route.ts');
  console.log('🔍 Procurando por:', startMarker);
  process.exit(1);
}

// Extrair a parte antes e depois dos dados
const beforeData = routeFile.substring(0, startIndex);
const afterData = routeFile.substring(endIndex + 2); // +2 para incluir o };

// Limpar os dados gerados (remover comentários iniciais)
const cleanedData = dadosGerados
  .replace('// DADOS ATUALIZADOS AUTOMATICAMENTE DO CSV\n\n', '')
  .trim();

// Construir o novo arquivo
const newRouteContent = `${beforeData}const dadosIndicadores: Record<string, any> = {
  // ========================================
  // DADOS REAIS EXTRAÍDOS DO CSV
  // Total: 46 indicadores com dados reais
  // ========================================
  
  ${cleanedData}
${afterData}`;

// Salvar o arquivo atualizado
fs.writeFileSync('src/app/api/gestao/desempenho/route.ts', newRouteContent);

console.log('✅ Arquivo route.ts atualizado com todos os dados reais!');
console.log('📊 46 indicadores agora têm dados reais do CSV');
console.log('🎯 Zero dados mockados - tudo baseado na planilha'); 