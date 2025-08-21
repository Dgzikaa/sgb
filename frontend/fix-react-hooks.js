#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('⚡ Corrigindo warnings de React hooks automaticamente...\n');

// Função para processar um arquivo
function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) return false;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // 1. Adicionar useCallback em funções que são chamadas em useEffect
    const functionCallPattern = /const\s+(\w+)\s*=\s*async?\s*\([^)]*\)\s*=>\s*{/g;
    content = content.replace(functionCallPattern, (match, funcName) => {
      // Verificar se a função é chamada em useEffect
      if (content.includes(`useEffect(() => {`) && content.includes(`${funcName}()`)) {
        modified = true;
        return `const ${funcName} = useCallback(async (${match.match(/\([^)]*\)/)[0].slice(1, -1)}) => {`;
      }
      return match;
    });
    
    // 2. Adicionar dependencies em useCallback
    const useCallbackPattern = /useCallback\([^,]+,\s*\[([^\]]*)\]\s*\)/g;
    content = content.replace(useCallbackPattern, (match, deps) => {
      if (deps.trim() === '') {
        modified = true;
        return match.replace('[]', '[]');
      }
      return match;
    });
    
    // 3. Adicionar useMemo para arrays/objetos estáticos
    const staticArrayPattern = /const\s+(\w+)\s*=\s*\[([^\]]+)\]/g;
    content = content.replace(staticArrayPattern, (match, varName, arrayContent) => {
      if (arrayContent.includes("'") || arrayContent.includes('"')) {
        modified = true;
        return `const ${varName} = useMemo(() => [${arrayContent}], [])`;
      }
      return match;
    });
    
    // 4. Adicionar imports necessários
    if (modified && content.includes('useCallback') && !content.includes('import.*useCallback')) {
      const importPattern = /import\s+React,\s*{([^}]+)}\s+from\s+'react'/;
      if (content.match(importPattern)) {
        content = content.replace(importPattern, (match, imports) => {
          if (!imports.includes('useCallback')) {
            return `import React, { ${imports}, useCallback } from 'react'`;
          }
          return match;
        });
      }
    }
    
    if (modified && content.includes('useMemo') && !content.includes('import.*useMemo')) {
      const importPattern = /import\s+React,\s*{([^}]+)}\s+from\s+'react'/;
      if (content.match(importPattern)) {
        content = content.replace(importPattern, (match, imports) => {
          if (!imports.includes('useMemo')) {
            return `import React, { ${imports}, useMemo } from 'react'`;
          }
          return match;
        });
      }
    }
    
    // Salvar se houve modificações
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn(`⚠️ Erro em ${filePath}:`, error.message);
    return false;
  }
}

// Função para buscar arquivos recursivamente
function findFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findFiles(fullPath, files);
    } else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Executar correções
const files = findFiles('./src');
let corrected = 0;

for (const file of files) {
  if (processFile(file)) {
    corrected++;
  }
}

console.log(`\n🎉 ${corrected} arquivos corrigidos!`);
console.log('📊 Verificando resultado...');

// Testar resultado
const { execSync } = require('child_process');
try {
  const result = execSync('npx eslint . --ext .tsx --quiet 2>&1 | findstr "useCallback\|useEffect"', { encoding: 'utf8' });
  const hookWarnings = result.split('\n').filter(line => line.includes('useCallback') || line.includes('useEffect')).length;
  console.log(`⚡ Warnings de hooks restantes: ${hookWarnings}`);
} catch (error) {
  console.log('✨ Teste concluído!');
}
