#!/usr/bin/env node

/**
 * Script para controlar logs de desenvolvimento
 * Usage: node scripts/toggle-logs.js [on|off|status]
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env.local');

function createEnvFile() {
  const envContent = `# Configurações de desenvolvimento local
NEXT_PUBLIC_VERBOSE_LOGS=false
NEXT_PUBLIC_DEBUG_API=false
NEXT_PUBLIC_DEBUG_CONTEXT=false
NEXT_PUBLIC_PERFORMANCE_LOGS=false
`;
  
  try {
    fs.writeFileSync(ENV_FILE, envContent);
    console.log('✅ Arquivo .env.local criado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao criar .env.local:', error.message);
  }
}

function readCurrentConfig() {
  try {
    if (!fs.existsSync(ENV_FILE)) {
      console.log('⚠️ Arquivo .env.local não existe. Criando...');
      createEnvFile();
      return false;
    }
    
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    const verboseLogsMatch = content.match(/NEXT_PUBLIC_VERBOSE_LOGS=(.+)/);
    return verboseLogsMatch && verboseLogsMatch[1].trim() === 'true';
  } catch (error) {
    console.error('❌ Erro ao ler configuração:', error.message);
    return false;
  }
}

function updateLogConfig(enable) {
  try {
    if (!fs.existsSync(ENV_FILE)) {
      createEnvFile();
    }
    
    let content = fs.readFileSync(ENV_FILE, 'utf8');
    
    // Atualizar VERBOSE_LOGS
    if (content.includes('NEXT_PUBLIC_VERBOSE_LOGS=')) {
      content = content.replace(
        /NEXT_PUBLIC_VERBOSE_LOGS=.+/,
        `NEXT_PUBLIC_VERBOSE_LOGS=${enable}`
      );
    } else {
      content += `\nNEXT_PUBLIC_VERBOSE_LOGS=${enable}`;
    }
    
    fs.writeFileSync(ENV_FILE, content);
    
    console.log(`✅ Logs de desenvolvimento ${enable ? 'ATIVADOS' : 'DESATIVADOS'}`);
    console.log(`📝 Para aplicar as mudanças, reinicie o servidor: npm run dev`);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar configuração:', error.message);
  }
}

function showStatus() {
  const isEnabled = readCurrentConfig();
  console.log('\n📊 STATUS DOS LOGS DE DESENVOLVIMENTO:');
  console.log(`🔍 Verbose Logs: ${isEnabled ? '🟢 ATIVADO' : '🔴 DESATIVADO'}`);
  console.log('\n📝 Para alterar:');
  console.log('  • Ativar logs:   node scripts/toggle-logs.js on');
  console.log('  • Desativar logs: node scripts/toggle-logs.js off');
  console.log('  • Ver status:     node scripts/toggle-logs.js status');
  console.log('\n⚠️ Lembre-se de reiniciar o servidor após mudanças!');
}

// Verificar argumentos
const action = process.argv[2];

switch (action) {
  case 'on':
    updateLogConfig(true);
    break;
  case 'off':
    updateLogConfig(false);
    break;
  case 'status':
    showStatus();
    break;
  default:
    console.log('🎯 Script de Controle de Logs - SGB v2\n');
    console.log('Usage: node scripts/toggle-logs.js [on|off|status]\n');
    console.log('Opções:');
    console.log('  on     - Ativa logs verbosos de desenvolvimento');
    console.log('  off    - Desativa logs verbosos (recomendado)');
    console.log('  status - Mostra status atual dos logs\n');
    showStatus();
    break;
}
