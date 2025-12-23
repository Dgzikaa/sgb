import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeEmail } from '@/lib/email-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API de administração para definir senha diretamente
 * Útil para corrigir problemas de login
 * 
 * POST /api/admin/definir-senha
 * Body: { email: string, novaSenha: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, novaSenha } = await request.json();

    if (!email || !novaSenha) {
      return NextResponse.json(
        { error: 'Email e nova senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (novaSenha.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    console.log('🔄 [ADMIN] Definindo senha diretamente para:', email);

    // 1. Verificar se usuário existe
    const emailNormalizado = email.toLowerCase().trim();
    const { data: usuario, error: fetchError } = await supabase
      .from('usuarios_bar')
      .select('id, user_id, email, nome, role, ativo')
      .eq('email', emailNormalizado)
      .single();

    if (fetchError || !usuario) {
      console.log('❌ Usuário não encontrado:', email);
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (!usuario.ativo) {
      return NextResponse.json(
        { error: 'Usuário está inativo' },
        { status: 400 }
      );
    }

    if (!usuario.user_id) {
      return NextResponse.json(
        { error: 'Usuário não possui conta de autenticação vinculada' },
        { status: 400 }
      );
    }

    console.log('✅ Usuário encontrado:', usuario.nome);
    console.log('👤 User ID:', usuario.user_id);
    console.log('📧 Email no banco:', usuario.email);
    console.log('🔐 Definindo senha (tamanho):', novaSenha.length, 'caracteres');

    // 2. Buscar usuário no Auth para verificar email real
    console.log('🔍 Verificando usuário no Supabase Auth...');
    const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(usuario.user_id);
    
    if (authUserError || !authUserData?.user) {
      console.error('❌ Erro ao buscar usuário no Auth:', authUserError);
      return NextResponse.json(
        { 
          error: 'Usuário não encontrado no Supabase Auth',
          details: authUserError?.message || 'Usuário não existe no Auth'
        },
        { status: 404 }
      );
    }

    const emailNoAuth = normalizeEmail(authUserData.user.email || '');
    console.log('📧 Email no Auth:', emailNoAuth);
    console.log('📧 Email no banco:', emailNormalizado);
    
    if (emailNoAuth !== emailNormalizado) {
      console.warn('⚠️ ATENÇÃO: Email no Auth é diferente do email no banco!');
      console.warn('⚠️ Usando email do Auth para login:', emailNoAuth);
    }

    // 3. Atualizar senha no Supabase Auth
    console.log('🔄 Atualizando senha no Supabase Auth...');
    const { data: authData, error: authUpdateError } = await supabase.auth.admin.updateUserById(
      usuario.user_id,
      { 
        password: novaSenha,
        email_confirm: true,
      }
    );

    if (authUpdateError) {
      console.error('❌ Erro ao atualizar senha no Auth:', authUpdateError);
      console.error('❌ Código:', authUpdateError.status);
      console.error('❌ Mensagem:', authUpdateError.message);
      console.error('❌ Detalhes:', JSON.stringify(authUpdateError, null, 2));
      return NextResponse.json(
        { 
          error: 'Erro ao atualizar senha no Auth',
          details: authUpdateError.message 
        },
        { status: 500 }
      );
    }

    if (!authData || !authData.user) {
      console.error('❌ Resposta do Auth não contém dados do usuário');
      return NextResponse.json(
        { 
          error: 'Erro ao atualizar senha: resposta inválida do servidor'
        },
        { status: 500 }
      );
    }

    console.log('✅ Senha atualizada com sucesso no Auth');
    console.log('✅ User ID confirmado:', authData.user.id);
    console.log('✅ Email confirmado:', authData.user.email);

    // 4. Marcar que senha foi redefinida
    const { error: updateError } = await supabase
      .from('usuarios_bar')
      .update({ 
        senha_redefinida: true,
        ultima_atividade: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', usuario.id);

    if (updateError) {
      console.error('⚠️ Erro ao atualizar flag senha_redefinida:', updateError);
      // Não falhar, a senha já foi atualizada
    }

    // 5. Testar login com o email do Auth (não do banco)
    console.log('🧪 Testando login com nova senha...');
    const emailParaLogin = emailNoAuth || emailNormalizado;
    console.log('📧 Email usado no teste:', emailParaLogin);
    
    const { data: testAuth, error: testError } = await supabase.auth.signInWithPassword({
      email: emailParaLogin,
      password: novaSenha,
    });

    if (testError || !testAuth.user) {
      console.error('❌ ERRO CRÍTICO: Senha atualizada mas login falhou!');
      console.error('❌ Erro do teste:', testError?.message);
      console.error('❌ Email usado:', emailParaLogin);
      console.error('❌ User ID:', usuario.user_id);
      
      return NextResponse.json({
        success: false,
        error: 'Senha atualizada mas login de teste falhou',
        details: testError?.message || 'Erro desconhecido',
        emailUsadoNoTeste: emailParaLogin,
        emailNoBanco: emailNormalizado,
        emailNoAuth: emailNoAuth,
        aviso: 'A senha foi atualizada, mas o login de teste falhou. Verifique os logs para mais detalhes.'
      }, { status: 500 });
    } else {
      console.log('✅ Login de teste bem-sucedido! Senha está funcionando.');
      // Fazer sign out do teste
      await supabase.auth.signOut();
    }

    return NextResponse.json({
      success: true,
      message: 'Senha definida com sucesso e testada',
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        emailNoAuth: emailNoAuth,
        role: usuario.role
      },
      loginTested: true,
      emailParaLogin: emailParaLogin,
      instructions: `O usuário pode fazer login imediatamente com a nova senha usando o email: ${emailParaLogin}`
    });

  } catch (error) {
    console.error('❌ Erro ao definir senha:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

