/**
 * Script para resetar senha do usuário Isaias
 * 
 * Uso: node exemplo_teste/reset-senha-isaias.js
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!');
  console.log('Configure a variável de ambiente antes de executar.');
  process.exit(1);
}

async function resetPasswordIsaias() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('🔍 Buscando usuário Isaias...');

    // Buscar usuário pelo nome (case insensitive)
    const { data: usuarios, error: fetchError } = await supabase
      .from('usuarios_bar')
      .select('id, user_id, email, nome, role, ativo')
      .ilike('nome', '%isaias%');

    if (fetchError) {
      console.error('❌ Erro ao buscar usuário:', fetchError);
      return;
    }

    if (!usuarios || usuarios.length === 0) {
      console.log('❌ Nenhum usuário encontrado com o nome Isaias');
      return;
    }

    if (usuarios.length > 1) {
      console.log('⚠️ Múltiplos usuários encontrados:');
      usuarios.forEach(u => {
        console.log(`  - ${u.nome} (${u.email}) - ${u.ativo ? 'Ativo' : 'Inativo'}`);
      });
      console.log('\nUsando o primeiro usuário ativo...');
    }

    // Encontrar primeiro usuário ativo ou usar o primeiro
    const usuario = usuarios.find(u => u.ativo) || usuarios[0];

    if (!usuario.ativo) {
      console.log('⚠️ Usuário encontrado mas está INATIVO:', usuario.nome);
    }

    console.log('\n✅ Usuário encontrado:');
    console.log(`   Nome: ${usuario.nome}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   Role: ${usuario.role}`);
    console.log(`   Status: ${usuario.ativo ? 'Ativo' : 'Inativo'}`);

    if (!usuario.user_id) {
      console.error('❌ Usuário não possui user_id (conta de autenticação)');
      return;
    }

    // Gerar senha temporária
    const senhaTemporaria = `Temp${Math.random().toString(36).substring(2, 8)}!`;
    
    console.log('\n🔑 Gerando nova senha temporária...');
    console.log(`   Senha temporária: ${senhaTemporaria}`);

    // Atualizar senha no Supabase Auth
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
      usuario.user_id,
      { password: senhaTemporaria }
    );

    if (authUpdateError) {
      console.error('❌ Erro ao atualizar senha no Auth:', authUpdateError);
      return;
    }

    console.log('✅ Senha atualizada no Supabase Auth');

    // Marcar que precisa redefinir senha
    const { error: updateError } = await supabase
      .from('usuarios_bar')
      .update({ 
        senha_redefinida: false,
        ultima_atividade: new Date().toISOString()
      })
      .eq('id', usuario.id);

    if (updateError) {
      console.error('⚠️ Erro ao atualizar flag senha_redefinida:', updateError);
    } else {
      console.log('✅ Flag senha_redefinida atualizada');
    }

    // Tentar enviar email
    console.log('\n📧 Tentando enviar email...');
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : (process.env.NEXT_PUBLIC_APP_URL || 'https://zykor.com.br');

    try {
      const emailResponse = await fetch(`${baseUrl}/api/emails/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: usuario.email,
          nome: usuario.nome,
          email: usuario.email,
          senha_temporaria: senhaTemporaria,
          role: usuario.role,
          loginUrl: baseUrl
        })
      });

      if (emailResponse.ok) {
        const emailResult = await emailResponse.json();
        console.log('✅ Email enviado com sucesso!');
        console.log('   Email ID:', emailResult.emailId);
      } else {
        const errorText = await emailResponse.text();
        console.error('❌ Erro ao enviar email:');
        console.error('   Status:', emailResponse.status);
        console.error('   Resposta:', errorText.substring(0, 200));
      }
    } catch (emailError) {
      console.error('❌ Erro ao tentar enviar email:', emailError.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 RESUMO DO RESET DE SENHA');
    console.log('='.repeat(60));
    console.log(`👤 Usuário: ${usuario.nome}`);
    console.log(`📧 Email: ${usuario.email}`);
    console.log(`🔑 Senha Temporária: ${senhaTemporaria}`);
    console.log(`🌐 URL de Login: ${baseUrl}/login`);
    console.log('\n⚠️ IMPORTANTE:');
    console.log('   - Esta é uma senha temporária');
    console.log('   - O usuário DEVE alterar no primeiro login');
    console.log('   - Compartilhe a senha temporária com segurança');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar
resetPasswordIsaias();

