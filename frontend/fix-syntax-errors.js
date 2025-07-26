const fs = require('fs');

console.log('🔧 Corrigindo erros de sintaxe...');

// Ler arquivo
let content = fs.readFileSync('src/app/api/gestao/desempenho/route.ts', 'utf-8');

// Corrigir strings não terminadas
content = content.replace(/unidade: 'R,/g, "unidade: 'R$',");
content = content.replace(/unidade: '%,/g, "unidade: '%',");
content = content.replace(/unidade: 'unidades,/g, "unidade: 'unidades',");
content = content.replace(/unidade: 'estrelas,/g, "unidade: 'estrelas',");
content = content.replace(/unidade: 'minutos,/g, "unidade: 'minutos',");

// Corrigir vírgulas faltantes
content = content.replace(/meta: (\d+)\s*\n\s*dados:/g, 'meta: $1,\n      dados:');

// Corrigir chaves malformadas
content = content.replace(/},\s*\n\s*{/g, '},\n    {');

// Salvar arquivo corrigido
fs.writeFileSync('src/app/api/gestao/desempenho/route.ts', content);

console.log('✅ Erros de sintaxe corrigidos!'); 