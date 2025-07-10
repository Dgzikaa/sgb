#!/usr/bin/env node

/**
 * 🚨 SCRIPT DE VALIDAÇÃO AUTOMÁTICA - SGB_V2
 * 
 * Este script verifica se todas as páginas seguem as regras obrigatórias:
 * 1. Toda pasta com page.tsx deve ter layout.tsx OU herdar de pasta pai
 * 2. Layout deve usar DarkSidebarLayout
 * 3. Páginas devem usar Card components
 * 
 * USO:
 * node frontend/scripts/validate-pages.js
 */

const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '../src/app');
const ERRORS = [];
const WARNINGS = [];

// Cores para output
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

function hasLayoutInParentPath(currentPath) {
  // Verificar se alguma pasta pai tem layout.tsx
  const pathParts = currentPath.split('/').filter(p => p);
  
  // Começar da pasta atual e subir até encontrar layout
  for (let i = pathParts.length; i > 0; i--) {
    const parentPath = '/' + pathParts.slice(0, i).join('/');
    const parentDir = path.join(APP_DIR, ...pathParts.slice(0, i));
    const layoutPath = path.join(parentDir, 'layout.tsx');
    
    if (fs.existsSync(layoutPath)) {
      return { found: true, parentPath, layoutPath };
    }
  }
  
  // Verificar layout raiz
  const rootLayoutPath = path.join(APP_DIR, 'layout.tsx');
  if (fs.existsSync(rootLayoutPath)) {
    return { found: true, parentPath: '/', layoutPath: rootLayoutPath };
  }
  
  return { found: false };
}

function scanDirectory(dir, relativePath = '') {
  const items = fs.readdirSync(dir);
  
  let hasPageTsx = false;
  let hasLayoutTsx = false;
  
  // Verificar se há page.tsx e layout.tsx na pasta atual
  for (const item of items) {
    if (item === 'page.tsx') hasPageTsx = true;
    if (item === 'layout.tsx') hasLayoutTsx = true;
  }
  
  // REGRA 1: Se há page.tsx, deve ter layout.tsx OU herdar de pasta pai
  if (hasPageTsx && !hasLayoutTsx) {
    const currentPath = relativePath || '/';
    
    // Exceções: estas páginas podem não ter layout próprio
    const exceptions = ['/login', '/redefinir-senha', '/auth'];
    const isException = exceptions.some(exc => currentPath.includes(exc));
    
    if (!isException) {
      // Verificar se herda layout de pasta pai
      const inheritance = hasLayoutInParentPath(currentPath);
      
      if (!inheritance.found) {
        ERRORS.push({
          type: 'MISSING_LAYOUT',
          path: currentPath,
          message: `❌ ERRO: Pasta '${currentPath}' tem page.tsx mas não tem layout.tsx nem herda de pasta pai`
        });
      } else {
        // Tem herança, mas vamos verificar se o layout pai usa DarkSidebarLayout
        const layoutContent = fs.readFileSync(inheritance.layoutPath, 'utf8');
        if (!layoutContent.includes('DarkSidebarLayout')) {
          WARNINGS.push({
            type: 'INHERITED_LAYOUT_WITHOUT_SIDEBAR',
            path: currentPath,
            message: `⚠️  AVISO: Página '${currentPath}' herda layout de '${inheritance.parentPath}' que não usa DarkSidebarLayout`
          });
        }
      }
    }
  }
  
  // Verificar conteúdo do layout.tsx se existir
  if (hasLayoutTsx) {
    const layoutPath = path.join(dir, 'layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    
    if (!layoutContent.includes('DarkSidebarLayout')) {
      WARNINGS.push({
        type: 'LAYOUT_WITHOUT_SIDEBAR',
        path: relativePath || '/',
        message: `⚠️  AVISO: Layout em '${relativePath || '/'}' não usa DarkSidebarLayout`
      });
    }
  }
  
  // Verificar conteúdo do page.tsx se existir
  if (hasPageTsx) {
    const pagePath = path.join(dir, 'page.tsx');
    const pageContent = fs.readFileSync(pagePath, 'utf8');
    
    // REGRA 2: Página não deve usar PageBase
    if (pageContent.includes('PageBase')) {
      ERRORS.push({
        type: 'PAGE_USES_PAGEBASE',
        path: relativePath || '/',
        message: `❌ ERRO: Página '${relativePath || '/'}' usa PageBase (deve usar apenas div + layout.tsx)`
      });
    }
    
    // REGRA 3: Página deve usar Card components (exceto páginas especiais)
    const specialPages = ['loading', 'error', 'not-found', 'layout'];
    const isSpecialPage = specialPages.some(special => 
      pageContent.includes(special) || 
      (relativePath || '/').includes(special)
    );
    
    if (!pageContent.includes('Card') && !isSpecialPage && 
        !pageContent.includes('DarkSidebarLayout') && // Páginas que fazem seu próprio layout
        !pageContent.includes('AuthLayout')) { // Páginas de auth
      WARNINGS.push({
        type: 'PAGE_WITHOUT_CARDS',
        path: relativePath || '/',
        message: `⚠️  AVISO: Página '${relativePath || '/'}' não usa Card components`
      });
    }
  }
  
  // Recursivamente escanear subpastas
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.lstatSync(itemPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && !item.startsWith('_')) {
      const newRelativePath = relativePath ? `${relativePath}/${item}` : `/${item}`;
      scanDirectory(itemPath, newRelativePath);
    }
  }
}

