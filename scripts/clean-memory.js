#!/usr/bin/env node

/**
 * 🧹 SCRIPT DE LIMPEZA DE MEMÓRIA - SGB_V2
 * Remove arquivos temporários e cache que podem estar causando overhead de memória
 */

const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_CLEAN = [
  'frontend/.next',
  'frontend/out',
  'frontend/dist',
  'frontend/build',
  'frontend/.cache',
  'frontend/.eslintcache',
  'frontend/tsconfig.tsbuildinfo',
  'frontend/.tsbuildinfo',
  '.cache',
  'logs',
  'temp',
  'tmp',
  '.temp',
  '.tmp'
];

const FILES_TO_CLEAN = [
  'frontend/tsconfig.tsbuildinfo',
  'frontend/.eslintcache',
  'tsconfig.tsbuildinfo',
  '.tsbuildinfo'
];

function deleteDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Removido: ${dirPath}`);
      return true;
    } catch (error) {
      console.log(`❌ Erro ao remover ${dirPath}: ${error.message}`);
      return false;
    }
  }
  return false;
}

function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Removido: ${filePath}`);
      return true;
    } catch (error) {
      console.log(`❌ Erro ao remover ${filePath}: ${error.message}`);
      return false;
    }
  }
  return false;
}

function main() {
  console.log('🧹 Iniciando limpeza de arquivos temporários...\n');
  
  let cleaned = 0;
  
  // Limpar diretórios
  console.log('📁 Limpando diretórios...');
  DIRECTORIES_TO_CLEAN.forEach(dir => {
    if (deleteDirectory(dir)) cleaned++;
  });
  
  // Limpar arquivos
  console.log('\n📄 Limpando arquivos...');
  FILES_TO_CLEAN.forEach(file => {
    if (deleteFile(file)) cleaned++;
  });
  
  console.log(`\n🎉 Limpeza concluída! ${cleaned} itens removidos.`);
  console.log('💡 Reinicie o Cursor para aplicar as otimizações de memória.');
}

if (require.main === module) {
  main();
}

module.exports = { deleteDirectory, deleteFile };
