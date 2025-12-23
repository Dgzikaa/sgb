/**
 * Resetar senha do Isaias usando a API de produção
 */

const EMAIL = 'isaias.carneiro03@gmail.com';
const NOVA_SENHA = 'Senha@Temporaria123';

async function resetarSenha() {
  console.log('🔄 Resetando senha do usuário:', EMAIL);
  console.log('🔑 Nova senha:', NOVA_SENHA);
  console.log('');

  try {
    const response = await fetch('https://zykor.com.br/api/admin/definir-senha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: EMAIL,
        novaSenha: NOVA_SENHA
      })
    });

    const result = await response.json();

    console.log('📦 Resposta completa:', JSON.stringify(result, null, 2));
    console.log('');

    if (!response.ok) {
      console.error('❌ Erro ao resetar senha:', result.error);
      console.error('   Detalhes:', result.details);
      return;
    }

    console.log('✅ Senha resetada com sucesso!');
    console.log('');
    
    if (result.usuario) {
      console.log('📋 INFORMAÇÕES DO USUÁRIO:');
      console.log('  Nome:', result.usuario.nome);
      console.log('  Email:', result.usuario.email);
      console.log('  User ID:', result.usuario.user_id);
      console.log('');
    }
    
    if (result.loginTest) {
      console.log('🧪 TESTE DE LOGIN:');
      console.log('  Login funcionou:', result.loginTest.success ? '✅ Sim' : '❌ Não');
      if (result.loginTest.success) {
        console.log('  Email usado:', result.loginTest.email);
        console.log('  User ID:', result.loginTest.userId);
      } else {
        console.log('  Erro:', result.loginTest.error);
      }
      console.log('');
    }
    
    console.log('🎯 PARA FAZER LOGIN:');
    console.log(`  Email: ${EMAIL}`);
    console.log(`  Senha: ${NOVA_SENHA}`);
    console.log('');

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

resetarSenha();

