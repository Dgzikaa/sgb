import { NextRequest, NextResponse } from 'next/server';
import { logLogout } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic'

// Interfaces TypeScript
interface UserInfo {
  id: string;
  email: string;
  nome: string;
  bar_id: number;
}

export async function POST(request: NextRequest) {
  try {
    // Capturar informações do cliente para logging
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded
      ? forwarded.split(',')[0]
      : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const sessionId =
      request.headers.get('x-session-id') || `session_${Date.now()}`;

    // Tentar obter dados do usuário do cookie antes de limpar
    let userInfo: UserInfo | null = null;
    try {
      const userCookie = request.cookies.get('sgb_user');
      if (userCookie?.value) {
        userInfo = JSON.parse(userCookie.value) as UserInfo;
      }
    } catch {
      // Ignorar erro do cookie
    }

    // Log de logout
    await logLogout({
      userId: userInfo?.id,
      userEmail: userInfo?.email,
      userName: userInfo?.nome,
      barId: userInfo?.bar_id,
      ipAddress: clientIp,
      userAgent,
      sessionId,
    });

    // Criar response
    const response = NextResponse.json(
      { success: true, message: 'Logout realizado com sucesso' },
      { status: 200 }
    );

    // Limpar cookie httpOnly
    response.cookies.set('sgb_user', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(0), // Data no passado para expirar imediatamente
    });

    return response;
  } catch (error) {
    console.error('❌ Erro no logout:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
