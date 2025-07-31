import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminClient } from '@/lib/supabase-admin';

// ========================================
// 🔐 API PARA AUTENTICAÇÃO
// ========================================

interface UsuarioBar {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  ativo: boolean;
  senha_redefinida: boolean;
  permissao: string;
  bar_id: string;
  modulos_permitidos?: string[] | Record<string, any>;
}

interface LoginFailureLog {
  email: string;
  reason: string;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
}

// Função temporária para log de falha
async function logLoginFailure(data: LoginFailureLog) {
  console.log('❌ Login failed:', data);
  // TODO: Implementar log real
}

// ========================================
// 🔐 POST /api/auth/login
// ========================================

export async function POST(request: NextRequest) {
  console.log('🚀 API de login iniciada');

  // Capturar informações do cliente para logging
  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp = forwarded
    ? forwarded.split(',')[0]
    : request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const sessionId =
    request.headers.get('x-session-id') || `session_${Date.now()}`;

  try {
    console.log('📥 Fazendo parse do body da requisição');
    const body = await request.json();
    const email = body.email;
    const senha = body.senha || body.password; // Aceita tanto 'senha' quanto 'password'

    console.log('📝 Dados recebidos:', { email, senha: senha ? '***' : 'undefined' });

    // Validação básica
    if (!email || !senha) {
      await logLoginFailure({
        email: email || 'unknown',
        reason: 'Missing email or password',
        ipAddress: clientIp,
        userAgent,
        sessionId,
      });

      return NextResponse.json(
        {
          error: 'Email e senha são obrigatórios',
          details: 'MISSING_CREDENTIALS',
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Tentando login para: ${email}`);

    // Conectar ao Supabase Admin
    const supabase = await getAdminClient();

    // Buscar usuário
    console.log('🔍 Buscando usuário na tabela usuarios_bar...');
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios_bar')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (usuarioError || !usuario) {
      console.log('❌ Usuário não encontrado:', usuarioError);
      await logLoginFailure({
        email,
        reason: 'User not found',
        ipAddress: clientIp,
        userAgent,
        sessionId,
      });

      return NextResponse.json(
        {
          error: 'Credenciais inválidas',
          details: 'USER_NOT_FOUND',
        },
        { status: 401 }
      );
    }

    // Verificar se usuário está ativo
    if (!usuario.ativo) {
      await logLoginFailure({
        email,
        reason: 'User inactive',
        ipAddress: clientIp,
        userAgent,
        sessionId,
      });

      return NextResponse.json(
        {
          error: 'Usuário inativo',
          details: 'USER_INACTIVE',
        },
        { status: 401 }
      );
    }

    console.log('✅ Usuário encontrado e ativo');

    // Verificar senha (usando Supabase Auth)
    try {
      console.log('🔐 Verificando senha...');
      
      // Tentar fazer login usando Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: senha,
      });

      if (authError || !authData.user) {
        console.log('❌ Senha inválida:', authError);
        await logLoginFailure({
          email,
          reason: 'Invalid password',
          ipAddress: clientIp,
          userAgent,
          sessionId,
        });

        return NextResponse.json(
          {
            error: 'Credenciais inválidas',
            details: 'INVALID_PASSWORD',
          },
          { status: 401 }
        );
      }

      console.log('✅ Login bem-sucedido!');

      // Preparar dados do usuário para resposta
      const userData = {
        id: usuario.id,
        user_id: usuario.user_id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role || 'funcionario',
        bar_id: usuario.bar_id,
        modulos_permitidos: usuario.modulos_permitidos || [],
        ativo: usuario.ativo,
        senha_redefinida: usuario.senha_redefinida,
      };

      // Retornar sucesso com dados do usuário e token
      return NextResponse.json({
        success: true,
        user: userData,
        session: authData.session,
        message: 'Login realizado com sucesso',
      });

    } catch (authError) {
      console.error('❌ Erro na autenticação:', authError);
      await logLoginFailure({
        email,
        reason: 'Authentication error',
        ipAddress: clientIp,
        userAgent,
        sessionId,
      });

      return NextResponse.json(
        {
          error: 'Erro interno de autenticação',
          details: 'AUTH_ERROR',
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Erro geral no login:', error);
    await logLoginFailure({
      email: 'unknown',
      reason: 'Server error',
      ipAddress: clientIp,
      userAgent,
      sessionId,
    });

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: 'SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}

// ========================================
// 🔓 GET /api/auth/login - Health Check
// ========================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Login API is running',
    timestamp: new Date().toISOString(),
  });
}