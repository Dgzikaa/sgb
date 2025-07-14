module.exports = async () => {
  console.log('🧹 Iniciando limpeza global dos testes...')
  
  // Limpar timers pendentes
  if (global.clearTimeout) {
    clearTimeout()
  }
  
  if (global.clearInterval) {
    clearInterval()
  }
  
  // Limpar variáveis de ambiente de teste
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('✅ Limpeza global concluída')
} 