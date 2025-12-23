/**
 * Script para verificar o estado do usuário Isaias no Supabase
 * 
 * Uso: node exemplo_teste/verificar-usuario-isaias.js
 */

const EMAIL_ISAIAS = 'Isaias.carneiro03@gmail.com'; // Email do Isaias (com I maiúsculo)

async function verificarUsuario() {
  try {
    console.log('🔍 Verificando usuário:', EMAIL_ISAIAS);
    console.log('');

    // Fazer requisição para API de debug
    const response = await fetch('https://zykor.com.br/api/admin/debug-usuario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: EMAIL_ISAIAS
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro:', result.error);
      if (result.tentativas) {
        console.log('\n📋 Tentativas encontradas:');
        result.tentativas.forEach(u => {
          console.log(`  - ${u.nome} (${u.email})`);
        });
      }
      return;
    }

    console.log('✅ Usuário encontrado!\n');

    // Dados do banco
    console.log('📊 DADOS NO BANCO (usuarios_bar):');
    console.log('  ID:', result.usuario.id);
    console.log('  Nome:', result.usuario.nome);
    console.log('  Email:', result.usuario.email);
    console.log('  User ID:', result.usuario.user_id);
    console.log('  Role:', result.usuario.role);
    console.log('  Ativo:', result.usuario.ativo ? '✅ Sim' : '❌ Não');
    console.log('  Senha Redefinida:', result.usuario.senha_redefinida ? '✅ Sim' : '❌ Não');
    console.log('  Reset Token:', result.usuario.reset_token || 'Nenhum');
    console.log('  Reset Token Expiry:', result.usuario.reset_token_expiry || 'Nenhum');
    console.log('');

    // Dados do Auth
    if (result.authUser) {
      console.log('🔐 DADOS NO SUPABASE AUTH:');
      console.log('  ID:', result.authUser.id);
      console.log('  Email:', result.authUser.email);
      console.log('  Email Confirmado:', result.authUser.email_confirmed_at ? '✅ Sim' : '❌ Não');
      console.log('  Último Login:', result.authUser.last_sign_in_at || 'Nunca');
      console.log('  Criado em:', result.authUser.created_at);
      console.log('  Atualizado em:', result.authUser.updated_at || 'Nunca');
      console.log('');
    } else {
      console.log('❌ Usuário NÃO encontrado no Supabase Auth!\n');
    }

    // Problemas identificados
    if (result.problemas && result.problemas.length > 0) {
      console.log('⚠️ PROBLEMAS IDENTIFICADOS:');
      result.problemas.forEach(problema => {
        console.log(`  - ${problema}`);
      });
      console.log('');
    } else {
      console.log('✅ Nenhum problema identificado!\n');
    }

    // Comparação de emails
    if (result.authUser) {
      const emailBanco = result.usuario.email.toLowerCase();
      const emailAuth = result.authUser.email?.toLowerCase();
      
      console.log('📧 COMPARAÇÃO DE EMAILS:');
      console.log('  Email no Banco:', emailBanco);
      console.log('  Email no Auth:', emailAuth);
      
      if (emailBanco !== emailAuth) {
        console.log('  ❌ EMAILS SÃO DIFERENTES!');
        console.log('  ⚠️ Use o email do Auth para fazer login:', emailAuth);
      } else {
        console.log('  ✅ Emails são iguais');
      }
      console.log('');
    }

    // Recomendações
    console.log('💡 RECOMENDAÇÕES:');
    if (!result.usuario.user_id) {
      console.log('  ❌ Usuário não tem user_id vinculado - precisa criar conta no Auth');
    } else if (!result.authUser) {
      console.log('  ❌ Usuário não existe no Auth - precisa recriar conta');
    } else if (result.authUser.email?.toLowerCase() !== result.usuario.email.toLowerCase()) {
      console.log('  ⚠️ Resetar senha usando a API /api/admin/definir-senha');
      console.log('  ⚠️ Fazer login com o email:', result.authUser.email);
    } else if (!result.authUser.email_confirmed_at) {
      console.log('  ⚠️ Email não confirmado - resetar senha deve resolver');
    } else {
      console.log('  ✅ Tudo certo! Resetar senha e testar login');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar usuário:', error.message);
  }
}

// Executar
verificarUsuario();

