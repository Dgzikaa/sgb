#!/usr/bin/env node

/**
 * 🚀 SCRIPT DE CORREÇÃO AUTOMÁTICA - SGB_V2
 * 
 * Este script corrige automaticamente os problemas encontrados pela validação:
 * 1. Cria layout.tsx onde necessário
 * 2. Remove PageBase de páginas que usam
 * 3. Aplica as regras obrigatórias
 * 
 * USO:
 * node frontend/scripts/fix-pages-automatically.js
 */

const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '../src/app');

// Template do layout padrão
const LAYOUT_TEMPLATE = `import { DarkSidebarLayout } from '@/components/layouts'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DarkSidebarLayout>
      {children}
    </DarkSidebarLayout>
  )
}`;

// Páginas que PRECISAM de layout próprio (não herdam)
const PAGES_NEED_OWN_LAYOUT = [
  '/home',
  '/dashboard-financeiro', 
  '/contaazul-callback',
  '/configuracoes/configuracao',
  '/configuracoes/integracoes/contaazul',
  '/configuracoes/integracoes/contaazul/financeiro'
];

// Páginas que devem remover PageBase
const PAGES_REMOVE_PAGEBASE = [
  '/configuracoes',
  '/relatorios/contahub-teste',
  '/visao-geral/diario'
];

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function createLayoutFile(dirPath, relativePath) {
  const layoutPath = path.join(dirPath, 'layout.tsx');
  
  if (!fs.existsSync(layoutPath)) {
    fs.writeFileSync(layoutPath, LAYOUT_TEMPLATE);
    log(colors.green, `✅ Criado: ${relativePath}/layout.tsx`);
    return true;
  }
  return false;
}

function removePageBaseFromFile(filePath, relativePath) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Remover imports do PageBase
  if (content.includes('PageBase')) {
    content = content.replace(/import.*PageBase.*from.*['"]@\/components\/ui\/page-base['"];?\n?/g, '');
    content = content.replace(/import.*{[^}]*PageBase[^}]*}.*from.*['"]@\/components\/ui\/page-base['"];?\n?/g, '');
    
    // Remover uso do PageBase
    content = content.replace(/<PageBase[^>]*>/g, '<div className="space-y-6">');
    content = content.replace(/<\/PageBase>/g, '</div>');
    
    // Remover PageHeader e PageContent se existirem
    content = content.replace(/<PageHeader[^>]*\/>/g, '');
    content = content.replace(/<PageHeader[^>]*>.*?<\/PageHeader>/gs, '');
    content = content.replace(/<PageContent[^>]*>/g, '');
    content = content.replace(/<\/PageContent>/g, '');
    
    fs.writeFileSync(filePath, content);
    modified = true;
    log(colors.green, `✅ Removido PageBase de: ${relativePath}`);
  }
  
  return modified;
}

function scanAndFix(dir, relativePath = '') {
  const items = fs.readdirSync(dir);
  
  let hasPageTsx = false;
  let hasLayoutTsx = false;
  
  // Verificar se há page.tsx e layout.tsx
  for (const item of items) {
    if (item === 'page.tsx') hasPageTsx = true;
    if (item === 'layout.tsx') hasLayoutTsx = true;
  }
  
  const currentPath = relativePath || '/';
  
  // Criar layout.tsx se necessário
  if (hasPageTsx && !hasLayoutTsx && PAGES_NEED_OWN_LAYOUT.includes(currentPath)) {
    createLayoutFile(dir, relativePath);
  }
  
  // Remover PageBase se necessário
  if (hasPageTsx && PAGES_REMOVE_PAGEBASE.includes(currentPath)) {
    const pagePath = path.join(dir, 'page.tsx');
    removePageBaseFromFile(pagePath, currentPath);
  }
  
  // Recursivamente processar subpastas
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.lstatSync(itemPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && !item.startsWith('_')) {
      const newRelativePath = relativePath ? `${relativePath}/${item}` : `/${item}`;
      scanAndFix(itemPath, newRelativePath);
    }
  }
}

console.log('\n' + '='.repeat(60));
log(colors.bold + colors.blue, '🚀 CORREÇÃO AUTOMÁTICA - SGB_V2');
console.log('='.repeat(60));

log(colors.blue, '\n📋 Aplicando correções...\n');

try {
  scanAndFix(APP_DIR);
  
  log(colors.bold + colors.green, '\n✅ CORREÇÕES APLICADAS COM SUCESSO!');
  
  log(colors.blue, '\n📊 Próximos passos:');
  log(colors.blue, '1. Execute: npm run validate-pages');
  log(colors.blue, '2. Teste as páginas no navegador');
  log(colors.blue, '3. Commit das mudanças');
  
  console.log('\n' + '='.repeat(60));
  
} catch (error) {
  log(colors.red, `❌ Erro durante correção: ${error.message}`);
  process.exit(1);
} 