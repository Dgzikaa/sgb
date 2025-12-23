import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    console.log('🔐 Definindo senha (tamanho):', novaSenha.length, 'caracteres');

    // 2. Atualizar senha no Supabase Auth
    const { data: authData, error: authUpdateError } = await supabase.auth.admin.updateUserById(
      usuario.user_id,
      { 
        password: novaSenha,
        email_confirm: true,
      }
    );

    if (authUpdateError) {
      console.error('❌ Erro ao atualizar senha no Auth:', authUpdateError);
      console.error('❌ Detalhes:', JSON.stringify(authUpdateError, null, 2));
      return NextResponse.json(
        { 
          error: 'Erro ao atualizar senha no Auth',
          details: authUpdateError.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ Senha atualizada com sucesso no Auth');
    console.log('✅ User ID atualizado:', authData.user?.id);

    // 3. Marcar que senha foi redefinida
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

    // 4. Testar login para confirmar que funciona
    console.log('🧪 Testando login com nova senha...');
    const { data: testAuth, error: testError } = await supabase.auth.signInWithPassword({
      email: emailNormalizado,
      password: novaSenha,
    });

    if (testError || !testAuth.user) {
      console.warn('⚠️ Aviso: Não foi possível testar o login automaticamente:', testError?.message);
      // Não falhar, pode ser um problema temporário
    } else {
      console.log('✅ Login de teste bem-sucedido! Senha está funcionando.');
    }

    return NextResponse.json({
      success: true,
      message: 'Senha definida com sucesso',
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role
      },
      loginTested: !testError && !!testAuth.user,
      instructions: 'O usuário pode fazer login imediatamente com a nova senha.'
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

