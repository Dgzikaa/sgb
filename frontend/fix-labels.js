#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🏷️ Corrigindo labels automaticamente...\n');

// Função para gerar ID único baseado no conteúdo do label
function generateId(labelText) {
  return labelText
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 30) + '-input';
}

// Função para processar um arquivo
function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) return false;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Padrão: <label>texto</label> seguido de <Input
    // Captura o texto do label e adiciona htmlFor + id no input
    const labelInputPattern = /<label(\s[^>]*?)>([^<]+)<\/label>\s*<(Input|Textarea)([^>]*?)>/g;
    
    content = content.replace(labelInputPattern, (match, labelAttrs, labelText, inputType, inputAttrs) => {
      // Gerar ID baseado no texto do label
      const id = generateId(labelText);
      
      // Adicionar htmlFor ao label se não existir
      let newLabelAttrs = labelAttrs;
      if (!newLabelAttrs.includes('htmlFor')) {
        newLabelAttrs = ` htmlFor="${id}"${labelAttrs}`;
      }
      
      // Adicionar id ao input se não existir
      let newInputAttrs = inputAttrs;
      if (!newInputAttrs.includes(' id=')) {
        newInputAttrs = `\n                      id="${id}"${inputAttrs}`;
      }
      
      modified = true;
      return `<label${newLabelAttrs}>${labelText}</label>
                    <${inputType}${newInputAttrs}>`;
    });
    
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
  const result = execSync('npx eslint . --ext .tsx --quiet 2>&1 | findstr "label"', { encoding: 'utf8' });
  const labelWarnings = result.split('\n').filter(line => line.includes('label')).length;
  console.log(`🏷️ Labels restantes: ${labelWarnings}`);
} catch (error) {
  console.log('✨ Teste concluído!');
}
