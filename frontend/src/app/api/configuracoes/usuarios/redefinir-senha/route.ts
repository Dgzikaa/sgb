import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Enviar link de redefinição de senha para o usuário
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
      .select('id, user_id, email, nome')
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

    // 2. Gerar token único de redefinição
    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Expira em 1 hora

    // 3. Salvar token no banco
    const { error: updateError } = await supabase
      .from('usuarios_bar')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Erro ao salvar token de reset:', updateError);
      return NextResponse.json(
        { error: 'Erro ao gerar token de redefinição' },
        { status: 500 }
      );
    }

    // 4. Gerar URL de redefinição
    // Usar VERCEL_URL em produção, ou NEXT_PUBLIC_APP_URL, ou fallback
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : (process.env.NEXT_PUBLIC_APP_URL || 
         (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://sgbv2.vercel.app'));
    
    const resetLink = `${baseUrl}/usuarios/redefinir-senha?email=${encodeURIComponent(usuario.email)}&token=${resetToken}`;

    // 5. Tentar enviar email com link de redefinição
    let emailSent = false;
    let emailError: string | null = null;
    
    try {
      // Usar URL absoluta baseada no host da requisição para chamadas internas
      const requestUrl = new URL(request.url);
      const internalBaseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
      
      const emailResponse = await fetch(`${internalBaseUrl}/api/emails/password-reset-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: usuario.email,
          nome: usuario.nome,
          email: usuario.email,
          resetLink: resetLink,
          expiresIn: '1 hora'
        })
      });

      if (emailResponse.ok) {
        emailSent = true;
        console.log('✅ Email de redefinição (link) enviado para:', usuario.email);
      } else {
        const errorData = await emailResponse.json().catch(() => ({}));
        emailError = errorData.error || 'Falha ao enviar email';
        console.warn('⚠️ Falha ao enviar email de redefinição:', emailError);
      }
    } catch (err) {
      emailError = err instanceof Error ? err.message : 'Erro desconhecido';
      console.warn('⚠️ Erro ao enviar email:', err);
    }

    // 6. Retornar resultado
    // Se o email foi enviado com sucesso, não precisa mostrar o link
    // Se não foi enviado, mostrar o link para o admin copiar e enviar manualmente
    return NextResponse.json({ 
      success: true,
      message: emailSent 
        ? `✅ Link de redefinição enviado para ${usuario.email}` 
        : `⚠️ Não foi possível enviar o email: ${emailError}`,
      emailSent,
      // Sempre fornecer o link para o admin poder copiar se necessário
      resetData: {
        email: usuario.email,
        nome: usuario.nome,
        resetLink: resetLink,
        expiresAt: resetTokenExpiry.toISOString(),
        message: emailSent 
          ? '📧 Email enviado! Link abaixo caso o usuário não receba:' 
          : '⚠️ Email não enviado! Copie o link e envie para o usuário:'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao gerar link de redefinição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
