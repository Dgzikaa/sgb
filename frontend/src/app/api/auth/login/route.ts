import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';
import { normalizeEmail } from '@/lib/email-utils';
import { safeErrorLog } from '@/lib/logger';

export const dynamic = 'force-dynamic'

// 🔇 Controle de logs verbose - defina como true para debug de login
const VERBOSE_LOGIN_LOGS = process.env.NODE_ENV === 'development' && process.env.DEBUG_LOGIN === 'true';

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

// Função para log de falhas de login (apenas erros reais, não verbose)
async function logLoginFailure(data: LoginFailureLog) {
  // Apenas loga em casos reais de falha (não verbose)
  if (VERBOSE_LOGIN_LOGS) {
    console.log('❌ Login failed:', data);
  }
  // TODO: Implementar log real no banco/Sentry
}

// ========================================
// 🔐 POST /api/auth/login
// ========================================

export async function POST(request: NextRequest) {
  // Capturar informações do cliente para logging
  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp = forwarded
    ? forwarded.split(',')[0]
    : request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const sessionId =
    request.headers.get('x-session-id') || `session_${Date.now()}`;

  try {
    const body = await request.json();
    const email = normalizeEmail(body.email); // ✅ Normaliza email
    const senha = body.senha || body.password; // Aceita tanto 'senha' quanto 'password'

    if (VERBOSE_LOGIN_LOGS) {
      console.log('🔐 Tentativa de login:', email);
    }

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

    // Conectar ao Supabase Admin
    const supabase = await getAdminClient();

    // Buscar usuário - pode ter múltiplos registros se tiver acesso a múltiplos bares
    const { data: usuarios, error: usuarioError } = await supabase
      .from('usuarios_bar')
      .select('*')
      .eq('email', email) // Email já está normalizado
      .eq('ativo', true);

    if (usuarioError || !usuarios || usuarios.length === 0) {
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

    // Usar o primeiro registro como base (todos têm os mesmos dados de autenticação)
    const usuario = usuarios[0];
    
    // Buscar todos os bares que o usuário tem acesso
    const barIds = [...new Set(usuarios.map(u => u.bar_id))];
    const { data: barsData } = await supabase
      .from('bars')
      .select('id, nome')
      .in('id', barIds)
      .eq('ativo', true);
    
    const availableBars = barsData || [];

    // Verificar senha (usando Supabase Auth)
    try {
      // Tentar fazer login usando Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email, // Email já está normalizado
        password: senha,
      });

      if (authError || !authData.user) {
        if (VERBOSE_LOGIN_LOGS) {
          console.log('❌ Erro na autenticação:', authError?.message);
        }
        
        await logLoginFailure({
          email,
          reason: authError?.message || 'Invalid password',
          ipAddress: clientIp,
          userAgent,
          sessionId,
        });

        return NextResponse.json(
          {
            error: 'Credenciais inválidas',
            details: 'INVALID_PASSWORD',
            // Em desenvolvimento, incluir mais detalhes
            ...(process.env.NODE_ENV === 'development' && {
              debug: {
                authError: authError?.message,
                user_id: usuario.user_id,
                email_normalized: email.toLowerCase()
              }
            })
          },
          { status: 401 }
        );
      }

      // Preparar dados do usuário para resposta
      // Incluir lista de bares disponíveis para suporte multi-bar
      const userData = {
        id: usuario.id,
        user_id: usuario.user_id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role || 'funcionario',
        bar_id: availableBars.length > 0 ? availableBars[0].id : usuario.bar_id, // Bar padrão
        modulos_permitidos: usuario.modulos_permitidos || [],
        ativo: usuario.ativo,
        senha_redefinida: usuario.senha_redefinida,
        availableBars: availableBars, // Lista de bares que o usuário tem acesso
      };

      // Retornar sucesso com dados do usuário e token
      return NextResponse.json({
        success: true,
        user: userData,
        session: authData.session,
        message: 'Login realizado com sucesso',
      });

    } catch (authError) {
      safeErrorLog('autenticação login', authError);
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
    safeErrorLog('login geral', error);
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
