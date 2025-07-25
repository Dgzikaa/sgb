import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

export interface UserAuth {
  id: number;
  user_id: string;
  email: string;
  nome: string;
  role: 'admin' | 'financeiro' | 'funcionario';
  bar_id: number;
  permissao: string; // Alias para role para compatibilidade
  modulos_permitidos: string[];
  ativo: boolean;
}

/**
 * Função para extrair dados de autenticação do usuário
 * Lê os dados reais do usuário do cookie/header
 */
export async function getUserAuth(
  request?: NextRequest
): Promise<UserAuth | null> {
  try {
    let userData: string | null = null;

    if (request) {
      // Se temos o request, usar headers diretamente
      userData = request.headers.get('x-user-data');

      // Fallback: tentar pegar do cookie se não tem header
      if (!userData) {
        const cookieValue = request.cookies.get('sgb_user')?.value;
        if (cookieValue) {
          userData = cookieValue;
        }
      }
    } else {
      // Usar o headers() do Next.js
      const headersList = await headers();
      userData = headersList.get('x-user-data');
    }

    if (!userData) {
      return null;
    }

    // Decodificar URL encoding antes de fazer JSON.parse
    const decodedUserData = decodeURIComponent(userData);
    const parsedUser = JSON.parse(decodedUserData);

    if (!parsedUser || !parsedUser.email || !parsedUser.id) {
      return null;
    }

    // Normalizar dados para garantir compatibilidade
    const user: UserAuth = {
      id: parsedUser.id,
      user_id: parsedUser.user_id || parsedUser.id.toString(),
      email: parsedUser.email,
      nome: parsedUser.nome || parsedUser.email,
      role: parsedUser.role || parsedUser.permissao || 'funcionario',
      bar_id: parsedUser.bar_id || 3, // Default para Ordinário Bar se não especificado
      permissao: parsedUser.role || parsedUser.permissao || 'funcionario',
      modulos_permitidos: parsedUser.modulos_permitidos || [],
      ativo: parsedUser.ativo !== false,
    };

    return user;
  } catch (error) {
    console.error('❌ Erro ao processar autenticação:', error);
    return null;
  }
}

/**
 * Verificar se o usuário tem uma permissão específica
 */
export function hasPermission(user: UserAuth, permission: string): boolean {
  // Admin sempre tem todas as permissões
  if (user.role === 'admin') {
    return true;
  }

  // Verificar permissões específicas
  const permissions = user.modulos_permitidos || [];
  return permissions.includes(permission) || permissions.includes('admin');
}

/**
 * Verificar se o usuário pode administrar o sistema
 */
export function isAdmin(user: UserAuth): boolean {
  return user.role === 'admin' || user.permissao === 'admin';
}

/**
 * Verificar se o usuário pode gerenciar dados financeiros
 */
export function canManageFinancial(user: UserAuth): boolean {
  return isAdmin(user) || user.role === 'financeiro';
}

/**
 * Middleware helper para autenticação de APIs
 */
export function createAuthResponse(error: string, status: number = 401) {
  return new Response(
    JSON.stringify({
      success: false,
      error,
      code: 'AUTH_ERROR',
      help: 'Faça login em /login para acessar esta funcionalidade',
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
