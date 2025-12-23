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
      .select('id, user_id, email, nome, role')
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

    // 2. Gerar senha temporária (método mais direto para admin)
    const senhaTemporaria = `Temp${Math.random().toString(36).substring(2, 8)}!`;
    
    // 3. Atualizar senha no Supabase Auth
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
      usuario.user_id,
      { password: senhaTemporaria }
    );

    if (authUpdateError) {
      console.error('❌ Erro ao atualizar senha no Auth:', authUpdateError);
      return NextResponse.json(
        { 
          error: 'Erro ao atualizar senha no Auth',
          details: authUpdateError.message 
        },
        { status: 500 }
      );
    }

    // 4. Gerar token único de redefinição (para link alternativo)
    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Expira em 1 hora

    // 5. Salvar token no banco e marcar que precisa redefinir senha
    const { error: updateError } = await supabase
      .from('usuarios_bar')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString(),
        senha_redefinida: false,
        ultima_atividade: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Erro ao salvar token de reset:', updateError);
      // Não falhar, a senha já foi atualizada
    }

    // 4. Gerar URL de redefinição
    // Em produção, SEMPRE usar o domínio oficial zykor.com.br
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://zykor.com.br';
    
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

    // 6. Tentar enviar email com senha temporária também
    let emailSentWithPassword = false;
    try {
      const requestUrl = new URL(request.url);
      const internalBaseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
      
      const emailResponsePassword = await fetch(`${internalBaseUrl}/api/emails/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: usuario.email,
          nome: usuario.nome,
          email: usuario.email,
          senha_temporaria: senhaTemporaria,
          role: usuario.role || 'funcionario',
          loginUrl: baseUrl
        })
      });

      if (emailResponsePassword.ok) {
        emailSentWithPassword = true;
        console.log('✅ Email com senha temporária enviado para:', usuario.email);
      }
    } catch (err) {
      console.warn('⚠️ Erro ao enviar email com senha temporária:', err);
    }

    // 7. Retornar resultado com senha temporária
    return NextResponse.json({ 
      success: true,
      message: emailSent || emailSentWithPassword
        ? `✅ Email enviado para ${usuario.email}` 
        : `⚠️ Não foi possível enviar o email: ${emailError || 'Erro desconhecido'}`,
      emailSent: emailSent || emailSentWithPassword,
      emailError: emailError || undefined,
      // Sempre fornecer a senha temporária para o admin
      resetData: {
        email: usuario.email,
        nome: usuario.nome,
        temporaryPassword: senhaTemporaria, // 🔑 SENHA TEMPORÁRIA
        resetLink: resetLink,
        expiresAt: resetTokenExpiry.toISOString(),
        message: emailSent || emailSentWithPassword
          ? '📧 Email enviado! Senha temporária abaixo para compartilhar com o usuário:' 
          : '⚠️ Email não enviado! Use a senha temporária abaixo para compartilhar com o usuário:'
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
