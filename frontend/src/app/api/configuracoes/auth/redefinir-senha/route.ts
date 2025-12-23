import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'

// Criar cliente Supabase com service role key (mesmo padrão das outras APIs)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, novaSenha, token } = await request.json();

    console.log('🔐 Redefinindo senha para:', { email });

    if (!email || !novaSenha || !token) {
      return NextResponse.json(
        { success: false, error: 'Email, nova senha e token são obrigatórios' },
        { status: 400 }
      );
    }

    if (novaSenha.length < 6) {
      return NextResponse.json(
        { success: false, error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Buscar usuário pelo email e validar token
    console.log('🔍 Buscando usuário e validando token...');
    console.log('📧 Email recebido:', email);
    console.log('🔑 Token recebido:', token ? '***' : 'vazio');
    
    // Normalizar email para lowercase (consistente com login)
    const emailNormalizado = email.toLowerCase().trim();
    
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios_bar')
      .select('user_id, nome, reset_token, reset_token_expiry, email')
      .eq('email', emailNormalizado)
      .eq('reset_token', token)
      .single();

    if (usuarioError || !usuarioData) {
      console.error(
        '❌ Usuário não encontrado ou token inválido:',
        usuarioError
      );
      return NextResponse.json(
        { success: false, error: 'Token inválido ou expirado' },
        { status: 404 }
      );
    }

    // Verificar se o token não expirou
    if (usuarioData.reset_token_expiry) {
      const tokenExpiry = new Date(usuarioData.reset_token_expiry);
      if (tokenExpiry < new Date()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Token expirado. Solicite uma nova recuperação de senha',
          },
          { status: 400 }
        );
      }
    }

    console.log('✅ Usuário encontrado e token válido:', usuarioData.nome);
    console.log('👤 User ID:', usuarioData.user_id);
    console.log('📧 Email do usuário:', usuarioData.email);

    // Atualizar senha no Supabase Auth
    console.log('🔑 Atualizando senha no Auth...');
    console.log('🔐 Nova senha (tamanho):', novaSenha.length, 'caracteres');
    console.log('👤 User ID:', usuarioData.user_id);
    
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      usuarioData.user_id,
      {
        password: novaSenha,
        email_confirm: true,
      }
    );

    if (authError) {
      console.error('❌ Erro ao atualizar senha no Auth:', authError);
      console.error('❌ Código do erro:', authError.status);
      console.error('❌ Mensagem:', authError.message);
      console.error('❌ Detalhes completos:', JSON.stringify(authError, null, 2));
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar senha: ' + authError.message },
        { status: 500 }
      );
    }

    if (!authData || !authData.user) {
      console.error('❌ Resposta do Auth não contém dados do usuário');
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar senha: resposta inválida do servidor' },
        { status: 500 }
      );
    }

    console.log('✅ Senha atualizada com sucesso no Auth');
    console.log('✅ User ID atualizado:', authData.user.id);
    console.log('✅ Email confirmado:', authData.user.email);

    // Limpar token de reset e marcar que o usuário já redefiniu a senha
    const { error: updateError } = await supabase
      .from('usuarios_bar')
      .update({
        senha_redefinida: true,
        reset_token: null,
        reset_token_expiry: null,
        atualizado_em: new Date().toISOString(),
      })
      .eq('user_id', usuarioData.user_id);

    if (updateError) {
      console.error('⚠️ Erro ao atualizar flag no banco (mas senha já foi atualizada):', updateError);
      // Não falhar, a senha já foi atualizada no Auth
    } else {
      console.log('✅ Flag senha_redefinida atualizada no banco');
    }

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso',
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    });
  } catch (error) {
    console.error('🔥 Erro inesperado:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
