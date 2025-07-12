#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📋 Validando estrutura de páginas...');

const srcPath = path.join(__dirname, '..', 'src', 'app');

// Verificar se ainda existe pasta admin (não deve existir)
const adminPath = path.join(srcPath, 'admin');
if (fs.existsSync(adminPath)) {
  console.error('❌ ERRO: Pasta /admin/ ainda existe! Deve ser removida.');
  console.error('   Páginas admin devem estar em /paginas/configuracoes/');
  process.exit(1);
}

// Verificar se ainda existe pasta api/admin (não deve existir)
const apiAdminPath = path.join(srcPath, 'api', 'admin');
if (fs.existsSync(apiAdminPath)) {
  console.error('❌ ERRO: Pasta /api/admin/ ainda existe! Deve ser removida.');
  console.error('   APIs devem estar diretamente em /api/[funcionalidade]/');
  process.exit(1);
}

// Verificar se pasta paginas existe
const paginasPath = path.join(srcPath, 'paginas');
if (!fs.existsSync(paginasPath)) {
  console.error('❌ ERRO: Pasta /paginas/ não existe!');
  console.error('   Todas as páginas devem estar em /paginas/[categoria]/');
  process.exit(1);
}

// Verificar se pasta api existe
const apiPath = path.join(srcPath, 'api');
if (!fs.existsSync(apiPath)) {
  console.error('❌ ERRO: Pasta /api/ não existe!');
  console.error('   Todas as APIs devem estar em /api/[funcionalidade]/');
  process.exit(1);
}

// Verificar estrutura de páginas
const paginasCategories = ['configuracoes', 'relatorios', 'operacoes', 'funcionario', 'dashboard', 'visao-geral'];
let paginasFound = 0;

paginasCategories.forEach(category => {
  const categoryPath = path.join(paginasPath, category);
  if (fs.existsSync(categoryPath)) {
    paginasFound++;
    console.log(`✅ Encontrada categoria: /paginas/${category}/`);
  }
});

if (paginasFound === 0) {
  console.error('❌ ERRO: Nenhuma categoria encontrada em /paginas/');
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
console.log(`   - ${paginasFound} categorias de páginas encontradas`);
console.log(`   - ${apisFound} APIs essenciais encontradas`);
console.log(`   - Estrutura admin antiga removida corretamente`);
console.log(''); 