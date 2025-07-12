#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo estrutura de páginas automaticamente...');

const srcPath = path.join(__dirname, '..', 'src', 'app');

// Função para mover arquivos
function moveFile(source, destination) {
  try {
    // Criar diretório de destino se não existir
    const destDir = path.dirname(destination);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Mover arquivo
    fs.renameSync(source, destination);
    console.log(`✅ Movido: ${source} → ${destination}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao mover ${source}:`, error.message);
    return false;
  }
}

// Função para encontrar arquivos page.tsx fora da estrutura
function findIncorrectPages(dir, incorrectPages = []) {
  if (!fs.existsSync(dir)) return incorrectPages;
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Pular pastas que estão corretas
      if (item === 'api' || item === 'paginas' || item === 'components') {
        continue;
      }
      
      // Procurar recursivamente
      findIncorrectPages(fullPath, incorrectPages);
    } else if (item === 'page.tsx') {
      // Verificar se está fora da estrutura correta
      const relativePath = path.relative(srcPath, fullPath);
      if (!relativePath.startsWith('paginas/')) {
        incorrectPages.push(fullPath);
      }
    }
  }
  
  return incorrectPages;
}

// Encontrar páginas incorretas
const incorrectPages = findIncorrectPages(srcPath);

if (incorrectPages.length === 0) {
  console.log('✅ Todas as páginas estão na estrutura correta!');
  process.exit(0);
}

console.log(`📋 Encontradas ${incorrectPages.length} páginas fora da estrutura:`);
incorrectPages.forEach(page => {
  console.log(`  - ${path.relative(srcPath, page)}`);
});

// Sugerir correções automáticas
console.log('\n🔄 Aplicando correções automáticas...');

let fixedCount = 0;

for (const pagePath of incorrectPages) {
  const relativePath = path.relative(srcPath, pagePath);
  const dirName = path.dirname(relativePath);
  
  let newPath;
  
  // Determinar onde mover baseado no nome da pasta
  if (dirName.includes('admin') || dirName.includes('config')) {
    newPath = path.join(srcPath, 'paginas', 'configuracoes', path.basename(dirName), 'page.tsx');
  } else if (dirName.includes('relatorio')) {
    newPath = path.join(srcPath, 'paginas', 'relatorios', path.basename(dirName), 'page.tsx');
  } else if (dirName.includes('operacao')) {
    newPath = path.join(srcPath, 'paginas', 'operacoes', path.basename(dirName), 'page.tsx');
  } else if (dirName.includes('funcionario')) {
    newPath = path.join(srcPath, 'paginas', 'funcionario', path.basename(dirName), 'page.tsx');
  } else {
    // Mover para configurações por padrão
    newPath = path.join(srcPath, 'paginas', 'configuracoes', path.basename(dirName), 'page.tsx');
  }
  
  if (moveFile(pagePath, newPath)) {
    fixedCount++;
  }
}

console.log(`\n✅ Correções aplicadas: ${fixedCount}/${incorrectPages.length}`);

if (fixedCount > 0) {
  console.log('\n⚠️  IMPORTANTE: Verifique se as páginas movidas estão nos locais corretos!');
  console.log('   Você pode precisar ajustar manualmente algumas rotas.');
}

console.log(''); 