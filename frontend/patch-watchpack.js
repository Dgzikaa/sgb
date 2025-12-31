#!/usr/bin/env node

/**
 * Patch para corrigir erro do Watchpack no Windows
 * "EINVAL: invalid argument, lstat 'F:\System Volume Information'"
 * 
 * Este script modifica o Watchpack compilado do Next.js para ignorar
 * diretórios do sistema Windows que causam erros de acesso.
 */

const fs = require('fs');
const path = require('path');

// Caminho para o Watchpack compilado do Next.js
const watchpackPath = path.join(__dirname, 'node_modules', 'next', 'dist', 'compiled', 'watchpack', 'watchpack.js');

console.log('🔧 Aplicando patch no Watchpack...');

if (!fs.existsSync(watchpackPath)) {
  console.log('❌ Watchpack não encontrado em:', watchpackPath);
  process.exit(0);
}

try {
  let content = fs.readFileSync(watchpackPath, 'utf8');
  
  // Verificar se o patch V2 já foi aplicado
  if (content.includes('ZYKOR_WATCHPACK_PATCH_V2')) {
    console.log('✅ Patch V2 já aplicado anteriormente');
    process.exit(0);
  }
  
  // Remover patch V1 antigo se existir
  if (content.includes('ZYKOR_WATCHPACK_PATCH')) {
    console.log('🔄 Removendo patch V1 antigo...');
    content = content.replace(/\/\/ ZYKOR_WATCHPACK_PATCH - Início[\s\S]*?\/\/ ZYKOR_WATCHPACK_PATCH - Fim\n?/, '');
  }
  
  // Adicionar código no início do arquivo para suprimir erros
  const patchCode = `
// ZYKOR_WATCHPACK_PATCH_V2 - Início
(function() {
  const originalConsoleError = console.error;
  const suppressPatterns = [
    'System Volume Information',
    'pagefile.sys',
    'hiberfil.sys',
    'swapfile.sys',
    'DumpStack.log.tmp',
    'DumpStack.log',
    '$RECYCLE.BIN',
    '$Recycle.Bin',
    'Config.Msi',
    'Recovery',
    'bootmgr',
    'BOOTNXT'
  ];
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('Watchpack Error')) {
      for (const pattern of suppressPatterns) {
        if (message.includes(pattern)) {
          return; // Suprimir erro do Watchpack sobre arquivos de sistema Windows
        }
      }
    }
    originalConsoleError.apply(console, args);
  };
})();
// ZYKOR_WATCHPACK_PATCH_V2 - Fim
`;
  
  content = patchCode + content;
  
  // Fazer backup
  fs.writeFileSync(watchpackPath + '.backup', fs.readFileSync(watchpackPath));
  
  // Aplicar patch
  fs.writeFileSync(watchpackPath, content, 'utf8');
  
  console.log('✅ Patch aplicado com sucesso!');
  console.log('📦 Backup criado em:', watchpackPath + '.backup');
  
} catch (error) {
  console.error('❌ Erro ao aplicar patch:', error.message);
  process.exit(1);
}

