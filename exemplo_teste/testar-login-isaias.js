/**
 * Script para testar login do Isaias
 */

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTExNjYsImV4cCI6MjA2Njg4NzE2Nn0.59x53jDOpNe9yVevnP-TcXr6Dkj0QjU8elJb636xV6M';

async function testarLogin() {
  const email = 'isaias.carneiro03@gmail.com';
  const senhas = [
    'Senha@Temporaria123',
  ];

  console.log('🧪 Testando login para:', email);
  console.log('');

  for (const senha of senhas) {
    console.log(`🔐 Testando senha: ${senha}`);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: email,
          password: senha,
        })
      });

      const result = await response.json();

      if (response.ok && result.access_token) {
        console.log('✅ SENHA CORRETA!:', senha);
        console.log('✅ User ID:', result.user.id);
        console.log('✅ Email confirmado:', result.user.email_confirmed_at ? 'Sim' : 'Não');
        console.log('');
        return;
      } else {
        console.log('❌ Senha incorreta');
        console.log('   Erro:', result.error_description || result.error || 'Credenciais inválidas');
        console.log('');
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error.message);
      console.log('');
    }
  }

  console.log('❌ NENHUMA SENHA FUNCIONOU!');
  console.log('');
  console.log('💡 Vou resetar a senha para: SenhaTemporaria@123');
}

testarLogin();

