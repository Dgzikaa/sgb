import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

// Tipos para o usuário autenticado
export interface AuthenticatedUser {
  id: number
  user_id: string
  email: string
  nome: string
  role: 'admin' | 'financeiro' | 'funcionario'
  bar_id: number
  modulos_permitidos: string[]
  ativo: boolean
}

// Tipos para permissões
export interface PermissionCheck {
  module: string
  action: 'read' | 'write' | 'delete' | 'admin'
  resource?: string
}

/**
 * Middleware de autenticação para APIs
 * Valida o usuário logado via cookie/header
 */
export async function authenticateUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Tentar pegar token do header Authorization
    let userToken = request.headers.get('authorization')?.replace('Bearer ', '')
    
    // Se não tem no header, tentar no cookie
    if (!userToken) {
      userToken = request.cookies.get('sgb_user')?.value
    }
    
    // Se não tem token, tentar parsear dados do localStorage via cookie
    if (!userToken) {
      // Buscar dados do usuário que o frontend envia via header customizado
      const userDataHeader = request.headers.get('x-user-data')
      if (userDataHeader) {
        try {
          const userData = JSON.parse(decodeURIComponent(userDataHeader))
          if (userData && userData.email && userData.id) {
            return userData as AuthenticatedUser
          }
        } catch (e) {
          console.log('Falha ao parsear x-user-data header')
        }
      }
    }
    
    if (!userToken) {
      console.log('🚫 Nenhum token de autenticação encontrado')
      return null
    }
    
    // Tentar parsear o token como JSON (dados do usuário)
    try {
      const userData = JSON.parse(decodeURIComponent(userToken))
      
      if (!userData || !userData.email || !userData.id) {
        console.log('🚫 Token inválido - dados incompletos')
        return null
      }
      
      // Validar se o usuário ainda existe e está ativo
      const supabase = await getAdminClient()
      const { data: usuario, error } = await supabase
        .from('usuarios_bar')
        .select('*')
        .eq('id', userData.id)
        .eq('ativo', true)
        .single()
      
      if (error || !usuario) {
        console.log('🚫 Usuário não encontrado ou inativo:', userData.email)
        return null
      }
      
      console.log('✅ Usuário autenticado:', usuario.nome)
      return usuario as AuthenticatedUser
      
    } catch (parseError) {
      console.log('🚫 Erro ao parsear token de usuário:', parseError)
      return null
    }
    
  } catch (error) {
    console.error('❌ Erro na autenticação:', error)
    return null
  }
}

/**
 * Verificar permissões do usuário
 */
export function checkPermission(user: AuthenticatedUser, permission: PermissionCheck): boolean {
  // Admin pode tudo
  if ((user.role as string) === 'admin') {
    return true
  }
  
  // Verificar permissões específicas do módulo
  const modulePermissions = user.modulos_permitidos || []
  
  switch (permission.module) {
    case 'checklists':
      switch (permission.action) {
        case 'read':
          // Todos podem ler checklists
          return modulePermissions.includes('checklists') || 
                 modulePermissions.includes('checklists_read') ||
                 user.role === 'financeiro'
        
        case 'write':
          // Financeiro e admin podem criar/editar
          return user.role === 'financeiro' || 
                 modulePermissions.includes('checklists_write') ||
                 modulePermissions.includes('checklists_admin')
        
        case 'delete':
          // Só admin pode deletar
          return (user.role as string) === 'admin' || 
                 modulePermissions.includes('checklists_admin')
        
        case 'admin':
          // Só admin tem acesso total
          return (user.role as string) === 'admin'
        
        default:
          return false
      }
    
    default:
      return false
  }
}

/**
 * Resposta de erro de autenticação
 */
export function authErrorResponse(message: string = 'Não autorizado', status: number = 401) {
  return NextResponse.json({
    success: false,
    error: message,
    code: 'AUTH_ERROR'
  }, { status })
}

/**
 * Resposta de erro de permissão
 */
export function permissionErrorResponse(message: string = 'Permissão negada', status: number = 403) {
  return NextResponse.json({
    success: false,
    error: message,
    code: 'PERMISSION_DENIED'
  }, { status })
}

// Lista de rotas que requerem autenticação
export const PROTECTED_ROUTES = [
  '/api/admin',
  '/api/dashboard',
      '/api/windsor-auth',
    '/api/windsor-sync',
    '/api/nibo-auth',
    '/api/nibo-sync'
]

// Lista de rotas públicas (podem ser acessadas sem auth)
export const PUBLIC_ROUTES = [
  '/api/config', // Temporariamente público até implementar auth adequada
  '/api/relatorios' // Dados agregados, sem informações sensíveis
]

export function requiresAuth(pathname: string): boolean {
  // Verificar se é uma rota protegida
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

export function isPublicRoute(pathname: string): boolean {
  // Verificar se é uma rota explicitamente pública
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
} 
