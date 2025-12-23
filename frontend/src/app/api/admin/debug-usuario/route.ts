import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API de debug para verificar estado do usuário no Supabase
 * 
 * POST /api/admin/debug-usuario
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    const emailOriginal = email.trim();
    const emailNormalizado = email.toLowerCase().trim();
    console.log('🔍 Debugando usuário:', emailOriginal);

    // 1. Buscar no banco usuarios_bar com ILIKE (case insensitive)
    const { data: usuarioBusca, error: usuarioError } = await supabase
      .from('usuarios_bar')
      .select('*')
      .ilike('email', emailNormalizado)
      .single();

    if (usuarioError || !usuarioBusca) {
      // Tentar buscar múltiplos registros similares
      const { data: usuario2 } = await supabase
        .from('usuarios_bar')
        .select('*')
        .ilike('email', `%${emailNormalizado}%`)
        .limit(5);

      return NextResponse.json({
        error: 'Usuário não encontrado',
        emailBuscado: emailOriginal,
        emailNormalizado: emailNormalizado,
        tentativas: usuario2 || [],
        sugestao: 'Verifique se o email está correto no banco'
      }, { status: 404 });
    }

    const usuario = usuarioBusca;

    // 2. Buscar no Supabase Auth
    let authUser: {
      id: string;
      email: string | undefined;
      email_confirmed_at: string | undefined;
      last_sign_in_at: string | undefined;
      created_at: string;
      updated_at: string | undefined;
    } | null = null;
    let authError: Error | null = null;
    
    if (usuario.user_id) {
      try {
        const { data: authData, error: authErr } = await supabase.auth.admin.getUserById(usuario.user_id);
        if (authData?.user) {
          authUser = {
            id: authData.user.id,
            email: authData.user.email,
            email_confirmed_at: authData.user.email_confirmed_at,
            last_sign_in_at: authData.user.last_sign_in_at,
            created_at: authData.user.created_at,
            updated_at: authData.user.updated_at,
          };
        }
        if (authErr) {
          authError = authErr as Error;
        }
      } catch (err) {
        authError = err instanceof Error ? err : new Error(String(err));
      }
    }

    // 3. Tentar fazer login (sem retornar erro se falhar)
    let loginTest: {
      userExists: boolean;
      emailMatches: boolean;
    } | null = null;
    if (usuario.user_id && authUser) {
      // Não podemos testar sem senha, mas podemos verificar se o usuário existe
      loginTest = {
        userExists: true,
        emailMatches: authUser.email?.toLowerCase() === emailNormalizado,
      };
    }

    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        email_normalizado: emailNormalizado,
        user_id: usuario.user_id,
        role: usuario.role,
        ativo: usuario.ativo,
        senha_redefinida: usuario.senha_redefinida,
        reset_token: usuario.reset_token ? '***' : null,
        reset_token_expiry: usuario.reset_token_expiry,
      },
      authUser,
      loginTest,
      problemas: [
        !usuario.user_id && 'Usuário não tem user_id vinculado',
        !authUser && 'Usuário não encontrado no Supabase Auth',
        authUser && authUser.email && authUser.email.toLowerCase() !== emailNormalizado && 'Email no Auth diferente do banco',
        authUser && !authUser.email_confirmed_at && 'Email não confirmado no Auth',
      ].filter(Boolean) as string[],
    });

  } catch (error) {
    console.error('❌ Erro no debug:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

