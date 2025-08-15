#!/usr/bin/env node

// Script de validação das configurações do Zykor
const fs = require('fs');
const path = require('path');

console.log('🔍 ZYKOR - Validação de Configuração\n');

const envPath = path.join(__dirname, '../.env.local');
const errors = [];
const warnings = [];
const success = [];

// 1. Verificar se .env.local existe
if (!fs.existsSync(envPath)) {
  errors.push('.env.local não encontrado - Execute: node scripts/setup.js');
} else {
  success.push('.env.local encontrado');
  
  // Carregar variáveis
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      envVars[key.trim()] = value.trim();
    }
  });

  // 2. Verificar Supabase
  if (envVars.NEXT_PUBLIC_SUPABASE_URL && !envVars.NEXT_PUBLIC_SUPABASE_URL.includes('SEU_')) {
    success.push('Supabase URL configurada');
  } else {
    errors.push('NEXT_PUBLIC_SUPABASE_URL não configurada');
  }

  if (envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY && !envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('SEU_')) {
    success.push('Supabase Anon Key configurada');
  } else {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada');
  }

  // 3. Verificar IA
  const hasOpenAI = envVars.OPENAI_API_KEY && envVars.OPENAI_API_KEY.startsWith('sk-');
  const hasAnthropic = envVars.ANTHROPIC_API_KEY && !envVars.ANTHROPIC_API_KEY.includes('SUA_');
  
  if (hasOpenAI) {
    success.push('OpenAI API Key configurada');
  } else if (hasAnthropic) {
    success.push('Anthropic API Key configurada');
  } else {
    errors.push('Nenhuma API Key de IA configurada (OpenAI ou Anthropic)');
  }

  // 4. Verificar JWT Secrets
  if (envVars.JWT_SECRET && envVars.JWT_SECRET.length > 20) {
    success.push('JWT Secret configurado');
  } else {
    errors.push('JWT_SECRET não configurado ou muito fraco');
  }

  if (envVars.JWT_REFRESH_SECRET && envVars.JWT_REFRESH_SECRET.length > 20) {
    success.push('JWT Refresh Secret configurado');
  } else {
    errors.push('JWT_REFRESH_SECRET não configurado ou muito fraco');
  }

  // 5. Verificar opcionais
  if (envVars.NEXT_PUBLIC_SENTRY_DSN && envVars.NEXT_PUBLIC_SENTRY_DSN.includes('sentry.io')) {
    success.push('Sentry configurado');
  } else {
    warnings.push('Sentry não configurado (recomendado para produção)');
  }

  if (envVars.DISCORD_WEBHOOK_URL && envVars.DISCORD_WEBHOOK_URL.includes('discord.com')) {
    success.push('Discord webhook configurado');
  } else {
    warnings.push('Discord webhook não configurado (opcional)');
  }

  if (envVars.NEXT_PUBLIC_APP_VERSION) {
    success.push('Versão do app definida');
  } else {
    warnings.push('NEXT_PUBLIC_APP_VERSION não definida');
  }
}

// 6. Verificar arquivos críticos
const criticalFiles = [
  'src/lib/ai/setup.ts',
  'src/lib/security/mfa.ts',
  'src/lib/security/session.ts',
  'src/lib/security/rbac.ts',
  'src/lib/security/lgpd.ts',
  'src/lib/monitoring.ts',
  'src/components/ai/ZykorAIChat.tsx',
  'public/sw-zykor.js',
  'public/manifest-zykor.json'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    success.push(`${file} encontrado`);
  } else {
    errors.push(`${file} não encontrado`);
  }
});

// Exibir resultados
console.log('✅ SUCESSOS:');
success.forEach(msg => console.log(`   ✓ ${msg}`));

if (warnings.length > 0) {
  console.log('\n⚠️  AVISOS:');
  warnings.forEach(msg => console.log(`   ⚠ ${msg}`));
}

if (errors.length > 0) {
  console.log('\n❌ ERROS:');
  errors.forEach(msg => console.log(`   ✗ ${msg}`));
}

// Score final
const totalChecks = success.length + warnings.length + errors.length;
const successRate = (success.length / totalChecks) * 100;

console.log(`\n📊 PONTUAÇÃO: ${successRate.toFixed(1)}% (${success.length}/${totalChecks})`);

if (errors.length === 0) {
  console.log('\n🎉 CONFIGURAÇÃO VÁLIDA! Zykor pronto para rodar.');
  console.log('Execute: npm run dev');
} else {
  console.log('\n🔧 AÇÃO NECESSÁRIA: Corrija os erros acima antes de continuar.');
  console.log('Consulte: env-setup-guide.md');
}

// Próximos passos sugeridos
if (errors.length === 0) {
  console.log('\n🚀 PRÓXIMOS PASSOS:');
  console.log('1. npm run dev');
  console.log('2. Acesse http://localhost:3001');
  console.log('3. Teste o Zykor AI Assistant');
  console.log('4. Verifique /api/health');
  console.log('5. Configure MFA em Configurações');
}
