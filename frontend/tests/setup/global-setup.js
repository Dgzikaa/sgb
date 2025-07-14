const { execSync } = require('child_process')
const path = require('path')

module.exports = async () => {
  console.log('🚀 Iniciando setup global dos testes...')
  
  // Definir variáveis de ambiente para testes
  process.env.NODE_ENV = 'test'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  
  // Limpar cache do Jest se existir
  try {
    const cacheDir = path.join(__dirname, '../../.jest-cache')
    execSync(`rm -rf ${cacheDir}`, { stdio: 'ignore' })
  } catch (error) {
    // Ignorar erros de limpeza de cache
  }
  
  // Configurar timezone
  process.env.TZ = 'UTC'
  
  console.log('✅ Setup global concluído')
} 