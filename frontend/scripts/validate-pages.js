#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📋 Validando estrutura de páginas...');

const srcPath = path.join(__dirname, '..', 'src', 'app');

// Verificar se ainda existe pasta admin (não deve existir)
const adminPath = path.join(srcPath, 'admin');
if (fs.existsSync(adminPath)) {
  console.error('❌ ERRO: Pasta /admin/ ainda existe! Deve ser removida.');
  console.error('   Páginas admin devem estar em /configuracoes/');
  process.exit(1);
}

// Verificar se ainda existe pasta api/admin (não deve existir)
const apiAdminPath = path.join(srcPath, 'api', 'admin');
if (fs.existsSync(apiAdminPath)) {
  console.error('❌ ERRO: Pasta /api/admin/ ainda existe! Deve ser removida.');
  console.error('   APIs devem estar diretamente em /api/[funcionalidade]/');
  process.exit(1);
}

// Verificar se pasta paginas ainda existe (não deve mais existir)
const paginasPath = path.join(srcPath, 'paginas');
if (fs.existsSync(paginasPath)) {
  console.error('❌ ERRO: Pasta /paginas/ ainda existe!');
  console.error('   Estrutura foi simplificada - páginas devem estar na raiz.');
  process.exit(1);
}

// Verificar se pasta api existe
const apiPath = path.join(srcPath, 'api');
if (!fs.existsSync(apiPath)) {
  console.error('❌ ERRO: Pasta /api/ não existe!');
  console.error('   Todas as APIs devem estar em /api/[funcionalidade]/');
  process.exit(1);
}

// Verificar estrutura de páginas principais na raiz
const mainPages = ['home', 'login', 'configuracoes', 'relatorios', 'operacoes', 'funcionario', 'dashboard-financeiro', 'visao-geral'];
let pagesFound = 0;

mainPages.forEach(page => {
  const pagePath = path.join(srcPath, page);
  if (fs.existsSync(pagePath)) {
    pagesFound++;
    console.log(`✅ Encontrada página: /${page}/`);
  }
});

if (pagesFound < 6) {
  console.error('❌ ERRO: Páginas principais não encontradas na raiz');
  console.error('   Estrutura esperada: /home/, /login/, /configuracoes/, etc.');
  process.exit(1);
}

// Verificar estrutura de APIs essenciais
const essentialApis = ['usuarios', 'bars', 'credenciais', 'auth'];
let apisFound = 0;

essentialApis.forEach(api => {
  const apiDirPath = path.join(apiPath, api);
  if (fs.existsSync(apiDirPath)) {
    apisFound++;
    console.log(`✅ Encontrada API essencial: /api/${api}/`);
  }
});

if (apisFound === 0) {
  console.error('❌ ERRO: Nenhuma API essencial encontrada em /api/');
  process.exit(1);
}

console.log(`✅ Validação concluída com sucesso!`);
console.log(`   - ${pagesFound} páginas principais encontradas na raiz`);
console.log(`   - ${apisFound} APIs essenciais encontradas`);
console.log(`   - Estrutura simplificada implementada corretamente`);
console.log(''); 