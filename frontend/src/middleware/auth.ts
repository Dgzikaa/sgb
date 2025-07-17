import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

// Tipos para o usuário autenticado
export interface AuthenticatedUser {
  id: number;
  user_id: string;
  email: string;
  nome: string;
  role: 'admin' | 'financeiro' | 'funcionario'; // Garante que 'admin' está incluso
  bar_id: number;
  modulos_permitidos: string[];
  ativo: boolean;
}

// Tipos para checagem de permissões
export interface PermissionCheck {
  module: string;
  action: 'read' | 'write' | 'delete' | 'admin';
  resource?: string;
}

/**
 * Middleware de autenticação para APIs.
 * Valida o usuário logado via cookie ou header.
 */
export async function authenticateUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    let userToken: string | undefined | null = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!userToken) {
      const cookie = request.cookies.get('sgb_user');
      userToken = cookie ? cookie.value : undefined;
    }
    if (!userToken) {
      const userDataHeader = request.headers.get('x-user-data');
      if (userDataHeader) {
        try {
          const userData: unknown = JSON.parse(decodeURIComponent(userDataHeader));
          if (
            typeof userData === 'object' &&
            userData !== null &&
            'email' in userData &&
            'id' in userData
          ) {
            return userData as AuthenticatedUser;
          }
        } catch (e) {
          console.log('Falha ao interpretar o header x-user-data');
        }
      }
    }
    if (!userToken) {
      console.log('Nenhum token de autenticação encontrado');
      return null;
    }
    try {
      const userData: unknown = JSON.parse(decodeURIComponent(userToken));
      if (
        typeof userData !== 'object' ||
        userData === null ||
        !('email' in userData) ||
        !('id' in userData)
      ) {
        console.log('Token inválido: dados incompletos');
        return null;
      }
      const supabase = await getAdminClient();
      const { data: usuario, error } = await supabase
        .from('usuarios_bar')
        .select('*')
        .eq('id', (userData as { id: number }).id)
        .eq('ativo', true)
        .single();
      if (error || !usuario) {
        console.log('Usuário não encontrado ou inativo:', (userData as { email?: string }).email);
        return null;
      }
      console.log('Usuário autenticado:', usuario.nome);
      return usuario as AuthenticatedUser;
    } catch (parseError) {
      console.log('Erro ao interpretar token de usuário:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return null;
  }
}

/**
 * Checa se o usuário possui permissão para determinada ação.
 */
export function checkPermission(user: AuthenticatedUser, permission: PermissionCheck): boolean {
  if (user.role === 'admin') {
    return true;
  }
  const modulePermissions: string[] = user.modulos_permitidos || [];
  switch (permission.module) {
    case 'checklists':
      switch (permission.action) {
        case 'read':
          return (
            modulePermissions.includes('checklists') ||
            modulePermissions.includes('checklists_read') ||
            user.role === 'financeiro'
          );
        case 'write':
          return (
            user.role === 'financeiro' ||
            modulePermissions.includes('checklists_write') ||
            modulePermissions.includes('checklists_admin')
          );
        case 'delete':
          return modulePermissions.includes('checklists_admin');
        case 'admin':
          return modulePermissions.includes('checklists_admin');
        default:
          return false;
      }
    default:
      return false;
  }
}

/**
 * Retorna resposta de erro de autenticação.
 */
export function authErrorResponse(message = 'Não autorizado', status = 401) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'AUTH_ERROR',
    },
    { status }
  );
}

/**
 * Retorna resposta de erro de permissão.
 */
export function permissionErrorResponse(message = 'Permissão negada', status = 403) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'PERMISSION_DENIED',
    },
    { status }
  );
}

// Lista de rotas que requerem autenticação
export const PROTECTED_ROUTES: string[] = [
  '/api/admin',
  '/api/dashboard',
  '/api/contaazul-auth',
  '/api/contaazul-sync',
  '/api/contaazul-automation',
];

// Lista de rotas públicas (podem ser acessadas sem autenticação)
export const PUBLIC_ROUTES: string[] = [
  '/api/config',
  '/api/relatorios',
];

export function requiresAuth(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
} 

