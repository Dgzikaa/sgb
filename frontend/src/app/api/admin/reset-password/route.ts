import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API de administração para resetar senha e retornar senha temporária
 * Útil quando o email não está funcionando
 * 
 * POST /api/admin/reset-password
 * Body: { email: string, returnPassword?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, returnPassword = true } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔄 [ADMIN] Iniciando reset de senha para:', email);

    // 1. Verificar se usuário existe na tabela usuarios_bar
    const { data: usuario, error: fetchError } = await supabase
      .from('usuarios_bar')
      .select('id, user_id, email, nome, role, ativo')
      .eq('email', email.toLowerCase())
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

    console.log('✅ Usuário encontrado:', usuario.nome);

    // 2. Gerar nova senha temporária
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

    // 4. Marcar que precisa redefinir senha
    const { error: updateError } = await supabase
      .from('usuarios_bar')
      .update({ 
        senha_redefinida: false,
        ultima_atividade: new Date().toISOString()
      })
      .eq('id', usuario.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar flag senha_redefinida:', updateError);
    }

    // 5. Tentar enviar email (mas não falhar se der erro)
    let emailSent = false;
    let emailError: string | null = null;
    
    try {
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : (process.env.NEXT_PUBLIC_APP_URL || 'https://zykor.com.br');

      const emailResponse = await fetch(`${baseUrl}/api/emails/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          nome: usuario.nome,
          email,
          senha_temporaria: senhaTemporaria,
          role: usuario.role,
          loginUrl: baseUrl
        })
      });

      if (emailResponse.ok) {
        emailSent = true;
        console.log('✅ Email de reset enviado com sucesso');
      } else {
        const emailResult = await emailResponse.json().catch(() => ({}));
        emailError = emailResult.error || 'Falha ao enviar email';
        console.warn('⚠️ Falha ao enviar email de reset:', emailError);
      }
    } catch (emailError) {
      emailError = emailError instanceof Error ? emailError.message : 'Erro desconhecido';
      console.warn('⚠️ Erro ao enviar email de reset:', emailError);
    }

    // 6. Retornar resultado com senha temporária
    return NextResponse.json({
      success: true,
      message: 'Senha resetada com sucesso',
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role
      },
      temporaryPassword: returnPassword ? senhaTemporaria : undefined,
      emailSent,
      emailError: emailError || undefined,
      instructions: returnPassword 
        ? `Senha temporária gerada: ${senhaTemporaria}. O usuário deve alterar no primeiro login.`
        : 'Senha resetada. Verifique se o email foi enviado.'
    });

  } catch (error) {
    console.error('❌ Erro no reset de senha:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