function generateReport() {
  console.log('\n' + '='.repeat(60));
  log(colors.bold + colors.blue, '🔍 RELATÓRIO DE VALIDAÇÃO - SGB_V2 (Com Herança)');
  console.log('='.repeat(60));
  
  // Mostrar erros
  if (ERRORS.length > 0) {
    log(colors.bold + colors.red, '\n🚨 ERROS CRÍTICOS ENCONTRADOS:');
    console.log('-'.repeat(40));
    
    ERRORS.forEach((error, index) => {
      log(colors.red, `${index + 1}. ${error.message}`);
      
      if (error.type === 'MISSING_LAYOUT') {
        log(colors.red, '   SOLUÇÃO: Criar layout.tsx com DarkSidebarLayout na pasta pai');
        log(colors.red, '   EXEMPLO: frontend/src/app/configuracoes/layout.tsx');
      }
      
      if (error.type === 'PAGE_USES_PAGEBASE') {
        log(colors.red, '   SOLUÇÃO: Remover PageBase e usar div + layout.tsx');
        log(colors.red, '   TEMPLATE: frontend/src/templates/page-template.tsx');
      }
      
      console.log('');
    });
  }
  
  // Mostrar avisos
  if (WARNINGS.length > 0) {
    log(colors.bold + colors.yellow, '\n⚠️  AVISOS:');
    console.log('-'.repeat(40));
    
    WARNINGS.forEach((warning, index) => {
      log(colors.yellow, `${index + 1}. ${warning.message}`);
    });
    console.log('');
  }
  
  // Resumo final
  if (ERRORS.length === 0 && WARNINGS.length === 0) {
    log(colors.bold + colors.green, '✅ TODAS AS PÁGINAS ESTÃO SEGUINDO AS REGRAS!');
    log(colors.green, '🎉 Sistema de layout funcionando perfeitamente!');
  } else if (ERRORS.length === 0) {
    log(colors.bold + colors.green, '✅ NENHUM ERRO CRÍTICO ENCONTRADO!');
    log(colors.yellow, `⚠️  Apenas ${WARNINGS.length} aviso(s) - sistema funcionando bem!`);
  } else {
    log(colors.bold + colors.red, `\n📊 RESUMO:`);
    log(colors.red, `   • ${ERRORS.length} erro(s) crítico(s)`);
    log(colors.yellow, `   • ${WARNINGS.length} aviso(s)`);
    
    if (ERRORS.length > 0) {
      log(colors.red, '\n❌ FALHA: Corrija os erros antes de continuar!');
      process.exit(1);
    }
  }
  
  console.log('='.repeat(60));
  log(colors.blue, '📖 Documentação: docs/REGRAS_CRIACAO_PAGINAS.md');
  log(colors.blue, '🔧 Template: frontend/src/templates/page-template.tsx');
  console.log('='.repeat(60) + '\n');
}

// Executar validação
log(colors.bold + colors.blue, '🚀 Iniciando validação das páginas (com herança)...\n');

try {
  scanDirectory(APP_DIR);
  generateReport();
} catch (error) {
  log(colors.red, `❌ Erro ao executar validação: ${error.message}`);
  process.exit(1);
} 