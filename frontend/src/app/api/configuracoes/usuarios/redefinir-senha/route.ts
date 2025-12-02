import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Redefinir senha de um usuário (só admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // 1. Buscar dados do usuário
    const { data: usuario, error: fetchError } = await supabase
      .from('usuarios_bar')
      .select('user_id, email, nome')
      .eq('id', userId)
      .single();

    if (fetchError || !usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (!usuario.user_id) {
      return NextResponse.json(
        { error: 'Usuário não possui conta de autenticação vinculada' },
        { status: 400 }
      );
    }

    // 2. Gerar nova senha temporária
    const novaSenhaTemporia = `Temp${Math.random().toString(36).slice(2, 10)}!`;

    // 3. Atualizar senha no Supabase Auth
    const { error: authError } = await supabase.auth.admin.updateUserById(
      usuario.user_id,
      {
        password: novaSenhaTemporia,
      }
    );

    if (authError) {
      console.error('❌ Erro ao atualizar senha no Auth:', authError);
      return NextResponse.json(
        { error: `Erro ao redefinir senha: ${authError.message}` },
        { status: 500 }
      );
    }

    // 4. Marcar que senha precisa ser redefinida
    await supabase
      .from('usuarios_bar')
      .update({
        senha_redefinida: false,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', userId);

    // 5. Enviar email com nova senha
    let emailSent = false;
    try {
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : (process.env.NEXT_PUBLIC_APP_URL || 'https://sgbv2.vercel.app');

      const emailResponse = await fetch(`${baseUrl}/api/emails/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: usuario.email,
          nome: usuario.nome,
          novaSenha: novaSenhaTemporia,
          loginUrl: baseUrl
        })
      });

      if (emailResponse.ok) {
        emailSent = true;
        console.log('✅ Email de redefinição enviado para:', usuario.email);
      } else {
        console.warn('⚠️ Falha ao enviar email de redefinição');
      }
    } catch (emailError) {
      console.warn('⚠️ Erro ao enviar email:', emailError);
    }

    return NextResponse.json({ 
      success: true,
      message: emailSent 
        ? `Senha redefinida! Email enviado para ${usuario.email}` 
        : 'Senha redefinida, mas email não pôde ser enviado',
      emailSent,
      credentials: emailSent ? undefined : {
        email: usuario.email,
        senha_temporaria: novaSenhaTemporia,
        message: 'Informe estas credenciais ao usuário manualmente'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao redefinir senha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

